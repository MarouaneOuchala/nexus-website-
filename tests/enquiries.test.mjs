import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

test("enquiry database: validation, pricing, retries, and admin-only access", async (t) => {
  const db = new PGlite();
  const admin = randomUUID();
  const outsider = randomUUID();
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid() to authenticated;
    `);
    await db.exec(await readFile(new URL("../supabase/migrations/202610250001_enquiries.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../supabase/migrations/202610260001_business_stats.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../supabase/migrations/202610260002_visit_trends.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../supabase/migrations/202610260004_meeting_welcome.sql", import.meta.url), "utf8"));
    await db.query("insert into auth.users (id) values ($1), ($2)", [admin, outsider]);
    await db.query("insert into private.admin_users (user_id) values ($1)", [admin]);
    const base = {
      id: randomUUID(), full_name: "Test Enquiry", email: "test@example.invalid",
      phone: "+212 600 000 001", goal: "Practise presentations", preferred_time: "After 17:00",
      background: "", request_type: "consultation", sessions: 16, language: "fr", consent: true, website: "",
    };
    const submit = (payload) => db.query("select public.submit_enquiry($1::jsonb) as id", [JSON.stringify(payload)]);
    const identity = async (id) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
      await db.exec("set role authenticated");
    };
    await db.exec("set role anon");
    await t.test("anonymous callers can submit, but cannot read client data", async () => {
      assert.equal((await submit(base)).rows[0].id, base.id);
      await assert.rejects(db.query("select * from public.enquiries"), /permission denied/);
      await assert.rejects(db.query("select * from private.admin_users"), /permission denied/);
      await assert.rejects(db.query("select public.is_admin()"), /permission denied/);
      await assert.rejects(db.query("select * from public.business_stats()"), /permission denied/);
      await assert.rejects(db.query("insert into public.enquiries (id) values ($1)", [randomUUID()]), /permission denied/);
    });
    await t.test("retrying the same submission is idempotent", async () => {
      assert.equal((await submit(base)).rows[0].id, base.id);
      await db.exec("reset role");
      assert.equal((await db.query("select count(*)::integer as count from public.enquiries")).rows[0].count, 1);
      await db.exec("set role anon");
    });
    await t.test("all four prices are derived by the database, not trusted from the browser", async () => {
      for (const [index, sessions, price] of [[1, 8, 1399], [2, 16, 2699], [3, 24, 3799], [4, 32, 4999]]) {
        const id = randomUUID();
        await submit({ ...base, id, email: `price${index}@example.invalid`, phone: `21260000001${index}`, sessions, total_mad: 1 });
        await db.exec("reset role");
        assert.equal((await db.query("select total_mad from public.enquiries where id=$1", [id])).rows[0].total_mad, price);
        await db.exec("set role anon");
      }
    });
    await t.test("invalid consent, honeypot, phone, bundle, type and application are rejected", async () => {
      for (const change of [
        { consent: false }, { website: "spam" }, { phone: "123" }, { sessions: 12 },
        { request_type: "invalid" }, { request_type: "application", sessions: null, background: "" },
        { full_name: "" }, { email: "bad" }, { language: "xx" }, { goal: "" },
      ]) {
        await assert.rejects(submit({ ...base, id: randomUUID(), ...change }));
      }
    });
    await t.test("repeat requests are limited per contact", async () => {
      await submit({ ...base, id: randomUUID() });
      await submit({ ...base, id: randomUUID() });
      await assert.rejects(submit({ ...base, id: randomUUID() }), /RATE_LIMITED/);
    });
    await t.test("Moroccan local phone numbers normalize for callbacks and throttling", async () => {
      const id = randomUUID();
      await submit({ ...base, id, email: "local@example.invalid", phone: "06 12 34 56 78", sessions: null });
      await db.exec("reset role");
      const row = (await db.query("select phone, total_mad from public.enquiries where id=$1", [id])).rows[0];
      assert.equal(row.phone, "212612345678");
      assert.equal(row.total_mad, null);
      await db.exec("set role anon");
    });
    await t.test("teacher applications retain their full background without a bundle", async () => {
      const id = randomUUID();
      await submit({ ...base, id, email: "teacher@example.invalid", phone: "+212600000099", request_type: "application", sessions: null, background: "Teaching experience and evening availability." });
      await db.exec("reset role");
      const row = (await db.query("select background, request_type, sessions from public.enquiries where id=$1", [id])).rows[0];
      assert.equal(row.background, "Teaching experience and evening availability.");
      assert.equal(row.request_type, "application");
      assert.equal(row.sessions, null);
      await db.exec("set role anon");
    });
    await t.test("ordinary signed-in users cannot read or change leads or grant themselves admin", async () => {
      await identity(outsider);
      assert.equal((await db.query("select public.is_admin() as allowed")).rows[0].allowed, false);
      await assert.rejects(db.query("select * from public.business_stats()"), /ADMIN_REQUIRED/);
      assert.deepEqual((await db.query("select * from public.enquiries")).rows, []);
      assert.deepEqual((await db.query("update public.enquiries set status='won' returning id")).rows, []);
      await assert.rejects(db.query("insert into private.admin_users values ($1)", [outsider]), /permission denied/);
    });
    await t.test("only allowlisted admins can read every submitted field and update follow-up", async () => {
      await identity(admin);
      const row = (await db.query("select * from public.enquiries where id=$1", [base.id])).rows[0];
      assert.equal(row.full_name, base.full_name);
      assert.equal(row.preferred_time, base.preferred_time);
      assert.equal(row.phone, "212600000001");
      assert.equal(row.consent, true);
      const updated = (await db.query("update public.enquiries set status='callback', notes='Call after work', next_call_at='2026-11-01T17:00:00Z' where id=$1 returning *", [base.id])).rows[0];
      assert.equal(updated.notes, "Call after work");
      assert.equal(updated.status, "callback");
      await assert.rejects(db.query("update public.enquiries set email='tampered@example.invalid' where id=$1", [base.id]), /permission denied/);
      await assert.rejects(db.query("delete from public.enquiries where id=$1", [base.id]), /permission denied/);
    });
    await t.test("teachers and appointments are admin-only and preserve removed-teacher history", async () => {
      await db.exec("set role anon");
      await assert.rejects(db.query("select * from public.teachers"), /permission denied/);
      await identity(outsider);
      assert.deepEqual((await db.query("select * from public.teachers")).rows, []);
      await assert.rejects(db.query("insert into public.teachers (name) values ('Unauthorised')"), /row-level security/);
      assert.deepEqual((await db.query("update public.teachers set active=false returning id")).rows, []);
      assert.deepEqual((await db.query("update public.enquiries set meeting_at=now() returning id")).rows, []);
      await identity(admin);
      const teacher = (await db.query("select * from public.teachers where active")).rows[0];
      assert.equal(teacher.name, "Mohammed");
      for (const name of ["mohammed", "", " A ", "a".repeat(81)]) {
        await assert.rejects(db.query("insert into public.teachers (name) values ($1)", [name]));
      }
      const added = (await db.query("insert into public.teachers (name) values ('Test Teacher') returning *")).rows[0];
      assert.equal(added.active, true);
      await assert.rejects(db.query("update public.enquiries set teacher_id=$1 where id=$2", [teacher.id, base.id]), /meeting_assignment_pair/);
      await assert.rejects(db.query("update public.enquiries set meeting_at=now() where id=$1", [base.id]), /meeting_assignment_pair/);
      const saved = (await db.query(`update public.enquiries set teacher_id=$1,
        meeting_at='2026-10-28T17:30:00Z', meeting_url='https://meet.google.com/test-meeting'
        where id=$2 returning *`, [added.id, base.id])).rows[0];
      assert.equal(saved.teacher_id, added.id);
      assert.equal(saved.meeting_url, "https://meet.google.com/test-meeting");
      assert.equal(saved.notes, "Call after work");
      assert.equal(saved.status, "callback");
      assert.equal(saved.total_mad, 2699);
      await assert.rejects(db.query("update public.enquiries set meeting_url='javascript:alert(1)' where id=$1", [base.id]));
      await db.query("update public.teachers set active=false where id=$1", [added.id]);
      assert.equal((await db.query("select teacher_id from public.enquiries where id=$1", [base.id])).rows[0].teacher_id, added.id);
      await db.query("update public.enquiries set notes='History retained' where id=$1", [base.id]);
      const other = (await db.query("select id from public.enquiries where id<>$1 and request_type<>'application' limit 1", [base.id])).rows[0];
      await assert.rejects(db.query("update public.enquiries set teacher_id=$1, meeting_at=now() where id=$2", [added.id, other.id]), /TEACHER_UNAVAILABLE/);
      await assert.rejects(db.query("update public.enquiries set teacher_id=$1, meeting_at=now() where request_type='application'", [teacher.id]), /client_meetings_only/);
      await assert.rejects(db.query("delete from public.teachers where id=$1", [added.id]), /permission denied/);
      await assert.rejects(db.query("update public.teachers set name='Changed' where id=$1", [teacher.id]), /permission denied/);
      await assert.rejects(db.query("insert into public.teachers (name, active) values ('Bypass', false)"), /permission denied/);
      const stale = (await db.query("update public.enquiries set meeting_at=now() where id=$1 and updated_at=$2 returning id", [base.id, saved.updated_at])).rows;
      assert.equal(stale.length, 0, "stale edits must not overwrite a later follow-up");
    });
    await t.test("business stats cover all records, exclude applications, and distinguish package value", async () => {
      await db.exec("reset role");
      await db.exec("begin");
      try {
        await db.exec("delete from public.enquiries");
        const before = (await db.query("select * from public.business_stats()")).rows[0];
        for (const [field, value] of Object.entries(before)) {
          if (field !== "measured_at") assert.equal(Number(value), 0, field);
        }
        for (let index = 0; index < 105; index++) {
          await db.query(`insert into public.enquiries
            (id, full_name, email, phone, goal, request_type, language, consent, status, sessions, total_mad, next_call_at, background)
            values ($1, 'Stats Test', 'stats@example.invalid', '212600000000', 'Testing',
              $2, 'en', true, $3, $4, $5, $6, 'Test teaching background')`,
          [randomUUID(), index === 104 ? "application" : "consultation",
            index < 3 || index === 104 ? "won" : index === 3 ? "closed" : index === 6 ? "new" : index === 7 ? "contacted" : "callback",
            index < 2 ? 8 : null, index < 2 ? 1399 : null,
            index === 0 || index === 3 || index === 4 || index === 104 ? "2000-01-01T00:00:00Z" : index === 5 ? "2100-01-01T00:00:00Z" : null]);
        }
        await identity(admin);
        const stats = (await db.query("select * from public.business_stats()")).rows[0];
        assert.equal(Number(stats.client_enquiries), 104);
        assert.equal(Number(stats.converted), 3);
        assert.equal(Number(stats.confirmed_value_mad), 2798);
        assert.equal(Number(stats.confirmed_without_package), 1);
        assert.equal(Number(stats.applications), 1);
        assert.equal(Number(stats.open_enquiries), 100);
        assert.equal(Number(stats.callbacks), 98);
        assert.equal(Number(stats.new_enquiries), 1);
        assert.equal(Number(stats.contacted), 1);
        assert.equal(Number(stats.closed), 1);
        assert.equal(Number(stats.overdue_callbacks), 1);
        assert.ok(Number.isFinite(new Date(stats.measured_at).getTime()));
      } finally {
        await db.exec("rollback");
      }
    });
    await t.test("visits are idempotent, expire after inactivity, and remain private", async () => {
      await db.exec("reset role");
      const id = randomUUID();
      await db.exec("set role anon");
      assert.equal((await db.query("select public.record_site_visit($1) as id", [id])).rows[0].id, id);
      assert.equal((await db.query("select public.record_site_visit($1) as id", [id])).rows[0].id, id);
      await assert.rejects(db.query("select public.record_site_visit(null)"), /INVALID_VISIT/);
      await assert.rejects(db.query("select * from private.site_visits"), /permission denied/);
      await assert.rejects(db.query("select * from private.enquiry_confirmations"), /permission denied/);
      await assert.rejects(db.query("select private.submit_enquiry_core('{}')"), /permission denied/);
      await assert.rejects(db.query("select public.business_trends('2026-01-01', '2026-01-31', 'hour')"), /permission denied/);
      await db.exec("reset role");
      assert.equal(Number((await db.query("select count(*) as n from private.site_visits where id=$1", [id])).rows[0].n), 1);
      await db.query("update private.site_visits set last_seen_at=now()-interval '31 minutes' where id=$1", [id]);
      await db.exec("set role anon");
      assert.notEqual((await db.query("select public.record_site_visit($1) as id", [id])).rows[0].id, id);
      await identity(outsider);
      await assert.rejects(db.query("select public.business_trends('2026-01-01', '2026-01-31', 'day')"), /ADMIN_REQUIRED/);
    });
    await t.test("visit attribution is optional, atomic, and deduplicated on retries", async () => {
      await db.exec("reset role");
      const visit = randomUUID();
      await db.exec("set role anon");
      await db.query("select public.record_site_visit($1)", [visit]);
      const payload = { ...base, id: randomUUID(), email: "visit@example.invalid", phone: "212600000088", analytics_visit_id: visit };
      await submit(payload); await submit(payload);
      await db.exec("reset role");
      assert.equal((await db.query("select analytics_visit_id from public.enquiries where id=$1", [payload.id])).rows[0].analytics_visit_id, visit);
      const untracked = { ...payload, id: randomUUID(), analytics_visit_id: randomUUID() };
      await db.exec("set role anon");
      await submit(untracked);
      await db.exec("reset role");
      assert.equal((await db.query("select analytics_visit_id from public.enquiries where id=$1", [untracked.id])).rows[0].analytics_visit_id, null);
      const invalid = { ...payload, id: randomUUID(), analytics_visit_id: "invalid" };
      await db.exec("set role anon");
      await assert.rejects(submit(invalid));
      await db.exec("reset role");
      assert.equal(Number((await db.query("select count(*) as n from public.enquiries where id=$1", [invalid.id])).rows[0].n), 0);
      await identity(admin);
      await assert.rejects(db.query("update public.enquiries set analytics_visit_id=$1 where id=$2", [visit, payload.id]), /permission denied/);
    });
    await t.test("confirmation history records only the first transition and excludes applications", async () => {
      await db.exec("reset role");
      await db.exec("begin");
      try {
        await identity(admin);
        await db.query("update public.enquiries set status='won' where id=$1", [base.id]);
        await db.query("update public.enquiries set notes='Still confirmed' where id=$1", [base.id]);
        await db.query("update public.enquiries set status='new' where id=$1", [base.id]);
        await db.query("update public.enquiries set status='won' where id=$1", [base.id]);
        await db.exec("update public.enquiries set status='won' where request_type='application'");
        await db.exec("reset role");
        assert.equal(Number((await db.query("select count(*) as n from private.enquiry_confirmations where enquiry_id=$1", [base.id])).rows[0].n), 1);
        assert.equal(Number((await db.query("select count(*) as n from private.enquiry_confirmations c join public.enquiries e on e.id=c.enquiry_id where e.request_type='application'")).rows[0].n), 0);
      } finally { await db.exec("rollback"); }
    });
    await t.test("trends zero-fill buckets, use Morocco time and distinguish cohorts from confirmations", async () => {
      await db.exec("reset role");
      await db.exec("begin");
      try {
        await db.exec("delete from public.enquiries; delete from private.site_visits");
        const visit = randomUUID();
        await db.query("insert into private.site_visits (id,started_at,last_seen_at) values ($1,'2025-12-31T23:30:00Z','2026-01-01T00:00:00Z')", [visit]);
        for (let i = 0; i < 3; i++) {
          await db.query(`insert into public.enquiries
            (id,full_name,email,phone,goal,request_type,language,consent,created_at,analytics_visit_id,background)
            values ($1,'Trend Test','trend@example.invalid','212600000000','Testing',$2,'en',true,'2026-01-01T00:30:00Z',$3,'Teacher')`,
          [randomUUID(), i === 2 ? "application" : "consultation", visit]);
        }
        await db.exec("update public.enquiries set status='won'");
        await db.exec("update private.enquiry_confirmations set confirmed_at='2026-02-02T12:00:00Z'");
        await identity(admin);
        const trend = async (start, end, mode) => (await db.query("select public.business_trends($1,$2,$3) as data", [start, end, mode])).rows[0].data;
        const hours = await trend("2026-01-01", "2026-01-01", "hour");
        assert.equal(hours.buckets.length, 24);
        assert.equal(hours.buckets[0].visits, 1);
        assert.equal(hours.buckets[0].converted_visits, 1);
        assert.equal(hours.buckets[1].enquiries, 2);
        assert.equal(hours.buckets[1].converted, 2);
        assert.equal(hours.buckets[1].attributed, 2);
        assert.equal(hours.buckets.reduce((n, b) => n + b.confirmations, 0), 0);
        const days = await trend("2026-02-01", "2026-02-28", "day");
        assert.equal(days.buckets.length, 28);
        assert.equal(days.buckets[1].key, "2026-02-02");
        assert.equal(days.buckets[1].confirmations, 2);
        const months = await trend("2026-01-01", "2026-12-31", "month");
        assert.equal(months.buckets.length, 12);
        assert.equal(months.buckets[0].visits, 1);
        assert.equal(months.buckets[1].confirmations, 2);
        await db.exec("reset role");
        await db.query("update private.site_visits set started_at='2026-03-01T00:30:00Z' where id=$1", [visit]);
        await identity(admin);
        const ramadan = await trend("2026-03-01", "2026-03-01", "hour");
        assert.equal(ramadan.buckets[0].visits, 1, "Ramadan uses UTC+0 rather than a fixed UTC+1");
        assert.equal(ramadan.buckets[1].visits, 0);
        const leap = await trend("2024-02-01", "2024-02-29", "day");
        assert.equal(leap.buckets.length, 29);
        const leapYear = await trend("2024-01-01", "2024-12-31", "month");
        assert.equal(leapYear.buckets.length, 12);
        await assert.rejects(trend("2026-02-01", "2026-01-01", "day"), /INVALID_TREND_RANGE/);
      } finally { await db.exec("rollback"); }
      await identity(admin);
      for (const args of [["2026-01-01","2028-01-01","day"],["2026-01-01","2026-01-02","invalid"],[null,"2026-01-02","day"]]) {
        await assert.rejects(db.query("select public.business_trends($1,$2,$3)", args), /INVALID_TREND_RANGE/);
      }
    });
    await t.test("revoking admin immediately revokes database read access", async () => {
      await db.exec("reset role");
      await db.query("delete from private.admin_users where user_id=$1", [admin]);
      await identity(admin);
      assert.deepEqual((await db.query("select * from public.enquiries")).rows, []);
      await assert.rejects(db.query("select * from public.business_stats()"), /ADMIN_REQUIRED/);
      await assert.rejects(db.query("select public.business_trends('2026-01-01','2026-01-31','hour')"), /ADMIN_REQUIRED/);
    });
  } finally {
    await db.close();
  }
});
