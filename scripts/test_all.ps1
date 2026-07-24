# Canary Test Runner Script (PowerShell)

$ProjectRoot = Resolve-Path "$PSScriptRoot\.."

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Running Canary Suite Tests..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Run Pytest in AI Service
Write-Host "[1/3] Running Python Pytest Suite..." -ForegroundColor Yellow
$AiVenv = Join-Path $ProjectRoot "ai\.venv\Scripts\python.exe"
if (Test-Path $AiVenv) {
    & $AiVenv -m pytest "$ProjectRoot\ai"
} else {
    pytest "$ProjectRoot\ai"
}

if ($LASTEXITCODE -ne 0) { Write-Host "Python tests failed!" -ForegroundColor Red; exit 1 }

# 2. Run Maven Test in Backend
Write-Host "`n[2/3] Running Java Spring Boot Test Suite..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\backend"
mvn clean test
if ($LASTEXITCODE -ne 0) { Write-Host "Java tests failed!" -ForegroundColor Red; exit 1 }

# 3. Build Frontend Verification
Write-Host "`n[3/3] Running Frontend Production Build Verification..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend build failed!" -ForegroundColor Red; exit 1 }

Set-Location "$ProjectRoot"
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " ALL TEST SUITES PASSED CLEANLY!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
