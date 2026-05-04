-- 010_AUTH_REAL_INTAKE.sql
-- STEP 5: Supabase Auth onboarding + real worry intake persistence.
-- Run this after 001~009 have succeeded.

begin;

do $$
begin
  if to_regclass('public.profiles') is null then raise exception 'Missing public.profiles. Run base schema first.'; end if;
  if to_regclass('public.families') is null then raise exception 'Missing public.families. Run base schema first.'; end if;
  if to_regclass('public.family_members') is null then raise exception 'Missing public.family_members. Run base schema first.'; end if;
  if to_regclass('public.accessibility_preferences') is null then raise exception 'Missing public.accessibility_preferences. Run 009 technology integration first.'; end if;
  if to_regclass('public.care_intake_entries') is null then raise exception 'Missing public.care_intake_entries. Run 009 technology integration first.'; end if;
  if to_regclass('public.care_orchestration_events') is null then raise exception 'Missing public.care_orchestration_events. Run 009 technology integration first.'; end if;
  if to_regclass('public.notification_outbox') is null then raise exception 'Missing public.notification_outbox. Run 009 technology integration first.'; end if;
end $$;

alter table public.care_intake_entries
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists preferred_response_channel text not null default 'phone',
  add column if not exists easy_mode_used boolean not null default true;

create index if not exists idx_care_intake_entries_created_by on public.care_intake_entries(created_by);
create index if not exists idx_care_intake_entries_family_status on public.care_intake_entries(family_id, ops_status, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email, '보호자'),
    case
      when new.raw_user_meta_data ->> 'role' in ('child', 'parent', 'manager', 'ops', 'admin')
        then (new.raw_user_meta_data ->> 'role')::public.app_role
      else 'child'::public.app_role
    end
  )
  on conflict (id) do update
    set display_name = coalesce(excluded.display_name, public.profiles.display_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.bootstrap_current_user_family(
  display_name_input text default null,
  family_name_input text default '우리 가족'
)
returns table(profile_id uuid, family_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_family_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select email into v_email from auth.users where id = v_uid;

  insert into public.profiles (id, display_name, role)
  values (v_uid, coalesce(nullif(display_name_input, ''), v_email, '보호자'), 'child')
  on conflict (id) do update
    set display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name),
        updated_at = now();

  select fm.family_id
    into v_family_id
  from public.family_members fm
  where fm.profile_id = v_uid
  order by fm.created_at asc
  limit 1;

  if v_family_id is null then
    insert into public.families (name, created_by)
    values (coalesce(nullif(family_name_input, ''), '우리 가족'), v_uid)
    returning id into v_family_id;
  end if;

  insert into public.family_members (family_id, profile_id, relationship, can_manage_appointments, can_view_reports)
  values (v_family_id, v_uid, 'guardian', true, true)
  on conflict (family_id, profile_id) do update
    set can_manage_appointments = true,
        can_view_reports = true;

  insert into public.accessibility_preferences (profile_id, family_id, easy_mode, large_text, show_only_essential_actions)
  values (v_uid, v_family_id, true, true, true)
  on conflict do nothing;

  return query select v_uid, v_family_id;
end;
$$;

grant execute on function public.bootstrap_current_user_family(text, text) to authenticated;

create or replace function public.current_user_family_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select fm.family_id
  from public.family_members fm
  where fm.profile_id = auth.uid()
  order by fm.created_at asc
  limit 1;
$$;

grant execute on function public.current_user_family_id() to authenticated;

create or replace function public.create_care_intake_request(
  worry_input text default 'not_sure',
  channel_input text default 'phone',
  memo_input text default '',
  social_care_input boolean default false,
  contact_name_input text default null,
  contact_phone_input text default null
)
returns table(intake_id uuid, family_id uuid, recommended_pack_code text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_family_id uuid;
  v_elder_id uuid;
  v_intake_id uuid;
  v_worry text;
  v_channel text;
  v_pack_code text;
  v_memo text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  v_memo := trim(coalesce(memo_input, ''));
  if length(v_memo) < 2 then
    raise exception '걱정 내용을 조금만 더 입력해주세요.';
  end if;

  v_worry := case
    when worry_input in ('hospital','meal','medication','discharge','documents','recurring','not_sure','emergency') then worry_input
    else 'not_sure'
  end;

  v_channel := case
    when channel_input in ('phone','kakao','photo','simple_form','ops','api') then channel_input
    else 'phone'
  end;

  select b.family_id into v_family_id
  from public.bootstrap_current_user_family(null, '우리 가족') b
  limit 1;

  select e.id into v_elder_id
  from public.elders e
  where e.family_id = v_family_id
  order by e.created_at asc
  limit 1;

  v_pack_code := case v_worry
    when 'hospital' then 'hospital_day'
    when 'meal' then 'meal_delivery'
    when 'medication' then 'medication_check'
    when 'discharge' then 'discharge_7days'
    when 'documents' then 'documents_insurance'
    when 'recurring' then 'regular_care'
    when 'emergency' then 'urgent_help'
    else 'not_sure_consult'
  end;

  insert into public.care_intake_entries (
    family_id,
    elder_id,
    intake_channel,
    raw_text,
    resolved_worry,
    recommended_pack_code,
    ai_summary,
    ops_status,
    social_care_requested,
    created_by,
    contact_name,
    contact_phone,
    preferred_response_channel,
    easy_mode_used
  ) values (
    v_family_id,
    v_elder_id,
    v_channel,
    v_memo,
    v_worry,
    v_pack_code,
    '보호자 걱정 접수: ' || left(v_memo, 180),
    'new',
    social_care_input,
    v_uid,
    nullif(contact_name_input, ''),
    nullif(contact_phone_input, ''),
    case when v_channel in ('phone','kakao') then v_channel else 'phone' end,
    true
  ) returning id into v_intake_id;

  insert into public.care_orchestration_events (
    family_id,
    elder_id,
    care_intake_entry_id,
    event_type,
    title,
    description,
    actor_role,
    severity
  ) values (
    v_family_id,
    v_elder_id,
    v_intake_id,
    'worry_request_created',
    '보호자 걱정 접수',
    '추천 케어팩: ' || v_pack_code,
    'family',
    case when v_worry = 'emergency' then 'urgent' else 'info' end
  );

  insert into public.notification_outbox (
    family_id,
    elder_id,
    recipient_profile_id,
    channel,
    template_code,
    title,
    body,
    payload,
    status
  ) values (
    v_family_id,
    v_elder_id,
    v_uid,
    'app',
    'worry_request_received',
    '부모님 걱정 접수 완료',
    '운영실이 확인 후 해결 플랜으로 정리합니다.',
    jsonb_build_object('intake_id', v_intake_id, 'worry', v_worry, 'pack_code', v_pack_code),
    'queued'
  );

  return query select v_intake_id, v_family_id, v_pack_code;
end;
$$;

grant execute on function public.create_care_intake_request(text, text, text, boolean, text, text) to authenticated;

drop view if exists public.family_real_intake_dashboard;
create view public.family_real_intake_dashboard as
select
  cie.family_id,
  count(*) filter (where cie.ops_status in ('new','triaged','waiting_family')) as open_intake_count,
  count(*) filter (where cie.social_care_requested = true and cie.ops_status in ('new','triaged','waiting_family')) as social_care_open_count,
  max(cie.created_at) as last_intake_at
from public.care_intake_entries cie
where cie.family_id is not null
group by cie.family_id;

drop view if exists public.ops_real_intake_board;
create view public.ops_real_intake_board as
select
  cie.id,
  cie.family_id,
  f.name as family_name,
  cie.resolved_worry,
  cie.recommended_pack_code,
  cie.intake_channel,
  cie.ops_status,
  cie.social_care_requested,
  cie.contact_name,
  cie.contact_phone,
  cie.created_at
from public.care_intake_entries cie
left join public.families f on f.id = cie.family_id
order by cie.created_at desc;

commit;
