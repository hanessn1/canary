#!/usr/bin/env bash
# Canary Environment Setup Script (Unix/Linux/macOS)
# Automatically sets up dependencies for Python AI Service, Java Backend, and React Frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=================================================="
echo "       Canary Automated Environment Setup         "
echo "=================================================="
echo "Root Directory: $ROOT_DIR"
echo ""

# 1. Python AI Service Setup
echo "[1/3] Setting up Python AI Service (ai/)..."
AI_DIR="$ROOT_DIR/ai"
VENV_DIR="$AI_DIR/.venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment in $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
else
    echo "Python virtual environment already exists in $VENV_DIR."
fi

PYTHON_EXE="$VENV_DIR/bin/python"
echo "Installing/upgrading Python dependencies..."
"$PYTHON_EXE" -m pip install --upgrade pip
"$PYTHON_EXE" -m pip install -r "$AI_DIR/requirements.txt"
echo "✓ Python AI Service setup complete."
echo ""

# 2. Java Backend Setup
echo "[2/3] Setting up Spring Boot Java Backend (backend/)..."
BACKEND_DIR="$ROOT_DIR/backend"
cd "$BACKEND_DIR"
echo "Building Maven backend dependencies..."
mvn clean test-compile
echo "✓ Java Backend setup complete."
echo ""

# 3. React Frontend Setup
echo "[3/3] Setting up React Frontend (frontend/)..."
FRONTEND_DIR="$ROOT_DIR/frontend"
cd "$FRONTEND_DIR"
echo "Installing npm dependencies in $FRONTEND_DIR..."
npm install
echo "✓ React Frontend setup complete."
echo ""

echo "=================================================="
echo "   Canary Environment Setup Completed Successfully!"
echo "=================================================="
