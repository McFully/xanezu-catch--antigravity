$AssetsDir = Join-Path $PSScriptRoot "assets"
if (-not (Test-Path $AssetsDir)) { New-Item -ItemType Directory -Path $AssetsDir | Out-Null }

$ChapterRegistry = @{
    1 = "forest"; 2 = "desert"; 3 = "valley"; 4 = "ocean"; 5 = "neon"; 6 = "volcano"; 7 = "sky"; 8 = "space"
    9 = "egypt"; 10 = "rome"; 11 = "cave"; 12 = "zen"; 13 = "pirate"; 14 = "castle"; 15 = "steampunk"; 16 = "canyon"
    17 = "maya"; 18 = "viking"; 19 = "olympus"; 20 = "aztec"; 21 = "candy"; 22 = "paper"; 23 = "dragons"; 24 = "crystals"
    25 = "sakura"; 26 = "toys"; 27 = "circus"; 28 = "alice"; 29 = "library"; 30 = "clockwork"; 31 = "mushroom"; 32 = "atlantis"
    33 = "dream"; 34 = "gothic"; 35 = "isles"; 36 = "magic_wood"; 37 = "frozen"; 38 = "swamp"; 39 = "emerald"; 40 = "phoenix"
    41 = "retro"; 42 = "chrome"; 43 = "data"; 44 = "mars"; 45 = "sludge"; 46 = "orbit"; 47 = "quantum"; 48 = "alchemy"
    49 = "moon"; 50 = "micro"; 51 = "diesel"; 52 = "lowpoly"; 53 = "sun"; 54 = "arctic"; 55 = "metro"; 56 = "neural"
    57 = "biome"; 58 = "factory"; 59 = "train"; 60 = "gamma"; 61 = "sketch"; 62 = "ink"; 63 = "watercolor"; 64 = "pico8"
    65 = "minimal"; 66 = "mountains"; 67 = "autumn"; 68 = "lavender"; 69 = "lake"; 70 = "wheat"; 71 = "tv"; 72 = "shapes"
    73 = "spectral"; 74 = "glowfish"; 75 = "time"; 76 = "chalk"; 77 = "velvet"; 78 = "museum"; 79 = "uranium"; 80 = "abyss"
    81 = "astral"; 82 = "heaven"; 83 = "blackhole"; 84 = "core"; 85 = "nostalgia"; 86 = "omega"; 87 = "genesis"; 88 = "infinity"
}

function Get-BGColor($ch, $layer) {
    # Simple color logic: darker for back layers
    $h = ($ch * 137.5) % 360
    $s = 40 + ($layer * 10)
    $l = 10 + ($layer * 8)
    return "hsl($h, $s%, $l%)"
}

function Generate-SVG($type, $layer, $color) {
    $width = 800
    $height = 600
    $points = ""
    
    if ($type -match "forest|jungle|mushroom|wood|swamp|sakura|biome|autumn|lavender") {
        # Natural: Trees and foliage
        $points = "M 0,$height "
        for ($x = 0; $x -le $width; $x += 40) {
            $y = 400 - ($layer * 60) + (Get-Random -Minimum -40 -Maximum 40)
            $points += "L $x,$y "
            # Add a trunk/tree shape
            if ((Get-Random -Maximum 10) -gt 6) {
                $tx = $x + (Get-Random -Min -10 -Max 10)
                $ty = $y - (Get-Random -Min 40 -Max 120)
                $points += "L $tx,$ty L $($tx+10),$y "
            }
        }
        $points += "L $width,$height Z"
    }
    elseif ($type -match "desert|egypt|canyon|mars|arctic|wheat|sand|valley") {
        # Arid: Smooth dunes or plateau
        $points = "M 0,$height "
        for ($x = 0; $x -le $width; $x += 100) {
            $y = 450 - ($layer * 50) + ([Math]::Sin($x * 0.01 + $layer) * 60)
            $points += "Q $($x+50),$($y - 40) $($x+100),$y "
        }
        $points += "L $width,$height Z"
    }
    elseif ($type -match "neon|retro|data|quantum|micro|metro|factory|train|steampunk|clockwork|chrome|diesel|omega") {
        # Urban/Tech: Rectangular buildings
        $points = "M 0,$height "
        for ($x = 0; $x -le $width; $x += 60) {
            $bh = 100 + ($layer * 80) + (Get-Random -Min 0 -Max 150)
            $bw = 40 + (Get-Random -Min 0 -Max 40)
            $points += "L $x,$height L $x,$($height - $bh) L $($x+$bw),$($height - $bh) L $($x+$bw),$height "
        }
        $points += "Z"
    }
    elseif ($type -match "volcano|mountains|sky|isles|olympus|viking|crystals|frozen|lowpoly|uranium|abyss|peaks") {
        # Jagged: Sharp peaks
        $points = "M 0,$height "
        for ($x = 0; $x -le $width; $x += 80) {
            $y = 500 - ($layer * 100) - (Get-Random -Min 0 -Max 250)
            $points += "L $x,$y "
        }
        $points += "L $width,$height Z"
    }
    else {
        # Abstract/Mystic/Liquid: Smooth waves
        $points = "M 0,$height "
        for ($x = 0; $x -le $width; $x += 50) {
            $y = 300 + ($layer * 40) + ([Math]::Sin($x * 0.02 + $layer) * 80)
            $points += "T $x,$y "
        }
        $points += "L $width,$height Z"
    }

    return @"
<svg width="$width" height="$height" viewBox="0 0 $width $height" xmlns="http://www.w3.org/2000/svg">
    <path d="$points" fill="$color" />
</svg>
"@
}

Write-Host "Generating Backgrounds for 88 Chapters..."
foreach ($ch in 1..88) {
    $chDir = Join-Path $AssetsDir "ch$ch"
    if (-not (Test-Path $chDir)) { New-Item -ItemType Directory -Path $chDir | Out-Null }
    
    $type = $ChapterRegistry[$ch]
    if (-not $type) { $type = "abstract" }

    foreach ($layer in 1..3) {
        $color = Get-BGColor $ch $layer
        $svg = Generate-SVG $type $layer $color
        $fileName = "bg_$layer.svg"
        $path = Join-Path $chDir $fileName
        $svg | Out-File -FilePath $path -Encoding utf8
    }
    
    if ($ch % 10 -eq 0) { Write-Host "Progress: $ch/88" }
}

Write-Host "Done! 264 background layers generated."
