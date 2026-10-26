begin;

alter table public.enquiries
  add column diagnostic_completed_at timestamptz,
  add column diagnostic_teacher_id uuid references public.teachers(id),
  add column first_paid_at timestamptz,
  add constraint diagnostic_completion_pair check
    ((diagnostic_completed_at is null) = (diagnostic_teacher_id is null)),
  add constraint diagnostic_clients_only check
    (request_type <> 'application' or (diagnostic_completed_at is null and first_paid_at is null)),
  add constraint payment_after_diagnostic check
    (first_paid_at is null or (diagnostic_completed_at is not null and first_paid_at >= diagnostic_completed_at));

grant update (diagnostic_completed_at, first_paid_at) on public.enquiries to authenticated;

create function private.check_diagnostic_conversion()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.diagnostic_completed_at is distinct from old.diagnostic_completed_at then
    if new.diagnostic_completed_at is null then
      new.diagnostic_teacher_id := null;
    else
      if new.teacher_id is null or new.meeting_at is null then
        raise exception 'DIAGNOSTIC_ASSIGNMENT_REQUIRED' using errcode = '22023';
      end if;
      new.diagnostic_teacher_id := coalesce(old.diagnostic_teacher_id, new.teacher_id);
    end if;
  end if;
  if new.diagnostic_completed_at > now() or new.first_paid_at > now() then
    raise exception 'FUTURE_DIAGNOSTIC_OR_PAYMENT' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger check_diagnostic_conversion before update on public.enquiries
  for each row execute function private.check_diagnostic_conversion();

create function public.teacher_conversion()
returns table (teacher_id uuid, completed_diagnostics bigint, paying_clients bigint, conversion_rate numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  return query
  with payments as (
    select lower(btrim(email)) as email, min(first_paid_at) as paid_at
    from public.enquiries where first_paid_at is not null group by lower(btrim(email))
  ), attribution as (
    select distinct on (p.email) p.email, e.diagnostic_teacher_id
    from payments p join public.enquiries e on lower(btrim(e.email)) = p.email
    where e.diagnostic_completed_at <= p.paid_at
    order by p.email, e.diagnostic_completed_at, e.created_at, e.id
  ), diagnostics as (
    select e.diagnostic_teacher_id, count(*) as completed
    from public.enquiries e where e.diagnostic_completed_at is not null
    group by e.diagnostic_teacher_id
  ), converted as (
    select a.diagnostic_teacher_id, count(*) as paid from attribution a group by a.diagnostic_teacher_id
  )
  select t.id, coalesce(d.completed, 0), coalesce(c.paid, 0),
    case when coalesce(d.completed, 0) = 0 then null
      else round(100.0 * coalesce(c.paid, 0) / d.completed, 1) end
  from public.teachers t
  left join diagnostics d on d.diagnostic_teacher_id = t.id
  left join converted c on c.diagnostic_teacher_id = t.id;
end;
$$;
revoke all on function public.teacher_conversion() from public, anon;
grant execute on function public.teacher_conversion() to authenticated;

commit;
