$AssetsDir = Join-Path $PSScriptRoot "assets"
$ChDir = "2-desierto-dorado"
$DirPath = Join-Path $AssetsDir $ChDir | Join-Path -ChildPath "obstaculos"

if (-not (Test-Path $DirPath)) { New-Item -ItemType Directory -Path $DirPath | Out-Null }

$Colors = @('#5c2602', '#BF360C', '#E65100', '#FFB74D', '#FFD700', '#2E7D32', '#1B5E20')

function Generate-DesertObs {
    param($Position, $Level)
    
    # We use a normalized 0-100 viewBox. By doing preserveAspectRatio="none", 
    # the graphic guarantees 100% collision box fill regardless of actual dimensions.
    $W = 100
    $H = 100
    $svgo = ""
    
    $defs = @"
    <defs>
        <filter id="sandTex">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.25 0" in="noise" result="coloredNoise"/>
            <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply"/>
        </filter>
        <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <linearGradient id="sandGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="$($Colors[1])"/>
            <stop offset="50%" stop-color="$($Colors[2])"/>
            <stop offset="100%" stop-color="$($Colors[0])"/>
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="$($Colors[4])"/>
            <stop offset="100%" stop-color="$($Colors[3])"/>
        </linearGradient>
        <linearGradient id="snakeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#8B4513"/>
            <stop offset="50%" stop-color="#DAA520"/>
            <stop offset="100%" stop-color="#8B4513"/>
        </linearGradient>
    </defs>
"@

    if ($Position -eq 'top') {
        # HANGING SNAKES (100% fills bounding box)
        $svgo += "<g>"
        # Invisible rect to force aspect boundaries exactly
        $svgo += "<rect x='0' y='0' width='100' height='100' fill='none' />"
        
        # Body snaking from Top (Y=0) to Bottom (Y=100), hitting X=0 and X=100
        $svgo += "<path d='M50,0 Q100,25 50,50 T50,100' fill='none' stroke='url(#snakeGrad)' stroke-width='20' stroke-linecap='round'/>"
        $svgo += "<path d='M10,0 Q100,20 0,50 Q100,75 50,90' fill='none' stroke='url(#snakeGrad)' stroke-width='15' stroke-linecap='round'/>" # Guarantee width touch
        
        # Snake Head at the bottom exactly touching Y=100
        $svgo += "<ellipse cx='50' cy='95' rx='15' ry='5' fill='url(#snakeGrad)'/>"
        
        # Fangs
        $svgo += "<polygon points='40,95 45,100 50,95' fill='#FFF'/>"
        $svgo += "<polygon points='50,95 55,100 60,95' fill='#FFF'/>"
        
        # Eyes
        $svgo += "<circle cx='45' cy='92' r='2' fill='#F00' filter='url(#glow)'/>"
        $svgo += "<circle cx='55' cy='92' r='2' fill='#F00' filter='url(#glow)'/>"
        $svgo += "</g>"

    }
    else {
        # BOTTOM: Detailed Cacti or standing Totems
        $svgo += "<g filter='url(#sandTex)'>"
        # Invisible rect to force aspect boundaries exactly
        $svgo += "<rect x='0' y='0' width='100' height='100' fill='none' />"
        
        if ($Level % 2 -eq 1) {
            # High Detail Cactus stretching from 0,0 to 100,100
            
            # Trunk
            $svgo += "<rect x='30' y='5' width='40' height='95' fill='$($Colors[5])' rx='5'/>"
            $svgo += "<rect x='35' y='5' width='20' height='95' fill='$($Colors[6])' rx='2'/>"
            
            # Left Arm (Touch X=0)
            $svgo += "<path d='M35,60 Q0,60 0,30 L10,30 Q10,50 35,50 Z' fill='$($Colors[5])'/>"
            # Right Arm (Touch X=100)
            $svgo += "<path d='M65,70 Q100,70 100,40 L90,40 Q90,60 65,60 Z' fill='$($Colors[5])'/>"
            
            # Pricks
            $svgo += "<line x1='30' y1='20' x2='20' y2='15' stroke='#FFF' stroke-width='1'/>"
            $svgo += "<line x1='70' y1='40' x2='80' y2='35' stroke='#FFF' stroke-width='1'/>"
            $svgo += "<line x1='30' y1='50' x2='20' y2='45' stroke='#FFF' stroke-width='1'/>"
            $svgo += "<line x1='70' y1='80' x2='80' y2='75' stroke='#FFF' stroke-width='1'/>"
            
            # Cactus Flower touching exactly Y=0 for perfect hitbox sync
            $svgo += "<ellipse cx='50' cy='0' rx='15' ry='5' fill='#ff2975' filter='url(#glow)'/>"
            $svgo += "<circle cx='50' cy='5' r='5' fill='url(#goldGrad)' filter='url(#glow)'/>"

        }
        else {
            # Ancient Golden Hieroglyph Totems
            # Trunk touching exactly 0 to 100 in width and height
            $svgo += "<rect x='0' y='0' width='100' height='100' fill='url(#sandGrad)' />"
            
            # Details to break the flatness
            $svgo += "<rect x='0' y='10' width='100' height='5' fill='$($Colors[0])' opacity='0.8'/>"
            $svgo += "<rect x='0' y='80' width='100' height='5' fill='$($Colors[0])' opacity='0.8'/>"
            
            # Golden glowing eye/gem perfectly centered
            $svgo += "<polygon points='50,30 80,50 50,70 20,50' fill='url(#goldGrad)' filter='url(#glow)'/>"
            $svgo += "<ellipse cx='50' cy='50' rx='10' ry='15' fill='$($Colors[0])'/>"
        }
        $svgo += "</g>"
    }

    $svgContent = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
    $defs
    $svgo
</svg>
"@
    return $svgContent
}

for ($i = 1; $i -le 6; $i++) {
    $svgTop = Generate-DesertObs 'top' $i
    $svgTop | Out-File -FilePath (Join-Path $DirPath "obs_top_l0$i.svg") -Encoding utf8
    
    $svgBot = Generate-DesertObs 'bot' $i
    $svgBot | Out-File -FilePath (Join-Path $DirPath "obs_bot_l0$i.svg") -Encoding utf8
    
    # Write fallback
    $svgBot | Out-File -FilePath (Join-Path $DirPath "obs_l0$i.svg") -Encoding utf8
}

Write-Host "Generated AAA Top and Bottom Obstacles for Desert Chapter! (100% Bounds Sync)"
