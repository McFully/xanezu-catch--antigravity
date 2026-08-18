$AssetsDir = Join-Path $PSScriptRoot "..\assets"
$ChaptersTotal = 88

if (-not (Test-Path $AssetsDir)) { New-Item -ItemType Directory -Path $AssetsDir }

Write-Host "🚀 Starting Massive Asset Generation with PowerShell..." -ForegroundColor Cyan

$Generators = @{
    "nature" = { param($c1, $c2) "<svg width='100' height='100' xmlns='http://www.w3.org/2000/svg'><path d='M10,90 Q50,10 90,90' fill='$c1' opacity='0.6' /><circle cx='50' cy='30' r='10' fill='$c2' /><path d='M30,70 L50,40 L70,70' fill='$c1' /></svg>" }
    "scifi"  = { param($c1, $c2) "<svg width='100' height='100' xmlns='http://www.w3.org/2000/svg'><rect x='10' y='10' width='80' height='80' fill='none' stroke='$c2' stroke-width='2' /><rect x='20' y='20' width='60' height='60' fill='$c1' opacity='0.3' /><line x1='0' y1='50' x2='100' y2='50' stroke='$c2' opacity='0.5' /><circle cx='50' cy='50' r='10' fill='$c2' /></svg>" }
    "tech"   = { param($c1, $c2) "<svg width='100' height='100' xmlns='http://www.w3.org/2000/svg'><path d='M10,10 L90,10 L90,90 L10,90 Z' fill='none' stroke='$c1' stroke-width='1' /><circle cx='20' cy='20' r='5' fill='$c2' /><circle cx='80' cy='80' r='5' fill='$c2' /><path d='M30,30 L70,70 M70,30 L30,70' stroke='$c1' stroke-width='2' /></svg>" }
    "magic"  = { param($c1, $c2) "<svg width='100' height='100' xmlns='http://www.w3.org/2000/svg'><defs><radialGradient id='g$(Get-Random)'><stop offset='0%' stop-color='$c1' /><stop offset='100%' stop-color='transparent' /></radialGradient></defs><circle cx='50' cy='50' r='40' fill='url(#g$(Get-Random))' /><polygon points='50,10 60,40 90,50 60,60 50,90 40,60 10,50 40,40' fill='$c2' /></svg>" }
}

$Themes = @(
    @{ name="nature"; types=@("leaf","rock","bush","flower","cloud") }
    @{ name="scifi";  types=@("panel","wire","drone","shutter","beam") }
    @{ name="tech";   types=@("gear","chip","bolt","pipe","sensor") }
    @{ name="magic";  types=@("crystal","spark","rune","orb","wisp") }
)

$count = 0

for ($ch = 1; $ch -le $ChaptersTotal; $ch++) {
    $ChDir = Join-Path $AssetsDir "ch$ch"
    if (-not (Test-Path $ChDir)) { New-Item -ItemType Directory -Path $ChDir }

    $hue = ($ch * 137.5) % 360
    $c1 = "hsl($hue, 70%, 40%)"
    $c2 = "hsl($(($hue + 40) % 360), 80%, 60%)"

    $Theme = $Themes[$ch % $Themes.Count]

    for ($i = 1; $i -le 12; $i++) {
        $type = $Theme.types[$i % $Theme.types.Count]
        $FileName = "$($type)_$i.svg"
        $FilePath = Join-Path $ChDir $FileName
        
        $svg = & $Generators[$Theme.name] $c1 $c2
        Set-Content -Path $FilePath -Value $svg
        $count++
    }
}

Write-Host "✅ Success! Generated $count assets in /assets/ch1 to /assets/ch88" -ForegroundColor Green
