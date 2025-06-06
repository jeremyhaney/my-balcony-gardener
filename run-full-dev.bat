@echo off
setlocal enabledelayedexpansion
title My Balcony Gardener: Development Environment

echo ====================================================
echo  My Balcony Gardener - Development Environment
echo  Version 1.0.0
echo ====================================================
echo.

:: Check if in project root
if not exist "mbg_dashboard" (
    echo Error: 'mbg_dashboard' directory not found.
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

:: Check for required environment file
echo [1/3] Checking environment...
if not exist "mbg_dashboard\.env.local" (
    echo Error: .env.local file not found in mbg_dashboard directory.
    echo Please create it from .env.example and set the required variables.
    pause
    exit /b 1
)

:: Verify required variables are set in .env.local
findstr /i "VITE_SUPABASE_URL" "mbg_dashboard\.env.local" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: VITE_SUPABASE_URL is not set in .env.local file
    pause
    exit /b 1
)

findstr /i "VITE_SUPABASE_ANON_KEY" "mbg_dashboard\.env.local" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: VITE_SUPABASE_ANON_KEY is not set in .env.local file
    pause
    exit /b 1
)

:: Start Vite frontend dev server
echo [2/3] Starting Vite development server...
start "MBG Frontend" cmd /k "cd /d "%CD%\mbg_dashboard" && npm run dev"

:: Wait for Vite to start
timeout /t 5 /nobreak >nul

:: Start Cloudflare tunnel with explicit configuration
echo [3/3] Starting Cloudflare tunnel...
start "Cloudflare Tunnel" cmd /k "cd /d "%CD%" && cloudflared tunnel --url http://localhost:5173 run a97e498f-60a8-47f5-b03d-da43dfc488e0"

echo.
echo ====================================================
echo  Development environment is running!
echo  Local:      http://localhost:5173
echo  Network:    Check the Cloudflare tunnel window for public URL
echo.
echo  Press any key to stop all services...
echo ====================================================

pause >nul

:: Cleanup
echo.
echo Stopping all services...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Cloudflare Tunnel*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Vite*" >nul 2>&1

echo All services have been stopped.
pause
