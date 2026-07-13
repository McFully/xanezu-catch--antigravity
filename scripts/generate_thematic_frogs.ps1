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
    if (Test-Path $path) {
        $baseSvgs[$key] = Get-Content $path -Raw
    }
}

Write-Host "Starting Generation for 88 Thematic Frog Skins with Accessories..."

# Accessory Definitions (Centered 250, 250. Head top ~80)
$accessories = @{
    "JUNGLE"  = '<!-- Leafy Hat --><path d="M180 110 Q 250 40 320 110 Q 250 130 180 110" fill="#228B22" stroke="#000" stroke-width="2"/><path d="M250 40 L250 70" stroke="#FFF" stroke-width="2" opacity="0.4"/>'
    "DESERT"  = '<!-- Sombrero --><ellipse cx="250" cy="95" rx="140" ry="30" fill="#F4A460" stroke="#8B4513" stroke-width="4"/><path d="M200 95 L220 40 L280 40 L300 95 Z" fill="#F4A460" stroke="#8B4513" stroke-width="4"/><path d="M200 95 Q 250 110 300 95" stroke="#FF0000" stroke-width="6" fill="none"/>'
    "TECH"    = '<!-- Cyber Visor --><rect x="180" y="110" width="140" height="25" rx="5" fill="rgba(0, 255, 255, 0.4)" stroke="#0FF" stroke-width="2"/><path d="M180 122 L320 122" stroke="#0FF" stroke-width="1" stroke-dasharray="4"/>'
    "OCEAN"   = '<!-- Snorkel Mask --><rect x="180" y="100" width="140" height="60" rx="30" fill="rgba(135, 206, 235, 0.3)" stroke="#FFF" stroke-width="3"/><path d="M310 130 L340 130 L340 60" stroke="#FFF" stroke-width="6" fill="none"/>'
    "MAGIC"   = '<!-- Wizard Hat --><path d="M160 110 L340 110 L250 -30 Z" fill="#4B0082" stroke="#000" stroke-width="2"/><circle cx="250" cy="20" r="5" fill="#FFD700"/>'
    "ZEN"     = '<!-- Hachimaki --><rect x="150" y="105" width="200" height="15" fill="#FFF" stroke="#FF0000" stroke-width="1"/><circle cx="250" cy="112" r="5" fill="#FF0000"/>'
    "SPACE"   = '<!-- Astro Helmet --><circle cx="250" cy="150" r="130" fill="rgba(200, 230, 255, 0.2)" stroke="#DDD" stroke-width="4"/><rect x="230" y="20" width="40" height="15" fill="#DDD"/>'
    "PIRATE"  = '<!-- Tricorn & Patch --><path d="M150 110 C 150 40, 350 40, 350 110 Z" fill="#222" stroke="#000" stroke-width="2"/><circle cx="215" cy="125" r="15" fill="#000"/><path d="M150 105 L350 145" stroke="#000" stroke-width="4"/>'
    "VIKING"  = '<!-- Horned Helmet --><path d="M180 110 Q 250 40 320 110 Z" fill="#808080" stroke="#000" stroke-width="2"/><path d="M180 80 Q 150 20 120 50" stroke="#FFF" stroke-width="8" fill="none"/><path d="M320 80 Q 350 20 380 50" stroke="#FFF" stroke-width="8" fill="none"/>'
    "ANCIENT" = '<!-- Pharaoh --><path d="M140 150 L180 60 L320 60 L360 150 Z" fill="#FFD700" stroke="#000" stroke-width="2"/><path d="M180 60 L180 150 M210 60 L210 150 M250 60 L250 150 M290 60 L290 150 M320 60 L320 150" stroke="#00F" stroke-width="4"/>'
    "FANCY"   = '<!-- Top Hat --><rect x="190" y="30" width="120" height="80" fill="#222"/><rect x="160" y="110" width="180" height="10" rx="5" fill="#222"/><rect x="190" y="90" width="120" height="10" fill="#F00"/>'
    "MODERN"  = '<!-- Cap --><path d="M180 110 Q 250 40 320 110 Z" fill="#3498db"/><rect x="250" y="95" width="100" height="15" rx="5" fill="#3498db"/>'
    "GOTHIC"  = '<!-- Bat Ears --><path d="M180 90 L150 30 L210 70 Z" fill="#222"/><path d="M320 90 L350 30 L290 70 Z" fill="#222"/>'
}

# Color Mapping Logic
$mapping = @(
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
    $bgMatch = [regex]::Match($body, 'bg:\s*"([^"]+)"')
    $nameMatch = [regex]::Match($body, 'name:\s*"([^"]+)"')

    $colors = if ($colorsMatch.Success) { $colorsMatch.Groups[1].Value.Split(',') | ForEach-Object { $_.Trim().Replace('"', '').Replace("'", "") } } else { @('#A6F616', '#061a10') }
    $bg = if ($bgMatch.Success) { $bgMatch.Groups[1].Value } else { "" }
    $name = if ($nameMatch.Success) { $nameMatch.Groups[1].Value } else { "" }
    
    $primary = $colors[0]
    $secondary = if ($colors.Count -gt 1) { $colors[1] } else { $primary }
    
    # Theme Selection
    $theme = "JUNGLE"
    if ($bg -match "forest|jungle|biome|swamp|mushroom") { $theme = "JUNGLE" }
    elseif ($bg -match "desert|canyon|valley|sand|mars|egypt") { $theme = "DESERT" }
    elseif ($bg -match "neon|data|quantum|micro|digital|pico8|tv|glitch") { $theme = "TECH" }
    elseif ($bg -match "ocean|atlantis|lake|bubbles|glowfish") { $theme = "OCEAN" }
    elseif ($bg -match "magic|astral|heaven|dream|library|zen|sakura") { $theme = "MAGIC" }
    elseif ($bg -match "space|orbit|gamma|blackhole|core|infinity") { $theme = "SPACE" }
    elseif ($bg -match "pirate") { $theme = "PIRATE" }
    elseif ($bg -match "viking|arctic|frozen") { $theme = "VIKING" }
    elseif ($bg -match "egypt") { $theme = "ANCIENT" }
    elseif ($bg -match "castle|museum|rome|olympus") { $theme = "FANCY" } # Top hat/Crown style
    elseif ($bg -match "metro|train|factory|steampunk|clockwork") { $theme = "MODERN" }
    elseif ($bg -match "gothic") { $theme = "GOTHIC" }
    
    $accessorySvg = $accessories[$theme]

    $outDir = Join-Path $PSScriptRoot "..\assets\ch$id"
    if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

    foreach ($key in $baseSvgs.Keys) {
        $tintedSvg = $baseSvgs[$key]
        
        # Apply Tinting
        foreach ($m in $mapping) {
            $replacement = $primary
            if ($m.type -eq 'very_light') { $replacement = '#FFFFFF' }
            elseif ($m.type -eq 'light') { $replacement = Shade-Color $primary 20 }
            elseif ($m.type -eq 'primary') { $replacement = $primary }
            elseif ($m.type -eq 'mid_dark') { $replacement = $secondary }
            elseif ($m.type -eq 'very_dark') { $replacement = Shade-Color $secondary -30 }
            $tintedSvg = $tintedSvg.Replace($m.old, $replacement)
        }
        
        # Inject Accessory before closing </svg>
        $tintedSvg = $tintedSvg.Replace("</svg>", "$accessorySvg</svg>")
        
        $fileName = if ($key -eq "idle") { "frog.svg" } else { "frog_$key.svg" }
        $outPath = Join-Path $outDir $fileName
        $tintedSvg | Set-Content $outPath -NoNewline
    }
}

Write-Host "Success: Generated 352 Thematic Accessory Frog Skins."
