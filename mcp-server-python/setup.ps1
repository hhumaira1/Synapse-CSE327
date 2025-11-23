# Python MCP Server Setup Script
# Automates virtual environment creation and dependency installation

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Synapse CRM - MCP Server Setup (Python)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Python 3.11+ from https://python.org" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found: $pythonVersion" -ForegroundColor Green

# Extract version number and validate
$versionMatch = $pythonVersion -match "Python (\d+)\.(\d+)"
if ($versionMatch) {
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    
    if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 11)) {
        Write-Host "❌ Python 3.11+ is required (found $major.$minor)" -ForegroundColor Red
        exit 1
    }
}

# Create virtual environment
Write-Host ""
Write-Host "Creating virtual environment..." -ForegroundColor Yellow

if (Test-Path "venv") {
    Write-Host "⚠️  Virtual environment already exists. Removing old version..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "venv"
}

python -m venv venv

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create virtual environment!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Virtual environment created" -ForegroundColor Green

# Activate virtual environment
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Yellow

# Try to activate (this sets environment variables in current session)
& ".\venv\Scripts\Activate.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Activation failed (may need to run: Set-ExecutionPolicy RemoteSigned)" -ForegroundColor Yellow
    Write-Host "Continuing anyway..." -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "Packages: mcp, httpx, python-dotenv, orjson" -ForegroundColor Gray

& ".\venv\Scripts\pip.exe" install -r requirements.txt --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All dependencies installed" -ForegroundColor Green

# Setup .env file
Write-Host ""
Write-Host "Setting up configuration..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host "   Please review settings in .env before running server" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  .env file already exists (keeping existing configuration)" -ForegroundColor Yellow
}

# Verify NestJS backend is running
Write-Host ""
Write-Host "Checking NestJS backend..." -ForegroundColor Yellow

try {
    $backendUrl = "http://localhost:3001/api"
    $response = Invoke-WebRequest -Uri $backendUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is running at $backendUrl" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend is not running at http://localhost:3001" -ForegroundColor Yellow
    Write-Host "   Start it with: cd ..\server; npm run start:dev" -ForegroundColor Yellow
}

# Final instructions
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Activate virtual environment:" -ForegroundColor White
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Review configuration:" -ForegroundColor White
Write-Host "   notepad .env" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start MCP server:" -ForegroundColor White
Write-Host "   python server.py" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test with Gemini CLI:" -ForegroundColor White
Write-Host "   gemini mcp list" -ForegroundColor Gray
Write-Host "   gemini chat 'Sign in as admin@yourcrm.com password test123'" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation: README.md" -ForegroundColor Yellow
Write-Host ""
