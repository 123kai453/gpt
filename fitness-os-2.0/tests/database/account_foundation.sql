-- Real PostgreSQL integration checks. Run against an isolated, migrated LOCAL
-- Supabase database as postgres. Everything rolls back, including Auth users.
-- psql "$LOCAL_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f tests/database/account_foundation.sql
begin;
set local client_min_messages = warning;
set local row_security = on;

create function pg_temp.check_true(p_actual boolean, p_label text) returns void
language plpgsql as $$
begin
  if p_actual is distinct from true then raise exception 'FAILED: %', p_label; end if;
end;
$$;
create function pg_temp.check_throws(p_sql text, p_state text, p_label text) returns void
language plpgsql as $$
declare v_threw boolean := false;
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_state then
      raise exception 'FAILED: %; expected SQLSTATE %, got % (%)', p_label, p_state, sqlstate, sqlerrm;
    end if;
    v_threw := true;
  end;
  if not v_threw then raise exception 'FAILED: %; statement unexpectedly succeeded', p_label; end if;
end;
$$;
create function pg_temp.set_actor(p_user uuid) returns void
language plpgsql as $$
begin
  perform pg_catalog.set_config('request.jwt.claim.sub', coalesce(p_user::text,''), true);
  perform pg_catalog.set_config('request.jwt.claims', case when p_user is null then '{}' else
    pg_catalog.jsonb_build_object('sub',p_user,'session_id',p_user,'role','authenticated')::text end, true);
end;
$$;
create temporary table account_test_results (name text primary key, result jsonb not null);
grant all on table account_test_results to authenticated;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('aaaabbbb-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase2-db-a@example.invalid','',now(),'{}','{}',now(),now()),
  ('aaaabbbb-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase2-db-b@example.invalid','',now(),'{}','{}',now(),now()),
  ('aaaabbbb-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase2-db-limit@example.invalid','',now(),'{}','{}',now(),now());

insert into auth.sessions (id,user_id,created_at,updated_at,aal)
select id,id,now(),now(),'aal1' from auth.users where id::text like 'aaaabbbb-0000-4000-8000-%';

select pg_temp.check_true((select count(*) = 3 from public.profiles where id::text like 'aaaabbbb-0000-4000-8000-%'), 'Auth trigger creates profiles');
select pg_temp.check_true((select count(*) = 3 from public.user_preferences where user_id::text like 'aaaabbbb-0000-4000-8000-%'), 'Auth trigger creates preferences');
select pg_temp.check_true((select not public and file_size_limit = 5242880 and allowed_mime_types = array['image/png','image/jpeg','image/webp'] from storage.buckets where id = 'private-media'), 'private bucket and limits configured');
select pg_temp.check_true((select count(*) = 9 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where c.relrowsecurity and ((n.nspname='public' and c.relname in ('profiles','user_preferences','user_consents','sync_metadata','user_data_exports','user_media','account_deletion_jobs')) or (n.nspname='app_private' and c.relname in ('account_mutation_receipts','rate_limit_counters')))), 'RLS enabled on all nine active/private tables');

set local role anon;
select pg_temp.set_actor(null);
select pg_temp.check_throws('select * from public.profiles', '42501', 'anonymous cannot read profiles');
select pg_temp.check_throws('select * from public.user_preferences', '42501', 'anonymous cannot read preferences');
select pg_temp.check_throws('select * from public.user_media', '42501', 'anonymous cannot read media');
select pg_temp.check_throws('select public.consume_account_rate_limit(''export'')', '42501', 'anonymous cannot invoke account RPC');
select pg_temp.check_throws('select * from app_private.account_mutation_receipts', '42501', 'anonymous cannot read receipts');

reset role;
set local role authenticated;
select pg_temp.set_actor('aaaabbbb-0000-4000-8000-000000000001'::uuid);
select pg_temp.check_true((select count(*) = 1 from public.profiles), 'A sees only own profile');
select pg_temp.check_true((select count(*) = 1 from public.user_preferences), 'A sees only own preferences');
select pg_temp.check_throws('update public.profiles set display_name = ''bypass''', '42501', 'direct profile update denied');
select pg_temp.check_throws('update public.user_preferences set theme = ''light''', '42501', 'direct preferences update denied');
select pg_temp.check_throws('select * from app_private.rate_limit_counters', '42501', 'authenticated cannot read counters');
select pg_temp.check_throws('select * from app_private.account_mutation_receipts', '42501', 'authenticated cannot read receipts');

insert into account_test_results values ('applied', public.apply_account_mutation(
  'aaaaaaaa-1111-4111-8111-111111111111','dddddddd-1111-4111-8111-111111111111','profile',1,'{"username":"TestAlpha","display_name":"Device A"}'
));
select pg_temp.check_true((select result ->> 'status' = 'applied' and (result ->> 'version')::bigint = 2 and result ->> 'entity' = 'profile' and result ->> 'mutation_id' = 'aaaaaaaa-1111-4111-8111-111111111111' from account_test_results where name='applied'), 'mutation applies and returns agreed envelope');
select public.apply_account_mutation('aaaaaaaa-2222-4222-8222-222222222222','dddddddd-2222-4222-8222-222222222222','profile',2,'{"display_name":"Device B"}');
select pg_temp.check_true(public.apply_account_mutation('aaaaaaaa-1111-4111-8111-111111111111','dddddddd-1111-4111-8111-111111111111','profile',1,'{"username":"TestAlpha","display_name":"Device A"}') = (select result from account_test_results where name='applied'), 'replay returns ORIGINAL response after later mutation');
select pg_temp.check_true((select version = 3 and display_name = 'Device B' from public.profiles), 'replay does not increment version or overwrite newer data');
select pg_temp.check_throws($sql$select public.apply_account_mutation('aaaaaaaa-1111-4111-8111-111111111111','dddddddd-1111-4111-8111-111111111111','profile',1,'{"display_name":"different"}')$sql$, '22023', 'UUID cannot be reused with changed payload');
insert into account_test_results values ('conflict', public.apply_account_mutation('aaaaaaaa-3333-4333-8333-333333333333','dddddddd-1111-4111-8111-111111111111','profile',1,'{"display_name":"stale"}'));
select pg_temp.check_true((select result ->> 'status' = 'conflict' and (result ->> 'version')::bigint = 3 and result #>> '{record,display_name}' = 'Device B' from account_test_results where name='conflict'), 'stale base returns current record without overwrite');
select pg_temp.check_true((select version = 3 from public.profiles), 'conflict does not increment version');
select pg_temp.check_throws($sql$select public.apply_account_mutation('aaaaaaaa-4444-4444-8444-444444444444','dddddddd-1111-4111-8111-111111111111','profile',3,'{"user_id":"aaaabbbb-0000-4000-8000-000000000002"}')$sql$, '22023', 'ownership patch forbidden');
select pg_temp.check_throws($sql$select public.apply_account_mutation('aaaaaaaa-4444-4444-8444-444444444444','dddddddd-1111-4111-8111-111111111111','profile',3,'{"version":999}')$sql$, '22023', 'server version patch forbidden');
select pg_temp.check_throws($sql$select public.apply_account_mutation('aaaaaaaa-4444-4444-8444-444444444444','dddddddd-1111-4111-8111-111111111111','profile',3,'{"avatar_path":"aaaabbbb-0000-4000-8000-000000000002/avatar.png"}')$sql$, '22023', 'other user avatar reference rejected');
select pg_temp.check_throws($sql$select public.apply_account_mutation('aaaaaaaa-4444-4444-8444-444444444444','dddddddd-1111-4111-8111-111111111111','profile',3,'{"username":"x"}')$sql$, '22023', 'invalid username rejected');

select pg_temp.check_true(public.apply_account_mutation('aaaaaaaa-5555-4555-8555-555555555555','dddddddd-1111-4111-8111-111111111111','preferences',1,'{"theme":"light","language":"en","unit_system":"imperial","timezone":"Asia/Shanghai","notification_preferences":{"email":false,"push":true}}') ->> 'status' = 'applied', 'preferences mutation applied');
select pg_temp.check_true((select version = 2 and theme='light' and timezone='Asia/Shanghai' from public.user_preferences), 'preferences saved server version');
select pg_temp.check_throws($sql$select public.apply_account_mutation('aaaaaaaa-6666-4666-8666-666666666666','dddddddd-1111-4111-8111-111111111111','preferences',2,'{"timezone":"Invalid/Timezone"}')$sql$, '22023', 'invalid timezone rejected');
select pg_temp.check_throws($sql$select public.apply_account_mutation('aaaaaaaa-6666-4666-8666-666666666666','dddddddd-1111-4111-8111-111111111111','preferences',2,'{"notification_preferences":{"email":false,"push":true,"secret":true}}')$sql$, '22023', 'extra notification keys rejected');
select pg_temp.check_throws($sql$select public.apply_account_mutation('aaaaaaaa-6666-4666-8666-666666666666','dddddddd-1111-4111-8111-111111111111','preferences',2,'{"notification_preferences":{"email":"false","push":true}}')$sql$, '22023', 'notification values must be booleans');

insert into public.user_consents (scope,granted,policy_version) values ('privacy_policy',true,'2026-11-03');
select pg_temp.check_throws('update public.user_consents set granted=false','42501','consents append only update denied');
select pg_temp.check_throws('delete from public.user_consents','42501','consents append only delete denied');
select pg_temp.check_throws($sql$insert into public.user_consents (scope,granted,policy_version,created_at) values ('privacy_policy',true,'1','2000-01-01')$sql$,'42501','consent timestamp server-owned');
insert into public.user_media (id,object_path,mime_type,size_bytes,status) values ('eeeeeeee-1111-4111-8111-111111111111','aaaabbbb-0000-4000-8000-000000000001/avatar.png','image/png',123,'ready');
insert into storage.objects (bucket_id,name) values ('private-media','aaaabbbb-0000-4000-8000-000000000001/avatar.png');
insert into public.user_data_exports (id,format) values ('eeeeeeee-2222-4222-8222-222222222222','json');
select public.apply_account_mutation('aaaaaaaa-7777-4777-8777-777777777777','dddddddd-1111-4111-8111-111111111111','profile',3,'{"avatar_path":"aaaabbbb-0000-4000-8000-000000000001/avatar.png"}');
select pg_temp.check_throws($sql$update public.user_media set object_path='aaaabbbb-0000-4000-8000-000000000001/moved.png'$sql$,'22023','media object path immutable');
update public.user_media set status='deleting' where id='eeeeeeee-1111-4111-8111-111111111111';
select pg_temp.check_true((select avatar_path is null and version=5 from public.profiles),'removing ready media atomically clears avatar and increments version');
update public.user_media set status='ready' where id='eeeeeeee-1111-4111-8111-111111111111';
select pg_temp.check_throws($sql$insert into public.user_media (object_path,mime_type,size_bytes) values ('aaaabbbb-0000-4000-8000-000000000001/bad.svg','image/svg+xml',100)$sql$,'23514','media MIME constraint');
select pg_temp.check_throws($sql$insert into public.user_media (object_path,mime_type,size_bytes) values ('aaaabbbb-0000-4000-8000-000000000001/huge.png','image/png',5242881)$sql$,'23514','media size constraint');
select pg_temp.check_throws($sql$insert into storage.objects (bucket_id,name) values ('private-media','aaaabbbb-0000-4000-8000-000000000002/forbidden.png')$sql$,'42501','storage prevents foreign prefix insert');

-- User B cannot inspect, change, delete, or insert records owned by user A.
select pg_temp.set_actor('aaaabbbb-0000-4000-8000-000000000002'::uuid);
select pg_temp.check_true((select count(*) = 0 from public.profiles where id='aaaabbbb-0000-4000-8000-000000000001'),'B cannot see A profile');
select pg_temp.check_true((select count(*) = 0 from public.user_preferences where user_id='aaaabbbb-0000-4000-8000-000000000001'),'B cannot see A preferences');
select pg_temp.check_true((select count(*) = 0 from public.user_media),'B cannot see A media');
select pg_temp.check_true((select count(*) = 0 from public.user_data_exports),'B cannot see A exports');
select pg_temp.check_true((select count(*) = 0 from public.user_consents),'B cannot see A consents');
select pg_temp.check_true((select count(*) = 0 from public.sync_metadata),'B cannot see A sync metadata');
select pg_temp.check_true((select count(*) = 0 from storage.objects where bucket_id='private-media'),'B cannot see A storage object');
with updated as (update public.user_media set status='failed' where id='eeeeeeee-1111-4111-8111-111111111111' returning id)
select pg_temp.check_true((select count(*) = 0 from updated),'B cannot update A media');
with deleted as (delete from public.user_data_exports where id='eeeeeeee-2222-4222-8222-222222222222' returning id)
select pg_temp.check_true((select count(*) = 0 from deleted),'B cannot delete A exports');
with updated as (update storage.objects set name='aaaabbbb-0000-4000-8000-000000000002/stolen.png' where bucket_id='private-media' returning id)
select pg_temp.check_true((select count(*) = 0 from updated),'B cannot move A object');
with deleted as (delete from storage.objects where bucket_id='private-media' returning id)
select pg_temp.check_true((select count(*) = 0 from deleted),'B cannot delete A object');
select pg_temp.check_throws($sql$insert into public.user_media (user_id,object_path,mime_type,size_bytes) values ('aaaabbbb-0000-4000-8000-000000000001','aaaabbbb-0000-4000-8000-000000000001/stolen.png','image/png',100)$sql$,'42501','B cannot insert media owned by A');
select pg_temp.check_throws($sql$insert into public.user_consents (user_id,scope,granted,policy_version) values ('aaaabbbb-0000-4000-8000-000000000001','privacy_policy',true,'1')$sql$,'42501','B cannot insert consent owned by A');
select pg_temp.check_throws($sql$select public.apply_account_mutation('bbbbbbbb-1111-4111-8111-111111111111','dddddddd-2222-4222-8222-222222222222','profile',1,'{"username":"testalpha"}')$sql$,'23505','username uniqueness is case insensitive');

select pg_temp.set_actor('aaaabbbb-0000-4000-8000-000000000003'::uuid);
select pg_temp.check_true((public.consume_account_rate_limit('export')->>'allowed')::boolean,'first export allowed');
select public.consume_account_rate_limit('export');
select public.consume_account_rate_limit('export');
select pg_temp.check_true(not (public.consume_account_rate_limit('export')->>'allowed')::boolean,'fourth export rate limited');
select pg_temp.check_true((public.consume_account_rate_limit('export')->>'retry_after')::integer between 1 and 3600,'rate retry_after bounded');
select pg_temp.check_throws($sql$select public.consume_account_rate_limit('custom_unlimited')$sql$,'22023','caller cannot supply arbitrary action/limit');

-- Request is atomic, resumable, and blocks all further uploads/mutations.
select pg_temp.set_actor('aaaabbbb-0000-4000-8000-000000000001'::uuid);
insert into account_test_results values ('deletion', public.request_account_deletion());
select pg_temp.check_true(public.request_account_deletion() = (select result from account_test_results where name='deletion'),'repeat deletion request returns same job');
select pg_temp.check_true((select deletion_requested_at is not null from public.profiles),'deletion marker committed with job');
select pg_temp.check_true((select count(*)=1 from public.account_deletion_jobs),'A sees own deletion job');
select pg_temp.check_throws($sql$select public.apply_account_mutation('aaaaaaaa-9999-4999-8999-999999999999','dddddddd-1111-4111-8111-111111111111','preferences',2,'{"theme":"dark"}')$sql$,'42501','mutations blocked during deletion');
select pg_temp.check_throws($sql$insert into public.user_media (object_path,mime_type,size_bytes) values ('aaaabbbb-0000-4000-8000-000000000001/new.png','image/png',123)$sql$,'42501','media inserts blocked during deletion');
select pg_temp.check_throws($sql$insert into storage.objects (bucket_id,name) values ('private-media','aaaabbbb-0000-4000-8000-000000000001/new.png')$sql$,'42501','direct storage upload blocked during deletion');
select pg_temp.check_throws($sql$update storage.objects set name='aaaabbbb-0000-4000-8000-000000000001/changed.png' where bucket_id='private-media'$sql$,'42501','direct storage update blocked during deletion');
delete from storage.objects where bucket_id='private-media';
select pg_temp.check_true((select count(*)=0 from storage.objects where bucket_id='private-media'),'own storage cleanup remains possible during deletion');
select pg_temp.set_actor('aaaabbbb-0000-4000-8000-000000000002'::uuid);
select pg_temp.check_true((select count(*)=0 from public.account_deletion_jobs),'B cannot see A deletion job');

reset role;
delete from auth.sessions where user_id='aaaabbbb-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.set_actor('aaaabbbb-0000-4000-8000-000000000002'::uuid);
select pg_temp.check_true((select count(*)=0 from public.profiles),'revoked session JWT cannot read profile');
select pg_temp.check_throws($sql$select public.consume_account_rate_limit('export')$sql$,'42501','revoked session cannot call RPC');
select pg_temp.check_throws($sql$insert into storage.objects (bucket_id,name) values ('private-media','aaaabbbb-0000-4000-8000-000000000002/revoked.png')$sql$,'42501','revoked session cannot upload');
reset role;
delete from auth.users where id='aaaabbbb-0000-4000-8000-000000000001';
select pg_temp.check_true(not exists(select 1 from public.profiles where id='aaaabbbb-0000-4000-8000-000000000001'),'Auth deletion cascades profile');
select pg_temp.check_true(not exists(select 1 from public.user_preferences where user_id='aaaabbbb-0000-4000-8000-000000000001'),'Auth deletion cascades preferences');
select pg_temp.check_true(not exists(select 1 from public.user_media where user_id='aaaabbbb-0000-4000-8000-000000000001'),'Auth deletion cascades media metadata');
select pg_temp.check_true(not exists(select 1 from public.user_data_exports where user_id='aaaabbbb-0000-4000-8000-000000000001'),'Auth deletion cascades export metadata');
select pg_temp.check_true(not exists(select 1 from public.user_consents where user_id='aaaabbbb-0000-4000-8000-000000000001'),'Auth deletion cascades consent ledger');
select pg_temp.check_true(not exists(select 1 from public.sync_metadata where user_id='aaaabbbb-0000-4000-8000-000000000001'),'Auth deletion cascades sync metadata');
select pg_temp.check_true(not exists(select 1 from public.account_deletion_jobs where user_id='aaaabbbb-0000-4000-8000-000000000001'),'Auth deletion cascades deletion job');
select pg_temp.check_true(not exists(select 1 from app_private.account_mutation_receipts where user_id='aaaabbbb-0000-4000-8000-000000000001'),'Auth deletion cascades private receipts');
select pg_temp.check_true(not exists(select 1 from app_private.rate_limit_counters where user_id='aaaabbbb-0000-4000-8000-000000000001'),'Auth deletion cascades rate counters');
set local role authenticated;
select pg_temp.set_actor('aaaabbbb-0000-4000-8000-000000000001'::uuid);
select pg_temp.check_throws($sql$insert into storage.objects (bucket_id,name) values ('private-media','aaaabbbb-0000-4000-8000-000000000001/after-delete.png')$sql$,'42501','stale JWT cannot upload after Auth deletion');

reset role;
select 'PASS: account foundation SQL integration assertions' as test_result;
rollback;
