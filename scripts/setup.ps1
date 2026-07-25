# Canary Environment Setup Script (Windows PowerShell)
# Automatically sets up dependencies for Python AI Service, Java Backend, and React Frontend

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path "$PSScriptRoot\.."

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "       Canary Automated Environment Setup         " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Root Directory: $RootDir" -ForegroundColor Gray
Write-Host ""

# 1. Python AI Service Setup
Write-Host "[1/3] Setting up Python AI Service (ai/)..." -ForegroundColor Yellow
$AiDir = Join-Path $RootDir "ai"
$VenvDir = Join-Path $AiDir ".venv"
$PythonExe = Join-Path $VenvDir "Scripts\python.exe"
$ReqFile = Join-Path $AiDir "requirements.txt"

if (-not (Test-Path $VenvDir)) {
    Write-Host "Creating Python virtual environment in $VenvDir..." -ForegroundColor Gray
    python -m venv $VenvDir
} else {
    Write-Host "Python virtual environment already exists in $VenvDir." -ForegroundColor Gray
}

Write-Host "Installing/upgrading Python dependencies..." -ForegroundColor Gray
& $PythonExe -m pip install --upgrade pip
& $PythonExe -m pip install -r $ReqFile
Write-Host "[OK] Python AI Service setup complete." -ForegroundColor Green
Write-Host ""

# 2. Java Backend Setup
Write-Host "[2/3] Setting up Spring Boot Java Backend (backend/)..." -ForegroundColor Yellow
$BackendDir = Join-Path $RootDir "backend"
Set-Location $BackendDir
Write-Host "Building Maven backend dependencies..." -ForegroundColor Gray
mvn test-compile
Set-Location $RootDir
Write-Host "[OK] Java Backend setup complete." -ForegroundColor Green
Write-Host ""

# 3. React Frontend Setup
Write-Host "[3/3] Setting up React Frontend (frontend/)..." -ForegroundColor Yellow
$FrontendDir = Join-Path $RootDir "frontend"
Set-Location $FrontendDir
Write-Host "Installing npm dependencies in $FrontendDir..." -ForegroundColor Gray
npm install
Set-Location $RootDir
Write-Host "[OK] React Frontend setup complete." -ForegroundColor Green
Write-Host ""

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Canary Environment Setup Completed Successfully!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
