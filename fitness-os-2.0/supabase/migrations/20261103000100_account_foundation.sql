-- PHASE 2 account foundation. Intentionally abort on pre-existing application
-- tables instead of silently adopting or overwriting an unknown hosted schema.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'user_preferences', 'user_consents', 'sync_metadata',
    'user_data_exports', 'user_media', 'account_deletion_jobs'
  ] loop
    if pg_catalog.to_regclass('public.' || table_name) is not null then
      raise exception 'PHASE 2 migration conflict: public.% already exists; review and migrate explicitly', table_name;
    end if;
  end loop;
  if pg_catalog.to_regnamespace('app_private') is not null then
    raise exception 'PHASE 2 migration conflict: app_private already exists; review explicitly';
  end if;
end;
$$;

create schema app_private;
revoke all on schema app_private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text not null default '',
  avatar_path text,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  deletion_requested_at timestamptz,
  constraint profiles_username_format check (
    username is null or username ~ '^[a-zA-Z0-9_]{3,24}$'
  ),
  constraint profiles_display_name_length check (pg_catalog.char_length(display_name) <= 64),
  constraint profiles_avatar_path_length check (avatar_path is null or pg_catalog.char_length(avatar_path) <= 300)
);
create unique index profiles_username_case_insensitive on public.profiles (pg_catalog.lower(username)) where username is not null;

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  language text not null default 'zh-CN' check (language in ('zh-CN', 'en')),
  unit_system text not null default 'metric' check (unit_system in ('metric', 'imperial')),
  timezone text not null default 'UTC' check (pg_catalog.char_length(timezone) between 1 and 100),
  notification_preferences jsonb not null default '{"email":false,"push":false}'::jsonb,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint user_preferences_notifications check (
    pg_catalog.jsonb_typeof(notification_preferences) = 'object'
    and notification_preferences ?& array['email', 'push']
    and (notification_preferences - array['email', 'push']) = '{}'::jsonb
    and pg_catalog.jsonb_typeof(notification_preferences -> 'email') = 'boolean'
    and pg_catalog.jsonb_typeof(notification_preferences -> 'push') = 'boolean'
  )
);

create table public.user_consents (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  scope text not null check (scope in ('privacy_policy', 'terms', 'health_data', 'analytics', 'notifications')),
  granted boolean not null,
  policy_version text not null check (pg_catalog.char_length(policy_version) between 1 and 64),
  created_at timestamptz not null default pg_catalog.now()
);
create index user_consents_user_scope_created on public.user_consents (user_id, scope, created_at desc);

create table public.sync_metadata (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  device_id uuid not null,
  last_seen_at timestamptz not null default pg_catalog.now(),
  last_synced_at timestamptz,
  primary key (user_id, device_id)
);

create table public.user_data_exports (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  format text not null check (format in ('json', 'csv')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  object_path text,
  error_code text check (error_code is null or error_code ~ '^[A-Z0-9_]{1,80}$'),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  completed_at timestamptz,
  constraint user_data_exports_object_owner check (object_path is null or pg_catalog.split_part(object_path, '/', 1) = user_id::text)
);
create index user_data_exports_user_created on public.user_data_exports(user_id, created_at desc);

create table public.user_media (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  object_path text not null unique,
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  size_bytes bigint not null check (size_bytes between 1 and 5242880),
  status text not null default 'pending' check (status in ('pending', 'ready', 'deleting', 'failed')),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint user_media_object_path check (
    pg_catalog.split_part(object_path, '/', 1) = user_id::text
    and pg_catalog.char_length(object_path) between 38 and 512
    and object_path ~ '^[a-f0-9-]{36}/[A-Za-z0-9][A-Za-z0-9_./-]*$'
    and object_path not like '%..%' and object_path not like '%//%'
  )
);
create index user_media_user_created on public.user_media(user_id, created_at desc);

create table public.account_deletion_jobs (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'deleting_storage', 'deleting_auth', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts between 0 and 100000),
  last_error text check (last_error is null or last_error ~ '^[A-Z0-9_]{1,80}$'),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  completed_at timestamptz
);

create table app_private.account_mutation_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  mutation_id uuid not null,
  request_payload jsonb not null,
  result jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  primary key (user_id, mutation_id)
);
create table app_private.rate_limit_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  count integer not null check (count > 0),
  primary key (user_id, action, window_start)
);

-- Every application table is private by default. No grants inherited from the
-- public schema defaults are retained, including for the anonymous API role.
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_consents enable row level security;
alter table public.sync_metadata enable row level security;
alter table public.user_data_exports enable row level security;
alter table public.user_media enable row level security;
alter table public.account_deletion_jobs enable row level security;
alter table app_private.account_mutation_receipts enable row level security;
alter table app_private.rate_limit_counters enable row level security;
revoke all on public.profiles, public.user_preferences, public.user_consents,
  public.sync_metadata, public.user_data_exports, public.user_media,
  public.account_deletion_jobs from public, anon, authenticated;
revoke all on all tables in schema app_private from public, anon, authenticated;

-- Auth logout revokes refresh tokens immediately, while an already issued JWT
-- can otherwise remain valid until exp. Enforce the backing Auth session too.
create function public.has_current_auth_session() returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session text := auth.jwt() ->> 'session_id';
begin
  if v_user is null or v_session is null or v_session !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return false;
  end if;
  return exists (select 1 from auth.sessions s where s.id = v_session::uuid
    and s.user_id = v_user and (s.not_after is null or s.not_after > pg_catalog.now()));
end;
$$;
revoke all on function public.has_current_auth_session() from public, anon;
grant execute on function public.has_current_auth_session() to authenticated;

create function public.is_current_account_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_current_auth_session() and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.deletion_requested_at is null
  );
$$;
revoke all on function public.is_current_account_active() from public, anon;
grant execute on function public.is_current_account_active() to authenticated;

grant select on public.profiles, public.user_preferences to authenticated;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()) and (select public.has_current_auth_session()));
create policy preferences_select_own on public.user_preferences for select to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session()));

grant select on public.user_consents to authenticated;
grant insert (user_id, scope, granted, policy_version) on public.user_consents to authenticated;
create policy consents_select_own on public.user_consents for select to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session()));
create policy consents_insert_own on public.user_consents for insert to authenticated with check (user_id = (select auth.uid()) and public.is_current_account_active());

grant select, insert, update, delete on public.sync_metadata, public.user_media, public.user_data_exports to authenticated;
create policy sync_select_own on public.sync_metadata for select to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session()));
create policy sync_insert_own on public.sync_metadata for insert to authenticated with check (user_id = (select auth.uid()) and public.is_current_account_active());
create policy sync_update_own on public.sync_metadata for update to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session())) with check (user_id = (select auth.uid()) and public.is_current_account_active());
create policy sync_delete_own on public.sync_metadata for delete to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session()));
create policy media_select_own on public.user_media for select to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session()));
create policy media_insert_own on public.user_media for insert to authenticated with check (user_id = (select auth.uid()) and public.is_current_account_active());
create policy media_update_own on public.user_media for update to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session())) with check (user_id = (select auth.uid()) and public.is_current_account_active());
create policy media_delete_own on public.user_media for delete to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session()));
create policy exports_select_own on public.user_data_exports for select to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session()));
create policy exports_insert_own on public.user_data_exports for insert to authenticated with check (user_id = (select auth.uid()) and public.is_current_account_active());
create policy exports_update_own on public.user_data_exports for update to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session())) with check (user_id = (select auth.uid()) and public.is_current_account_active());
create policy exports_delete_own on public.user_data_exports for delete to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session()));
grant select, update on public.account_deletion_jobs to authenticated;
create policy deletion_jobs_select_own on public.account_deletion_jobs for select to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session()));
create policy deletion_jobs_update_own on public.account_deletion_jobs for update to authenticated using (user_id = (select auth.uid()) and (select public.has_current_auth_session())) with check (user_id = (select auth.uid()) and (select public.has_current_auth_session()));

-- Server-maintained timestamps and immutable ownership on writable resources.
create function app_private.guard_owned_resource() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id or new.id is distinct from old.id or new.created_at is distinct from old.created_at then
      raise exception using errcode = '22023', message = 'immutable_resource_identity';
    end if;
    if tg_table_name = 'user_media' then
      if new.object_path is distinct from old.object_path or new.mime_type is distinct from old.mime_type or new.size_bytes is distinct from old.size_bytes then
        raise exception using errcode = '22023', message = 'immutable_media_metadata';
      end if;
    end if;
    new.updated_at := pg_catalog.clock_timestamp();
  else
    new.created_at := pg_catalog.clock_timestamp();
    new.updated_at := new.created_at;
  end if;
  return new;
end;
$$;
revoke all on function app_private.guard_owned_resource() from public, anon, authenticated;
create trigger media_guard before insert or update on public.user_media for each row execute function app_private.guard_owned_resource();
create trigger exports_guard before insert or update on public.user_data_exports for each row execute function app_private.guard_owned_resource();
create trigger deletion_jobs_guard before insert or update on public.account_deletion_jobs for each row execute function app_private.guard_owned_resource();

-- Serialize avatar cleanup with CAS mutations through the profile row lock.
-- A concurrent device cannot leave a reference to media being removed.
create function app_private.clear_removed_avatar() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    update public.profiles set avatar_path = null, version = version + 1,
      updated_at = pg_catalog.clock_timestamp()
      where id = old.user_id and avatar_path = old.object_path;
    return old;
  end if;
  if new.status <> 'ready' then
    update public.profiles set avatar_path = null, version = version + 1,
      updated_at = pg_catalog.clock_timestamp()
      where id = old.user_id and avatar_path = old.object_path;
  end if;
  return new;
end;
$$;
revoke all on function app_private.clear_removed_avatar() from public, anon, authenticated;
create trigger media_clear_avatar before update or delete on public.user_media for each row execute function app_private.clear_removed_avatar();

create function app_private.create_account_defaults() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name) values (new.id, case
    when pg_catalog.jsonb_typeof(new.raw_user_meta_data -> 'display_name') = 'string'
      then pg_catalog.left(pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name'), 64)
    else '' end);
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;
revoke all on function app_private.create_account_defaults() from public, anon, authenticated;
create trigger fitness_os_account_defaults after insert on auth.users for each row execute function app_private.create_account_defaults();
-- Existing hosted Auth users also receive defaults, without changing Auth data.
insert into public.profiles (id, display_name) select id, case
  when pg_catalog.jsonb_typeof(raw_user_meta_data -> 'display_name') = 'string'
    then pg_catalog.left(pg_catalog.btrim(raw_user_meta_data ->> 'display_name'), 64)
  else '' end from auth.users;
insert into public.user_preferences (user_id) select id from auth.users;

create function public.consume_account_rate_limit(p_action text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_limit integer;
  v_seconds integer;
  v_start timestamptz;
  v_count integer;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if v_user is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  if not public.has_current_auth_session() then raise exception using errcode = '42501', message = 'session_revoked_or_expired'; end if;
  case p_action
    when 'mutation' then v_limit := 120; v_seconds := 60;
    when 'media' then v_limit := 30; v_seconds := 60;
    when 'consent' then v_limit := 30; v_seconds := 60;
    when 'export' then v_limit := 3; v_seconds := 3600;
    when 'delete' then v_limit := 3; v_seconds := 3600;
    else raise exception using errcode = '22023', message = 'invalid_rate_limit_action';
  end case;
  if not exists (select 1 from public.profiles where id = v_user) then
    raise exception using errcode = '42501', message = 'account_not_found';
  end if;
  v_start := pg_catalog.to_timestamp(pg_catalog.floor(extract(epoch from v_now) / v_seconds) * v_seconds);
  insert into app_private.rate_limit_counters as counter (user_id, action, window_start, count)
    values (v_user, p_action, v_start, 1)
    on conflict (user_id, action, window_start) do update set count = counter.count + 1
      where counter.count < v_limit
    returning count into v_count;
  return pg_catalog.jsonb_build_object(
    'allowed', v_count is not null,
    'retry_after', case when v_count is null then greatest(1, pg_catalog.ceil(extract(epoch from (v_start + pg_catalog.make_interval(secs => v_seconds) - v_now)))::integer) else 0 end
  );
end;
$$;
revoke all on function public.consume_account_rate_limit(text) from public, anon;
grant execute on function public.consume_account_rate_limit(text) to authenticated;

create function public.apply_account_mutation(
  p_mutation_id uuid, p_device_id uuid, p_entity text, p_base_version bigint, p_patch jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_payload jsonb;
  v_receipt app_private.account_mutation_receipts%rowtype;
  v_profile public.profiles%rowtype;
  v_preferences public.user_preferences%rowtype;
  v_record jsonb;
  v_version bigint;
  v_result jsonb;
  v_rate jsonb;
  v_key text;
begin
  if v_user is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  if not public.has_current_auth_session() then raise exception using errcode = '42501', message = 'session_revoked_or_expired'; end if;
  if p_mutation_id is null or p_device_id is null or p_base_version is null or p_base_version < 1
    or p_entity is null or p_entity not in ('profile', 'preferences')
    or p_patch is null or pg_catalog.jsonb_typeof(p_patch) <> 'object' or p_patch = '{}'::jsonb
    or pg_catalog.octet_length(p_patch::text) > 8192 then
    raise exception using errcode = '22023', message = 'invalid_mutation';
  end if;
  v_payload := pg_catalog.jsonb_build_object('device_id',p_device_id,'entity',p_entity,'base_version',p_base_version,'patch',p_patch);
  insert into app_private.account_mutation_receipts (user_id, mutation_id, request_payload)
    values (v_user, p_mutation_id, v_payload) on conflict (user_id, mutation_id) do nothing;
  select * into strict v_receipt from app_private.account_mutation_receipts
    where user_id = v_user and mutation_id = p_mutation_id for update;
  if v_receipt.request_payload <> v_payload then
    raise exception using errcode = '22023', message = 'mutation_id_reused_with_different_payload';
  end if;
  if v_receipt.result is not null then return v_receipt.result; end if;
  -- Locking the profile also serializes deletion requests against preference writes.
  select * into v_profile from public.profiles where id = v_user for update;
  if not found then raise exception using errcode = '42501', message = 'account_not_found'; end if;
  if v_profile.deletion_requested_at is not null then
    raise exception using errcode = '42501', message = 'account_deletion_in_progress';
  end if;
  v_rate := public.consume_account_rate_limit('mutation');
  if not (v_rate ->> 'allowed')::boolean then
    raise exception using errcode = 'P0001', message = 'rate_limit_exceeded', detail = v_rate::text;
  end if;
  for v_key in select pg_catalog.jsonb_object_keys(p_patch) loop
    if (p_entity = 'profile' and v_key not in ('username', 'display_name', 'avatar_path'))
      or (p_entity = 'preferences' and v_key not in ('theme', 'language', 'unit_system', 'timezone', 'notification_preferences')) then
      raise exception using errcode = '22023', message = 'unknown_mutation_field';
    end if;
  end loop;
  if p_entity = 'profile' then
    v_version := v_profile.version;
    if p_patch ? 'username' and not (
      p_patch -> 'username' = 'null'::jsonb or
      (pg_catalog.jsonb_typeof(p_patch -> 'username') = 'string' and (p_patch ->> 'username') ~ '^[a-zA-Z0-9_]{3,24}$')
    ) then raise exception using errcode = '22023', message = 'invalid_username'; end if;
    if p_patch ? 'display_name' and (pg_catalog.jsonb_typeof(p_patch -> 'display_name') <> 'string' or pg_catalog.char_length(p_patch ->> 'display_name') > 64) then
      raise exception using errcode = '22023', message = 'invalid_display_name';
    end if;
    if p_patch ? 'avatar_path' and not (
      p_patch -> 'avatar_path' = 'null'::jsonb or
      (pg_catalog.jsonb_typeof(p_patch -> 'avatar_path') = 'string' and pg_catalog.char_length(p_patch ->> 'avatar_path') <= 300 and exists (
        select 1 from public.user_media m where m.user_id = v_user and m.object_path = p_patch ->> 'avatar_path' and m.status = 'ready'
      ))
    ) then raise exception using errcode = '22023', message = 'invalid_avatar_path'; end if;
    if v_version = p_base_version then
      update public.profiles set
        username = case when p_patch ? 'username' then p_patch ->> 'username' else username end,
        display_name = case when p_patch ? 'display_name' then p_patch ->> 'display_name' else display_name end,
        avatar_path = case when p_patch ? 'avatar_path' then p_patch ->> 'avatar_path' else avatar_path end,
        version = version + 1, updated_at = pg_catalog.clock_timestamp()
      where id = v_user returning * into v_profile;
    end if;
    v_record := pg_catalog.to_jsonb(v_profile);
  else
    select * into strict v_preferences from public.user_preferences where user_id = v_user for update;
    v_version := v_preferences.version;
    if p_patch ? 'theme' and (pg_catalog.jsonb_typeof(p_patch -> 'theme') <> 'string' or p_patch ->> 'theme' not in ('dark', 'light')) then
      raise exception using errcode = '22023', message = 'invalid_theme';
    end if;
    if p_patch ? 'language' and (pg_catalog.jsonb_typeof(p_patch -> 'language') <> 'string' or p_patch ->> 'language' not in ('zh-CN', 'en')) then
      raise exception using errcode = '22023', message = 'invalid_language';
    end if;
    if p_patch ? 'unit_system' and (pg_catalog.jsonb_typeof(p_patch -> 'unit_system') <> 'string' or p_patch ->> 'unit_system' not in ('metric', 'imperial')) then
      raise exception using errcode = '22023', message = 'invalid_unit_system';
    end if;
    if p_patch ? 'timezone' and (pg_catalog.jsonb_typeof(p_patch -> 'timezone') <> 'string' or not exists (
      select 1 from pg_catalog.pg_timezone_names where name = p_patch ->> 'timezone'
    )) then raise exception using errcode = '22023', message = 'invalid_timezone'; end if;
    if p_patch ? 'notification_preferences' and not (
      pg_catalog.jsonb_typeof(p_patch -> 'notification_preferences') = 'object'
      and (p_patch -> 'notification_preferences') ?& array['email', 'push']
      and ((p_patch -> 'notification_preferences') - array['email', 'push']) = '{}'::jsonb
      and pg_catalog.jsonb_typeof(p_patch #> '{notification_preferences,email}') = 'boolean'
      and pg_catalog.jsonb_typeof(p_patch #> '{notification_preferences,push}') = 'boolean'
    ) then raise exception using errcode = '22023', message = 'invalid_notification_preferences'; end if;
    if v_version = p_base_version then
      update public.user_preferences set
        theme = case when p_patch ? 'theme' then p_patch ->> 'theme' else theme end,
        language = case when p_patch ? 'language' then p_patch ->> 'language' else language end,
        unit_system = case when p_patch ? 'unit_system' then p_patch ->> 'unit_system' else unit_system end,
        timezone = case when p_patch ? 'timezone' then p_patch ->> 'timezone' else timezone end,
        notification_preferences = case when p_patch ? 'notification_preferences' then p_patch -> 'notification_preferences' else notification_preferences end,
        version = version + 1, updated_at = pg_catalog.clock_timestamp()
      where user_id = v_user returning * into v_preferences;
    end if;
    v_record := pg_catalog.to_jsonb(v_preferences);
  end if;
  v_result := pg_catalog.jsonb_build_object(
    'status', case when v_version = p_base_version then 'applied' else 'conflict' end,
    'entity', p_entity, 'record', v_record, 'version', (v_record ->> 'version')::bigint, 'mutation_id', p_mutation_id
  );
  update app_private.account_mutation_receipts set result = v_result where user_id = v_user and mutation_id = p_mutation_id;
  insert into public.sync_metadata (user_id, device_id, last_seen_at, last_synced_at)
    values (v_user, p_device_id, pg_catalog.clock_timestamp(), case when v_version = p_base_version then pg_catalog.clock_timestamp() else null end)
    on conflict (user_id, device_id) do update set last_seen_at = excluded.last_seen_at,
      last_synced_at = case when v_version = p_base_version then excluded.last_synced_at else public.sync_metadata.last_synced_at end;
  return v_result;
end;
$$;
revoke all on function public.apply_account_mutation(uuid, uuid, text, bigint, jsonb) from public, anon;
grant execute on function public.apply_account_mutation(uuid, uuid, text, bigint, jsonb) to authenticated;

create function public.request_account_deletion() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_job public.account_deletion_jobs%rowtype;
  v_rate jsonb;
begin
  if v_user is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  if not public.has_current_auth_session() then raise exception using errcode = '42501', message = 'session_revoked_or_expired'; end if;
  select * into v_profile from public.profiles where id = v_user for update;
  if not found then raise exception using errcode = '42501', message = 'account_not_found'; end if;
  select * into v_job from public.account_deletion_jobs where user_id = v_user for update;
  if found then return pg_catalog.to_jsonb(v_job); end if;
  v_rate := public.consume_account_rate_limit('delete');
  if not (v_rate ->> 'allowed')::boolean then
    raise exception using errcode = 'P0001', message = 'rate_limit_exceeded', detail = v_rate::text;
  end if;
  update public.profiles set deletion_requested_at = pg_catalog.clock_timestamp(),
    updated_at = pg_catalog.clock_timestamp(), version = version + 1 where id = v_user;
  insert into public.account_deletion_jobs (user_id) values (v_user) returning * into v_job;
  return pg_catalog.to_jsonb(v_job);
end;
$$;
revoke all on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;

-- Buckets are configuration, never public. Existing differently configured
-- buckets require human review, rather than an UPDATE that changes old data.
do $$
begin
  if exists (select 1 from pg_catalog.pg_policy where polrelid = 'storage.objects'::regclass) then
    raise exception 'Storage objects already have policies; review existing policy OR-composition before applying PHASE 2';
  end if;
  if exists (select 1 from storage.buckets where id = 'private-media' and
    (public is distinct from false or file_size_limit is distinct from 5242880::bigint or allowed_mime_types is distinct from array['image/png','image/jpeg','image/webp']::text[])) then
    raise exception 'Storage bucket private-media exists with incompatible settings; review explicitly';
  end if;
end;
$$;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('private-media', 'private-media', false, 5242880, array['image/png','image/jpeg','image/webp']) on conflict (id) do nothing;
create policy fitness_media_select_own on storage.objects for select to authenticated using (
  bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.has_current_auth_session())
);
create policy fitness_media_insert_own on storage.objects for insert to authenticated with check (
  bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.has_current_auth_session())
  and name not like '%..%' and name not like '%//%' and public.is_current_account_active()
);
create policy fitness_media_update_own on storage.objects for update to authenticated using (
  bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.has_current_auth_session())
) with check (
  bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.has_current_auth_session())
  and name not like '%..%' and name not like '%//%' and public.is_current_account_active()
);
create policy fitness_media_delete_own on storage.objects for delete to authenticated using (
  bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.has_current_auth_session())
);

-- The controlled service-role worker may process exports/deletions. Never put
-- its credential into a browser, NEXT_PUBLIC variable, log or client bundle.
grant all on public.profiles, public.user_preferences, public.user_consents,
  public.sync_metadata, public.user_data_exports, public.user_media,
  public.account_deletion_jobs to service_role;
