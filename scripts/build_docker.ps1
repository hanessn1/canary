# Canary Docker Build Script (PowerShell)

$ProjectRoot = Resolve-Path "$PSScriptRoot\.."

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Building Canary Docker Container Images..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Build AI Image
Write-Host "[1/3] Building hanessn/canary-ai:latest..." -ForegroundColor Yellow
docker build -t hanessn/canary-ai:latest -f "$ProjectRoot\ai\Dockerfile" "$ProjectRoot"

# Build Backend Image
Write-Host "[2/3] Building hanessn/canary-backend:latest..." -ForegroundColor Yellow
docker build -t hanessn/canary-backend:latest -f "$ProjectRoot\backend\Dockerfile" "$ProjectRoot"

# Build Frontend Image
Write-Host "[3/3] Building hanessn/canary-frontend:latest..." -ForegroundColor Yellow
docker build -t hanessn/canary-frontend:latest -f "$ProjectRoot\frontend\Dockerfile" "$ProjectRoot"

Write-Host "`nAll Docker images built successfully!" -ForegroundColor Green
Write-Host "Run 'docker compose up -d' to start the stack." -ForegroundColor Green
