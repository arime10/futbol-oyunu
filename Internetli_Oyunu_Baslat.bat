@echo off
title Futbol Masa Oyunu (Internetli - Sehirlerarasi)
color 0B
echo ====================================================
echo      INTERNETLI OYUN BASLATILIYOR (SAMSUN - ANKARA)
echo ====================================================
echo.
cd /d "%~dp0backend"
echo 1. Oyun sunucusu baslatiliyor...
start "Oyun Sunucusu" cmd /k "node src/server.js"
timeout /t 3 /nobreak >nul
start http://localhost:4000
echo.
echo 2. Sehirlerarasi internet linki olusturuluyor...
echo (Asagidaki 'your url is: https://...' linkini arkadasiniza atin)
echo.
npx --yes localtunnel --port 4000
pause
