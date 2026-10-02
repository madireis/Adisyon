@echo off
title Wot's Cafe Adisyon Sunucusu
color 0A
echo ================================================================
echo           WOT'S CAFE & RESTORAN ADISYON SISTEMI
echo ================================================================
echo.
echo [1/2] Tarayici aciliyor: http://adisyon.local:3001
start "" http://localhost:3001
echo.
echo [2/2] Sunucu motoru calistiriliyor...
echo.
if exist "Adisyon-Server.exe" (
    "Adisyon-Server.exe"
) else (
    node server.cjs
)
pause
