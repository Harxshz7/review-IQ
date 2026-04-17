# ReviewIQ - Start Backend and Frontend on Windows (PowerShell)
# Usage: .\start.ps1

Write-Host "🚀 Starting ReviewIQ..." -ForegroundColor Cyan
Write-Host ""

# Check if backend venv exists
if (-not (Test-Path "backend\venv")) {
    Write-Host "⚠️  Backend virtual environment not found. Creating..." -ForegroundColor Yellow
    Set-Location backend
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    Set-Location ..
}

# Check if frontend node_modules exists
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "⚠️  Frontend node_modules not found. Installing..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host "📦 Starting Backend (FastAPI)..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    & .\venv\Scripts\Activate.ps1
    python main.py
}

# Wait for backend to start
Start-Sleep -Seconds 2

Write-Host "🎨 Starting Frontend (Vite)..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npm run dev
}

Write-Host ""
Write-Host "✅ ReviewIQ is running!" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000"
Write-Host "   Frontend: http://localhost:5173"
Write-Host ""
Write-Host "Press Ctrl+C to stop both services" -ForegroundColor Yellow
Write-Host ""

# Keep the script running and show output
try {
    while ($true) {
        Receive-Job $backendJob -ErrorAction SilentlyContinue
        Receive-Job $frontendJob -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
}
finally {
    Write-Host "`n🛑 Shutting down ReviewIQ..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
}
