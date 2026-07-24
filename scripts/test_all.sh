#!/usr/bin/env bash
# Canary Test Runner Script (Bash)

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "========================================="
echo " Running Canary Suite Tests..."
echo "========================================="

echo "[1/3] Running Python Pytest Suite..."
if [ -f "$PROJECT_ROOT/ai/.venv/bin/python" ]; then
    "$PROJECT_ROOT/ai/.venv/bin/python" -m pytest "$PROJECT_ROOT/ai"
else
    pytest "$PROJECT_ROOT/ai"
fi

echo "[2/3] Running Java Spring Boot Test Suite..."
(cd "$PROJECT_ROOT/backend" && mvn clean test)

echo "[3/3] Running Frontend Production Build Verification..."
(cd "$PROJECT_ROOT/frontend" && npm run build)

echo "========================================="
echo " ALL TEST SUITES PASSED CLEANLY!"
echo "========================================="
