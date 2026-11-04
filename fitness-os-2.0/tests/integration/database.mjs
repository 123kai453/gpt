/**
 * Actual local Supabase Auth/PostgREST/Storage security integration tests.
 * Run: node --env-file=.env.local tests/integration/database.mjs
 * Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * SUPABASE_SERVICE_ROLE_KEY, SUPABASE_TEST_JWT_SECRET (LOCAL ONLY).
 * Refuses hosted URLs. No token/key/session is written to console or disk.
 */
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.SUPABASE_TEST_JWT_SECRET;
if (!url || !anonKey || !serviceKey || !jwtSecret) {
  throw new Error('Missing required LOCAL Supabase test configuration; see script header.');
}
const endpoint = new URL(url);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname)) {
  throw new Error('Refusing integration mutations outside an isolated localhost Supabase instance.');
}
const timedFetch = (input, init = {}) => fetch(input, {
  ...init,
  signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000),
});
const client = (key = anonKey, accessToken) => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: timedFetch, ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}) },
});
const admin = client(serviceKey);
const anonymous = client();
const accounts = [];
const storagePaths = new Set();
const passed = [];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
const bucket = 'private-media';
const runId = randomUUID().replaceAll('-', '').slice(0, 12);

function check(condition, label) {
  if (!condition) throw new Error(label);
  passed.push(label);
}
function ok(response, label) {
  if (response.error) throw new Error(`${label} (${response.error.code ?? response.error.status ?? 'request_failed'})`);
  return response.data;
}
function denied(response, label) {
  check(Boolean(response.error), label);
}
function empty(response, label) {
  const data = ok(response, label);
  check(Array.isArray(data) && data.length === 0, label);
}
function mutation(actor, entity, version, patch, mutationId = randomUUID(), deviceId = actor.deviceId) {
  return actor.client.rpc('apply_account_mutation', {
    p_mutation_id: mutationId, p_device_id: deviceId, p_entity: entity, p_base_version: version, p_patch: patch,
  });
}
function signedJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.${createHmac('sha256', jwtSecret).update(`${header}.${body}`).digest('base64url')}`;
}
function trackedPath(userId, extension = 'png') {
  const path = `${userId}/${randomUUID()}.${extension}`;
  storagePaths.add(path);
  return path;
}
async function makeAccount(label) {
  const email = `phase2-${runId}-${label}@example.invalid`;
  const password = `Fitness!${randomUUID()}Aa9`;
  const created = ok(await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { display_name: `  Test ${label.toUpperCase()}  `, role: 'service_role' },
  }), 'admin creates isolated test account');
  const actor = { id: created.user.id, email, password, deviceId: randomUUID(), client: client() };
  accounts.push(actor);
  actor.session = ok(await actor.client.auth.signInWithPassword({ email, password }), 'real password sign-in').session;
  return actor;
}

try {
  const a = await makeAccount('a');
  const b = await makeAccount('b');
  const profileA = ok(await a.client.from('profiles').select('*').single(), 'own profile fetch');
  check(profileA.id === a.id && profileA.display_name === 'Test A' && profileA.version === 1, 'Auth trigger defaults and safe display-name metadata');
  check(ok(await a.client.from('user_preferences').select('*').single(), 'own preference fetch').version === 1, 'Auth trigger creates preferences');

  for (const table of ['profiles', 'user_preferences', 'user_consents', 'sync_metadata', 'user_media', 'user_data_exports', 'account_deletion_jobs']) {
    denied(await anonymous.from(table).select('*'), `anonymous cannot read ${table}`);
  }
  const anonymousWrites = [
    ['profiles', { id: a.id }, { display_name: 'forbidden' }, 'id'],
    ['user_preferences', { user_id: a.id }, { theme: 'light' }, 'user_id'],
    ['user_consents', { user_id: a.id, scope: 'privacy_policy', granted: true, policy_version: 'local-test' }, { granted: false }, 'user_id'],
    ['sync_metadata', { user_id: a.id, device_id: randomUUID() }, { last_seen_at: new Date().toISOString() }, 'user_id'],
    ['user_media', { user_id: a.id, object_path: trackedPath(a.id), mime_type: 'image/png', size_bytes: 100 }, { status: 'failed' }, 'user_id'],
    ['user_data_exports', { user_id: a.id, format: 'json' }, { status: 'failed' }, 'user_id'],
    ['account_deletion_jobs', { user_id: a.id }, { status: 'failed' }, 'user_id'],
  ];
  for (const [table, row, patch, ownerKey] of anonymousWrites) {
    denied(await anonymous.from(table).insert(row), `anonymous cannot INSERT ${table}`);
    denied(await anonymous.from(table).update(patch).eq(ownerKey, a.id), `anonymous cannot UPDATE ${table}`);
    denied(await anonymous.from(table).delete().eq(ownerKey, a.id), `anonymous cannot DELETE ${table}`);
  }
  denied(await anonymous.rpc('consume_account_rate_limit', { p_action: 'export' }), 'anonymous cannot execute account RPC');
  denied(await a.client.schema('app_private').from('account_mutation_receipts').select('*'), 'private receipt schema is not exposed');
  denied(await a.client.schema('app_private').from('rate_limit_counters').select('*'), 'private rate schema is not exposed');
  empty(await b.client.from('profiles').select('*').eq('id', a.id), 'B cannot select A profile');
  empty(await b.client.from('user_preferences').select('*').eq('user_id', a.id), 'B cannot select A preferences');
  for (const table of ['profiles', 'user_preferences']) {
    const primary = table === 'profiles' ? 'id' : 'user_id';
    denied(await a.client.from(table).insert({ [primary]: a.id }), `${table} direct INSERT denied`);
    denied(await a.client.from(table).update(table === 'profiles' ? { display_name: 'bypass' } : { theme: 'light' }).eq(primary, a.id), `${table} direct UPDATE denied`);
    denied(await a.client.from(table).delete().eq(primary, a.id), `${table} direct DELETE denied`);
  }

  const username = `db_${runId}`;
  const firstId = randomUUID();
  const firstPatch = { username, display_name: 'First device' };
  const first = ok(await mutation(a, 'profile', 1, firstPatch, firstId), 'first CAS');
  check(first.status === 'applied' && first.version === 2 && first.mutation_id === firstId, 'CAS applied response envelope');
  const second = ok(await mutation(a, 'profile', 2, { display_name: 'Second device' }), 'second CAS');
  check(second.status === 'applied' && second.version === 3, 'server increments version');
  const replay = ok(await mutation(a, 'profile', 1, firstPatch, firstId), 'idempotent replay');
  assert.deepEqual(replay, first, 'same UUID/payload returns ORIGINAL response');
  passed.push('same UUID/payload returns ORIGINAL response');
  denied(await mutation(a, 'profile', 1, { display_name: 'different payload' }, firstId), 'same UUID/different payload rejected');
  const conflictId = randomUUID();
  const conflict = ok(await mutation(a, 'profile', 1, { display_name: 'stale' }, conflictId), 'stale CAS');
  check(conflict.status === 'conflict' && conflict.version === 3 && conflict.record.display_name === 'Second device', 'stale CAS returns server record without overwrite');
  ok(await mutation(a, 'profile', 3, { display_name: 'Third device' }), 'advance after conflict');
  assert.deepEqual(ok(await mutation(a, 'profile', 1, { display_name: 'stale' }, conflictId), 'conflict replay'), conflict, 'conflict response also cached');
  passed.push('conflict response also cached');
  denied(await mutation(a, 'profile', 4, { user_id: b.id }), 'ownership patch forbidden');
  denied(await mutation(a, 'profile', 4, { version: 100 }), 'server version patch forbidden');
  denied(await mutation(a, 'profile', 4, { avatar_path: `${b.id}/avatar.png` }), 'foreign avatar reference forbidden');
  denied(await mutation(b, 'profile', 1, { username: username.toUpperCase() }), 'username uniqueness is case insensitive');
  denied(await mutation(a, 'preferences', 1, { timezone: 'Invalid/Timezone' }), 'unknown timezone rejected');
  denied(await mutation(a, 'preferences', 1, { notification_preferences: { email: false, push: true, extra: true } }), 'unknown notification field rejected');
  const preferences = ok(await mutation(a, 'preferences', 1, {
    theme: 'light', language: 'en', unit_system: 'imperial', timezone: 'Asia/Shanghai', notification_preferences: { email: false, push: true },
  }), 'valid preferences CAS');
  check(preferences.status === 'applied' && preferences.version === 2 && preferences.record.theme === 'light', 'preferences version independent of profile');
  const concurrent = await Promise.all([
    mutation(a, 'profile', 4, { display_name: 'Concurrent A' }),
    mutation(a, 'profile', 4, { display_name: 'Concurrent B' }, randomUUID(), randomUUID()),
  ]);
  check(concurrent.map((r) => ok(r, 'concurrent CAS').status).sort().join(',') === 'applied,conflict', 'concurrent devices cannot overwrite same base version');
  const sameId = randomUUID();
  const concurrentReplay = await Promise.all([
    mutation(a, 'profile', 5, { display_name: 'Exactly once' }, sameId),
    mutation(a, 'profile', 5, { display_name: 'Exactly once' }, sameId),
  ]);
  assert.deepEqual(ok(concurrentReplay[0], 'concurrent replay first'), ok(concurrentReplay[1], 'concurrent replay second'), 'concurrent same UUID responds identically');
  check(concurrentReplay[0].data.version === 6, 'concurrent replay increments only once');

  const mediaId = randomUUID();
  const path = `${a.id}/${randomUUID()}.png`;
  storagePaths.add(path);
  ok(await a.client.from('user_media').insert({ id: mediaId, object_path: path, mime_type: 'image/png', size_bytes: png.byteLength }).select().single(), 'own media metadata insert');
  ok(await a.client.storage.from(bucket).upload(path, png, { contentType: 'image/png' }), 'own real Storage upload');
  ok(await a.client.from('user_media').update({ status: 'ready' }).eq('id', mediaId).select().single(), 'own media ready update');
  const avatar = ok(await mutation(a, 'profile', 6, { avatar_path: path }), 'own ready avatar CAS');
  check(avatar.status === 'applied' && avatar.version === 7, 'own ready media can be avatar');
  ok(await a.client.storage.from(bucket).download(path), 'own Storage download');
  ok(await a.client.storage.from(bucket).createSignedUrl(path, 60), 'own short-lived signed URL');
  denied(await b.client.storage.from(bucket).download(path), 'B cannot download A object');
  denied(await anonymous.storage.from(bucket).download(path), 'anonymous cannot download private object');
  denied(await b.client.storage.from(bucket).createSignedUrl(path, 60), 'B cannot sign A object URL');
  denied(await b.client.storage.from(bucket).update(path, png, { contentType: 'image/png' }), 'B cannot update A object');
  denied(await b.client.storage.from(bucket).upload(trackedPath(a.id), png, { contentType: 'image/png' }), 'B cannot upload into A folder');
  denied(await anonymous.storage.from(bucket).upload(trackedPath(a.id), png, { contentType: 'image/png' }), 'anonymous cannot upload');
  await b.client.storage.from(bucket).remove([path]);
  ok(await a.client.storage.from(bucket).download(path), 'B delete attempt leaves A object intact');
  await anonymous.storage.from(bucket).remove([path]);
  ok(await a.client.storage.from(bucket).download(path), 'anonymous delete attempt leaves A object intact');
  empty(await b.client.from('user_media').select('*').eq('user_id', a.id), 'B cannot read A media metadata');
  empty(await b.client.from('user_media').update({ status: 'failed' }).eq('id', mediaId).select(), 'B cannot update A media metadata');
  empty(await b.client.from('user_media').delete().eq('id', mediaId).select(), 'B cannot delete A media metadata');
  denied(await b.client.from('user_media').insert({ user_id: a.id, object_path: `${a.id}/${randomUUID()}.png`, mime_type: 'image/png', size_bytes: 100 }), 'B cannot insert A media metadata');
  denied(await a.client.from('user_media').update({ object_path: `${a.id}/${randomUUID()}.png` }).eq('id', mediaId), 'media path immutable');
  const oversizePath = `${a.id}/${randomUUID()}.png`;
  const svgPath = `${a.id}/${randomUUID()}.svg`;
  storagePaths.add(oversizePath); storagePaths.add(svgPath);
  denied(await a.client.storage.from(bucket).upload(oversizePath, Buffer.alloc(5_242_881), { contentType: 'image/png' }), 'Storage rejects greater than 5MiB');
  denied(await a.client.storage.from(bucket).upload(svgPath, Buffer.from('<svg/>'), { contentType: 'image/svg+xml' }), 'Storage rejects unsupported MIME');

  const exportRow = ok(await a.client.from('user_data_exports').insert({ format: 'json' }).select().single(), 'own export metadata insert');
  empty(await b.client.from('user_data_exports').select('*').eq('user_id', a.id), 'B cannot select A export');
  empty(await b.client.from('user_data_exports').update({ status: 'failed' }).eq('id', exportRow.id).select(), 'B cannot update A export');
  empty(await b.client.from('user_data_exports').delete().eq('id', exportRow.id).select(), 'B cannot delete A export');
  denied(await b.client.from('user_data_exports').insert({ user_id: a.id, format: 'json' }), 'B cannot insert export owned by A');
  ok(await a.client.from('user_consents').insert({ scope: 'privacy_policy', granted: true, policy_version: 'local-test' }), 'own consent insert');
  empty(await b.client.from('user_consents').select('*').eq('user_id', a.id), 'B cannot select A consent');
  denied(await b.client.from('user_consents').insert({ user_id: a.id, scope: 'privacy_policy', granted: true, policy_version: 'local-test' }), 'B cannot insert A consent');
  denied(await a.client.from('user_consents').update({ granted: false }).eq('user_id', a.id), 'consents cannot be updated');
  denied(await a.client.from('user_consents').delete().eq('user_id', a.id), 'consents cannot be deleted directly');
  empty(await b.client.from('sync_metadata').select('*').eq('user_id', a.id), 'B cannot select A device metadata');
  denied(await b.client.from('sync_metadata').insert({ user_id: a.id, device_id: randomUUID() }), 'B cannot insert A device metadata');
  empty(await b.client.from('sync_metadata').update({ last_seen_at: new Date().toISOString() }).eq('user_id', a.id).select(), 'B cannot update A device metadata');
  empty(await b.client.from('sync_metadata').delete().eq('user_id', a.id).select(), 'B cannot delete A device metadata');
  for (let n = 0; n < 3; n++) check(ok(await b.client.rpc('consume_account_rate_limit', { p_action: 'export' }), 'export limit RPC').allowed, `fixed export allowance ${n + 1}`);
  const limit = ok(await b.client.rpc('consume_account_rate_limit', { p_action: 'export' }), 'export rate denied result');
  check(!limit.allowed && limit.retry_after > 0 && limit.retry_after <= 3600, 'fixed fourth-export limit and retry_after');
  denied(await b.client.rpc('consume_account_rate_limit', { p_action: 'unlimited' }), 'caller cannot choose arbitrary rate action');

  const originalClaims = JSON.parse(Buffer.from(a.session.access_token.split('.')[1], 'base64url').toString());
  const expired = client(anonKey, signedJwt({ ...originalClaims, iat: Math.floor(Date.now() / 1000) - 7200, exp: Math.floor(Date.now() / 1000) - 3600 }));
  const expiredResponse = await expired.from('profiles').select('*');
  check(Boolean(expiredResponse.error) && expiredResponse.status === 401, 'expired access JWT rejected by actual PostgREST');
  const missingSessionClaims = { ...originalClaims };
  delete missingSessionClaims.session_id;
  const noSession = client(anonKey, signedJwt(missingSessionClaims));
  empty(await noSession.from('profiles').select('*'), 'JWT without live session cannot read profile');
  denied(await noSession.rpc('consume_account_rate_limit', { p_action: 'export' }), 'JWT without live session cannot execute RPC');
  const staleAccessToken = a.session.access_token;
  const staleRefreshToken = a.session.refresh_token;
  ok(await a.client.auth.signOut({ scope: 'global' }), 'global signout');
  const revoked = client(anonKey, staleAccessToken);
  empty(await revoked.from('profiles').select('*'), 'logout immediately blocks former JWT profile read');
  denied(await revoked.rpc('consume_account_rate_limit', { p_action: 'export' }), 'logout immediately blocks former JWT RPC');
  denied(await revoked.storage.from(bucket).download(path), 'logout immediately blocks former JWT Storage download');
  denied(await client().auth.refreshSession({ refresh_token: staleRefreshToken }), 'revoked refresh token cannot create session');
  a.client = client();
  a.session = ok(await a.client.auth.signInWithPassword({ email: a.email, password: a.password }), 'sign-in after logout creates new live session').session;

  ok(await a.client.from('user_media').update({ status: 'deleting' }).eq('id', mediaId), 'metadata removal status');
  const cleared = ok(await a.client.from('profiles').select('*').single(), 'profile after media deletion');
  check(cleared.avatar_path === null && cleared.version === 8, 'media removal clears avatar and advances version atomically');
  const deletion = ok(await a.client.rpc('request_account_deletion'), 'request deletion');
  assert.deepEqual(ok(await a.client.rpc('request_account_deletion'), 'repeat deletion'), deletion, 'deletion request is idempotent/resumable');
  passed.push('deletion request is idempotent/resumable');
  empty(await b.client.from('account_deletion_jobs').select('*').eq('user_id', a.id), 'B cannot read A deletion job');
  empty(await b.client.from('account_deletion_jobs').update({ status: 'failed' }).eq('id', deletion.id).select(), 'B cannot update A deletion job');
  denied(await mutation(a, 'preferences', 2, { theme: 'dark' }), 'deletion state blocks account mutation');
  denied(await a.client.from('user_media').insert({ object_path: `${a.id}/${randomUUID()}.png`, mime_type: 'image/png', size_bytes: 100 }), 'deletion state blocks media insert');
  denied(await a.client.from('user_data_exports').insert({ format: 'json' }), 'deletion state blocks new exports');
  denied(await a.client.storage.from(bucket).upload(trackedPath(a.id), png, { contentType: 'image/png' }), 'deletion state blocks direct Storage upload');
  denied(await a.client.storage.from(bucket).update(path, png, { contentType: 'image/png' }), 'deletion state blocks direct Storage update');
  ok(await a.client.storage.from(bucket).remove([path]), 'deletion state allows own Storage cleanup');
  denied(await a.client.storage.from(bucket).download(path), 'removed object no longer downloadable');
  ok(await admin.auth.admin.deleteUser(a.id), 'Auth admin deletion after file cleanup');
  for (const table of ['profiles', 'user_preferences', 'user_consents', 'sync_metadata', 'user_media', 'user_data_exports', 'account_deletion_jobs']) {
    const response = await admin.from(table).select('*').eq(table === 'profiles' ? 'id' : 'user_id', a.id);
    empty(response, `Auth deletion cascades ${table}`);
  }
  empty(await a.client.from('profiles').select('*'), 'deleted account former JWT cannot read profile');
  denied(await a.client.storage.from(bucket).upload(trackedPath(a.id), png, { contentType: 'image/png' }), 'deleted account former JWT cannot recreate Storage files');
  console.log(JSON.stringify({ status: 'passed', environment: 'isolated-local-supabase', assertions: passed.length, checks: passed }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: 'failed', environment: 'isolated-local-supabase', completedAssertions: passed.length, failure: error instanceof Error ? error.message : 'Unknown test failure' }));
  process.exitCode = 1;
} finally {
  // Remove test files through Storage API first; Auth may refuse deleting users
  // that still own files. Cleanup deliberately runs on both pass and failure.
  if (storagePaths.size) await admin.storage.from(bucket).remove([...storagePaths]).catch(() => {});
  for (const actor of accounts) await admin.auth.admin.deleteUser(actor.id).catch(() => {});
}
