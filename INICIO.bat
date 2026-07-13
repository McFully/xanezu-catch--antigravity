@echo off
setlocal
cd /d "%~dp0"

title XANEZU CATCH - SELECTOR DE LANZAMIENTO

:menu
cls
echo ==========================================
echo        XANEZU CATCH - LANZADOR
echo ==========================================
echo.
echo  [1] Lanzar VERSION WEB (Navegador)
echo  [2] Lanzar VERSION DESKTOP (App Escritorio)
echo  [3] Salir
echo.
echo ==========================================
set /p choice="Elige una opcion [1-3]: "

if "%choice%"=="1" goto launch_web
if "%choice%"=="2" goto launch_desktop
if "%choice%"=="3" exit
goto menu

:launch_web
call INICIO_WEB.bat
exit

:launch_desktop
call INICIO_DESKTOP.bat
exit
