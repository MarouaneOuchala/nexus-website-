import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

test("teacher diagnostic conversion uses completed sessions and actual first payments", async () => {
  const db = new PGlite();
  const admin = randomUUID(), outsider = randomUUID();
  try {
    await db.exec(`
      create role anon nologin; create role authenticated nologin;
      create schema auth; create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid() to authenticated;
    `);
    for (const name of ["202610250001_enquiries.sql", "202610260004_meeting_welcome.sql",
      "202610260005_teacher_profiles.sql", "202610260006_teacher_conversion.sql"]) {
      await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"));
    }
    await db.query("insert into auth.users values ($1),($2)", [admin, outsider]);
    await db.query("insert into private.admin_users values ($1)", [admin]);
    const teacher = (await db.query("select id from public.teachers")).rows[0].id;
    const other = (await db.query("insert into public.teachers(name) values ('Other Teacher') returning id")).rows[0].id;
    const add = async (email, assigned = teacher, type = "consultation") => {
      const id = randomUUID();
      await db.query(`insert into public.enquiries
        (id,full_name,email,phone,goal,request_type,language,consent,teacher_id,meeting_at,background)
        values ($1,'Test Client',$2,'212600000000','English',$4,'fr',true,$3,
          case when $3::uuid is not null then '2026-01-01T10:00Z'::timestamptz end,'Test')`,
      [id, email, assigned, type]);
      return id;
    };
    const identity = async (id) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
      await db.exec("set role authenticated");
    };
    const metric = async (id = teacher) => (await db.query("select * from public.teacher_conversion() where teacher_id=$1", [id])).rows[0];
    const first = await add("client@example.invalid");
    const second = await add("second@example.invalid");
    const future = await add("upcoming@example.invalid");
    const unassigned = await add("unassigned@example.invalid", null);
    const application = await add("applicant@example.invalid", null, "application");
    await identity(admin);
    assert.equal((await metric()).conversion_rate, null);
    await db.query("update public.enquiries set status='won' where id=$1", [future]);
    assert.equal((await metric()).paying_clients, 0);
    await assert.rejects(db.query("update public.enquiries set first_paid_at='2026-01-03T10:00Z' where id=$1", [first]), /payment_after_diagnostic/);
    await assert.rejects(db.query("update public.enquiries set diagnostic_completed_at='2026-01-02T10:00Z' where id=$1", [unassigned]), /DIAGNOSTIC_ASSIGNMENT_REQUIRED/);
    await assert.rejects(db.query("update public.enquiries set first_paid_at='2026-01-03T10:00Z' where id=$1", [application]));
    await assert.rejects(db.query("update public.enquiries set diagnostic_completed_at=now()+interval '1 day' where id=$1", [first]), /FUTURE_DIAGNOSTIC_OR_PAYMENT/);
    await db.query("update public.enquiries set diagnostic_completed_at='2026-01-02T10:00Z' where id in ($1,$2)", [first, second]);
    await assert.rejects(db.query("update public.enquiries set first_paid_at='2026-01-01T10:00Z' where id=$1", [first]), /payment_after_diagnostic/);
    await db.query("update public.enquiries set first_paid_at='2026-01-03T10:00Z' where id=$1", [first]);
    assert.equal((await metric()).completed_diagnostics, 2);
    assert.equal((await metric()).paying_clients, 1);
    assert.equal(Number((await metric()).conversion_rate), 50);
    await db.query("update public.enquiries set teacher_id=$1 where id=$2", [other, first]);
    assert.equal((await metric()).paying_clients, 1);
    assert.equal((await metric(other)).completed_diagnostics, 0);
    await assert.rejects(db.query("update public.enquiries set diagnostic_teacher_id=$1 where id=$2", [other, first]), /permission denied/);
    await assert.rejects(db.query("update public.enquiries set diagnostic_completed_at=null where id=$1", [first]), /payment_after_diagnostic/);
    await db.exec("reset role");
    const duplicate = await add("CLIENT@example.invalid", other);
    await identity(admin);
    await db.query(`update public.enquiries set diagnostic_completed_at='2026-01-04T10:00Z',
      first_paid_at='2026-01-05T10:00Z' where id=$1`, [duplicate]);
    assert.equal((await metric()).paying_clients, 1);
    assert.equal((await metric(other)).paying_clients, 0);
    await db.query("update public.teachers set active=false where id=$1", [teacher]);
    assert.equal((await metric()).paying_clients, 1);
    await db.query("update public.enquiries set first_paid_at=null where id in ($1,$2)", [first, duplicate]);
    assert.equal((await metric()).paying_clients, 0);
    await identity(outsider);
    await assert.rejects(db.query("select * from public.teacher_conversion()"), /ADMIN_REQUIRED/);
    assert.equal((await db.query("update public.enquiries set first_paid_at=now() returning id")).rows.length, 0);
    await db.exec("set role anon");
    await assert.rejects(db.query("select * from public.teacher_conversion()"), /permission denied/);
  } finally { await db.close(); }
});
