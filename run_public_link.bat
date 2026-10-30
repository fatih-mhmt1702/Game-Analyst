@echo off
title Game Analyst - Ucretsiz Genel Internet Linki (Public URL)
echo ========================================================
echo  Game Analyst - Ucretsiz Genel Internet Linki Baslatici
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Backend servisi kontrol ediliyor (Port 8000)...
start "Game Analyst Backend" cmd /c "py -3.13 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"

echo [2/3] Frontend web sunucusu kontrol ediliyor (Port 5173)...
start "Game Analyst Frontend" cmd /c "cd frontend && call npm run dev -- --host"

echo [3/3] Guvenli ve ucretsiz genel Internet baglantisi hazirlaniyor...
echo.
echo --------------------------------------------------------
echo  Lutfen baglanti yontemini secin:
echo   1. Pinggy SSH Tunnel (EN HIZLI: Indirme gerekmez, 2 saniyede link ve QR verir)
echo   2. Localtunnel (Node.js ile aninda link verir)
echo   3. Cloudflare Quick Tunnel (cloudflared ile)
echo --------------------------------------------------------
echo.
set /p choice="Seciminiz (1, 2 veya 3 - Varsayilan: 1): "

if "%choice%"=="2" goto opt_localtunnel
if "%choice%"=="3" goto opt_cloudflare
goto opt_pinggy

:opt_pinggy
echo.
echo =======================================================================
echo  Pinggy Baglantisi Kuruluyor...
echo  Ekranda cikan "https://xxxx.a.pinggy.link" adresini kullanabilirsiniz!
echo =======================================================================
echo.
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:5173 qr@a.pinggy.io
pause
exit

:opt_localtunnel
echo.
echo =======================================================================
echo  Localtunnel Baglantisi Kuruluyor...
echo  "your url is: https://xxxx.loca.lt" seklinde link verilecektir.
echo =======================================================================
echo.
call npx --yes localtunnel --port 5173
pause
exit

:opt_cloudflare
echo.
echo Cloudflare Quick Tunnel hazirlaniyor...
if not exist "%LOCALAPPDATA%\cloudflared.exe" (
    echo Cloudflare istemcisi hizli indiriliyor...
    curl.exe -fSL -# -o "%LOCALAPPDATA%\cloudflared.exe" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
)
echo.
echo =======================================================================
echo  Cloudflare Quick Tunnel Baslatildi!
echo  Asagidaki loglarda "https://xxxx.trycloudflare.com" linki yer alacaktir.
echo =======================================================================
echo.
"%LOCALAPPDATA%\cloudflared.exe" tunnel --url http://localhost:5173
pause
exit
