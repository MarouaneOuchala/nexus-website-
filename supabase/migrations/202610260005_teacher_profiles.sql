begin;

alter table public.teachers
  add column updated_at timestamptz not null default now(),
  add column schedule_preference text not null default 'not_set'
    check (schedule_preference in ('not_set', 'weekdays', 'weekends', 'both', 'flexible')),
  add column availability_notes text not null default '' check (length(availability_notes) <= 1000),
  add column notes text not null default '' check (length(notes) <= 3000),
  add column teaching_languages text not null default '' check (length(teaching_languages) <= 200),
  add column specialties text not null default '' check (length(specialties) <= 500),
  add column client_capacity integer check (client_capacity between 1 and 200);
grant update (schedule_preference, availability_notes, notes, teaching_languages, specialties, client_capacity)
  on public.teachers to authenticated;
create trigger stamp_teacher_update before update on public.teachers
  for each row execute function private.stamp_enquiry_update();

alter table public.enquiries
  add column teaching_status text not null default 'pending'
    check (teaching_status in ('pending', 'active', 'paused', 'finished')),
  add constraint teaching_requires_assignment check (teaching_status = 'pending' or teacher_id is not null);
grant update (teaching_status) on public.enquiries to authenticated;
create index enquiries_teacher_idx on public.enquiries (teacher_id) where teacher_id is not null;

create table private.teacher_client_history (
  teacher_id uuid not null references public.teachers(id),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  first_assigned_at timestamptz not null default now(),
  primary key (teacher_id, enquiry_id)
);
alter table private.teacher_client_history enable row level security;
revoke all on private.teacher_client_history from public, anon, authenticated;
insert into private.teacher_client_history (teacher_id, enquiry_id)
  select teacher_id, id from public.enquiries where teacher_id is not null and request_type <> 'application';

create function private.reset_teaching_assignment()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.teacher_id is distinct from old.teacher_id then
    new.teaching_status := 'pending';
  end if;
  return new;
end;
$$;
create trigger reset_teaching_assignment before update on public.enquiries
  for each row execute function private.reset_teaching_assignment();

create function private.record_teacher_client()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.teacher_id is not null and new.request_type <> 'application' then
    insert into private.teacher_client_history (teacher_id, enquiry_id)
    values (new.teacher_id, new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger record_teacher_client after insert or update of teacher_id on public.enquiries
  for each row execute function private.record_teacher_client();

create function public.teacher_workload()
returns table (
  teacher_id uuid, total_clients bigint, assigned_clients bigint,
  active_clients bigint, paused_clients bigint, pending_clients bigint, finished_clients bigint,
  measured_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  return query
  with history as (
    select h.teacher_id, count(distinct lower(btrim(e.email))) as total
    from private.teacher_client_history h join public.enquiries e on e.id = h.enquiry_id
    where e.request_type <> 'application' group by h.teacher_id
  ), clients as (
    select e.teacher_id, lower(btrim(e.email)) as email,
      min(case e.teaching_status when 'active' then 1 when 'paused' then 2 when 'pending' then 3 else 4 end) as stage
    from public.enquiries e where e.teacher_id is not null and e.request_type <> 'application'
    group by e.teacher_id, lower(btrim(e.email))
  ), workload as (
    select c.teacher_id, count(*) as assigned,
      count(*) filter (where stage = 1) as active,
      count(*) filter (where stage = 2) as paused,
      count(*) filter (where stage = 3) as pending,
      count(*) filter (where stage = 4) as finished
    from clients c group by c.teacher_id
  )
  select t.id, coalesce(h.total, 0), coalesce(w.assigned, 0),
    coalesce(w.active, 0), coalesce(w.paused, 0), coalesce(w.pending, 0), coalesce(w.finished, 0), now()
  from public.teachers t left join history h on h.teacher_id = t.id left join workload w on w.teacher_id = t.id;
end;
$$;
revoke all on function public.teacher_workload() from public, anon;
grant execute on function public.teacher_workload() to authenticated;

commit;
