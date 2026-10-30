@echo off
title Game Analyst - Sunucuyu Baslat
cd /d "%~dp0"
echo ========================================================
echo  Game Analyst - Sunucu ve Internet Baglantisi Baslatiliyor
echo ========================================================
echo.
echo [1/2] Docker konteynerleri calistiriliyor...
docker compose up -d
if %errorlevel% neq 0 (
    echo.
    echo [HATA] Docker Desktop calismiyor olabilir. Lutfen Docker'i acip tekrar deneyin.
    pause
    exit /b
)

echo.
echo [2/2] Cloudflare canli baglanti linki hazirlaniyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 4; $line = docker logs game_analyst_tunnel 2>&1 | Select-String -Pattern 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | Select-Object -Last 1; if ($line) { $url = [regex]::Match($line.Line, 'https://[a-zA-Z0-9-]+\.trycloudflare\.com').Value; Write-Host ''; Write-Host '>>> SUNUCU BASARIYLA ACILDI! <<<' -ForegroundColor Green; Write-Host 'Canli Baglanti Linkiniz:' -ForegroundColor Yellow; Write-Host $url -ForegroundColor Cyan; Write-Host ''; Start-Process $url } else { Write-Host 'Konteynerler calisiyor. Linki gormek icin show_cloudflare_link.bat dosyasini acabilirsiniz.' -ForegroundColor Yellow }"

echo.
echo Kapatmak istediginizde 'durdur.bat' dosyasini calistirabilirsiniz.
echo ========================================================
pause
