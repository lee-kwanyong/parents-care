alter table public.notification_outbox
  alter column template_code drop not null;

alter table public.notification_outbox
  alter column template_code set default '';

update public.notification_outbox
   set template_code = ''
 where template_code is null;

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
