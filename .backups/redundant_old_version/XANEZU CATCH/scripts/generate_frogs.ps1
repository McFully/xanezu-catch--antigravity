$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$registryPath = Join-Path $PSScriptRoot "..\js\core\ChapterRegistry.js"
$registryText = Get-Content $registryPath -Raw

$chapterMatches = [regex]::Matches($registryText, '(\d+):\s*\{([^}]+)\}')

$bases = @{
    "idle" = "frog.idl.svg"
    "up"   = "frog.idl_up.svg"
    "dn"   = "frog.idl_dn.svg"
    "c"    = "frog.idl_c.svg"
}

$baseSvgs = @{}
foreach ($key in $bases.Keys) {
    $path = Join-Path $PSScriptRoot "..\assets\$($bases[$key])"
    $baseSvgs[$key] = Get-Content $path -Raw
}

Write-Host "Starting generation for 88 frog skins (4 states each) via PowerShell..."

# Shared Color Mapping Logic
$mapping = @(
    # Greens (Base)
    @{ old = '#204b0e'; type = 'very_dark' },
    @{ old = '#1a4a14'; type = 'very_dark' },
    @{ old = '#174b19'; type = 'very_dark' },
    @{ old = '#2f5a1a'; type = 'very_dark' },
    @{ old = '#154a16'; type = 'very_dark' },
    @{ old = '#7ad95f'; type = 'mid_dark' },
    @{ old = '#55e141'; type = 'mid_dark' },
    @{ old = '#aff92f'; type = 'primary' },
    @{ old = '#abf62f'; type = 'primary' },
    @{ old = '#bdef46'; type = 'primary' },
    @{ old = '#c6ed63'; type = 'light_mid' },
    @{ old = '#d7f397'; type = 'light' },
    @{ old = '#f6fbdf'; type = 'very_light' },
    # Variations in Up/Dn/C
    @{ old = '#cbd884'; type = 'light' },
    @{ old = '#e1ee91'; type = 'very_light' },
    @{ old = '#d1f070'; type = 'light' },
    @{ old = '#a6d71d'; type = 'primary' },
    @{ old = '#9dc02f'; type = 'primary' },
    @{ old = '#5b9605'; type = 'very_dark' },
    @{ old = '#4c8207'; type = 'very_dark' },
    @{ old = '#43770e'; type = 'very_dark' }
)

function Shade-Color($color, $percent) {
    if ($color -notmatch "^#[0-9a-fA-F]{6}$") { return $color }
    try {
        $R = [Convert]::ToInt32($color.Substring(1, 2), 16)
        $G = [Convert]::ToInt32($color.Substring(3, 2), 16)
        $B = [Convert]::ToInt32($color.Substring(5, 2), 16)

        $R = [Math]::Max(0, [Math]::Min(255, [int]($R * (100 + $percent) / 100)))
        $G = [Math]::Max(0, [Math]::Min(255, [int]($G * (100 + $percent) / 100)))
        $B = [Math]::Max(0, [Math]::Min(255, [int]($B * (100 + $percent) / 100)))

        return "#{0:X2}{1:X2}{2:X2}" -f $R, $G, $B
    }
    catch { return $color }
}

foreach ($match in $chapterMatches) {
    $id = $match.Groups[1].Value
    $body = $match.Groups[2].Value
    
    $colorsMatch = [regex]::Match($body, 'colors:\s*\[([^\]]+)\]')
    $eyeMatch = [regex]::Match($body, 'eyeColor:\s*"([^"]+)"')
    
    $colors = if ($colorsMatch.Success) { 
        $colorsMatch.Groups[1].Value.Split(',') | ForEach-Object { $_.Trim().Replace('"', '').Replace("'", "") } 
    }
    else { @('#A6F616', '#061a10') }
    
    $eyeColor = if ($eyeMatch.Success) { $eyeMatch.Groups[1].Value } else { $colors[0] }
    
    $primary = $colors[0]
    $secondary = if ($colors.Count -gt 1) { $colors[1] } else { $primary }
    $highlight = $eyeColor
    
    $outDir = Join-Path $PSScriptRoot "..\assets\ch$id"
    if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

    foreach ($key in $baseSvgs.Keys) {
        $tintedSvg = $baseSvgs[$key]
        foreach ($m in $mapping) {
            $replacement = $primary
            if ($m.type -eq 'very_light') { $replacement = '#FFFFFF' }
            elseif ($m.type -eq 'light') { $replacement = $highlight }
            elseif ($m.type -eq 'primary') { $replacement = $primary }
            elseif ($m.type -eq 'mid_dark') { $replacement = $secondary }
            elseif ($m.type -eq 'very_dark') { $replacement = Shade-Color $secondary -30 }
            
            $tintedSvg = $tintedSvg.Replace($m.old, $replacement)
        }
        
        $fileName = if ($key -eq "idle") { "frog.svg" } else { "frog_$key.svg" }
        $outPath = Join-Path $outDir $fileName
        $tintedSvg | Set-Content $outPath -NoNewline
    }
}

Write-Host "Successfully generated all thematic frog skins (4 states per chapter)."
