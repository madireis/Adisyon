@echo off
title Wot's Cafe Adisyon Sunucusu
color 0A
if exist "Adisyon-Server.exe" (
    "Adisyon-Server.exe"
) else (
    node server.cjs
)
pause
