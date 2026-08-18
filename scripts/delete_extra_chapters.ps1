# Delete chapter asset directories 9+
$assetsDir = Join-Path $PSScriptRoot "..\assets"
$deleted = 0

Get-ChildItem -Path $assetsDir -Directory | ForEach-Object {
    if ($_.Name -match '^ch(\d+)$') {
        $num = [int]$Matches[1]
        if ($num -gt 8) {
            Remove-Item $_.FullName -Recurse -Force
            Write-Host "Deleted: $($_.Name)"
            $deleted++
        }
    }
}

Write-Host "`nTotal deleted: $deleted directories"
