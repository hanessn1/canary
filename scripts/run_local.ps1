# Canary Local Development Launcher (PowerShell)
# Launches AI Service, Spring Boot Backend, and React Frontend in separate CMD windows (auto-closing upon exit)

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Starting Canary Platform Services..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Start Python AI Service
Write-Host "[1/3] Starting AI Service on http://localhost:8000..." -ForegroundColor Yellow
$AiVenv = Join-Path $ProjectRoot "ai\.venv\Scripts\python.exe"
if (Test-Path $AiVenv) {
    Start-Process cmd.exe -ArgumentList "/c title Canary AI Service && cd /d `"$ProjectRoot\ai`" && `"$AiVenv`" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
} else {
    Start-Process cmd.exe -ArgumentList "/c title Canary AI Service && cd /d `"$ProjectRoot\ai`" && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
}

# 2. Start Java Spring Boot Backend
Write-Host "[2/3] Starting Spring Boot Backend on http://localhost:8080..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/c title Canary Backend API && cd /d `"$ProjectRoot\backend`" && mvn spring-boot:run"

# 3. Start React Frontend
Write-Host "[3/3] Starting React Web UI on http://localhost:5173..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/c title Canary Web UI && cd /d `"$ProjectRoot\frontend`" && npm run dev"

Write-Host "`nAll services launched in separate CMD windows!" -ForegroundColor Green
Write-Host "Access Web UI (Dev Server): http://localhost:5173" -ForegroundColor Green
Write-Host "(Closing/stopping a service will automatically close its CMD window)" -ForegroundColor DarkGray
