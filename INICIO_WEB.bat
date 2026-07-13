@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

title XANEZU CATCH - LANZADOR INSTANTANEO

echo ==========================================
echo       XANEZU CATCH - LANZAMIENTO DIRECTO
echo ==========================================

:: [1/3] Limpieza Profunda
echo [1/3] Limpiando cache y procesos previos...
if exist ".angular\cache" rd /s /q ".angular\cache"
powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }" >nul 2>&1
powershell -Command "Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }" >nul 2>&1

:: [2/3] Iniciando Servidor de Desarrollo (Hot Reload)
echo [2/3] Iniciando Servidor...
start /b "XANEZU SERVER" cmd /c "npm run ng:start"

echo [OK] Servidor iniciado.
echo [INFO] Abriendo el juego en el navegador (esperando arranque)...

:: Pausa para permitir que Angular empiece a servir
timeout /t 5 >nul
start "" "http://localhost:3000"

echo ==========================================
echo [EXITO] Juego lanzado en http://localhost:3000
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
exit
