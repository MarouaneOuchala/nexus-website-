-- Run only after deploying the dispatcher and storing its secret in Vault.
-- Vault secret names: nexus_push_dispatch_secret and nexus_push_dispatch_url.
-- Use the full Edge Function URL for nexus_push_dispatch_url.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule('nexus-enquiry-push', '* * * * *', $schedule$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'nexus_push_dispatch_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'nexus_push_dispatch_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
$schedule$);
