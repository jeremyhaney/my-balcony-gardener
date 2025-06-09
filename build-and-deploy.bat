@echo off
setlocal enabledelayedexpansion
title My Balcony Gardener: Development Setup

:: Change to script directory
cd /d "%~dp0"

:: Kill any running processes
echo Stopping any running processes...
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

:: Start Vite dev server in a new window
echo Starting Vite development server...
start "Vite Dev Server" cmd /k "cd /d "%CD%" && npm run dev"

echo Waiting for Vite dev server to start (5 seconds)...
timeout /t 5 /nobreak >nul

:: Verify the dev server is running
echo Verifying Vite dev server is running...
curl -s -o nul -w "%%{http_code}" http://localhost:5173 | find "200" >nul
if errorlevel 1 (
    echo Error: Vite dev server is not responding on port 5173
    pause
    exit /b 1
)

:: Start Cloudflare tunnel using the config file from project root
echo Starting Cloudflare tunnel...
start "Cloudflare Tunnel" cmd /k "cd /d "%CD%\.." && cloudflared tunnel --config "%CD%\..\cloudflare-config.yml" run"

echo.
echo ===================================================
echo Development environment is ready!
echo Local:      http://localhost:5173
echo Cloudflare: https://mybalconygardener.boileragency.com
echo ===================================================
echo.
pause
