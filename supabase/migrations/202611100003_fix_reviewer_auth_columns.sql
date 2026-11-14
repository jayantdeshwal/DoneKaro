-- ============================================================================
-- Migration: 202611100003_fix_reviewer_auth_columns.sql
-- Description: Ensure auth.users token columns are empty strings (not null)
--              Required by GoTrue internal scanner when deserializing users.
-- ============================================================================

UPDATE auth.users
SET
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
WHERE phone IN ('+918888888888', '+917777777777');

