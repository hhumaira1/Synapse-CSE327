#!/usr/bin/env pwsh
# Quick Start Script for SynapseCRM with MCP Chatbot
# Run this script to start all services in order

param(
    [switch]$SkipBackend,
    [switch]$SkipMCP,
    [switch]$Help
)

if ($Help) {
    Write-Host "SynapseCRM Quick Start" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\quick-start.ps1 [-SkipBackend] [-SkipMCP]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -SkipBackend   Skip starting the backend server"
    Write-Host "  -SkipMCP       Skip starting the MCP server"
    Write-Host "  -Help          Show this help message"
    Write-Host ""
    Write-Host "Example: .\quick-start.ps1             # Start all services"
    Write-Host "         .\quick-start.ps1 -SkipBackend  # Only start MCP + Frontend"
    exit
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       SynapseCRM Quick Start with MCP Chatbot         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Step 1: Start Backend (NestJS)
if (!$SkipBackend) {
    Write-Host "🔧 Step 1: Starting Backend Server (NestJS)..." -ForegroundColor Green
    
    if (Test-Port 3001) {
        Write-Host "   ✅ Backend already running on port 3001" -ForegroundColor Yellow
    } else {
        Write-Host "   Starting backend on port 3001..." -ForegroundColor Gray
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run start:dev"
        Write-Host "   ⏳ Waiting for backend to start..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
        
        if (Test-Port 3001) {
            Write-Host "   ✅ Backend started successfully" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Backend might still be starting..." -ForegroundColor Yellow
        }
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping backend server" -ForegroundColor Yellow
    Write-Host ""
}

# Step 2: Start MCP Server (Python)
if (!$SkipMCP) {
    Write-Host "🐍 Step 2: Starting MCP Server (Python)..." -ForegroundColor Green
    
    if (Test-Port 5000) {
        Write-Host "   ✅ MCP server already running on port 5000" -ForegroundColor Yellow
    } else {
        Write-Host "   Starting MCP server on port 5000..." -ForegroundColor Gray
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd mcp-server-python; .\start-server.ps1"
        Write-Host "   ⏳ Waiting for MCP server to start..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
        
        if (Test-Port 5000) {
            Write-Host "   ✅ MCP server started successfully" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  MCP server might still be starting..." -ForegroundColor Yellow
        }
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping MCP server" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Start Frontend (Next.js)
Write-Host "⚛️  Step 3: Starting Frontend (Next.js)..." -ForegroundColor Green

if (Test-Port 3000) {
    Write-Host "   ✅ Frontend already running on port 3000" -ForegroundColor Yellow
} else {
    Write-Host "   Starting frontend on port 3000..." -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Frontend; npm run dev"
    Write-Host "   ⏳ Waiting for frontend to start..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    if (Test-Port 3000) {
        Write-Host "   ✅ Frontend started successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Frontend might still be starting..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  🚀 All Services Started!              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📍 Services:" -ForegroundColor Cyan
Write-Host "   • Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "   • Backend:     http://localhost:3001" -ForegroundColor White
Write-Host "   • MCP Server:  http://localhost:5000" -ForegroundColor White
Write-Host ""

Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "   2. Login to your account" -ForegroundColor White
Write-Host "   3. Click the chatbot icon (bottom-right)" -ForegroundColor White
Write-Host "   4. Try: 'Show all my contacts'" -ForegroundColor White
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   • Frontend/CHATBOT_MCP_SETUP.md - Full integration guide" -ForegroundColor White
Write-Host "   • MCP_INTEGRATION_COMPLETE.md - Summary of changes" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to open browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✅ Done! Check the new terminal windows for service logs." -ForegroundColor Green
Write-Host ""
