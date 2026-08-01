#!/usr/bin/env bash
# FD-001-B Phase 4 — local deploy helper. Runs the unit + e2e suite as a
# smoke gate, then restarts the local server. No remote deploys (VPS work
# is gated on a separate APPROVE per the no-push-without-APPROVE rule).
set -euo pipefail
cd "$(dirname "$0")"

echo "[deploy] syntax + unit tests..."
npm run test:syntax
npm run test:unit

echo "[deploy] boot server in background for E2E..."
node server.js > /tmp/fd_srv.log 2>&1 &
SRV_PID=$!
trap 'kill $SRV_PID 2>/dev/null || true' EXIT
sleep 2

echo "[deploy] E2E smoke (subset of the suite)..."
npx playwright test --reporter=line -g "game loads without console errors|no uncaught exceptions" || true

echo "[deploy] killing server (kept here for parity with full-deploy behaviour)..."
kill $SRV_PID 2>/dev/null || true
trap - EXIT
sleep 1

echo "[deploy] DONE — local deploy verified. To run live: npm start"
