import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

test("teacher profiles, activity and unique historical client workloads", async (t) => {
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
    for (const name of ["202610250001_enquiries.sql", "202610260004_meeting_welcome.sql"]) {
      await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"));
    }
    await db.query("insert into auth.users values ($1),($2)", [admin, outsider]);
    await db.query("insert into private.admin_users values ($1)", [admin]);
    const mohammed = (await db.query("select id from public.teachers")).rows[0].id;
    const other = (await db.query("insert into public.teachers (name) values ('Second Teacher') returning id")).rows[0].id;
    const add = async (email, teacher = mohammed, type = "consultation") => {
      const id = randomUUID();
      await db.query(`insert into public.enquiries
        (id,full_name,email,phone,goal,request_type,language,consent,teacher_id,meeting_at,background)
        values ($1,'Test Client',$2,'212600000000','English',$4,'fr',true,$3,
          case when $3::uuid is not null then '2026-11-01T18:00:00Z'::timestamptz end,'Teaching background')`,
      [id, email, teacher, type]);
      return id;
    };
    const first = await add("same@example.invalid");
    await db.exec(await readFile(new URL("../supabase/migrations/202610260005_teacher_profiles.sql", import.meta.url), "utf8"));
    const identity = async (id) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
      await db.exec("set role authenticated");
    };
    const workload = async (teacher = mohammed) => (await db.query("select * from public.teacher_workload() where teacher_id=$1", [teacher])).rows[0];
    await identity(admin);
    await t.test("migration backfills existing assignments without inventing active clients", async () => {
      const result = await workload();
      assert.equal(result.total_clients, 1);
      assert.equal(result.pending_clients, 1);
      assert.equal(result.active_clients, 0);
      assert.equal((await db.query("select teaching_status from public.enquiries where id=$1", [first])).rows[0].teaching_status, "pending");
    });
    await t.test("anonymous and ordinary users cannot access profiles, private history or workload", async () => {
      await db.exec("set role anon");
      await assert.rejects(db.query("select * from public.teacher_workload()"), /permission denied/);
      await assert.rejects(db.query("select notes from public.teachers"), /permission denied/);
      await identity(outsider);
      await assert.rejects(db.query("select * from public.teacher_workload()"), /ADMIN_REQUIRED/);
      assert.deepEqual((await db.query("select * from public.teachers")).rows, []);
      assert.deepEqual((await db.query("update public.teachers set notes='not allowed' returning id")).rows, []);
      assert.deepEqual((await db.query("update public.enquiries set teaching_status='active' returning id")).rows, []);
      await assert.rejects(db.query("select * from private.teacher_client_history"), /permission denied/);
      await identity(admin);
      await assert.rejects(db.query("insert into private.teacher_client_history values ($1,$2,now())", [other, first]), /permission denied/);
    });
    await t.test("profiles save preferences with validation and optimistic concurrency", async () => {
      const before = (await db.query("select * from public.teachers where id=$1", [mohammed])).rows[0];
      const updated = (await db.query(`update public.teachers set schedule_preference='weekdays',
        availability_notes='Mon–Thu 18:00–21:00 Morocco', notes='Prefers no Friday calls',
        specialties='Business English', teaching_languages='English, French', client_capacity=8
        where id=$1 and updated_at=$2 returning *`, [mohammed, before.updated_at])).rows[0];
      assert.equal(updated.client_capacity, 8);
      assert.equal(updated.notes, "Prefers no Friday calls");
      assert.equal((await db.query("update public.teachers set notes='stale' where id=$1 and updated_at=$2 returning id", [mohammed, before.updated_at])).rows.length, 0);
      for (const [column, value] of [["client_capacity", 0], ["client_capacity", 201], ["schedule_preference", "invalid"], ["notes", "a".repeat(3001)], ["availability_notes", "a".repeat(1001)], ["teaching_languages", "a".repeat(201)], ["specialties", "a".repeat(501)]]) {
        await assert.rejects(db.query(`update public.teachers set ${column}=$1 where id=$2`, [value, mohammed]));
      }
    });
    await t.test("same-email enquiries count once, with explicit activity precedence independent of enquiry status", async () => {
      await db.exec("reset role");
      const duplicate = await add("SAME@example.invalid");
      await db.query("update public.enquiries set teaching_status='paused', status='won' where id=$1", [first]);
      await db.query("update public.enquiries set teaching_status='active', status='closed' where id=$1", [duplicate]);
      const pending = await add("pending@example.invalid");
      const finished = await add("finished@example.invalid");
      await db.query("update public.enquiries set teaching_status='finished' where id=$1", [finished]);
      await add("teacher@example.invalid", null, "application");
      const unassigned = await add("unassigned@example.invalid", null);
      await assert.rejects(db.query("update public.enquiries set teaching_status='active' where id=$1", [unassigned]), /teaching_requires_assignment/);
      await assert.rejects(db.query("update public.enquiries set teaching_status='invalid' where id=$1", [pending]));
      const result = await workload();
      assert.equal(result.total_clients, 3);
      assert.equal(result.assigned_clients, 3);
      assert.equal(result.active_clients, 1);
      assert.equal(result.paused_clients, 0);
      assert.equal(result.pending_clients, 1);
      assert.equal(result.finished_clients, 1);
      await db.query("update public.enquiries set teaching_status='finished' where id=$1", [duplicate]);
      assert.equal((await workload()).paused_clients, 1);
      await db.query("update public.enquiries set teaching_status='active' where id=$1", [duplicate]);
    });
    await t.test("reassignment preserves overall history, resets activity, and does not inflate repeat assignments", async () => {
      await db.query("update public.enquiries set teacher_id=$1,teaching_status='active' where id=$2", [other, first]);
      assert.equal((await db.query("select teaching_status from public.enquiries where id=$1", [first])).rows[0].teaching_status, "pending");
      assert.equal((await workload(other)).total_clients, 1);
      assert.equal((await workload(other)).pending_clients, 1);
      assert.equal((await workload()).total_clients, 3);
      await db.query("update public.enquiries set teacher_id=$1 where id=$2", [mohammed, first]);
      assert.equal((await workload()).total_clients, 3);
      assert.equal((await workload(other)).total_clients, 1);
      assert.equal((await workload(other)).assigned_clients, 0);
    });
    await t.test("workload covers records beyond inbox pagination and retains removed teachers", async () => {
      for (let i = 0; i < 105; i++) await add(`bulk${i}@example.invalid`, other);
      const result = await workload(other);
      assert.equal(result.total_clients, 106);
      assert.equal(result.assigned_clients, 105);
      await identity(admin);
      await db.query("update public.teachers set active=false where id=$1", [other]);
      assert.equal((await workload(other)).total_clients, 106);
      const row = (await db.query("select id from public.enquiries where teacher_id=$1 limit 1", [other])).rows[0];
      await db.query("update public.enquiries set teaching_status='active' where id=$1", [row.id]);
      assert.equal((await workload(other)).active_clients, 1);
      await db.exec("reset role");
      await db.query("delete from private.admin_users where user_id=$1", [admin]);
      await identity(admin);
      await assert.rejects(db.query("select * from public.teacher_workload()"), /ADMIN_REQUIRED/);
    });
  } finally { await db.close(); }
});
