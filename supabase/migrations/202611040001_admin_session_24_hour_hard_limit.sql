BEGIN;

ALTER TABLE public.admin_2fa_sessions
  ALTER COLUMN hard_expires_at SET DEFAULT (now() + interval '24 hours');

COMMIT;