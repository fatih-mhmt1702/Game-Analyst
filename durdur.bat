@echo off
title Game Analyst - Sunucuyu Durdur
cd /d "%~dp0"
echo ========================================================
echo  Game Analyst - Sunucu ve Baglanti Kapatiliyor...
echo ========================================================
echo.
docker compose down
echo.
echo ========================================================
echo [OK] Sunucu ve internet baglantisi basariyla kapatildi.
echo      Bilgisayarinizda hicbir servis calismiyor.
echo ========================================================
pause
