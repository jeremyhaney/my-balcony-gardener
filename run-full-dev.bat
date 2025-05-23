@echo off
title My Balcony Gardener: Full Dev Stack
echo ====================================================
echo  Starting FULL DEVELOPMENT STACK for MBG
echo ====================================================
echo.

:: Start backend
echo [1/3] Starting backend server...
start "MBG Backend" cmd /k "cd backend && node index.js"

:: Wait a moment to let backend spin up
timeout /t 2 /nobreak >nul

:: Start Vite frontend dev server
echo [2/3] Starting frontend (Vite) dev server...
start "MBG Frontend" cmd /k "cd mbg_dashboard && run-dev.bat"

:: Wait before tunnel (ensures localhost is ready)
timeout /t 2 /nobreak >nul

:: Start Cloudflare tunnel
echo [3/3] Starting Cloudflare tunnel...
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel run a97e498f-60a8-47f5-b03d-da43dfc488e0"

echo.
echo ✅ All services launched. You may now access:
echo    Local Frontend: http://localhost:5173
echo    Public Website: https://mybalconygardener.boileragency.com
echo.
pause
