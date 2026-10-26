begin;

create function public.business_stats()
returns table (
  client_enquiries bigint,
  converted bigint,
  open_enquiries bigint,
  overdue_callbacks bigint,
  confirmed_value_mad bigint,
  confirmed_without_package bigint,
  applications bigint,
  new_enquiries bigint,
  contacted bigint,
  callbacks bigint,
  closed bigint,
  measured_at timestamptz
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  return query
  select
    count(*) filter (where e.request_type <> 'application'),
    count(*) filter (where e.request_type <> 'application' and e.status = 'won'),
    count(*) filter (where e.request_type <> 'application' and e.status in ('new', 'contacted', 'callback')),
    count(*) filter (where e.request_type <> 'application' and e.status in ('new', 'contacted', 'callback') and e.next_call_at <= now()),
    coalesce(sum(e.total_mad) filter (where e.request_type <> 'application' and e.status = 'won'), 0)::bigint,
    count(*) filter (where e.request_type <> 'application' and e.status = 'won' and e.sessions is null),
    count(*) filter (where e.request_type = 'application'),
    count(*) filter (where e.request_type <> 'application' and e.status = 'new'),
    count(*) filter (where e.request_type <> 'application' and e.status = 'contacted'),
    count(*) filter (where e.request_type <> 'application' and e.status = 'callback'),
    count(*) filter (where e.request_type <> 'application' and e.status = 'closed'),
    now()
  from public.enquiries e;
end;
$$;
revoke all on function public.business_stats() from public, anon;
grant execute on function public.business_stats() to authenticated;

commit;
