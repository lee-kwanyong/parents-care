-- 부모님 안심동행 케어: Row Level Security policies

alter table public.profiles enable row level security;
alter table public.elders enable row level security;
alter table public.family_memberships enable row level security;
alter table public.family_invite_codes enable row level security;
alter table public.manager_applications enable row level security;
alter table public.manager_profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.assignments enable row level security;
alter table public.timeline_events enable row level security;
alter table public.appointment_checklist_items enable row level security;
alter table public.appointment_questions enable row level security;
alter table public.care_reports enable row level security;
alter table public.manager_ratings enable row level security;
alter table public.risk_flags enable row level security;
alter table public.consent_records enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_ops()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('operator', 'admin')
  );
$$;

create or replace function public.is_family_member(target_elder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_memberships
    where elder_id = target_elder_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_assigned_manager(target_appointment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.assignments
    where appointment_id = target_appointment_id and manager_id = auth.uid()
  );
$$;

create or replace function public.appointment_elder_id(target_appointment_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select elder_id from public.appointments where id = target_appointment_id;
$$;

create policy "profiles: self or ops can read"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_ops());

create policy "profiles: self can update"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "elders: family and ops can read"
on public.elders for select
to authenticated
using (public.is_family_member(id) or public.is_ops());

create policy "elders: authenticated can create"
on public.elders for insert
to authenticated
with check (created_by = auth.uid());

create policy "elders: family guardian or ops can update"
on public.elders for update
to authenticated
using (
  public.is_ops() or exists (
    select 1 from public.family_memberships fm
    where fm.elder_id = elders.id and fm.user_id = auth.uid() and fm.family_role in ('guardian', 'elder_self')
  )
)
with check (
  public.is_ops() or exists (
    select 1 from public.family_memberships fm
    where fm.elder_id = elders.id and fm.user_id = auth.uid() and fm.family_role in ('guardian', 'elder_self')
  )
);

create policy "family_memberships: family and ops can read"
on public.family_memberships for select
to authenticated
using (public.is_family_member(elder_id) or public.is_ops());

create policy "family_memberships: ops can manage"
on public.family_memberships for all
to authenticated
using (public.is_ops())
with check (public.is_ops());

create policy "family_invite_codes: family guardian and ops can manage"
on public.family_invite_codes for all
to authenticated
using (public.is_family_member(elder_id) or public.is_ops())
with check (created_by = auth.uid() or public.is_ops());

create policy "manager_applications: own or ops can read"
on public.manager_applications for select
to authenticated
using (user_id = auth.uid() or public.is_ops());

create policy "manager_applications: own can submit"
on public.manager_applications for insert
to authenticated
with check (user_id = auth.uid());

create policy "manager_applications: own draft or ops can update"
on public.manager_applications for update
to authenticated
using (user_id = auth.uid() or public.is_ops())
with check (user_id = auth.uid() or public.is_ops());

create policy "manager_profiles: own assigned family or ops can read"
on public.manager_profiles for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_ops()
  or exists (
    select 1
    from public.assignments a
    join public.appointments ap on ap.id = a.appointment_id
    where a.manager_id = manager_profiles.user_id
      and public.is_family_member(ap.elder_id)
  )
);

create policy "manager_profiles: ops can manage"
on public.manager_profiles for all
to authenticated
using (public.is_ops())
with check (public.is_ops());

create policy "appointments: family assigned manager ops read"
on public.appointments for select
to authenticated
using (public.is_family_member(elder_id) or public.is_assigned_manager(id) or public.is_ops());

create policy "appointments: family can create"
on public.appointments for insert
to authenticated
with check (created_by = auth.uid() and public.is_family_member(elder_id));

create policy "appointments: family guardian or ops can update"
on public.appointments for update
to authenticated
using (public.is_ops() or public.is_family_member(elder_id))
with check (public.is_ops() or public.is_family_member(elder_id));

create policy "assignments: family assigned manager ops read"
on public.assignments for select
to authenticated
using (
  manager_id = auth.uid()
  or public.is_ops()
  or public.is_family_member(public.appointment_elder_id(appointment_id))
);

create policy "assignments: ops can manage"
on public.assignments for all
to authenticated
using (public.is_ops())
with check (public.is_ops());

create policy "timeline: family assigned manager ops read"
on public.timeline_events for select
to authenticated
using (
  public.is_ops()
  or public.is_assigned_manager(appointment_id)
  or (visible_to_family and public.is_family_member(public.appointment_elder_id(appointment_id)))
);

create policy "timeline: assigned manager or ops can create"
on public.timeline_events for insert
to authenticated
with check (public.is_ops() or public.is_assigned_manager(appointment_id));

create policy "checklist: assigned manager or ops manage"
on public.appointment_checklist_items for all
to authenticated
using (public.is_ops() or public.is_assigned_manager(appointment_id))
with check (public.is_ops() or public.is_assigned_manager(appointment_id));

create policy "questions: family assigned manager ops read"
on public.appointment_questions for select
to authenticated
using (
  public.is_ops()
  or public.is_assigned_manager(appointment_id)
  or public.is_family_member(public.appointment_elder_id(appointment_id))
);

create policy "questions: family can create"
on public.appointment_questions for insert
to authenticated
with check (public.is_family_member(public.appointment_elder_id(appointment_id)));

create policy "questions: assigned manager or ops can answer"
on public.appointment_questions for update
to authenticated
using (public.is_ops() or public.is_assigned_manager(appointment_id))
with check (public.is_ops() or public.is_assigned_manager(appointment_id));

create policy "reports: visibility by status and role"
on public.care_reports for select
to authenticated
using (
  public.is_ops()
  or public.is_assigned_manager(appointment_id)
  or (
    status in ('approved', 'sent')
    and public.is_family_member(public.appointment_elder_id(appointment_id))
  )
);

create policy "reports: manager draft or ops manage"
on public.care_reports for all
to authenticated
using (public.is_ops() or public.is_assigned_manager(appointment_id))
with check (public.is_ops() or public.is_assigned_manager(appointment_id));

create policy "ratings: family and ops read"
on public.manager_ratings for select
to authenticated
using (public.is_ops() or public.is_family_member(public.appointment_elder_id(appointment_id)) or manager_id = auth.uid());

create policy "ratings: family can create"
on public.manager_ratings for insert
to authenticated
with check (created_by = auth.uid() and public.is_family_member(public.appointment_elder_id(appointment_id)));

create policy "risk_flags: ops only"
on public.risk_flags for all
to authenticated
using (public.is_ops())
with check (public.is_ops());

create policy "consent: family and ops read"
on public.consent_records for select
to authenticated
using (public.is_ops() or public.is_family_member(elder_id));

create policy "consent: elder family or ops create"
on public.consent_records for insert
to authenticated
with check (public.is_ops() or public.is_family_member(elder_id));

create policy "audit_logs: ops read"
on public.audit_logs for select
to authenticated
using (public.is_ops());

create policy "audit_logs: authenticated can insert own action"
on public.audit_logs for insert
to authenticated
with check (actor_id = auth.uid() or public.is_ops());
