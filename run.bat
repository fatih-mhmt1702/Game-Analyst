@echo off
title NextFest Insight Launcher
echo ========================================================
echo  NextFest Insight - Steam Next Fest Intelligence App
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Bagimliliklar ve servisler kontrol ediliyor...
echo [2/2] Uygulama baslatiliyor (Backend + Masaustu Arayuzu)...
echo.

call npm run start

pause
