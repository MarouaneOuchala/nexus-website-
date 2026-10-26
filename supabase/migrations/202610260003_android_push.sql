begin;

create table private.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references auth.sessions(id) on delete cascade,
  token text not null unique check (length(token) between 20 and 4096),
  updated_at timestamptz not null default now()
);
create index push_devices_session on private.push_devices(session_id);
create table private.push_deliveries (
  id bigint generated always as identity primary key,
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  device_id uuid not null references private.push_devices(id) on delete cascade,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  claimed_until timestamptz,
  lease_id uuid,
  completed_at timestamptz,
  last_error text,
  unique(enquiry_id, device_id)
);
create index push_deliveries_pending on private.push_deliveries(available_at) where completed_at is null;
alter table private.push_devices enable row level security;
alter table private.push_deliveries enable row level security;
revoke all on private.push_devices, private.push_deliveries from public, anon, authenticated;

create function public.register_push_device(device_token text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  current_session uuid := (auth.jwt()->>'session_id')::uuid;
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED' using errcode = '42501'; end if;
  if device_token is null or length(device_token) not between 20 and 4096 then
    raise exception 'INVALID_DEVICE_TOKEN' using errcode = '22023';
  end if;
  if current_session is null or not exists (
    select 1 from auth.sessions where id = current_session and user_id = auth.uid()
      and (not_after is null or not_after > now())
  ) then raise exception 'ACTIVE_SESSION_REQUIRED' using errcode = '42501'; end if;
  delete from private.push_devices where session_id = current_session and token <> device_token;
  insert into private.push_devices(user_id, session_id, token)
  values(auth.uid(), current_session, device_token)
  on conflict (token) do update set user_id = excluded.user_id, session_id = excluded.session_id, updated_at = now()
    where private.push_devices.user_id = auth.uid();
  if not found then raise exception 'DEVICE_ALREADY_REGISTERED' using errcode = '42501'; end if;
end;
$$;

create function public.unregister_push_devices()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  delete from private.push_devices
    where user_id = auth.uid() and session_id = (auth.jwt()->>'session_id')::uuid;
end;
$$;

create function public.push_device_enabled()
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED' using errcode = '42501'; end if;
  return exists(select 1 from private.push_devices
    where user_id = auth.uid() and session_id = (auth.jwt()->>'session_id')::uuid);
end;
$$;

create function private.queue_enquiry_push()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into private.push_deliveries(enquiry_id, device_id)
    select new.id, d.id from private.push_devices d
    join private.admin_users a on a.user_id = d.user_id
    join auth.sessions s on s.id = d.session_id and s.user_id = d.user_id
    where s.not_after is null or s.not_after > now();
  return new;
end;
$$;
create trigger enquiry_push_created after insert on public.enquiries
  for each row execute function private.queue_enquiry_push();

create function public.claim_push_deliveries()
returns table(delivery_id bigint, enquiry_id uuid, device_token text, lease_id uuid)
language plpgsql security definer set search_path = '' as $$
begin
  delete from private.push_deliveries where created_at < now() - interval '30 days';
  delete from private.push_devices d where not exists (
    select 1 from private.admin_users a join auth.sessions s on s.user_id = a.user_id
    where a.user_id = d.user_id and s.id = d.session_id and (s.not_after is null or s.not_after > now())
  );
  return query
    with picked as (
      select q.id from private.push_deliveries q
      where q.completed_at is null and q.attempts < 5 and q.available_at <= now()
        and (q.claimed_until is null or q.claimed_until < now())
      order by q.id for update skip locked limit 10
    ), claimed as (
      update private.push_deliveries q set attempts = attempts + 1,
        claimed_until = now() + interval '5 minutes', lease_id = gen_random_uuid()
      from picked where q.id = picked.id returning q.*
    )
    select c.id, c.enquiry_id, d.token, c.lease_id
      from claimed c join private.push_devices d on d.id = c.device_id;
end;
$$;

create function public.finish_push_delivery(delivery_id bigint, delivery_lease uuid, result text)
returns void language plpgsql security definer set search_path = '' as $$
declare device uuid;
begin
  if result is null or result not in ('sent', 'unregistered', 'retry', 'failed') then
    raise exception 'INVALID_DELIVERY_RESULT' using errcode = '22023';
  end if;
  update private.push_deliveries q set claimed_until = null,
    completed_at = case when result in ('sent', 'unregistered', 'failed') then now() else null end,
    available_at = now() + interval '1 minute' * power(2, q.attempts),
    last_error = case when result = 'sent' then null else result end
    where q.id = delivery_id and q.lease_id = delivery_lease and q.completed_at is null
    returning q.device_id into device;
  if result = 'unregistered' and device is not null then
    delete from private.push_devices where id = device;
  end if;
end;
$$;

revoke all on function public.register_push_device(text), public.unregister_push_devices(),
  public.push_device_enabled(), public.claim_push_deliveries(),
  public.finish_push_delivery(bigint,uuid,text), private.queue_enquiry_push() from public, anon, authenticated;
grant execute on function public.register_push_device(text), public.unregister_push_devices(),
  public.push_device_enabled() to authenticated;
grant execute on function public.claim_push_deliveries(), public.finish_push_delivery(bigint,uuid,text) to service_role;

commit;
