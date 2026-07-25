#!/usr/bin/env bash
# Canary Diagnostic Health Check Script (Unix/Linux/macOS)
# Pings Ollama, Python AI Service, and Spring Boot Java Backend

OLLAMA_URL="http://localhost:11434/api/tags"
AI_URL="http://localhost:8000/health"
BACKEND_URL="http://localhost:8080/api/v1/health"

FAILED_COUNT=0

echo "=================================================="
echo "         Canary Services Diagnostic Check         "
echo "=================================================="
echo ""

# 1. Check Ollama Service
echo -n "[1/3] Checking Ollama Service ($OLLAMA_URL)... "
if curl -s --max-time 5 "$OLLAMA_URL" > /dev/null; then
    echo "[PASS]"
else
    echo "[FAIL]"
    echo "      Error: Ollama is not running on port 11434. Start Ollama with 'ollama serve'."
    FAILED_COUNT=$((FAILED_COUNT + 1))
fi

# 2. Check Python AI Service
echo -n "[2/3] Checking Python AI Service ($AI_URL)... "
if curl -s --max-time 5 "$AI_URL" > /dev/null; then
    echo "[PASS]"
else
    echo "[FAIL]"
    echo "      Error: Python AI Service is not running on port 8000."
    FAILED_COUNT=$((FAILED_COUNT + 1))
fi

# 3. Check Spring Boot Backend Service
echo -n "[3/3] Checking Spring Boot Backend ($BACKEND_URL)... "
if curl -s --max-time 5 "$BACKEND_URL" > /dev/null; then
    echo "[PASS]"
else
    echo "[FAIL]"
    echo "      Error: Spring Boot Backend is not running on port 8080."
    FAILED_COUNT=$((FAILED_COUNT + 1))
fi

echo ""
echo "=================================================="

if [ $FAILED_COUNT -gt 0 ]; then
    echo " Health Check Failed: $FAILED_COUNT service(s) offline."
    echo "=================================================="
    exit 1
else
    echo " All Canary Services are Online and Healthy!"
    echo "=================================================="
    exit 0
fi
