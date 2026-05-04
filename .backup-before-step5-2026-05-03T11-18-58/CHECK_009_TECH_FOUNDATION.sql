select
  to_regclass('public.integration_connectors') as integration_connectors,
  to_regclass('public.care_intake_entries') as care_intake_entries,
  to_regclass('public.care_orchestration_events') as care_orchestration_events,
  to_regclass('public.notification_outbox') as notification_outbox,
  to_regclass('public.care_consent_signatures') as care_consent_signatures,
  to_regclass('public.care_payment_approvals') as care_payment_approvals,
  to_regclass('public.hospital_route_guides') as hospital_route_guides,
  to_regclass('public.partner_service_referrals') as partner_service_referrals,
  to_regclass('public.accessibility_preferences') as accessibility_preferences,
  to_regclass('public.family_simple_home_dashboard') as family_simple_home_dashboard,
  to_regclass('public.ops_integrated_care_command_center') as ops_integrated_care_command_center;

select code, title, category, status from public.integration_connectors order by code;
