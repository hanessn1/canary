#!/usr/bin/env bash
# Canary Docker Build Script (Bash)

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "========================================="
echo " Building Canary Docker Container Images..."
echo "========================================="

echo "[1/3] Building hanessn/canary-ai:latest..."
docker build -t hanessn/canary-ai:latest -f "$PROJECT_ROOT/ai/Dockerfile" "$PROJECT_ROOT"

echo "[2/3] Building hanessn/canary-backend:latest..."
docker build -t hanessn/canary-backend:latest -f "$PROJECT_ROOT/backend/Dockerfile" "$PROJECT_ROOT"

echo "[3/3] Building hanessn/canary-frontend:latest..."
docker build -t hanessn/canary-frontend:latest -f "$PROJECT_ROOT/frontend/Dockerfile" "$PROJECT_ROOT"

echo "All Docker images built successfully! Run 'docker compose up -d' to start."
