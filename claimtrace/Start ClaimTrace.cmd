@echo off
rem Double-click to run ClaimTrace on this PC. The browser opens by itself when the app is ready.
rem Close this window (or press Ctrl+C) to stop it.
title ClaimTrace
cd /d "%~dp0"
echo.
echo   ClaimTrace is starting. The first run takes 2-3 minutes, later runs about one.
echo   Your browser will open http://localhost:3000 by itself when it is ready.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-local.ps1"
echo.
echo   ClaimTrace has stopped. If you see an error above, send it to the team.
pause
