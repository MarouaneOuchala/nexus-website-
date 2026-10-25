begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table private.admin_users enable row level security;
revoke all on private.admin_users from public, anon, authenticated;

create function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from private.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create table public.enquiries (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null check (length(full_name) between 2 and 120),
  email text not null check (length(email) between 3 and 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone text not null check (phone ~ '^[0-9]{8,15}$'),
  goal text not null check (length(goal) between 2 and 1000),
  background text not null default '' check (length(background) <= 3000),
  preferred_time text not null default '' check (length(preferred_time) <= 200),
  request_type text not null check (request_type in ('consultation', 'course-info', 'application')),
  sessions integer check (sessions in (8, 16, 24, 32)),
  total_mad integer,
  language text not null check (language in ('en', 'fr', 'ar')),
  consent boolean not null check (consent),
  consent_version text not null default '2026-10-callback-v1',
  status text not null default 'new' check (status in ('new', 'contacted', 'callback', 'won', 'closed')),
  notes text not null default '' check (length(notes) <= 10000),
  next_call_at timestamptz,
  check (
    (sessions is null and total_mad is null) or
    (sessions is not null and total_mad is not null and total_mad =
      case sessions when 8 then 1399 when 16 then 2699 when 24 then 3799 when 32 then 4999 end)
  ),
  check (request_type <> 'application' or (sessions is null and length(background) >= 2))
);

create index enquiries_created_idx on public.enquiries (created_at desc, id desc);
create index enquiries_email_idx on public.enquiries (email, created_at);
create index enquiries_phone_idx on public.enquiries (phone, created_at);

alter table public.enquiries enable row level security;
revoke all on public.enquiries from public, anon, authenticated;
grant select on public.enquiries to authenticated;
grant update (status, notes, next_call_at) on public.enquiries to authenticated;
create policy admin_read on public.enquiries for select to authenticated
  using ((select public.is_admin()));
create policy admin_follow_up on public.enquiries for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create function private.stamp_enquiry_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger stamp_enquiry_update before update on public.enquiries
  for each row execute function private.stamp_enquiry_update();

create function public.submit_enquiry(payload jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  submission_id uuid;
  contact_email text;
  contact_phone text;
  bundle integer;
  price integer;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' or
     octet_length(payload::text) > 16000 or
     coalesce(payload->>'website', '') <> '' or
     payload->>'consent' is distinct from 'true' then
    raise exception 'INVALID_ENQUIRY' using errcode = '22023';
  end if;
  submission_id := (payload->>'id')::uuid;
  if submission_id is null then
    raise exception 'INVALID_ENQUIRY' using errcode = '22023';
  end if;
  contact_email := lower(btrim(payload->>'email'));
  contact_phone := regexp_replace(payload->>'phone', '[^0-9]', '', 'g');
  if left(contact_phone, 2) = '00' then
    contact_phone := substr(contact_phone, 3);
  elsif length(contact_phone) = 10 and left(contact_phone, 1) = '0' then
    contact_phone := '212' || substr(contact_phone, 2);
  end if;
  bundle := (payload->>'sessions')::integer;
  price := case bundle when 8 then 1399 when 16 then 2699 when 24 then 3799 when 32 then 4999 end;

  -- Serialize retries and same-contact submissions before checking duplicate limits.
  perform pg_advisory_xact_lock(hashtextextended(submission_id::text, 0));
  if exists (select 1 from public.enquiries where id = submission_id) then
    return submission_id;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(contact_email, 1));
  perform pg_advisory_xact_lock(hashtextextended(contact_phone, 2));
  if (select count(*) from public.enquiries
      where (email = contact_email or phone = contact_phone)
      and created_at > now() - interval '15 minutes') >= 3 then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;
  insert into public.enquiries (
    id, full_name, email, phone, goal, background, preferred_time,
    request_type, sessions, total_mad, language, consent
  ) values (
    submission_id, btrim(payload->>'full_name'), contact_email, contact_phone,
    btrim(payload->>'goal'), btrim(coalesce(payload->>'background', '')),
    btrim(coalesce(payload->>'preferred_time', '')), payload->>'request_type',
    bundle, price, payload->>'language', true
  );
  return submission_id;
end;
$$;
revoke all on function public.submit_enquiry(jsonb) from public;
grant execute on function public.submit_enquiry(jsonb) to anon, authenticated;

commit;
