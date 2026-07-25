# Canary Diagnostic Health Check Script (Windows PowerShell)
# Pings Ollama, Python AI Service, and Spring Boot Java Backend

$ErrorActionPreference = "Continue"

$OllamaUrl = "http://localhost:11434/api/tags"
$AiUrl = "http://localhost:8000/health"
$BackendUrl = "http://localhost:8080/api/v1/health"

$FailedCount = 0

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "         Canary Services Diagnostic Check         " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Ollama Service
Write-Host "[1/3] Checking Ollama Service ($OllamaUrl)..." -NoNewline
try {
    $resp = Invoke-RestMethod -Uri $OllamaUrl -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host " [PASS]" -ForegroundColor Green
    if ($resp.models) {
        $modelNames = ($resp.models | ForEach-Object { $_.name }) -join ", "
        Write-Host "      Installed Models: $modelNames" -ForegroundColor Gray
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "      Error: Ollama is not running on port 11434. Start Ollama with 'ollama serve'." -ForegroundColor Red
    $FailedCount++
}

# 2. Check Python AI Service
Write-Host "[2/3] Checking Python AI Service ($AiUrl)..." -NoNewline
try {
    $resp = Invoke-RestMethod -Uri $AiUrl -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host " [PASS]" -ForegroundColor Green
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "      Error: Python AI Service is not running on port 8000." -ForegroundColor Red
    $FailedCount++
}

# 3. Check Spring Boot Backend Service
Write-Host "[3/3] Checking Spring Boot Backend ($BackendUrl)..." -NoNewline
try {
    $resp = Invoke-RestMethod -Uri $BackendUrl -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host " [PASS]" -ForegroundColor Green
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "      Error: Spring Boot Backend is not running on port 8080." -ForegroundColor Red
    $FailedCount++
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan

if ($FailedCount -gt 0) {
    Write-Host " Health Check Failed: $FailedCount service(s) offline." -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host " All Canary Services are Online and Healthy!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Cyan
    exit 0
}
