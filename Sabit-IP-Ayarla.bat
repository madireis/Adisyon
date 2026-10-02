@echo off
chcp 65001 >nul
title Adisyon - Sunucu IP Adresini Sabitle
cls

echo ======================================================================
echo          ADISYON - SUNUCU IP ADRESINI SABITLEME ARACI
echo ======================================================================
echo.
echo Bu arac, bu bilgisayarin mevcut IP adresini (Wi-Fi veya Ethernet)
echo kalici olarak "STATIK" yapar.
echo Boylece modem veya elektrik yeniden baslasa bile IP adresi ASLA degismez.
echo.

:: Yonetici yetkisi kontrolu
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [UYARI] Yonetici haklari gerekiyor. Yonetici olarak baslatiliyor...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo Aktif ag baglantisi tespit ediliyor...
echo.

powershell -ExecutionPolicy Bypass -Command "& {
    $adapter = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.InterfaceDescription -notmatch 'Virtual|Hyper-V|TAP|Npcap|VMware|Loopback' } | Select-Object -First 1;
    if (-not $adapter) {
        Write-Host '[HATA] Aktif bir ag baglantisi bulunamadi!' -ForegroundColor Red;
        pause;
        exit;
    }

    $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254*' } | Select-Object -First 1;
    $gateway = (Get-NetRoute -InterfaceIndex $adapter.InterfaceIndex -DestinationPrefix '0.0.0.0/0').NextHop;
    $dns = (Get-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4).ServerAddresses;

    if (-not $gateway) { $gateway = '192.168.1.1'; }
    if (-not $dns -or $dns.Count -eq 0) { $dns = @('8.8.8.8', '1.1.1.1'); }

    Write-Host ('Kullanilan Ag Karti : ' + $adapter.Name + ' (' + $adapter.InterfaceDescription + ')') -ForegroundColor Cyan;
    Write-Host ('Mevcut IP Adresi    : ' + $ipConfig.IPAddress) -ForegroundColor Yellow;
    Write-Host ('Alt Ag Maskesi / Prefix : /' + $ipConfig.PrefixLength) -ForegroundColor Gray;
    Write-Host ('Varsayilan Ag Gecidi: ' + $gateway) -ForegroundColor Gray;
    Write-Host ('DNS Sunuculari      : ' + ($dns -join ', ')) -ForegroundColor Gray;
    Write-Host '';

    $confirm = Read-Host 'Bu IP adresini kalici olarak sabitlemek istiyor musunuz? (E/H)';
    if ($confirm -eq 'E' -or $confirm -eq 'e' -or $confirm -eq 'Y' -or $confirm -eq 'y') {
        try {
            Write-Host 'IP adresi sabitleniyor...';
            # Once statik IP ata
            New-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -IPAddress $ipConfig.IPAddress -PrefixLength $ipConfig.PrefixLength -DefaultGateway $gateway -SkipAsSource $false -ErrorAction SilentlyContinue | Out-Null;
            Set-NetIPInterface -InterfaceIndex $adapter.InterfaceIndex -Dhcp Disabled -ErrorAction SilentlyContinue | Out-Null;
            
            # DNS ata
            Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses $dns -ErrorAction SilentlyContinue | Out-Null;

            Write-Host '';
            Write-Host '======================================================================' -ForegroundColor Green;
            Write-Host ('[BASARILI] IP Adresiniz Kalici Olarak Sabitlendi: ' + $ipConfig.IPAddress) -ForegroundColor Green;
            Write-Host 'Artik modem yeniden baslasa bile sunucu IP adresi degismeyecektir.' -ForegroundColor Green;
            Write-Host ('Garson Baglanti URL: http://' + $ipConfig.IPAddress + ':3001') -ForegroundColor Green;
            Write-Host '======================================================================' -ForegroundColor Green;
        } catch {
            Write-Host ('[HATA] ' + $_.Exception.Message) -ForegroundColor Red;
        }
    } else {
        Write-Host 'Islem iptal edildi.' -ForegroundColor Yellow;
    }
}"

echo.
pause
