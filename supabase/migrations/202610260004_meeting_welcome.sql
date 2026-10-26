begin;

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name = btrim(name) and length(name) between 2 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index teachers_active_name_idx on public.teachers (lower(name)) where active;
insert into public.teachers (name) values ('Mohammed');

alter table public.teachers enable row level security;
revoke all on public.teachers from public, anon, authenticated;
grant select on public.teachers to authenticated;
grant insert (name), update (active) on public.teachers to authenticated;
create policy admin_read_teachers on public.teachers for select to authenticated
  using ((select public.is_admin()));
create policy admin_add_teachers on public.teachers for insert to authenticated
  with check ((select public.is_admin()));
create policy admin_remove_teachers on public.teachers for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter table public.enquiries
  add column teacher_id uuid references public.teachers(id),
  add column meeting_at timestamptz,
  add column meeting_url text not null default ''
    check (length(meeting_url) <= 2000 and (meeting_url = '' or meeting_url ~ '^https://[^[:space:]]+$')),
  add constraint meeting_assignment_pair check ((teacher_id is null) = (meeting_at is null)),
  add constraint client_meetings_only check (request_type <> 'application' or teacher_id is null);
grant update (teacher_id, meeting_at, meeting_url) on public.enquiries to authenticated;

create function private.check_meeting_teacher()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.teacher_id is not null and
     (tg_op = 'INSERT' or new.teacher_id is distinct from old.teacher_id) then
    perform 1 from public.teachers where id = new.teacher_id and active for share;
    if not found then
      raise exception 'TEACHER_UNAVAILABLE' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;
create trigger check_meeting_teacher before insert or update on public.enquiries
  for each row execute function private.check_meeting_teacher();

commit;
