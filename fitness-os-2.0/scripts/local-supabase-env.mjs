/** Generate local-only SDK configuration without printing keys. Never contacts a hosted project. */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";
const target = resolve(".env.local");
const marker = "# Generated LOCAL Supabase development credentials; never commit.";
if (existsSync(target) && !readFileSync(target,"utf8").startsWith(marker)) {
  throw new Error("Refusing to replace an existing .env.local. Move it to a safe private location first.");
}
const commandEnv = { ...process.env, DOCKER_HOST: "unix:///var/run/docker.sock" };
for (const name of ["DOCKER_CONTEXT","DOCKER_TLS","DOCKER_TLS_VERIFY","DOCKER_CERT_PATH"]) delete commandEnv[name];
let local;
try {
  local = JSON.parse(execFileSync(process.env.SUPABASE_CLI || "supabase", ["status","-o","json"], {
    encoding:"utf8", env:commandEnv, stdio:["ignore","pipe","pipe"],
  }));
} catch { throw new Error("Could not read local Supabase status; no credential output was displayed."); }
const url = new URL(local.API_URL);
if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("Expected a local Supabase URL.");
if (!local.ANON_KEY || !local.SERVICE_ROLE_KEY) throw new Error("The local Auth service is not ready.");
const values = {
  NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
  NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: local.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY,
  ...(local.JWT_SECRET ? { SUPABASE_TEST_JWT_SECRET: local.JWT_SECRET } : {}),
};
writeFileSync(target, `${marker}\n${Object.entries(values).map(([key,value]) => `${key}=${JSON.stringify(value)}`).join("\n")}\n`, { mode:0o600 });
chmodSync(target,0o600);
console.log(`Created private .env.local with ${Object.keys(values).join(", ")}. Values were not printed.`);
