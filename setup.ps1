# Canary - Windows Environment Setup Script

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      Canary Environment Setup          " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

function Check-Command($cmd, $name) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] $name is not installed or not in PATH." -ForegroundColor Red
        return $false
    }
    Write-Host "[OK] $name detected." -ForegroundColor Green
    return $true
}

Write-Host "`nStep 1: Checking Prerequisites..." -ForegroundColor Yellow
$prereqsOk = $true
$prereqsOk = (Check-Command "python" "Python") -and $prereqsOk
$prereqsOk = (Check-Command "node" "Node.js") -and $prereqsOk
$prereqsOk = (Check-Command "npm" "npm") -and $prereqsOk
$prereqsOk = (Check-Command "java" "Java (JDK)") -and $prereqsOk
$prereqsOk = (Check-Command "mvn" "Maven") -and $prereqsOk
$prereqsOk = (Check-Command "ollama" "Ollama") -and $prereqsOk

if (-not $prereqsOk) {
    Write-Host "`n[ERROR] Missing prerequisites. Please install the missing tools and re-run setup.ps1." -ForegroundColor Red
    exit 1
}

# Step 2: Set up Python Virtual Environment
Write-Host "`nStep 2: Setting up Python AI Service Virtual Environment..." -ForegroundColor Yellow
$venvPath = Join-Path $PSScriptRoot "ai\.venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "Creating Python virtualenv at $venvPath..." -ForegroundColor Cyan
    python -m venv $venvPath
} else {
    Write-Host "Python virtualenv already exists at $venvPath." -ForegroundColor Green
}

$venvPython = Join-Path $venvPath "Scripts\python.exe"
Write-Host "Upgrading pip and installing Python dependencies..." -ForegroundColor Cyan
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $PSScriptRoot "ai\requirements.txt")
Write-Host "[OK] Python environment configured successfully." -ForegroundColor Green

# Step 3: Set up React Frontend Dependencies
Write-Host "`nStep 3: Setting up React Frontend Dependencies..." -ForegroundColor Yellow
Push-Location (Join-Path $PSScriptRoot "frontend")
try {
    npm install
    Write-Host "[OK] Frontend dependencies installed successfully." -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 4: Compile Java Backend
Write-Host "`nStep 4: Compiling Spring Boot Java Backend..." -ForegroundColor Yellow
mvn test-compile
Write-Host "[OK] Java backend compiled successfully." -ForegroundColor Green

# Step 5: Initialize Ollama Models
Write-Host "`nStep 5: Checking Ollama Service and Models..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -ErrorAction Stop
    $existingModels = $response.models | ForEach-Object { $_.name }

    $defaultEmbed = "nomic-embed-text"
    $defaultLlm = "qwen2.5:3b"

    if (-not ($existingModels -like "*$defaultEmbed*")) {
        Write-Host "Pulling default embedding model: $defaultEmbed..." -ForegroundColor Cyan
        ollama pull $defaultEmbed
    } else {
        Write-Host "[OK] Embedding model ($defaultEmbed) is present." -ForegroundColor Green
    }

    if (-not ($existingModels -like "*$defaultLlm*") -and -not ($existingModels -like "*qwen3*")) {
        Write-Host "Pulling default chat language model: $defaultLlm..." -ForegroundColor Cyan
        ollama pull $defaultLlm
    } else {
        Write-Host "[OK] Chat language model is present." -ForegroundColor Green
    }
} catch {
    Write-Host "[WARNING] Ollama service not responding at http://localhost:11434. Please start Ollama service manually." -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Canary Environment Setup Complete!     " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "To start Canary services:"
Write-Host "  - Python AI Service:  cd ai; .\.venv\Scripts\uvicorn main:app --reload --port 8000"
Write-Host "  - Java Backend:       mvn spring-boot:run"
Write-Host "  - React Frontend:     cd frontend; npm run dev"
