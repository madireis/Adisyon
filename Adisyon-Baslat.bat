@echo off
title Wot's Cafe Adisyon Sunucusu
color 0A
echo ================================================================
echo           WOT'S CAFE & RESTORAN ADISYON SISTEMI
echo ================================================================
echo.
echo Sunucu motoru calistiriliyor ve tarayici otomatik aciliyor...
echo.
if exist "Adisyon-Server.exe" (
    "Adisyon-Server.exe"
) else (
    node server.cjs
)
pause
