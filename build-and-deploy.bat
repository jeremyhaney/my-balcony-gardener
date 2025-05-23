@echo off
title My Balcony Gardener: Production Build + Deploy
echo ====================================================
echo  Building and Deploying Production Site for MBG
echo ====================================================
echo.

:: Step 1 - Build React frontend
echo [1/5] Building React app...
cd "mbg_dashboard"
call npm run build
cd ..

:: Step 2 - Clean backend public folder
echo [2/5] Cleaning backend/public folder...
rmdir /s /q "backend\public"
mkdir "backend\public"

:: Step 3 - Copy build output to backend/public
echo [3/5] Copying built files to backend/public...
xcopy /E /I /Y "mbg_dashboard\dist\*" "backend\public"

:: Step 4 - Kill any previous node processes on port 3001 (optional clean-up)
echo [4/5] Killing any process on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: Step 5 - Start backend and Cloudflare tunnel
echo [5/5] Starting backend and tunnel...
start "MBG Backend (Production)" cmd /k "cd backend && node index.js"
timeout /t 2 /nobreak >nul
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel run a97e498f-60a8-47f5-b03d-da43dfc488e0"

echo.
echo ✅ Production site deployed!
echo    https://mybalconygardener.boileragency.com
echo.
pause
