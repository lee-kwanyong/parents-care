select
  to_regclass('public.care_intake_entries') as care_intake_entries,
  to_regclass('public.family_real_intake_dashboard') as family_real_intake_dashboard,
  to_regclass('public.ops_real_intake_board') as ops_real_intake_board;

select proname as function_name
from pg_proc
where proname in ('bootstrap_current_user_family','current_user_family_id','create_care_intake_request')
order by proname;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'care_intake_entries'
  and column_name in ('contact_name','contact_phone','preferred_response_channel','easy_mode_used')
order by column_name;
