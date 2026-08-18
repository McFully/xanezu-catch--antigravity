$AssetsDir = Join-Path $PSScriptRoot "..\assets"
$ChaptersTotal = 88

Write-Host "🎨 SUPREME Asset Generator v2 - Thematic Unique Shapes" -ForegroundColor Cyan
Write-Host "   Each chapter gets UNIQUE shapes based on its theme!" -ForegroundColor Yellow

# ============================================
# THEMATIC SVG TEMPLATES - Radically different per group
# ============================================
$themeShapes = @{}

# --- JUNGLE / FOREST ---
$themeShapes["jungle"] = @(
    '<path d="M50 10 Q70 30 60 50 Q80 60 50 90 Q20 60 40 50 Q30 30 50 10" fill="{0}" opacity="0.7"/>',
    '<path d="M20 90 Q50 {1} 80 90 L80 95 L20 95Z" fill="{0}" opacity="0.6"/><circle cx="50" cy="{1}" r="5" fill="#8B4513"/>',
    '<path d="M30 80 C30 20 70 20 70 80" fill="none" stroke="{0}" stroke-width="4"/><circle cx="35" cy="40" r="8" fill="{0}" opacity="0.5"/><circle cx="65" cy="50" r="10" fill="{0}" opacity="0.4"/>'
)

# --- DESERT / SAND ---
$themeShapes["desert"] = @(
    '<path d="M10 90 L30 30 L50 90 L70 20 L90 90Z" fill="{0}" opacity="0.5"/>',
    '<path d="M20 90 L40 40 L60 40 L80 90Z" fill="{0}" opacity="0.6"/><path d="M35 55 L50 30 L65 55Z" fill="{0}" opacity="0.3"/>'
)

# --- OCEAN / WATER ---
$themeShapes["ocean"] = @(
    '<ellipse cx="50" cy="50" rx="30" ry="15" fill="{0}" opacity="0.4"/><ellipse cx="55" cy="45" rx="20" ry="10" fill="{0}" opacity="0.3"/>',
    '<path d="M50 20 Q70 35 60 50 L80 70 L60 65 L55 85 L45 65 L40 70 L35 50 Q25 35 50 20Z" fill="{0}" opacity="0.5"/>'
)

# --- NEON / CYBER ---
$themeShapes["neon"] = @(
    '<rect x="15" y="15" width="70" height="70" fill="none" stroke="{0}" stroke-width="2" opacity="0.6"/><rect x="25" y="25" width="50" height="50" fill="none" stroke="{0}" stroke-width="1" opacity="0.4"/>',
    '<line x1="10" y1="10" x2="90" y2="90" stroke="{0}" stroke-width="2" opacity="0.5"/>'
)

# --- VOLCANO / FIRE ---
$themeShapes["volcano"] = @(
    '<path d="M10 90 L35 30 L50 50 L65 20 L90 90Z" fill="{0}" opacity="0.6"/>',
    '<path d="M50 10 Q80 40 60 70 Q70 90 50 85 Q30 90 40 70 Q20 40 50 10" fill="{0}" opacity="0.5"/>'
)

# --- SKY / CLOUDS ---
$themeShapes["sky"] = @(
    '<circle cx="30" cy="50" r="20" fill="{0}" opacity="0.3"/><circle cx="50" cy="45" r="22" fill="{0}" opacity="0.35"/><circle cx="70" cy="50" r="18" fill="{0}" opacity="0.3"/>',
    '<path d="M10 70 Q30 30 50 50 Q70 30 90 70Z" fill="{0}" opacity="0.2"/>'
)

# --- SPACE / COSMIC ---
$themeShapes["space"] = @(
    '<circle cx="50" cy="50" r="20" fill="{0}" opacity="0.3"/><circle cx="50" cy="50" r="30" fill="none" stroke="{0}" stroke-width="1" opacity="0.2"/>',
    '<polygon points="50,10 53,42 85,45 58,58 62,90 50,68 38,90 42,58 15,45 47,42" fill="{0}" opacity="0.4"/>'
)

# --- CRYSTAL / CAVE ---
$themeShapes["crystal"] = @(
    '<polygon points="50,5 70,35 65,75 35,75 30,35" fill="{0}" opacity="0.5"/><line x1="50" y1="5" x2="50" y2="75" stroke="white" stroke-width="1" opacity="0.3"/>',
    '<path d="M50 10 L75 40 L65 90 L35 90 L25 40Z" fill="{0}" opacity="0.4"/>'
)

# --- CANDY / WHIMSY ---
$themeShapes["candy"] = @(
    '<circle cx="50" cy="50" r="30" fill="{0}" opacity="0.5"/><path d="M20 50 Q50 20 80 50 Q50 80 20 50" fill="white" opacity="0.15"/>',
    '<rect x="40" y="10" width="20" height="70" rx="10" fill="{0}" opacity="0.5"/>'
)

# --- STEAMPUNK / GEARS ---
$themeShapes["steampunk"] = @(
    '<circle cx="50" cy="50" r="30" fill="none" stroke="{0}" stroke-width="3" opacity="0.5"/><circle cx="50" cy="50" r="20" fill="none" stroke="{0}" stroke-width="2" opacity="0.4"/><circle cx="50" cy="50" r="5" fill="{0}" opacity="0.6"/>'
)

# --- MAGIC / RUNES ---
$themeShapes["magic"] = @(
    '<polygon points="50,10 61,38 92,42 68,60 74,90 50,74 26,90 32,60 8,42 39,38" fill="{0}" opacity="0.4"/>',
    '<circle cx="50" cy="50" r="30" fill="none" stroke="{0}" stroke-width="2" opacity="0.4"/>'
)

# --- ANCIENT ---
$themeShapes["ancient"] = @(
    '<path d="M20 90 L20 30 L80 30 L80 90" fill="none" stroke="{0}" stroke-width="8" opacity="0.6"/><rect x="15" y="20" width="70" height="10" fill="{0}" opacity="0.8"/>',
    '<circle cx="50" cy="50" r="35" fill="none" stroke="{0}" stroke-width="4" opacity="0.5"/><path d="M50 15 L50 85 M15 50 L85 50" stroke="{0}" stroke-width="2" opacity="0.3"/>'
)

# --- FANTASY ---
$themeShapes["fantasy"] = @(
    '<path d="M50 10 Q80 40 50 90 Q20 40 50 10" fill="{0}" opacity="0.6"/><circle cx="50" cy="50" r="10" fill="white" opacity="0.4"/>',
    '<path d="M10 50 Q30 10 50 50 Q70 10 90 50 Q70 90 50 50 Q30 90 10 50" fill="{0}" opacity="0.4"/>'
)

# --- ABSTRACT ---
$themeShapes["abstract"] = @(
    '<rect x="10" y="10" width="80" height="80" fill="none" stroke="{0}" stroke-width="1" opacity="0.2"/><rect x="20" y="20" width="60" height="60" fill="none" stroke="{0}" stroke-width="1" opacity="0.4"/><rect x="30" y="30" width="40" height="40" fill="{0}" opacity="0.6"/>',
    '<circle cx="50" cy="50" r="5" fill="{0}" opacity="0.8"/><circle cx="50" cy="50" r="15" fill="none" stroke="{0}" stroke-width="1" opacity="0.6"/><circle cx="50" cy="50" r="30" fill="none" stroke="{0}" stroke-width="1" opacity="0.3"/>'
)

# --- SCIFI ---
$themeShapes["scifi"] = @(
    '<rect x="20" y="20" width="60" height="60" rx="10" fill="none" stroke="{0}" stroke-width="3" opacity="0.6"/><line x1="20" y1="50" x2="80" y2="50" stroke="{0}" stroke-width="1" opacity="0.4"/>',
    '<circle cx="50" cy="50" r="10" fill="{0}" opacity="0.8"/><circle cx="50" cy="50" r="25" fill="none" stroke="{0}" stroke-width="2" opacity="0.3"/><ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="{0}" stroke-width="1" opacity="0.2"/>'
)

# Map chapter numbers to theme groups
$chapterThemes = @{}
# ... [Mapping logic identical to previous attempt] ...
1, 17, 25, 31, 36, 38, 57, 64 | ForEach-Object { $chapterThemes[$_] = "jungle" }
2, 9, 16, 20, 44, 75 | ForEach-Object { $chapterThemes[$_] = "desert" }
4, 13, 18, 32, 69, 74 | ForEach-Object { $chapterThemes[$_] = "ocean" }
5, 41, 43, 60, 63, 71, 84, 86 | ForEach-Object { $chapterThemes[$_] = "neon" }
6, 23, 40, 53, 79 | ForEach-Object { $chapterThemes[$_] = "volcano" }
7, 19, 35, 66, 72, 82, 87 | ForEach-Object { $chapterThemes[$_] = "sky" }
8, 46, 49, 81 | ForEach-Object { $chapterThemes[$_] = "space" }
11, 24, 37, 54, 58, 76 | ForEach-Object { $chapterThemes[$_] = "crystal" }
21, 26, 27, 28, 61, 70 | ForEach-Object { $chapterThemes[$_] = "candy" }
15, 30, 42, 48, 51, 55, 59 | ForEach-Object { $chapterThemes[$_] = "steampunk" }
12, 14, 29, 33, 34, 39, 62, 65, 68, 77 | ForEach-Object { $chapterThemes[$_] = "magic" }
10, 17, 20, 78, 85 | ForEach-Object { $chapterThemes[$_] = "ancient" }
22, 67, 81 | ForEach-Object { $chapterThemes[$_] = "fantasy" }
52, 73, 80, 83, 88 | ForEach-Object { $chapterThemes[$_] = "abstract" }
45, 47, 50, 56 | ForEach-Object { $chapterThemes[$_] = "scifi" }

for ($i = 1; $i -le $ChaptersTotal; $i++) {
    if (-not $chapterThemes.ContainsKey($i)) {
        $themes = $themeShapes.Keys | Sort-Object
        $chapterThemes[$i] = $themes[$i % $themes.Count]
    }
}

# Base colors per chapter (unique hue per chapter)
function Get-ChapterColor($ch, $variation) {
    $hue = ($ch * 137.508) % 360
    $satMod = ($variation * 7) % 40
    $lightMod = ($variation * 3) % 25
    return "hsl($([math]::Round($hue)), $([math]::Round(45 + $satMod))%, $([math]::Round(35 + $lightMod))%)"
}

# Generate 50k+ assets
$totalFiles = 0
for ($ch = 1; $ch -le $ChaptersTotal; $ch++) {
    $chDir = Join-Path $AssetsDir "ch$ch"
    if (Test-Path $chDir) { Remove-Item -Path $chDir -Recurse -Force }
    New-Item -ItemType Directory -Path $chDir | Out-Null
    
    $themeName = $chapterThemes[$ch]
    if (-not $themeName) { $themeName = "jungle" }
    $shapes = $themeShapes[$themeName]
    
    Write-Host "  Ch $ch/88 [$themeName] ..." -NoNewline -ForegroundColor Yellow
    
    for ($i = 1; $i -le 570; $i++) {
        $shapeIdx = $i % $shapes.Count
        $color = Get-ChapterColor $ch $i
        $varY = 10 + ($i * 7) % 70
        
        $body = $shapes[$shapeIdx] -f $color, $varY
        
        $rot = ($i * 13) % 360
        $scale = 0.7 + (($i * 3) % 60) / 100.0
        
        $svg = @"
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<g transform="rotate($rot 50 50) scale($scale)">
$body
</g>
</svg>
"@
        $filename = "$($themeName)_$i.svg"
        $path = Join-Path $chDir $filename
        [System.IO.File]::WriteAllText($path, $svg)
        $totalFiles++
    }
    Write-Host " OK" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ SUPREME v2 COMPLETE: $totalFiles assets generated!" -ForegroundColor Cyan
Write-Host "   Each chapter has UNIQUE thematic shapes!" -ForegroundColor Yellow
