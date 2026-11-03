#!/usr/bin/env bash
# Local only: never links or deploys a hosted project. Keys stay in a private log/env file.
set -euo pipefail
cd "$(dirname "$0")/.."
supabase_cli="${SUPABASE_CLI:-supabase}"
supabase_log="$(mktemp "${TMPDIR:-/tmp}/fitness-supabase.XXXXXX.log")"
supabase_shim_dir=""
trap '[[ -z "$supabase_shim_dir" ]] || rm -rf "$supabase_shim_dir"' EXIT
supabase_command_env=(env -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH DOCKER_HOST=unix:///var/run/docker.sock)
if [[ "${SUPABASE_LOCAL_HEALTHCHECK_PROXY_FIX:-0}" == 1 ]]; then
  supabase_real_docker="$(command -v docker)"
  supabase_shim_dir="$(mktemp -d "${TMPDIR:-/tmp}/fitness-docker-health.XXXXXX")"
  cp scripts/local-supabase-docker.sh "$supabase_shim_dir/docker"
  chmod 0700 "$supabase_shim_dir/docker"
  supabase_command_env+=("FITNESS_LOCAL_DOCKER_BINARY=$supabase_real_docker" "PATH=$supabase_shim_dir:$PATH")
fi
case "${1:-start}" in
  start)
    if "${supabase_command_env[@]}" SUPABASE_INTERNAL_IMAGE_REGISTRY="${SUPABASE_INTERNAL_IMAGE_REGISTRY:-docker.io}" \
      "$supabase_cli" start --exclude realtime,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor >"$supabase_log" 2>&1; then
      echo 'Local Supabase started. API: http://127.0.0.1:54321 ; test mailbox: http://127.0.0.1:54324 .'
      echo 'Run scripts/local-supabase.sh env to write private local SDK configuration.'
    else
      echo "Local Supabase startup failed. Private diagnostic log: $supabase_log (may contain local keys; do not upload)." >&2
      exit 1
    fi
    ;;
  stop)
    "${supabase_command_env[@]}" "$supabase_cli" stop >"$supabase_log" 2>&1
    echo 'Local Supabase stopped; development data preserved.'
    ;;
  env)
    SUPABASE_CLI="$supabase_cli" node scripts/local-supabase-env.mjs
    ;;
  *) echo 'Usage: scripts/local-supabase.sh [start|stop|env]' >&2; exit 2 ;;
esac
