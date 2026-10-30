@echo off
title Game Analyst - Docker Sunucusu ve Canli Link
echo ========================================================
echo  Game Analyst - Docker Baslatici & Cloudflare Tunnel
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Docker container'lari derleniyor ve baslatiliyor...
docker compose up -d --build

echo.
echo [2/2] Canli Internet linkiniz aliniyor...
echo ========================================================
timeout /t 5 >nul
docker logs game_analyst_tunnel 2>&1 | findstr /i "trycloudflare.com"
echo ========================================================
echo.
echo Yukarida gorunen "https://xxxx.trycloudflare.com" linkini 
echo tarayicinizdan veya telefonunuzdan hemen acabilirsiniz!
echo.
echo Durdurmak icin bu pencereye herhangi bir tusa basin...
pause >nul
docker compose down

