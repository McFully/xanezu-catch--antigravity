@echo off
setlocal
cd /d "%~dp0"

title XANEZU CATCH - LAUNCHER DESKTOP

echo ==========================================
echo       XANEZU CATCH - VERSION DESKTOP
echo ==========================================
echo [1/2] Verificando archivos...
if not exist "dist\xanezu-app\browser\index.html" (
    echo [INFO] No se encuentra el build del juego. Generando...
    call npm run ng:build
)

echo [2/2] Lanzando aplicacion independiente...
:: Ejecutamos Electron directamente. Esto abre el juego en su propia ventana.
call npm run electron:start

echo ==========================================
echo [OK] El juego deberia estar abierto.
echo [INFO] Esta ventana se cerrara en 5 segundos.
timeout /t 5 >nul
exit
