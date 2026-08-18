@echo off
setlocal
cd /d "%~dp0"

title XANEZU CATCH - MODO DESARROLLADOR (PREVIEW INSTANTANEO)

echo ==========================================
echo       XANEZU CATCH - MODO DESARROLLADOR
echo ==========================================
echo [1/3] Verificando entorno...

if not exist "node_modules" (
    echo [ERROR] No se encuentran las dependencias.
    echo [INFO] Ejecutando instalacion...
    call npm install
)

echo [2/3] Liberando puerto 4200...
powershell -Command "Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }" >nul 2>&1

echo [3/3] Iniciando Servidor Angular con Hot-Reload...
echo [INFO] Cualquier cambio que yo aplique se vera reflejado AL INSTANTE.
echo [INFO] Una vez iniciada la compilacion, el navegador se abrira solo.
echo ==========================================

:: Iniciamos el servidor y abrimos el navegador
start "XANEZU DEV SERVER" cmd /k "npm run ng:start -- --port 4200 --open"

echo [OK] Servidor lanzado. 
echo [INFO] Manten esta ventana abierta para monitorizar la compilacion.
echo [INFO] Esta ventana se cerrara en 10 segundos.
timeout /t 10 >nul
exit
