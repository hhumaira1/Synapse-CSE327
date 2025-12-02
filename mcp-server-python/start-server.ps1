# Start MCP Server for SynapseCRM Chatbot
# Run this script to start the Model Context Protocol server

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "🚀 Starting SynapseCRM MCP Server..." -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (!(Test-Path "venv")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    
    Write-Host "✅ Setup complete!" -ForegroundColor Green
    Write-Host ""
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Check if .env exists
if (!(Test-Path ".env")) {
    Write-Host "⚠️  No .env file found. Creating from template..." -ForegroundColor Yellow
    @"
# Backend API URL
BACKEND_URL=http://localhost:3001
BACKEND_API_PREFIX=/api

# HTTP server port
MCP_HTTP_PORT=5000

# Logging
LOG_LEVEL=INFO
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ Created .env file. Please verify settings." -ForegroundColor Green
    Write-Host ""
}

Write-Host "Starting MCP Server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start the server
python server_unified.py
