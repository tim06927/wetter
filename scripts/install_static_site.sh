#!/usr/bin/env bash
set -euo pipefail

APP_NAME="wetter"
SITE_ROOT="/srv/${APP_NAME}"
RELEASES_DIR="${SITE_ROOT}/releases"
CURRENT_LINK="${SITE_ROOT}/current"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${SOURCE_DIR}/dist"
RELEASE_NAME="$(date -u +%Y%m%dT%H%M%SZ)"
RELEASE_DIR="${RELEASES_DIR}/${RELEASE_NAME}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer with sudo." >&2
  exit 1
fi

install -d -m 0755 "${RELEASE_DIR}"

if [[ ! -f "${BUILD_DIR}/index.html" ]]; then
  echo "Build output not found. Run npm run build before installing." >&2
  exit 1
fi

rsync -a \
  --delete \
  "${BUILD_DIR}/" "${RELEASE_DIR}/"

ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"

echo "Installed ${APP_NAME} static site to ${RELEASE_DIR}"
echo "Current symlink: ${CURRENT_LINK}"
echo "Add deploy/Caddyfile.example to your Caddy config with the real domain."
echo "This app should be served as static files, not as a reverse proxy to Vite."
