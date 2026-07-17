@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"
set "PORT=4175"
set "URL=http://localhost:%PORT%/"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [HTML Designer] Node.js was not found.
  echo Please install Node.js 18 or later, then double-click this file again.
  echo Download: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

echo.
echo [HTML Designer] Starting local server...
echo [HTML Designer] URL: %URL%
echo [HTML Designer] Close this window to stop the server.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
node server.js

echo.
echo [HTML Designer] Server stopped.
pause
