@echo off
setlocal
cd /d "%~dp0"
title IP Subnet Calculator

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Download it from https://nodejs.org and try again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies, first run only...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting IP Subnet Calculator at http://localhost:5173
echo Close this window to stop the server.
start "" "http://localhost:5173"
call npm run dev -- --port 5173 --strictPort
pause
