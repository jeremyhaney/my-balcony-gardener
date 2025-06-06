@echo off
setlocal enabledelayedexpansion
title My Balcony Gardener: Build and Deploy v1.0.0

echo ====================================================
echo  My Balcony Gardener - Build and Deploy
  Version 1.0.0
echo ====================================================
echo Current directory: %CD%
echo.

:: Check if in project root
if not exist "mbg_dashboard" (
    echo Error: 'mbg_dashboard' directory not found in %CD%
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

:: Step 1 - Verify Node.js and npm
echo [1/5] Checking Node.js and npm...
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not installed or not in PATH.
    pause
    exit /b 1
)

:: Check for required environment variables
echo [2/5] Checking environment...
if not exist "mbg_dashboard\.env" (
    echo Error: .env file not found in mbg_dashboard directory.
    echo Please create it from .env.example and set the required variables.
    pause
    exit /b 1
)

:: Install dependencies
echo [3/5] Installing dependencies...
cd mbg_dashboard
call npm ci
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to install dependencies.
    pause
    exit /b 1
)

:: Build the project
echo [4/5] Building the project...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error: Build failed.
    pause
    exit /b 1
)

:: Deploy to Cloudflare Pages
echo [5/5] Deploying to Cloudflare Pages...
npm run deploy
if %ERRORLEVEL% neq 0 (
    echo Error: Deployment failed.
    pause
    exit /b 1
)

echo.
echo ====================================================
echo  Build and Deployment Complete!
echo  Your application should be live shortly.
echo ====================================================
echo.
pause
