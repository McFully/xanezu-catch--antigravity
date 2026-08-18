# Script de reparacion del entorno de desarrollo para Xanezu Catch
# -------------------------------------------------------------
# Este script añade automaticamente las rutas necesarias al PATH de usuario.

$pythonVersion = "313" 
$userProfile = $env:USERPROFILE
$localAppData = $env:LOCALAPPDATA

$pathsToAdd = @(
    "$userProfile\.local\bin",
    "$localAppData\Programs\Python\Python$pythonVersion\Scripts",
    "$localAppData\Programs\Python\Python314\Scripts",
    "$localAppData\Programs\Python\Python315\Scripts",
    "$userProfile\AppData\Roaming\Python\Python$pythonVersion\Scripts"
)

Write-Host "--- Iniciando reparacion del PATH para Python/Pip/Uv ---" -ForegroundColor Cyan

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$modified = $false

foreach ($path in $pathsToAdd) {
    if (Test-Path $path) {
        if ($currentPath -notlike "*$path*") {
            Write-Host "[OK] Anadiendo $path al PATH..." -ForegroundColor Green
            $currentPath = "$path;$currentPath"
            $modified = $true
        } else {
            Write-Host "[INFO] $path ya esta presente." -ForegroundColor Gray
        }
    }
}

if ($modified) {
    [Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
    Write-Host "PATH actualizado. REINICIA LA TERMINAL para aplicar cambios." -ForegroundColor Green
} else {
    Write-Host "No se requirieron cambios en el PATH." -ForegroundColor Green
}

Write-Host "--- Verificando instalaciones ---" -ForegroundColor Cyan
try {
    $pipVer = & pip --version
    Write-Host "Pip: $pipVer"
} catch {
    Write-Host "Pip no detectado." -ForegroundColor Yellow
}

try {
    $uvVer = & uv --version
    Write-Host "Uv: $uvVer"
} catch {
    Write-Host "Uv no detectado." -ForegroundColor Yellow
}
