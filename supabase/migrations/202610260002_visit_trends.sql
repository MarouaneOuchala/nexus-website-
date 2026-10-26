begin;

create table private.analytics_settings (
  singleton boolean primary key default true check (singleton),
  started_at timestamptz not null default now()
);
insert into private.analytics_settings default values;
create table private.site_visits (
  id uuid primary key,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index site_visits_started_idx on private.site_visits (started_at);
create table private.enquiry_confirmations (
  enquiry_id uuid primary key references public.enquiries(id) on delete cascade,
  confirmed_at timestamptz not null default now()
);
create index enquiry_confirmations_time_idx on private.enquiry_confirmations (confirmed_at);
alter table public.enquiries add column analytics_visit_id uuid references private.site_visits(id) on delete set null;
create index enquiries_analytics_visit_idx on public.enquiries (analytics_visit_id);
alter table private.analytics_settings enable row level security;
alter table private.site_visits enable row level security;
alter table private.enquiry_confirmations enable row level security;
revoke all on private.analytics_settings, private.site_visits, private.enquiry_confirmations from public, anon, authenticated;

create function public.record_site_visit(visit_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actual_id uuid := visit_id;
  previous_seen timestamptz;
begin
  if visit_id is null then raise exception 'INVALID_VISIT' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(visit_id::text, 3));
  select last_seen_at into previous_seen from private.site_visits where id = visit_id;
  if previous_seen <= now() - interval '30 minutes' then
    actual_id := gen_random_uuid();
  end if;
  insert into private.site_visits (id) values (actual_id)
    on conflict (id) do update set last_seen_at = now();
  return actual_id;
end;
$$;
revoke all on function public.record_site_visit(uuid) from public;
grant execute on function public.record_site_visit(uuid) to anon, authenticated;

alter function public.submit_enquiry(jsonb) set schema private;
alter function private.submit_enquiry(jsonb) rename to submit_enquiry_core;
revoke all on function private.submit_enquiry_core(jsonb) from public, anon, authenticated;
create function public.submit_enquiry(payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  enquiry_id uuid;
  visit_id uuid;
begin
  enquiry_id := private.submit_enquiry_core(payload);
  if payload->>'analytics_visit_id' is not null then
    visit_id := (payload->>'analytics_visit_id')::uuid;
    update public.enquiries e set analytics_visit_id = v.id
      from private.site_visits v
      where e.id = enquiry_id and e.analytics_visit_id is null
        and e.created_at > now() - interval '5 minutes'
        and v.id = visit_id and v.last_seen_at > now() - interval '30 minutes';
  end if;
  return enquiry_id;
end;
$$;
revoke all on function public.submit_enquiry(jsonb) from public;
grant execute on function public.submit_enquiry(jsonb) to anon, authenticated;

create function private.record_enquiry_confirmation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.request_type <> 'application' and new.status = 'won' and old.status <> 'won' then
    insert into private.enquiry_confirmations (enquiry_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger record_enquiry_confirmation after update of status on public.enquiries
  for each row execute function private.record_enquiry_confirmation();
revoke all on function private.record_enquiry_confirmation() from public, anon, authenticated;

create function public.business_trends(start_date date, end_date date, granularity text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  from_time timestamptz;
  until_time timestamptz;
  result jsonb;
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED' using errcode = '42501'; end if;
  if start_date is null or end_date is null or end_date < start_date or end_date - start_date > 365
    or granularity is null or granularity not in ('hour', 'day', 'month') then
    raise exception 'INVALID_TREND_RANGE' using errcode = '22023';
  end if;
  from_time := start_date::timestamp at time zone 'Africa/Casablanca';
  until_time := (end_date + 1)::timestamp at time zone 'Africa/Casablanca';
  with
  buckets as (
    select n as bucket from generate_series(0, case granularity
      when 'hour' then 23 when 'day' then end_date - start_date
      else (extract(year from end_date)::int - extract(year from start_date)::int) * 12
        + extract(month from end_date)::int - extract(month from start_date)::int end) n
  ),
  events as (
    select v.started_at as occurred_at, 1 as visits, 0 as enquiries, 0 as converted,
      0 as confirmations, 0 as attributed, 0 as converted_visits
      from private.site_visits v where v.started_at >= from_time and v.started_at < until_time
    union all
    select e.created_at, 0, 1, (e.status = 'won')::int, 0,
      (e.analytics_visit_id is not null)::int, 0
      from public.enquiries e where e.request_type <> 'application'
        and e.created_at >= from_time and e.created_at < until_time
    union all
    select c.confirmed_at, 0, 0, 0, 1, 0, 0 from private.enquiry_confirmations c
      where c.confirmed_at >= from_time and c.confirmed_at < until_time
    union all
    select v.started_at, 0, 0, 0, 0, 0, 1 from private.site_visits v
      where v.started_at >= from_time and v.started_at < until_time
      and exists (select 1 from public.enquiries e
        where e.analytics_visit_id = v.id and e.request_type <> 'application' and e.status = 'won')
  ),
  totals as (
    select case granularity when 'hour' then extract(hour from occurred_at at time zone 'Africa/Casablanca')::int
      when 'day' then (occurred_at at time zone 'Africa/Casablanca')::date - start_date
      else (extract(year from occurred_at at time zone 'Africa/Casablanca')::int - extract(year from start_date)::int) * 12
        + extract(month from occurred_at at time zone 'Africa/Casablanca')::int - extract(month from start_date)::int end as bucket,
      sum(visits) as visits, sum(enquiries) as enquiries, sum(converted) as converted,
      sum(confirmations) as confirmations, sum(attributed) as attributed, sum(converted_visits) as converted_visits
    from events group by 1
  )
  select jsonb_build_object(
    'tracking_started_at', (select started_at from private.analytics_settings),
    'legacy_confirmed', (select count(*) from public.enquiries e
      where e.request_type <> 'application' and e.status = 'won'
        and not exists (select 1 from private.enquiry_confirmations c where c.enquiry_id = e.id)),
    'buckets', jsonb_agg(jsonb_build_object(
      'key', case granularity when 'hour' then lpad(b.bucket::text, 2, '0') || ':00'
        when 'day' then (start_date + b.bucket)::text
        else to_char(date_trunc('month', start_date::timestamp) + b.bucket * interval '1 month', 'YYYY-MM') end,
      'visits', coalesce(t.visits, 0), 'enquiries', coalesce(t.enquiries, 0),
      'converted', coalesce(t.converted, 0), 'confirmations', coalesce(t.confirmations, 0),
      'attributed', coalesce(t.attributed, 0), 'converted_visits', coalesce(t.converted_visits, 0)
    ) order by b.bucket))
    into result from buckets b left join totals t using (bucket);
  return result;
end;
$$;
revoke all on function public.business_trends(date, date, text) from public, anon;
grant execute on function public.business_trends(date, date, text) to authenticated;
commit;
