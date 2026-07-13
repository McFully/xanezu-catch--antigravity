# Cleanup unused chapter assets
# Only keep: frog.svg, frog_up.svg, frog_dn.svg, frog_c.svg, bg_1.svg, bg_2.svg

$assetsDir = Join-Path $PSScriptRoot "..\assets"
$keepFiles = @('frog.svg', 'frog_up.svg', 'frog_dn.svg', 'frog_c.svg', 'bg_1.svg', 'bg_2.svg')
$totalDeleted = 0

for ($i = 1; $i -le 88; $i++) {
    $chDir = Join-Path $assetsDir "ch$i"
    if (Test-Path $chDir) {
        $filesToDelete = Get-ChildItem $chDir -File | Where-Object { $keepFiles -notcontains $_.Name }
        $count = ($filesToDelete | Measure-Object).Count
        $totalDeleted += $count
        $filesToDelete | Remove-Item -Force
        Write-Host "ch$i : deleted $count files"
    }
}

Write-Host "`nTotal: Deleted $totalDeleted unused files from chapter directories."
Write-Host "Kept only: $($keepFiles -join ', ')"
