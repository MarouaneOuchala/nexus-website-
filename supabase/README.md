# Enquiries and admin setup (Supabase Free)

Design 5 stays compatible with static hosting. Its public popup calls a narrowly
scoped Postgres function; the dashboard uses Supabase Auth and database-enforced
row-level security (RLS). No client data is embedded in the exported admin page.

## Connect a free project

1. Create a **Free** project at [Supabase](https://supabase.com/dashboard).
   Choose an appropriate region for your clients and review your privacy and
   data-transfer obligations before collecting personal information.
2. In the project's SQL Editor, run
   [the migration](migrations/202610250001_enquiries.sql) once. It runs atomically.
   Do not disable RLS or add public read policies.
3. In **Authentication > Providers > Email**, disable new user signups.
   The public enquiry form does not need an account. Enable the password email
   provider for admins.
4. In **Authentication > Users**, create your admin user with a strong password
   and a confirmed email. This application uses password login, not invitation
   link or password-recovery callbacks. Account provisioning and password resets
   are managed through Supabase by the project owner.
5. Add that user's UUID to the private allowlist in the SQL Editor:

   ```sql
   insert into private.admin_users (user_id)
   values ('REPLACE-WITH-THE-AUTH-USER-UUID');
   ```

   Signing in alone does not grant admin access. To revoke access, remove the UUID
   from this table. RLS denies further reads and updates immediately. Previously
   viewed information cannot be recalled from a user's screen.
6. Get the **Project URL** and **publishable key** from the project's API settings.
   Create an ignored `.env.local` in the project root:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
   ```

   These two values are intended for browser use. **Never put a secret key,
   service-role key, database password, or admin password in a `NEXT_PUBLIC_*`
   variable or source control.** Access protection comes from RLS, not key secrecy.
7. Restart development, or rebuild and redeploy after setting the same environment
   variables on your host. Static exports bake public environment values at build
   time. Open `/admin/` (under your base path if configured).

## Workflow

### Business statistics

Run [the business-stats migration](migrations/202610260001_business_stats.sql)
after the initial enquiries migration. The **Business stats** dashboard tab reads
an admin-only aggregate over all records, independent of inbox pagination and
filters. Refresh or reopen the tab to obtain a new snapshot.

Conversion means a client enquiry currently marked **Confirmed**, divided by all
client enquiries. Teacher applications are counted separately. These are enquiry
records, not unique customers or site visitors. Confirmed package value is the
sum of selected packages on confirmed client enquiries, not collected revenue;
confirmed enquiries without a package are shown separately. Overdue callbacks
include only open client enquiries whose callback time has passed.

### Additional admins

The project owner must create Mohammed (`Mohammedboulahouajeb@gmail.com`) and
Marouane (`marouaneouchalla@gmail.com`) in **Authentication > Users**, setting
passwords securely there. Existing passwords cannot be retrieved. Once both
accounts exist, run the following in the SQL Editor to grant admin access:

```sql
do $$
begin
  if (select count(*) from auth.users
      where lower(email) in ('mohammedboulahouajeb@gmail.com', 'marouaneouchalla@gmail.com')) <> 2 then
    raise exception 'Create both Auth users before granting admin access';
  end if;
  insert into private.admin_users (user_id)
  select id from auth.users
  where lower(email) in ('mohammedboulahouajeb@gmail.com', 'marouaneouchalla@gmail.com')
  on conflict (user_id) do nothing;
end;
$$;
```

This does not change Salma's access or any password.

### Enquiry workflow

- Contact, consultation, programme and package buttons open a native accessible
  modal, with keyboard focus containment, Escape/backdrop close, and focus return.
- Package selection is retained; the database derives the authoritative price:
  8 / 1,399; 16 / 2,699; 24 / 3,799; 32 / 4,999 MAD.
- Name, email, callback phone, goal and consent are required. Preferred callback
  time is optional. Teacher applications additionally capture background text.
  Moroccan local 10-digit phone numbers are normalized to `212…`.
- Success is shown only after a database receipt. Errors preserve the form.
  Retries reuse a random submission UUID to prevent duplicate records.
- The dashboard shows every captured field, language, package, amount, receipt
  time, consent version and reference. Admins can call or email the client, change
  status, schedule a callback and save private notes. Callback datetime fields use
  the admin device's local timezone; visitor availability is labelled Morocco time.
- Dashboard records load 100 at a time. Search, status filters and counts apply to
  **loaded records**; use **Load more** to include older records. Refresh retrieves
  the newest page. Edits use an optimistic timestamp check: if a save fails because
  another admin changed the record, refresh, review the current record and retry.
- Admin sessions use browser session storage (per tab), not permanent local storage.
  Always sign out on shared devices. Enquiry data itself is not cached in storage.

## Protection and operating limits

Anonymous users have no table read, update or delete permissions. The submission
function validates input lengths, types, consent and bundles. Only allowlisted
admins can select rows or update status, notes and callback time; even admins
cannot alter the client's original submission through this API. React renders
submitted text as text, never as HTML.

A honeypot and a limit of three enquiries per email/normalized phone per 15 minutes
reduce simple spam. **This is not comprehensive bot/DDoS protection**: attackers
can rotate contact details. Before advertising broadly, add a server-side CAPTCHA
verification/edge gateway and network rate limits appropriate to your traffic.
Do not rely on a browser-only CAPTCHA check.

The Free plan may pause after a week of inactivity. If paused or unreachable, the
form reports failure, not success; restore the project in Supabase. Monitor
availability and quotas before depending on this for business-critical leads.
Configure an internal retention policy and periodically delete expired enquiries
through the Supabase SQL Editor, and manage backups according to your needs.
No enquiries, credentials or admin accounts are seeded by this repository.

## Validation

Run `npm run test:enquiries`, `npm run lint`, and `npm run build`.
The database tests run the actual migration in local PGlite Postgres with stub
Supabase auth roles/`auth.uid()`; they test SQL validation, all four prices,
idempotency, duplicate throttling, anonymous/ordinary-user denials, admin follow-up
permissions and revocation. They do not connect to a hosted project.

After connecting your project, verify with synthetic data first:

1. Submit each bundle and a teacher application; confirm a receipt appears.
2. Verify anonymous callers cannot select the table through the API.
3. Sign in with a non-allowlisted account: no enquiry records should be visible.
4. Sign in with the admin account: inspect all fields and save a callback/notes.
5. Sign out and confirm that private records disappear.
6. Disconnect the network and verify no submission or follow-up claims success.

Hosted Auth, live project settings, and deployment must be checked against your
own project before production use.
