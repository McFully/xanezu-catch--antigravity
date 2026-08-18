# Script de Backup Automático para XANEZU CATCH

$BackupRoot = ".backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFolder = Join-Path $BackupRoot "backup_$Timestamp"

# Crear directorio de backup si no existe
if (!(Test-Path $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot -Force
}

New-Item -ItemType Directory -Path $BackupFolder -Force

Write-Host "Iniciando backup en: $BackupFolder" -ForegroundColor Cyan

# Copiar carpeta js y archivos críticos
Copy-Item -Path "js" -Destination $BackupFolder -Recurse -Force
Copy-Item -Path "*.js", "*.json", "*.html", "*.css", "*.md" -Destination $BackupFolder -Force

Write-Host "Backup completado con éxito." -ForegroundColor Green
