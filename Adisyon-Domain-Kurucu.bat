@echo off
chcp 65001 >nul
title Adisyon Alan Adi (Domain) Kurulumu
cls

echo ======================================================================
echo          ADISYON - YEREL ALAN ADI (DOMAIN) KURUCU
echo ======================================================================
echo.
echo Bu arac, bu bilgisayarda "adisyon.pos", "adisyon.local" ve "adisyon.cafe"
echo adreslerini sunucu IP adresine yonlendirir.
echo.

:: Yonetici haklari kontrolu
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [UYARI] Yonetici haklari gerekiyor. Yonetici olarak yeniden baslatiliyor...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

set HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts

echo 1) Bu bilgisayar ANA SUNUCU (Kasa / Server)
echo 2) Bu bilgisayar DIGER BIR TERMINAL (Garson / Mutfak Bilgisayari)
echo.
set /p CHOICE="Seciminiz (1 veya 2, varsayilan 1): "

if "%CHOICE%"=="2" (
    echo.
    set /p SERVER_IP="Ana Sunucu PC'nin IP adresini girin (Orn: 192.168.1.36): "
) else (
    set SERVER_IP=127.0.0.1
)

if "%SERVER_IP%"=="" (
    set SERVER_IP=127.0.0.1
)

echo.
echo [%SERVER_IP%] adresi icin yonlendirmeler hosts dosyasina ekleniyor...

:: Eski Adisyon kayitlarini temizle (gecici dosya ile)
set TEMP_HOSTS=%TEMP%\hosts_temp.txt
powershell -Command "(Get-Content '%HOSTS_FILE%') | Where-Object { $_ -notmatch 'adisyon\.' } | Set-Content '%TEMP_HOSTS%'"
copy /y "%TEMP_HOSTS%" "%HOSTS_FILE%" >nul
del "%TEMP_HOSTS%" >nul 2>&1

:: Yeni kayitlari ekle
echo. >> "%HOSTS_FILE%"
echo # --- ADISYON POS YEREL ALAN ADLARI --- >> "%HOSTS_FILE%"
echo %SERVER_IP%    adisyon.local >> "%HOSTS_FILE%"
echo %SERVER_IP%    adisyon.pos >> "%HOSTS_FILE%"
echo %SERVER_IP%    adisyon.cafe >> "%HOSTS_FILE%"
echo %SERVER_IP%    pos.local >> "%HOSTS_FILE%"

:: DNS Onbellegini temizle
ipconfig /flushdns >nul 2>&1

echo.
echo ======================================================================
echo [BASARILI] Alan adlari basariyla tanimlandi!
echo.
echo Artik bu bilgisayardaki herhangi bir tarayicidan su adresleri acabilirsiniz:
echo   - http://adisyon.local:3001
echo   - http://adisyon.pos:3001
echo   - http://adisyon.cafe:3001
echo ======================================================================
echo.
pause
