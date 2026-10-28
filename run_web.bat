@echo off
title Game Analyst - Web & Mobile Sunucusu
echo ========================================================
echo  Game Analyst - Web & Mobil Cihaz Sunucu Baslaticisi
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Backend servisi baslatiliyor (FastAPI 0.0.0.0:8000)...
start "Game Analyst Backend" cmd /c "py -3.13 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"

echo [2/2] Frontend web sunucusu baslatiliyor (Vite 0.0.0.0:5173)...
echo.
echo ========================================================
echo  Web Sitesi ve Mobil Baglanti Adresleri:
echo  - Bilgisayardan erisim: http://localhost:5173/
echo  - Ayni Wi-Fi'daki telefondan: http://[BILGISAYAR_IP_ADRESINIZ]:5173/
echo ========================================================
echo.

cd frontend
call npm run dev -- --host
pause
