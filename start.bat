@echo off
REM ReviewIQ - Start Backend and Frontend on Windows
REM Usage: start.bat

setlocal enabledelayedexpansion

echo [92m🚀 Starting ReviewIQ... [0m
echo.

REM Check if backend venv exists
if not exist "backend\venv" (
    echo [93m⚠️  Backend virtual environment not found. Creating...[0m
    cd backend
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
)

REM Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo [93m⚠️  Frontend node_modules not found. Installing...[0m
    cd frontend
    npm install
    cd ..
)

echo [92m📦 Starting Backend (FastAPI)...[0m
cd backend
call venv\Scripts\activate.bat
start "ReviewIQ Backend" cmd /k "python main.py"
cd ..

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

echo [92m🎨 Starting Frontend (Vite)...[0m
cd frontend
start "ReviewIQ Frontend" cmd /k "npm run dev"
cd ..

echo.
echo [94m✅ ReviewIQ is running![0m
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:5173
echo.
echo [93mClose both CMD windows to stop the services[0m
echo.
pause
