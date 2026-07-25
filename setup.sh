#!/usr/bin/env bash
# Canary - Linux / macOS Environment Setup Script

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}      Canary Environment Setup          ${NC}"
echo -e "${CYAN}========================================${NC}"

check_cmd() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}[ERROR] $2 is not installed or not in PATH.${NC}"
        return 1
    else
        echo -e "${GREEN}[OK] $2 detected.${NC}"
        return 0
    fi
}

echo -e "\n${YELLOW}Step 1: Checking Prerequisites...${NC}"
PREREQS_OK=true
check_cmd "python3" "Python 3" || PREREQS_OK=false
check_cmd "node" "Node.js" || PREREQS_OK=false
check_cmd "npm" "npm" || PREREQS_OK=false
check_cmd "java" "Java (JDK)" || PREREQS_OK=false
check_cmd "mvn" "Maven" || PREREQS_OK=false
check_cmd "ollama" "Ollama" || PREREQS_OK=false

if [ "$PREREQS_OK" = false ]; then
    echo -e "\n${RED}[ERROR] Missing prerequisites. Please install missing tools and re-run setup.sh.${NC}"
    exit 1
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Step 2: Set up Python Virtual Environment
echo -e "\n${YELLOW}Step 2: Setting up Python AI Service Virtual Environment...${NC}"
VENV_DIR="$SCRIPT_DIR/ai/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${CYAN}Creating Python virtualenv at $VENV_DIR...${NC}"
    python3 -m venv "$VENV_DIR"
else
    echo -e "${GREEN}Python virtualenv already exists at $VENV_DIR.${NC}"
fi

VENV_PYTHON="$VENV_DIR/bin/python"
echo -e "${CYAN}Upgrading pip and installing Python dependencies...${NC}"
"$VENV_PYTHON" -m pip install --upgrade pip
"$VENV_PYTHON" -m pip install -r "$SCRIPT_DIR/ai/requirements.txt"
echo -e "${GREEN}[OK] Python environment configured successfully.${NC}"

# Step 3: Set up React Frontend Dependencies
echo -e "\n${YELLOW}Step 3: Setting up React Frontend Dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"
npm install
echo -e "${GREEN}[OK] Frontend dependencies installed successfully.${NC}"
cd "$SCRIPT_DIR"

# Step 4: Compile Java Backend
echo -e "\n${YELLOW}Step 4: Compiling Spring Boot Java Backend...${NC}"
mvn test-compile
echo -e "${GREEN}[OK] Java backend compiled successfully.${NC}"

# Step 5: Initialize Ollama Models
echo -e "\n${YELLOW}Step 5: Checking Ollama Service and Models...${NC}"
if curl -s http://localhost:11434/api/tags > /dev/null; then
    EXISTING_MODELS=$(curl -s http://localhost:11434/api/tags)
    
    if ! echo "$EXISTING_MODELS" | grep -q "nomic-embed-text"; then
        echo -e "${CYAN}Pulling default embedding model: nomic-embed-text...${NC}"
        ollama pull nomic-embed-text
    else
        echo -e "${GREEN}[OK] Embedding model (nomic-embed-text) is present.${NC}"
    fi

    if ! echo "$EXISTING_MODELS" | grep -q "qwen2.5:3b" && ! echo "$EXISTING_MODELS" | grep -q "qwen3"; then
        echo -e "${CYAN}Pulling default chat language model: qwen2.5:3b...${NC}"
        ollama pull qwen2.5:3b
    else
        echo -e "${GREEN}[OK] Chat language model is present.${NC}"
    fi
else
    echo -e "${YELLOW}[WARNING] Ollama service not responding at http://localhost:11434. Please start Ollama service manually.${NC}"
fi

echo -e "\n${CYAN}========================================${NC}"
echo -e "${GREEN} Canary Environment Setup Complete!     ${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "To start Canary services:"
echo -e "  - Python AI Service:  cd ai && source .venv/bin/activate && uvicorn main:app --reload --port 8000"
echo -e "  - Java Backend:       mvn spring-boot:run"
echo -e "  - React Frontend:     cd frontend && npm run dev"
