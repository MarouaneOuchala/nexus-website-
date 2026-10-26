import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("Android push registrations and delivery queue", async (t) => {
  const db = new PGlite();
  const admin = randomUUID(), outsider = randomUUID(), session = randomUUID(), otherSession = randomUUID();
  const token = "test-device-token-not-a-real-fcm-registration";
  const identify = async (user, sid) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claims',$2,false)",
      [user, JSON.stringify({ sub: user, session_id: sid })]);
    await db.exec("set role authenticated");
  };
  try {
    await db.exec(`
      create role anon nologin; create role authenticated nologin; create role service_role nologin;
      create schema auth;
      create table auth.users(id uuid primary key);
      create table auth.sessions(id uuid primary key, user_id uuid references auth.users, not_after timestamptz);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
      $$;
      create function auth.jwt() returns jsonb language sql stable as $$
        select nullif(current_setting('request.jwt.claims',true),'')::jsonb;
      $$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid(), auth.jwt() to authenticated;
    `);
    for (const migration of ["202610250001_enquiries", "202610260001_business_stats", "202610260002_visit_trends", "202610260003_android_push"]) {
      await db.exec(await readFile(new URL(`../supabase/migrations/${migration}.sql`, import.meta.url), "utf8"));
    }
    await db.query("insert into auth.users values ($1),($2)", [admin, outsider]);
    await db.query("insert into private.admin_users values($1)", [admin]);
    await db.query("insert into auth.sessions(id,user_id) values($1,$2),($3,$4)", [session, admin, otherSession, outsider]);
    await t.test("anonymous and non-admin device registration denied", async () => {
      await db.exec("set role anon");
      await assert.rejects(db.query("select public.register_push_device($1)", [token]), /permission denied/);
      await identify(outsider, otherSession);
      await assert.rejects(db.query("select public.register_push_device($1)", [token]), /ADMIN_REQUIRED/);
      await assert.rejects(db.query("select * from public.claim_push_deliveries()"), /permission denied/);
    });
    await t.test("registration requires a real owned session and valid token", async () => {
      await identify(admin, otherSession);
      await assert.rejects(db.query("select public.register_push_device($1)", [token]), /ACTIVE_SESSION_REQUIRED/);
      await identify(admin, session);
      await assert.rejects(db.query("select public.register_push_device('short')"), /INVALID_DEVICE_TOKEN/);
      await db.query("select public.register_push_device($1)", [token]);
      await db.query("select public.register_push_device($1)", [token]);
      assert.equal((await db.query("select public.push_device_enabled() enabled")).rows[0].enabled, true);
      await assert.rejects(db.query("select * from private.push_devices"), /permission denied/);
      await assert.rejects(db.query("select * from public.claim_push_deliveries()"), /permission denied/);
    });
    const enquiry = randomUUID();
    const payload = { id: enquiry, full_name: "Push test", email: "push@example.invalid", phone: "212600003210",
      goal: "Business English", request_type: "consultation", language: "fr", consent: true, website: "" };
    await t.test("new enquiries enqueue once; idempotent retries do not duplicate", async () => {
      await db.exec("reset role");
      await db.exec("set role anon");
      for (let i = 0; i < 2; i++) await db.query("select public.submit_enquiry($1)", [JSON.stringify(payload)]);
      await db.exec("reset role");
      assert.equal((await db.query("select count(*)::int n from private.push_deliveries")).rows[0].n, 1);
    });
    let delivery;
    await t.test("only server can claim jobs; concurrent claims do not duplicate", async () => {
      await db.exec("set role service_role");
      delivery = (await db.query("select * from public.claim_push_deliveries()")).rows[0];
      assert.equal(delivery.device_token, token);
      assert.equal(delivery.enquiry_id, enquiry);
      assert.deepEqual((await db.query("select * from public.claim_push_deliveries()")).rows, []);
    });
    await t.test("wrong lease cannot complete another delivery", async () => {
      await db.query("select public.finish_push_delivery($1,$2,'sent')", [delivery.delivery_id, randomUUID()]);
      await db.exec("reset role");
      assert.equal((await db.query("select completed_at from private.push_deliveries")).rows[0].completed_at, null);
    });
    await t.test("transient failures retry with backoff and sent deliveries stop", async () => {
      await db.exec("set role service_role");
      await db.query("select public.finish_push_delivery($1,$2,'retry')", [delivery.delivery_id, delivery.lease_id]);
      assert.deepEqual((await db.query("select * from public.claim_push_deliveries()")).rows, []);
      await db.exec("reset role");
      await db.exec("update private.push_deliveries set available_at=now()-interval '1 second'");
      await db.exec("set role service_role");
      delivery = (await db.query("select * from public.claim_push_deliveries()")).rows[0];
      await db.query("select public.finish_push_delivery($1,$2,'sent')", [delivery.delivery_id, delivery.lease_id]);
      assert.deepEqual((await db.query("select * from public.claim_push_deliveries()")).rows, []);
    });
    await t.test("admin revocation removes device and queued deliveries", async () => {
      await db.exec("reset role");
      await db.query("delete from private.admin_users where user_id=$1", [admin]);
      await db.exec("set role service_role");
      assert.deepEqual((await db.query("select * from public.claim_push_deliveries()")).rows, []);
      await db.exec("reset role");
      assert.equal((await db.query("select count(*)::int n from private.push_devices")).rows[0].n, 0);
      await db.query("insert into private.admin_users values($1)", [admin]);
    });
    await t.test("logout revokes only the caller's session registration", async () => {
      await identify(admin, session);
      await db.query("select public.register_push_device($1)", [token]);
      await identify(outsider, otherSession);
      await db.exec("select public.unregister_push_devices()");
      await identify(admin, session);
      assert.equal((await db.query("select public.push_device_enabled() enabled")).rows[0].enabled, true);
      await db.exec("select public.unregister_push_devices()");
      assert.equal((await db.query("select public.push_device_enabled() enabled")).rows[0].enabled, false);
    });
    await t.test("terminal failures stop and unregistered FCM tokens are removed", async () => {
      await db.query("select public.register_push_device($1)", [token]);
      await db.exec("reset role");
      const enqueue = async () => {
        await db.query("insert into private.push_deliveries(enquiry_id,device_id) select $1,id from private.push_devices", [enquiry]);
        await db.exec("set role service_role");
        return (await db.query("select * from public.claim_push_deliveries()")).rows[0];
      };
      const failed = await enqueue();
      await db.query("select public.finish_push_delivery($1,$2,'failed')", [failed.delivery_id, failed.lease_id]);
      assert.deepEqual((await db.query("select * from public.claim_push_deliveries()")).rows, []);
      await db.exec("reset role");
      assert.equal((await db.query("select last_error from private.push_deliveries")).rows[0].last_error, "failed");
      await db.exec("delete from private.push_deliveries");
      const invalid = await enqueue();
      await db.query("select public.finish_push_delivery($1,$2,'unregistered')", [invalid.delivery_id, invalid.lease_id]);
      await db.exec("reset role");
      assert.equal((await db.query("select count(*)::int n from private.push_devices")).rows[0].n, 0);
      await identify(admin, session);
    });
    await t.test("token rotation replaces the device for the current session", async () => {
      await db.query("select public.register_push_device($1)", [token]);
      await db.query("select public.register_push_device($1)", [`${token}-rotated`]);
      await db.exec("reset role");
      assert.deepEqual((await db.query("select token from private.push_devices")).rows, [{ token: `${token}-rotated` }]);
      await identify(admin, session);
    });
    await t.test("expired sessions are removed", async () => {
      await db.query("select public.register_push_device($1)", [token]);
      await db.exec("reset role");
      await db.query("update auth.sessions set not_after=now()-interval '1 second' where id=$1", [session]);
      await db.exec("set role service_role");
      await db.exec("select * from public.claim_push_deliveries()");
      await db.exec("reset role");
      assert.equal((await db.query("select count(*)::int n from private.push_devices")).rows[0].n, 0);
    });
  } finally {
    await db.close();
  }
});
