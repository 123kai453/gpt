/** Explicit local-only real integration run. Never creates users in a hosted project. */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!raw || !['127.0.0.1','localhost','[::1]'].includes(new URL(raw).hostname)) {
  throw new Error('This runner requires the isolated local Supabase project. Hosted test execution is not enabled.');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Local Supabase test credentials are not configured.');
}
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js','test',...process.argv.slice(2)], {
  stdio:'inherit', env:{...process.env, PHASE2_AUTH_INTEGRATION:'1',PHASE2_ACCOUNT_INTEGRATION:'1'},
});
process.exit(result.status ?? 1);
