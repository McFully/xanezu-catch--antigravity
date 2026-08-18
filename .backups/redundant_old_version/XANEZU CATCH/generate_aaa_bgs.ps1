$AssetsDir = Join-Path $PSScriptRoot "assets"

$Chapters = @(
    @{ dir = '1-selva-tropical'; colors = @('#0c2b12', '#1B5E20', '#388E3C', '#81C784'); sky = @('#1a4a1a', '#4CAF50'); type = 'selva' },
    @{ dir = '2-desierto-dorado'; colors = @('#5c2602', '#BF360C', '#E65100', '#FFB74D'); sky = @('#b34500', '#FFD700'); type = 'desierto' },
    @{ dir = '3-japon-feudal'; colors = @('#4a0815', '#922B21', '#E6B0AA', '#F9EBEA'); sky = @('#311029', '#E6B0AA'); type = 'japon' },
    @{ dir = '4-bosque-encantado'; colors = @('#1d0b3b', '#4a148c', '#8e24aa', '#e1bee7'); sky = @('#0b021a', '#26c6da'); type = 'magia' },
    @{ dir = '5-pantano-maldito'; colors = @('#061408', '#1b5e20', '#827717', '#cddc39'); sky = @('#0a1711', '#558b2f'); type = 'pantano' },
    @{ dir = '6-fabrica-de-juguetes'; colors = @('#071f30', '#01579b', '#0288d1', '#fbc02d'); sky = @('#2c3e50', '#85c1e9'); type = 'fabrica' },
    @{ dir = '7-fiesta-mexicana'; colors = @('#380305', '#880e4f', '#d84315', '#ffeb3b'); sky = @('#4a148c', '#ff5722'); type = 'fiesta' },
    @{ dir = '8-reino-glacial'; colors = @('#061c30', '#01579b', '#4fc3f7', '#e1f5fe'); sky = @('#0d47a1', '#81d4fa'); type = 'hielo' },
    @{ dir = '9-neon-arcade'; colors = @('#1a0833', '#4a0080', '#00f2ff', '#a600ff'); sky = @('#0f051a', '#2e0a4d'); type = 'arcade' },
    @{ dir = '10-cosmos-pop'; colors = @('#0d0221', '#240b36', '#c31432', '#4cc9f0'); sky = @('#050110', '#1a052e'); type = 'espacio' },
    @{ dir = '11-volcano-rush'; colors = @('#2b0500', '#8a0707', '#ff4d00', '#ffc400'); sky = @('#1a0000', '#4a0000'); type = 'lava' },
    @{ dir = '12-retro-speedway'; colors = @('#0a0e29', '#1a2a6c', '#b21f1f', '#fdbb2d'); sky = @('#05071a', '#0a1033'); type = 'retro' },
    @{ dir = '13-ruinas-sumergidas'; colors = @('#002b36', '#073642', '#268bd2', '#859900'); sky = @('#00151a', '#004a5c'); type = 'mar' },
    @{ dir = '14-valle-lunar'; colors = @('#1a1a2e', '#16213e', '#0f3460', '#e94560'); sky = @('#0a0a14', '#1a1a2e'); type = 'luna' },
    @{ dir = '15-catedral-de-cristal'; colors = @('#1e1e2f', '#4b4b7c', '#92a8d1', '#f7cac9'); sky = @('#12121f', '#2a2a3d'); type = 'cristal' },
    @{ dir = '16-ciudad-nocturna'; colors = @('#0f172a', '#1e293b', '#334155', '#7dd3fc'); sky = @('#020617', '#0f172a'); type = 'ciudad' }
)

function Math-Sin($x) { return [Math]::Sin($x) }

function Generate-Path($points, $fill, $filter, $opacity) {
    return "<path d='$points' fill='$fill' filter='$filter' opacity='$opacity'/>"
}

function Generate-TerrainShape($width, $height, $baseY, $amplitude, $frequency, $layerOffset) {
    # CARTOON ART DIRECTOR: Replaced L with Q (Quadratic Bezier) for "Round & Soft" hills
    $path = "M 0,$height L 0,$baseY "
    $prevX = 0
    $prevY = $baseY
    for ($x = 30; $x -le ($width + 30); $x += 30) {
        $y = $baseY + (Math-Sin($x * $frequency + $layerOffset) * $amplitude) + (Math-Sin($x * $frequency * 2.5) * ($amplitude * 0.3))
        $cx = $prevX + 15
        $path += "Q $cx,$prevY $x,$y "
        $prevX = $x
        $prevY = $y
    }
    $path += "L $($width + 30),$height Z"
    return $path
}

function Generate-LevelSVG {
    param($Type, $Colors, $Sky, $Level)
    $W = 1280
    $H = 720
    
    $defs = @"
    <defs>
        <!-- CARTOON ART DIRECTOR: Warm ambient tint integration -->
        <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFF3E0" stop-opacity="0.95"/>
            <stop offset="30%" stop-color="$($Sky[1])" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="$($Sky[1])" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="$($Sky[0])"/>
            <stop offset="100%" stop-color="$($Sky[1])"/>
        </linearGradient>
        <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.1 0" in="noise" result="coloredNoise"/>
            <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply"/>
        </filter>
        <filter id="glow">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <!-- Soft Drop Shadow manually simulated -->
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#000" flood-opacity="0.25"/>
        </filter>
        
        <linearGradient id="layer3Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="$($Colors[3])"/>
            <stop offset="100%" stop-color="$($Colors[2])"/>
        </linearGradient>
        <linearGradient id="layer2Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="$($Colors[2])"/>
            <stop offset="100%" stop-color="$($Colors[1])"/>
        </linearGradient>
        <linearGradient id="layer1Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="$($Colors[1])"/>
            <stop offset="100%" stop-color="$($Colors[0])"/>
        </linearGradient>
    </defs>
"@

    $svgo = "<rect width='$W' height='$H' fill='url(#skyGrad)'/>"
    
    # Sun / Moon / Atmosphere glow (Warm tint)
    $sunY = 150 + ($Level * 10)
    $svgo += "<circle cx='640' cy='$sunY' r='300' fill='url(#sunGrad)' filter='url(#glow)'/>"

    # Base clouds (layered circles, Round and Soft)
    $svgo += "<g opacity='0.4'>"
    for ($c = 0; $c -lt 8; $c++) {
        $cx = ($c * 200 + $Level * 50) % 1500 - 100
        $cy = 100 + (Math-Sin($c) * 50)
        $cr = 120 + (Math-Sin($c * 3) * 60)
        $svgo += "<circle cx='$cx' cy='$cy' r='$cr' fill='#FFFFFF' filter='url(#glow)'/>"
    }
    $svgo += "</g>"

    # 3 Layers of Parallax Terrain (Far, Mid, Near)
    $path3 = Generate-TerrainShape $W $H 400 80 0.005 $Level
    $svgo += Generate-Path $path3 "url(#layer3Grad)" "url(#noiseFilter)" "0.6"

    $path2 = Generate-TerrainShape $W $H 550 60 0.007 ($Level + 5)
    $svgo += Generate-Path $path2 "url(#layer2Grad)" "url(#noiseFilter)" "0.8"

    $path1 = Generate-TerrainShape $W $H 700 40 0.01 ($Level + 10)
    # Applied DropShadow on main foreground
    $svgo += "<path d='$path1' fill='url(#layer1Grad)' filter='url(#dropShadow)'/>"

    # Props / Details (Trees, Cactus, Spikes depending on Biome)
    # CARTOON ART DIRECTOR: Stroke-linejoin='round' for polygon softness
    $svgo += "<g opacity='0.85' filter='url(#noiseFilter)' stroke-linejoin='round' stroke-linecap='round'>"
    
    $propColor = $Colors[0] # Darkest for foreground silhouette
    
    for ($i = 0; $i -lt (5 + $Level * 2); $i++) {
        $x = ($i * 150 + $Level * 80) % $W
        $baseY = 680 + (Math-Sin($x * 0.01 + $Level + 10) * 40)
        
        if ($Type -match 'desierto') {
            # Cactus (Soft shapes, completely rounded)
            $h = 80 + ($i * 10 % 60)
            $svgo += "<rect x='$x' y='$($baseY - $h)' width='24' height='$h' rx='12' fill='$propColor'/>"
            $svgo += "<rect x='$($x - 18)' y='$($baseY - $h + 20)' width='18' height='12' rx='6' fill='$propColor'/>"
            $svgo += "<rect x='$($x + 24)' y='$($baseY - $h + 40)' width='18' height='12' rx='6' fill='$propColor'/>"
            # Rim lighting
            $svgo += "<path d='M $($x + 4),$baseY L $($x + 4),$($baseY - $h + 10)' stroke='rgba(255,255,255,0.1)' stroke-width='4'/>"
        }
        elseif ($Type -match 'selva' -or $Type -match 'pantano') {
            # Thick Jungle Canopy / Mangroves (Overlapping circles)
            $h = 150 + ($i * 20 % 100)
            $svgo += "<rect x='$x' y='$($baseY - $h)' width='26' height='$h' rx='10' fill='$propColor'/>"
            $svgo += "<circle cx='$($x + 13)' cy='$($baseY - $h)' r='65' fill='$propColor'/>"
            $svgo += "<circle cx='$($x - 20)' cy='$($baseY - $h + 30)' r='45' fill='$propColor'/>"
            $svgo += "<circle cx='$($x + 45)' cy='$($baseY - $h + 20)' r='55' fill='$propColor'/>"
        }
        elseif ($Type -match 'magia') {
            # Sharp Crystals (Rounded corners visually over stroke)
            $h = 100 + ($i * 15 % 80)
            $svgo += "<polygon points='$x,$baseY $($x - 20),$($baseY - $h * 0.5) $x,$($baseY - $h) $($x + 20),$($baseY - $h * 0.5)' fill='$propColor' stroke='$propColor' stroke-width='10'/>"
            $svgo += "<polygon points='$x,$baseY $x,$($baseY - $h) $($x + 20),$($baseY - $h * 0.5)' fill='$($Colors[1])' stroke='$($Colors[1])' stroke-width='5' opacity='0.5'/>"
        }
        elseif ($Type -match 'japon') {
            # Bamboo or Torii silhouettes - rounded ends
            $h = 200 + ($i * 10 % 50)
            $svgo += "<rect x='$x' y='$($baseY - $h)' width='14' height='$h' rx='7' fill='$propColor'/>"
            $svgo += "<rect x='$($x + 25)' y='$($baseY - $h + 20)' width='14' height='$($h - 20)' rx='7' fill='$propColor'/>"
            for ($j = 0; $j -lt 5; $j++) {
                $svgo += "<rect x='$($x - 2)' y='$($baseY - $h + $j*40)' width='43' height='6' rx='3' fill='$propColor'/>"
            }
        }
        elseif ($Type -match 'fabrica') {
            # Gears and Pipes
            $h = 100 + ($i * 10 % 60)
            $svgo += "<rect x='$x' y='$($baseY - $h)' width='20' height='$h' fill='$propColor'/>"
            $svgo += "<circle cx='$x' cy='$($baseY - $h)' r='30' fill='$propColor'/>"
            $svgo += "<circle cx='$x' cy='$($baseY - $h)' r='10' fill='#000'/>"
        }
        elseif ($Type -match 'fiesta') {
            # Bunting and sombreros
            $h = 100 + ($i * 5 % 40)
            $svgo += "<polygon points='$x,$baseY $($x - 30),$($baseY - $h) $($x + 30),$($baseY - $h)' fill='$propColor'/>"
        }
        elseif ($Type -match 'hielo') {
            # Ice Columns
            $h = 120 + ($i * 20 % 100)
            $svgo += "<path d='M $($x - 15),$baseY Q $x,$($baseY - $h) $($x + 15),$baseY' fill='$propColor'/>"
            $svgo += "<path d='M $($x - 5),$baseY Q $x,$($baseY - $h) $($x + 15),$baseY' fill='#ffffff' opacity='0.2'/>"
        }
        elseif ($Type -match 'arcade' -or $Type -match 'retro') {
            # Skyscrapers neon silhouette
            $h = 150 + ($i * 30 % 200)
            $svgo += "<rect x='$x' y='$($baseY - $h)' width='60' height='$h' fill='$propColor'/>"
            for ($j = 0; $j -lt 6; $j++) {
                $svgo += "<circle cx='$($x + 10)' cy='$($baseY - $h + 20 + $j*25)' r='4' fill='#FFF' opacity='0.3'/>"
            }
        }
        elseif ($Type -match 'espacio') {
            # Satellites and floating rocks
            $h = 50 + ($i * 40 % 200)
            $svgo += "<circle cx='$x' cy='$($baseY - $h)' r='40' fill='$propColor'/>"
            $svgo += "<rect x='$($x - 60)' y='$($baseY - $h - 5)' width='120' height='10' fill='$propColor'/>"
        }
        elseif ($Type -match 'lava') {
            # Sharp Volcano teeth
            $h = 80 + ($i * 20 % 60)
            $svgo += "<polygon points='$x,$baseY $($x - 20),$baseY $($x - 10),$($baseY - $h)' fill='$propColor'/>"
        }
        elseif ($Type -match 'mar') {
            # Coral / Kelp
            $h = 100 + ($i * 15 % 80)
            $svgo += "<path d='M $x,$baseY Q $($x + 30),$($baseY - $h * 0.5) $x,$($baseY - $h)' fill='none' stroke='$propColor' stroke-width='15' stroke-linecap='round'/>"
        }
        elseif ($Type -match 'luna') {
            # Crater ridges
            $h = 30 + ($i * 10 % 40)
            $svgo += "<ellipse cx='$x' cy='$baseY' rx='100' ry='$h' fill='$propColor'/>"
        }
        elseif ($Type -match 'cristal') {
            # Crystal Spires
            $h = 130 + ($i * 15 % 100)
            $svgo += "<polygon points='$x,$baseY $($x - 15),$($baseY - $h * 0.5) $x,$($baseY - $h) $($x + 15),$($baseY - $h * 0.5)' fill='$propColor'/>"
        }
        elseif ($Type -match 'ciudad') {
            # City skyline with window dots
            $h = 100 + ($i * 50 % 250)
            $svgo += "<rect x='$x' y='$($baseY - $h)' width='50' height='$h' fill='$propColor'/>"
            $svgo += "<rect x='$($x + 5)' y='$($baseY - $h + 5)' width='5' height='5' fill='#FFF' opacity='0.5'/>"
        }
        else {
            # Abstract/Generic towers
            $h = 90 + ($i * 15 % 70)
            $svgo += "<rect x='$x' y='$($baseY - $h)' width='40' height='$h' rx='20' fill='$propColor'/>"
        }
    }
    
    $svgo += "</g>"

    # Vignette effect for AAA framing (Warm Dark edge)
    $svgo += "<rect width='$W' height='$H' fill='none' stroke='#110000' stroke-width='50' opacity='0.25' filter='url(#glow)'/>"

    return @"
<svg xmlns="http://www.w3.org/2000/svg" width="$W" height="$H" viewBox="0 0 $W $H">
    $defs
    $svgo
</svg>
"@
}

Write-Host "Iniciando re-renderizado AAA de fondos..."

foreach ($ch in $Chapters) {
    $dirName = $ch.dir
    $DirPath = Join-Path $AssetsDir $dirName | Join-Path -ChildPath "fondos"
    if (-not (Test-Path $DirPath)) {
        New-Item -ItemType Directory -Path $DirPath | Out-Null
    }

    for ($i = 1; $i -le 6; $i++) {
        $svgContent = Generate-LevelSVG -Type $ch.type -Colors $ch.colors -Sky $ch.sky -Level $i
        $FilePath = Join-Path $DirPath "bg_l0$i.svg"
        $svgContent | Out-File -FilePath $FilePath -Encoding utf8
    }
    Write-Host "Generados 6 fondos detallados para $dirName"
}

Write-Host "Renderizado AAA completado. Todos los fondos actualizados con texturas y detalle."
