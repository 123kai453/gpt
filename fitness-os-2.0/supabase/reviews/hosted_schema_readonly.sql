-- PHASE 2 hosted preflight. Run only after verifying the selected project.
-- Metadata only: no application rows, passwords, JWTs or object filenames.
-- No CREATE/ALTER/INSERT/UPDATE/DELETE/DROP/TRUNCATE, and no application RPC calls.
begin read only;
set local statement_timeout = '15s';
select pg_catalog.jsonb_build_object(
  'observed_at', pg_catalog.clock_timestamp(),
  'database', pg_catalog.current_database(),
  'role', current_user,
  'server_version', pg_catalog.current_setting('server_version'),
  'tables', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select n.nspname as schema_name, c.relname as table_name,
      c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where c.relkind in ('r','p') and n.nspname in ('public','app_private','supabase_migrations')
    order by n.nspname,c.relname
  ) t),
  'columns', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select table_schema,table_name,column_name,data_type,is_nullable,
      md5(coalesce(column_default,'')) as default_definition_md5
    from information_schema.columns
    where table_schema in ('public','app_private','supabase_migrations')
       or (table_schema='auth' and table_name='sessions')
    order by table_schema,table_name,ordinal_position
  ) t),
  'constraints', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select n.nspname as schema_name,c.relname as table_name,k.conname,k.contype,
      pg_catalog.pg_get_constraintdef(k.oid) as definition
    from pg_catalog.pg_constraint k join pg_catalog.pg_class c on c.oid=k.conrelid
    join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where n.nspname in ('public','app_private') order by n.nspname,c.relname,k.conname
  ) t),
  'indexes', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select schemaname,tablename,indexname,indexdef from pg_catalog.pg_indexes
    where schemaname in ('public','app_private') order by schemaname,tablename,indexname
  ) t),
  'triggers', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select n.nspname as schema_name,c.relname as table_name,t.tgname,
      pg_catalog.pg_get_triggerdef(t.oid) as definition
    from pg_catalog.pg_trigger t join pg_catalog.pg_class c on c.oid=t.tgrelid
    join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where not t.tgisinternal and (n.nspname in ('public','app_private') or (n.nspname='auth' and c.relname='users'))
    order by n.nspname,c.relname,t.tgname
  ) t),
  'policies', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
    from pg_catalog.pg_policies where schemaname in ('public','app_private')
      or (schemaname='storage' and tablename='objects') order by schemaname,tablename,policyname
  ) t),
  'functions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select n.nspname as schema_name,p.proname,
      pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
      p.prosecdef as security_definer,p.proconfig,
      md5(pg_catalog.pg_get_functiondef(p.oid)) as definition_md5
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','app_private') and p.prokind in ('f','p')
    order by n.nspname,p.proname,p.oid
  ) t),
  'table_grants', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select table_schema,table_name,grantee,privilege_type from information_schema.table_privileges
    where table_schema in ('public','app_private') order by table_schema,table_name,grantee,privilege_type
  ) t),
  'buckets', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select id,name,public,file_size_limit,allowed_mime_types from storage.buckets order by id
  ) t),
  'auth_user_count', (select count(*) from auth.users),
  'private_media_object_count', (select count(*) from storage.objects where bucket_id='private-media'),
  'migration_history_exists', pg_catalog.to_regclass('supabase_migrations.schema_migrations') is not null
) as hosted_schema_snapshot;
-- History may not exist in an unused project; do not create it to inspect it.
do $review$
declare versions jsonb;
begin
  if pg_catalog.to_regclass('supabase_migrations.schema_migrations') is null then
    raise notice 'Migration history table is absent; no record has been created.';
  elsif exists (select 1 from information_schema.columns where table_schema='supabase_migrations' and table_name='schema_migrations' and column_name='version') then
    execute 'select coalesce(jsonb_agg(version order by version), ''[]''::jsonb) from supabase_migrations.schema_migrations' into versions;
    raise notice 'Recorded migration versions: %', versions;
  else
    raise notice 'Migration history has unexpected columns; inspect metadata before reading records.';
  end if;
end;
$review$;
commit;
