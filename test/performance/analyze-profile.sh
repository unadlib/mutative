#!/bin/bash

# Mutative Array Profile Analysis Script
# 使用 pprof-to-md 分析 CPU profile

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILE_FILE="$SCRIPT_DIR/cpu-profile-array.pb.gz"
OUTPUT_FILE="$SCRIPT_DIR/array-profile-analysis.md"

echo "=============================================="
echo "Mutative Array Operations Profile Analysis"
echo "=============================================="

# 检查 profile 文件是否存在
if [ ! -f "$PROFILE_FILE" ]; then
    echo "Error: Profile file not found: $PROFILE_FILE"
    echo ""
    echo "Please run the profiling script first:"
    echo "  npx ts-node test/performance/pprof-array-profile.ts"
    exit 1
fi

echo "Profile file: $PROFILE_FILE"
echo "Output file: $OUTPUT_FILE"
echo ""

# 运行 pprof-to-md 分析
echo "Running pprof-to-md analysis..."
npx pprof-to-md "$PROFILE_FILE" \
    --format=detailed \
    --source-dir="$SCRIPT_DIR/../../src" \
    --max-hotspots=20 \
    -o "$OUTPUT_FILE"

echo ""
echo "Analysis complete!"
echo "Results saved to: $OUTPUT_FILE"
echo ""
echo "To view the results:"
echo "  cat $OUTPUT_FILE"
