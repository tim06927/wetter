#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UPDATER_SOURCE="${SOURCE_DIR}/deploy/flexdns/update-flexdns-do"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo: sudo $0" >&2
  exit 1
fi

if [[ ! -x "${UPDATER_SOURCE}" ]]; then
  echo "Updater source is not executable: ${UPDATER_SOURCE}" >&2
  exit 1
fi

for target in /usr/local/sbin/update-flexdns-cv /usr/local/sbin/update-flexdns-daiy; do
  if [[ -e "${target}" || -L "${target}" ]]; then
    cp -a "${target}" "${target}.bak.${TIMESTAMP}"
  fi

  install -m 0755 -o root -g root "${UPDATER_SOURCE}" "${target}"
done

for timer in /etc/systemd/system/flexdns-cv.timer /etc/systemd/system/flexdns-daiy.timer; do
  if [[ -f "${timer}" ]]; then
    cp -a "${timer}" "${timer}.bak.${TIMESTAMP}"
    sed -i \
      -e 's/^OnUnitActiveSec=.*/OnUnitActiveSec=5min/' \
      -e 's/^RandomizedDelaySec=.*/RandomizedDelaySec=1min/' \
      "${timer}"
  fi
done

systemctl daemon-reload
systemctl reset-failed flexdns-cv.service flexdns-daiy.service || true
systemctl enable --now flexdns-cv.timer flexdns-daiy.timer

echo "Installed external-IPv6 FlexDNS updater."
echo "Run now:"
echo "  sudo systemctl start flexdns-cv.service"
echo "  journalctl -u flexdns-cv.service -n 30 --no-pager"
