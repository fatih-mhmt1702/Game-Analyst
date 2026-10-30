@echo off
title Cloudflare Canli Baglanti Linki
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File show_link.ps1
pause
