#!/usr/bin/env bash
set -euo pipefail
echo "[EB predeploy] Installing deps & building Next.js"
npm ci --include=dev || npm install
npm run build
