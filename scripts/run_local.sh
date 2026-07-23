#!/usr/bin/env bash
# Canary Local Development Launcher (Bash)

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "========================================="
echo " Starting Canary Platform Services..."
echo "========================================="

# 1. Start Python AI Service
echo "[1/3] Starting AI Service on http://localhost:8000..."
if [ -f "$PROJECT_ROOT/ai/.venv/bin/python" ]; then
    (cd "$PROJECT_ROOT/ai" && "$PROJECT_ROOT/ai/.venv/bin/python" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload) &
else
    (cd "$PROJECT_ROOT/ai" && uvicorn main:app --host 0.0.0.0 --port 8000 --reload) &
fi

# 2. Start Java Spring Boot Backend
echo "[2/3] Starting Spring Boot Backend on http://localhost:8080..."
(cd "$PROJECT_ROOT/backend" && mvn spring-boot:run) &

# 3. Start React Frontend
echo "[3/3] Starting React Web UI on http://localhost:5173..."
(cd "$PROJECT_ROOT/frontend" && npm run dev) &

echo "All services launched! Access Web UI (Dev Server) at http://localhost:5173"
wait
