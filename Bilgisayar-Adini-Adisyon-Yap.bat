@echo off
chcp 65001 >nul
title Bilgisayar Adini Adisyon Yap
cls

echo ======================================================================
echo          BILGISAYAR ADINI "ADISYON" OLARAK AYARLAMA
echo ======================================================================
echo.
echo Bu islem bu bilgisayarin ag adini "ADISYON" olarak degistirir.
echo Boylece agdaki tum telefon, tablet ve bilgisayarlar IP adresi yerine
echo dogrudan sunu yazarak baglanabilir:
echo.
echo    http://adisyon.local:3001  veya  http://adisyon:3001
echo.

:: Yonetici yetkisi kontrolu
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [UYARI] Yonetici haklari gerekiyor. Yonetici olarak baslatiliyor...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo Mevcut Bilgisayar Adi: %COMPUTERNAME%
echo.
set /p CONFIRM="Bilgisayar adini 'ADISYON' yapmak istiyor musunuz? (E/H): "

if /i "%CONFIRM%"=="E" (
    powershell -Command "Rename-Computer -NewName 'ADISYON' -Force"
    echo.
    echo ======================================================================
    echo [BASARILI] Bilgisayar adi 'ADISYON' olarak degistirildi!
    echo Degisikligin gecerli olmasi icin bilgisayarinizi bir kez yeniden baslatin.
    echo ======================================================================
) else (
    echo Islem iptal edildi.
)

echo.
pause
