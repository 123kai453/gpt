#!/usr/bin/env bash
# Install the pinned official Linux x86_64 CLI for the Cloud/WSL test setup.
set -euo pipefail
if [[ "$(uname -s)" != Linux || "$(uname -m)" != x86_64 ]]; then
  echo 'This helper targets Linux x86_64. Install Supabase CLI 3.0.0 using the official instructions on other platforms.' >&2
  exit 2
fi
supabase_cli_version=3.0.0
supabase_install_dir="${SUPABASE_CLI_DIR:-${TMPDIR:-/tmp}/fitness-supabase-cli}"
supabase_install_tmp="$(mktemp -d "${TMPDIR:-/tmp}/fitness-supabase-install.XXXXXX")"
trap 'rm -rf "$supabase_install_tmp"' EXIT
supabase_archive="supabase_${supabase_cli_version}_linux_amd64.tar.gz"
supabase_release="https://github.com/supabase/cli/releases/download/v${supabase_cli_version}"
curl --fail --location --show-error --silent "${supabase_release}/${supabase_archive}" -o "${supabase_install_tmp}/${supabase_archive}"
curl --fail --location --show-error --silent "${supabase_release}/checksums.txt" -o "${supabase_install_tmp}/checksums.txt"
(
  cd "$supabase_install_tmp"
  awk -v file="$supabase_archive" '$2 == file {print}' checksums.txt | sha256sum --check --strict -
)
tar -xzf "${supabase_install_tmp}/${supabase_archive}" -C "$supabase_install_tmp" supabase
mkdir -p "$supabase_install_dir"
install -m 0755 "${supabase_install_tmp}/supabase" "${supabase_install_dir}/supabase"
printf 'Verified Supabase CLI %s installed at %s\n' "$supabase_cli_version" "${supabase_install_dir}/supabase"
