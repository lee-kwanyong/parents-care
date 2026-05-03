-- CHECK_008_PARENT_CARE_PLATFORM.sql
-- 008_parent_care_platform_differentiation.sql 실행 후 확인용
select
  to_regclass('public.care_service_packs') as care_service_packs,
  to_regclass('public.care_pack_requests') as care_pack_requests,
  to_regclass('public.care_pack_tasks') as care_pack_tasks,
  to_regclass('public.family_easy_mode_settings') as family_easy_mode_settings,
  to_regclass('public.elder_life_needs_profiles') as elder_life_needs_profiles,
  to_regclass('public.meal_delivery_subscriptions') as meal_delivery_subscriptions,
  to_regclass('public.meal_delivery_events') as meal_delivery_events,
  to_regclass('public.simple_family_action_items') as simple_family_action_items,
  to_regclass('public.family_parent_care_dashboard') as family_parent_care_dashboard,
  to_regclass('public.ops_parent_care_command_center') as ops_parent_care_command_center,
  to_regclass('public.ops_meal_delivery_board') as ops_meal_delivery_board;

select code, title, primary_worry_category, sort_order
from public.care_service_packs
order by sort_order;
