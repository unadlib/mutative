#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Running baseline (mutative@1.3.0)…"
BASELINE_MUTATIVE=1 npx ts-node pprof-array-profile.ts
BASELINE_MUTATIVE=1 npx ts-node analyze-pprof.ts

echo "Baseline profile written to cpu-profile-array.cpuprofile and array-profile-analysis.md (baseline)."
