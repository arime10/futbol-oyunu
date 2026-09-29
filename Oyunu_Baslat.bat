@echo off
title Futbol Masa Oyunu & Sesli Lobi
color 0A
echo ====================================================
echo      FUTBOL MASA OYUNU VE SESLI LOBI BASLATILIYOR
echo ====================================================
echo.
cd /d "%~dp0backend"
echo Sunucu calistiriliyor...
start http://localhost:4000
npm start
pause
