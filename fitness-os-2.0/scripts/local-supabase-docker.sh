#!/usr/bin/env bash
# Optional managed-Cloud workaround: BusyBox wget ignores NO_PROXY in local health checks.
# Only an exact loopback health probe uses -Y off. External proxy/CA/auth stay inherited.
set -euo pipefail
: "${FITNESS_LOCAL_DOCKER_BINARY:?Real Docker executable is required}"
supabase_docker_args=("$@")
for ((supabase_arg_index=0; supabase_arg_index<${#supabase_docker_args[@]}; supabase_arg_index++)); do
  if [[ "${supabase_docker_args[supabase_arg_index]}" == --health-cmd && "$((supabase_arg_index+1))" -lt "${#supabase_docker_args[@]}" ]]; then
    supabase_health="${supabase_docker_args[supabase_arg_index+1]}"
    if [[ "$supabase_health" == 'wget --no-verbose --tries=1 --spider http://127.0.0.1:'* ]]; then
      supabase_docker_args[supabase_arg_index+1]="${supabase_health/wget /wget -Y off }"
    fi
  fi
done
exec "$FITNESS_LOCAL_DOCKER_BINARY" "${supabase_docker_args[@]}"
