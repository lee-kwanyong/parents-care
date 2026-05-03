-- REPAIR_IF_PUBLIC_FAMILIES_MISSING.sql
-- 현재 에러: relation "public.families" does not exist
-- 원인: 007_worry_resolution_platform.sql을 단독 실행했거나, 001_initial_schema.sql이 먼저 실행되지 않음.
--
-- 권장: 이 파일만 실행하지 말고, supabase/RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql 전체를 실행하세요.
-- 이미 일부 SQL을 실행해서 중복 policy 오류가 날 수 있으므로, 최신 007에는 drop policy 안전장치가 들어 있습니다.

select
  to_regclass('public.profiles') as profiles_table,
  to_regclass('public.families') as families_table,
  to_regclass('public.family_members') as family_members_table,
  to_regclass('public.elders') as elders_table,
  to_regclass('public.appointments') as appointments_table,
  to_regclass('public.reports') as reports_table;
