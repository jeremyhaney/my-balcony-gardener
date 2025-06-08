@echo off
setlocal enabledelayedexpansion
title My Balcony Gardener: Build and Deploy

:: Change to script directory
cd /d "%~dp0"

:: Kill any running processes
taskkill /f /im node.exe >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Cloudflare Tunnel*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq MBG Frontend*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Vite*" >nul 2>&1
timeout /t 2 /nobreak >nul

:: Check if in project root
if not exist "mbg_dashboard" (
    echo Error: 'mbg_dashboard' directory not found in %CD%
    pause
    exit /b 1
)

:: Install dependencies
echo Installing dependencies...
cd mbg_dashboard
call npm ci
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

:: Build the project
echo Building the project...
call npm run build
if errorlevel 1 (
    echo Error: Build failed
    pause
    exit /b 1
)

:: Start Vite preview server on port 5173 for consistency
echo Starting Vite preview server on port 5173...
start "Vite Preview" cmd /k "npm run preview -- --port 5173"

echo Waiting for Vite preview server to start (10 seconds)...
timeout /t 10 /nobreak >nul

:: Verify the preview server is running
echo Verifying Vite preview server is running...
curl -s -o nul -w "%%{http_code}" http://localhost:5173 | find "200" >nul
if errorlevel 1 (
    echo Error: Vite preview server is not responding on port 5173
    pause
    exit /b 1
)

:: Start Cloudflare tunnel
echo Starting Cloudflare tunnel...
start "Cloudflare Tunnel" cmd /k "cd /d "%CD%\.." && cloudflared tunnel --url http://localhost:5173 run a97e498f-60a8-47f5-b03d-da43dfc488e0"

echo.
echo Build and deployment complete!
echo Vite preview: http://localhost:5173
echo Cloudflare tunnel should open in a new window
echo.
pause
