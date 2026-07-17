@echo off
setlocal EnableExtensions

title Instalar ZELO
echo.
echo A criar o atalho do ZELO no ambiente de trabalho...
echo.

set "ZELO_URL=https://yuriventura278-lgtm.github.io/hospital-do-prenda-estatistica/"
set "ICON_URL=https://yuriventura278-lgtm.github.io/hospital-do-prenda-estatistica/icons/zelo.ico"
set "DEST_DIR=%LOCALAPPDATA%\ZELO"
set "ICON_PATH=%DEST_DIR%\zelo.ico"

if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" >nul 2>nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri '%ICON_URL%' -OutFile '%ICON_PATH%' -UseBasicParsing -ErrorAction Stop } catch {}; $ws = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $scPath = Join-Path $desktop 'ZELO.url'; $sc = $ws.CreateShortcut($scPath); $sc.TargetPath = '%ZELO_URL%'; if (Test-Path '%ICON_PATH%') { $sc.IconLocation = '%ICON_PATH%,0' }; $sc.Save()"

echo.
echo Pronto! O icone "ZELO" foi criado no ambiente de trabalho.
echo Basta clicar duas vezes nele para abrir o sistema no navegador.
echo.
pause
