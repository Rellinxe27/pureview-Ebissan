-- ============================================================
-- OPTIONAL hardening — default user_id to the current auth user.
-- The app now sets user_id on every insert, so saving already works.
-- Running this as well makes inserts bulletproof (and lets the SQL
-- seed / direct API calls omit user_id). Safe to run once.
-- ============================================================

alter table services           alter column user_id set default auth.uid();
alter table clients            alter column user_id set default auth.uid();
alter table appointments       alter column user_id set default auth.uid();
alter table recurring_services alter column user_id set default auth.uid();
alter table quotes             alter column user_id set default auth.uid();
alter table invoices           alter column user_id set default auth.uid();
alter table payments           alter column user_id set default auth.uid();
alter table expenses           alter column user_id set default auth.uid();
alter table goals              alter column user_id set default auth.uid();
alter table tasks              alter column user_id set default auth.uid();
alter table feedback           alter column user_id set default auth.uid();
alter table team_members       alter column user_id set default auth.uid();
alter table settings           alter column user_id set default auth.uid();
