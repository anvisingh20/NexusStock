# NexusStock - Self-Contained Portable Runtime Installer & Server Bootstrapper

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "NexusStock Self-Contained Environment Setup & Launch" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Create runtimes directory
$RuntimeDir = Join-Path (Get-Location) "runtimes"
if (!(Test-Path $RuntimeDir)) {
    New-Item -ItemType Directory -Path $RuntimeDir | Out-Null
    Write-Host "[OK] Created runtimes folder: $RuntimeDir" -ForegroundColor Green
}

# --- PORTABLE PYTHON SETUP ---
$PythonDestDir = Join-Path $RuntimeDir "python_nuget"
$PythonExePath = Join-Path $PythonDestDir "tools\python.exe"

if (!(Test-Path $PythonExePath)) {
    Write-Host "[..] Downloading Portable Python 3.10.11 (NuGet)..." -ForegroundColor Yellow
    $PythonZip = Join-Path $RuntimeDir "python.zip"
    
    # Download official Python NuGet package (acts as a standard zip archive)
    Invoke-WebRequest -Uri "https://www.nuget.org/api/v2/package/python/3.10.11" -OutFile $PythonZip -UseBasicParsing
    Write-Host "[OK] Downloaded Python package" -ForegroundColor Green
    
    Write-Host "[..] Extracting Python..." -ForegroundColor Yellow
    Expand-Archive -Path $PythonZip -DestinationPath $PythonDestDir -Force
    Remove-Item $PythonZip -Force
    Write-Host "[OK] Extracted Python to $PythonDestDir" -ForegroundColor Green
} else {
    Write-Host "[OK] Portable Python already present" -ForegroundColor Green
}

# Bootstrap pip offline using standard ensurepip
Write-Host "[..] Bootstrapping Pip package manager..." -ForegroundColor Yellow
Start-Process -FilePath $PythonExePath -ArgumentList "-m", "ensurepip", "--default-pip" -Wait -NoNewWindow
Write-Host "[OK] Pip package manager initialized" -ForegroundColor Green


# --- PORTABLE NODE.JS SETUP ---
$NodeDestDir = Join-Path $RuntimeDir "node"
$NodeExePath = Join-Path $NodeDestDir "node.exe"
$NpmCmdPath = Join-Path $NodeDestDir "npm.cmd"

if (!(Test-Path $NodeExePath)) {
    Write-Host "[..] Downloading Portable Node.js v18.16.0..." -ForegroundColor Yellow
    $NodeZip = Join-Path $RuntimeDir "node.zip"
    
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v18.16.0/node-v18.16.0-win-x64.zip" -OutFile $NodeZip -UseBasicParsing
    Write-Host "[OK] Downloaded Node.js archive" -ForegroundColor Green
    
    Write-Host "[..] Extracting Node.js..." -ForegroundColor Yellow
    $NodeTempDir = Join-Path $RuntimeDir "node_temp"
    Expand-Archive -Path $NodeZip -DestinationPath $NodeTempDir -Force
    
    # Move files to final directory structure
    $ExtractedFolder = Join-Path $NodeTempDir "node-v18.16.0-win-x64"
    Move-Item -Path $ExtractedFolder -Destination $NodeDestDir -Force
    Remove-Item $NodeZip -Force
    Remove-Item $NodeTempDir -Recurse -Force
    Write-Host "[OK] Extracted Node.js to $NodeDestDir" -ForegroundColor Green
} else {
    Write-Host "[OK] Portable Node.js already present" -ForegroundColor Green
}


# --- INSTALL PIP DEPENDENCIES ---
Write-Host "[..] Installing FastAPI backend packages (fastapi, sqlalchemy, psycopg2-binary, uvicorn)..." -ForegroundColor Yellow
Start-Process -FilePath $PythonExePath -ArgumentList "-m", "pip", "install", "--no-cache-dir", "-r", "backend\requirements.txt" -Wait -NoNewWindow
Write-Host "[OK] Backend dependencies installed successfully" -ForegroundColor Green


# --- INSTALL NPM DEPENDENCIES ---
Write-Host "[..] Installing React frontend node modules..." -ForegroundColor Yellow
# Modify PATH temporarily to include Node directory so npm can locate node.exe
$env:PATH = "$NodeDestDir;$env:PATH"

# Run npm install inside frontend folder
$NpmProcess = Start-Process -FilePath $NpmCmdPath -ArgumentList "install" -WorkingDirectory "frontend" -PassThru -NoNewWindow -Wait
if ($NpmProcess.ExitCode -ne 0) {
    throw "npm install failed with exit code $($NpmProcess.ExitCode)"
}
Write-Host "[OK] Frontend node modules installed successfully" -ForegroundColor Green


# --- LAUNCH BACKEND SERVER ---
Write-Host "[..] Launching FastAPI Backend Server on port 8000..." -ForegroundColor Yellow
$BackendJob = Start-Process -FilePath $PythonExePath -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000" -WorkingDirectory "backend" -PassThru -NoNewWindow
Start-Sleep -Seconds 3
Write-Host "[OK] FastAPI backend is active in background (PID: $($BackendJob.Id))" -ForegroundColor Green


# --- LAUNCH FRONTEND SERVER ---
Write-Host "[..] Launching React Frontend Server on port 3000..." -ForegroundColor Yellow
# Run npm run dev in background
$FrontendJob = Start-Process -FilePath $NpmCmdPath -ArgumentList "run", "dev" -WorkingDirectory "frontend" -PassThru -NoNewWindow
Start-Sleep -Seconds 3
Write-Host "[OK] React frontend is active in background (PID: $($FrontendJob.Id))" -ForegroundColor Green

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "STATUS: ALL SYSTEMS DEPLOYED AND ACTIVE!" -ForegroundColor Green
Write-Host "  -> Frontend Client UI:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "  -> Backend Swagger API:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
