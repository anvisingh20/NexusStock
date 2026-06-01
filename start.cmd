@echo off
title NexusStock Suite Launcher
echo ==========================================================
echo           NexusStock Self-Contained Server Launcher
echo ==========================================================
echo.
cd /d "%~dp0"

:: 1. Add portable Node to PATH for this launcher session
set "PATH=%~dp0runtimes\node;%PATH%"

:: 2. Launch Backend Server in a new window
echo [..] Spawning FastAPI backend server on port 8000...
start "NexusStock Backend API" cmd /c "cd backend && ..\runtimes\python_nuget\tools\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

:: 3. Give backend 2 seconds to initialize
ping 127.0.0.1 -n 3 > nul

:: 4. Launch Frontend Server in a new window
echo [..] Spawning React frontend server on port 3000...
start "NexusStock Frontend UI" cmd /c "cd frontend && npm run dev"

echo.
echo ==========================================================
echo SUCCESS: BOTH SYSTEMS ARE LAUNCHED & RUNNING ACTIVE!
echo.
echo   -> Frontend UI:   http://localhost:3000
echo   -> API Swagger:   http://localhost:8000/docs
echo ==========================================================
echo.
echo You can close this loader window. The backend and frontend
echo consoles will remain active in your taskbar.
echo.
pause
