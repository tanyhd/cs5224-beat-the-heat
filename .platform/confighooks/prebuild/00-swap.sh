#!/usr/bin/env bash
set -euo pipefail
SWAP=/var/swapfile
if [ ! -f "$SWAP" ]; then
  if command -v fallocate >/dev/null 2>&1; then
    fallocate -l 2G "$SWAP"
  else
    dd if=/dev/zero of="$SWAP" bs=1M count=2048
  fi
  chmod 600 "$SWAP"
  mkswap "$SWAP"
  swapon "$SWAP"
  echo "$SWAP swap swap defaults 0 0" >> /etc/fstab
fi
