$AssetsDir = Join-Path $PSScriptRoot "assets"

$Chapters = @(
    @{ dir = '1-selva-tropical'; colors = @('#2E7D32', '#1B5E20', '#388E3C', '#4CAF50'); type = 'selva' },
    @{ dir = '2-desierto-dorado'; colors = @('#E65100', '#F57C00', '#FF9800', '#FFB74D', '#BF360C'); type = 'desierto' },
    @{ dir = '3-japon-feudal'; colors = @('#b71c1c', '#c62828', '#f44336', '#ffcdd2'); type = 'japon' },
    @{ dir = '4-bosque-encantado'; colors = @('#4a148c', '#6a1b9a', '#8e24aa', '#e1bee7', '#26c6da'); type = 'magia' },
    @{ dir = '5-pantano-maldito'; colors = @('#1b5e20', '#33691e', '#827717', '#9e9d24', '#004d40'); type = 'pantano' },
    @{ dir = '6-fabrica-de-juguetes'; colors = @('#01579b', '#0277bd', '#0288d1', '#03a9f4', '#fbc02d', '#d32f2f'); type = 'fabrica' },
    @{ dir = '7-fiesta-mexicana'; colors = @('#bf360c', '#d84315', '#e64a19', '#f4511e', '#ffeb3b', '#4caf50'); type = 'fiesta' },
    @{ dir = '8-reino-glacial'; colors = @('#01579b', '#0277bd', '#03a9f4', '#4fc3f7', '#81d4fa', '#e1f5fe'); type = 'hielo' },
    @{ dir = '9-neon-arcade'; colors = @('#2EF3FF', '#A600FF', '#FF00FF'); type = 'arcade' },
    @{ dir = '10-cosmos-pop'; colors = @('#FF4D6D', '#4CC9F0', '#FFF'); type = 'espacio' },
    @{ dir = '11-volcano-rush'; colors = @('#FF7A00', '#FF2E2E', '#FAD67A'); type = 'lava' },
    @{ dir = '12-retro-speedway'; colors = @('#00E5FF', '#FF00A8', '#FFF'); type = 'retro' },
    @{ dir = '13-ruinas-sumergidas'; colors = @('#6EC6FF', '#1B4965', '#FFF'); type = 'mar' },
    @{ dir = '14-valle-lunar'; colors = @('#D9D9E3', '#3C3F58', '#FFF'); type = 'luna' },
    @{ dir = '15-catedral-de-cristal'; colors = @('#BDE0FE', '#6D4C9B', '#FFF'); type = 'cristal' },
    @{ dir = '16-ciudad-nocturna'; colors = @('#7DD3FC', '#1E293B', '#FFF'); type = 'ciudad' }
)

function Generate-AaaObstacle {
    param($Type, $Colors, $Level, $Position)
    
    # 100x100 bounding box to use preserveAspectRatio="none"
    # This guarantees 100% fill rate for collision boxes.
    $W = 100
    $H = 100
    $svgo = ""

    $c1 = $Colors[0]
    $c2 = $Colors[1]
    $c3 = if ($Colors.Count -gt 2) { $Colors[2] } else { "#FFF" }

    $defs = @"
    <defs>
        <filter id="texNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0" in="noise" result="coloredNoise"/>
            <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply"/>
        </filter>
        <filter id="glowLight">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <linearGradient id="mainGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="$c1"/>
            <stop offset="50%" stop-color="$c2"/>
            <stop offset="100%" stop-color="$c3"/>
        </linearGradient>
    </defs>
"@

    # Common bounds enforcement rectangle (invisible)
    $Bounds = "<rect x='0' y='0' width='100' height='100' fill='none' />"
    $svgo += $Bounds

    if ($Type -match 'desierto') {
        $svgo += "<rect x='0' y='0' width='100' height='100' fill='url(#mainGrad)' filter='url(#texNoise)'/>"
    }
    elseif ($Type -match 'selva') {
        if ($Position -eq 'top') {
            $svgo += "<path d='M10,0 Q50,40 10,80 T30,100' fill='none' stroke='$c2' stroke-width='15' stroke-linecap='round' filter='url(#texNoise)'/>"
            $svgo += "<path d='M90,0 Q40,30 90,70 T70,100' fill='none' stroke='$c1' stroke-width='18' stroke-linecap='round'/>"
            $svgo += "<polygon points='20,40 40,45 25,60' fill='#8B0000'/>"
            $svgo += "<polygon points='80,60 60,65 75,80' fill='#8B0000'/>"
        }
        else {
            $svgo += "<rect x='0' y='0' width='100' height='100' fill='url(#mainGrad)' filter='url(#texNoise)'/>"
            $svgo += "<rect x='0' y='20' width='100' height='10' fill='#000' opacity='0.5'/>"
            $svgo += "<polygon points='50,40 80,60 50,80 20,60' fill='$c3' filter='url(#glowLight)'/>"
        }
    }
    elseif ($Type -match 'japon') {
        if ($Position -eq 'top') {
            $svgo += "<line x1='50' y1='0' x2='50' y2='30' stroke='#333' stroke-width='4'/>"
            $svgo += "<path d='M50,10 L70,40 L100,50 L70,60 L50,90 L30,60 L0,50 L30,40 Z' fill='url(#mainGrad)' stroke='$c3' stroke-width='2'/>"
            $svgo += "<circle cx='50' cy='50' r='10' fill='#111'/>"
            $svgo += "<circle cx='50' cy='50' r='5' fill='$c3'/>"
            $svgo += "<polygon points='45,80 55,80 50,100' fill='$c3'/>"
        }
        else {
            $svgo += "<path d='M10,100 L20,0 L30,100 Z' fill='$c1' filter='url(#texNoise)'/>"
            $svgo += "<path d='M40,100 L50,15 L60,100 Z' fill='$c2' filter='url(#texNoise)'/>"
            $svgo += "<path d='M70,100 L80,0 L90,100 Z' fill='$c1' filter='url(#texNoise)'/>"
            $svgo += "<path d='M0,100 L10,30 L20,100 Z' fill='$c3' opacity='0.6'/>"
            $svgo += "<path d='M80,100 L90,50 L100,100 Z' fill='$c3' opacity='0.6'/>"
        }
    }
    elseif ($Type -match 'magia') {
        if ($Position -eq 'top') {
            $svgo += "<path d='M0,0 Q50,40 100,0' fill='none' stroke='$c3' stroke-width='2' opacity='0.7'/>"
            $svgo += "<path d='M0,40 Q50,80 100,40' fill='none' stroke='$c3' stroke-width='2' opacity='0.7'/>"
            $svgo += "<line x1='50' y1='0' x2='50' y2='100' stroke='$c3' stroke-width='2' opacity='0.7'/>"
            $svgo += "<line x1='25' y1='0' x2='25' y2='80' stroke='$c3' stroke-width='2' opacity='0.7'/>"
            $svgo += "<line x1='75' y1='0' x2='75' y2='80' stroke='$c3' stroke-width='2' opacity='0.7'/>"
            $svgo += "<circle cx='50' cy='50' r='15' fill='$c1'/>"
            $svgo += "<circle cx='50' cy='50' r='5' fill='$c2' filter='url(#glowLight)'/>"
        }
        else {
            $svgo += "<polygon points='50,0 100,50 50,100 0,50' fill='url(#mainGrad)' filter='url(#texNoise)'/>"
            $svgo += "<polygon points='50,0 50,100 100,50' fill='#FFF' opacity='0.3'/>"
            $svgo += "<circle cx='50' cy='25' r='8' fill='$c3' filter='url(#glowLight)'/>"
            $svgo += "<circle cx='25' cy='50' r='6' fill='$c3' filter='url(#glowLight)'/>"
            $svgo += "<circle cx='75' cy='50' r='6' fill='$c3' filter='url(#glowLight)'/>"
            $svgo += "<circle cx='50' cy='75' r='8' fill='$c3' filter='url(#glowLight)'/>"
        }
    }
    elseif ($Type -match 'pantano') {
        if ($Position -eq 'top') {
            $svgo += "<path d='M0,0 L100,0 L80,20 Q60,60 50,100 Q40,60 20,20 Z' fill='$c1' filter='url(#texNoise)'/>"
            $svgo += "<circle cx='50' cy='95' r='5' fill='#32CD32' filter='url(#glowLight)'/>"
            $svgo += "<path d='M20,20 Q0,50 10,80' fill='none' stroke='#32CD32' stroke-width='4' filter='url(#glowLight)'/>"
            $svgo += "<path d='M80,20 Q100,40 90,70' fill='none' stroke='#32CD32' stroke-width='4' filter='url(#glowLight)'/>"
        }
        else {
            $svgo += "<path d='M10,100 Q10,40 30,20 Q40,0 50,30 Q60,0 70,20 Q90,40 90,100 Z' fill='url(#mainGrad)' filter='url(#texNoise)'/>"
            $svgo += "<circle cx='50' cy='30' r='8' fill='#32CD32' filter='url(#glowLight)'/>"
            $svgo += "<polygon points='0,100 10,80 20,100' fill='$c2'/>"
            $svgo += "<polygon points='80,100 90,80 100,100' fill='$c2'/>"
            $svgo += "<polygon points='40,100 50,0 60,100' fill='$c1' opacity='0.8'/>"
        }
    }
    elseif ($Type -match 'fabrica') {
        if ($Position -eq 'top') {
            $svgo += "<rect x='35' y='0' width='30' height='40' fill='#757575' filter='url(#texNoise)'/>"
            $svgo += "<rect x='45' y='0' width='10' height='100' fill='#E0E0E0'/>"
            $svgo += "<path d='M45,40 L20,70 L30,90 L45,70 Z' fill='$c1'/>"
            $svgo += "<path d='M55,40 L80,70 L70,90 L55,70 Z' fill='$c1'/>"
            $svgo += "<rect x='0' y='90' width='30' height='10' fill='$c2'/>"
            $svgo += "<rect x='70' y='90' width='30' height='10' fill='$c2'/>"
            $svgo += "<polygon points='0,90 20,100 0,100' fill='#FFF'/>"
            $svgo += "<polygon points='100,90 80,100 100,100' fill='#FFF'/>"
        }
        else {
            $svgo += "<rect x='0' y='80' width='100' height='20' fill='#424242'/>"
            $svgo += "<polygon points='10,80 25,0 40,80' fill='url(#mainGrad)'/>"
            $svgo += "<polygon points='40,80 50,20 60,80' fill='#757575'/>"
            $svgo += "<polygon points='60,80 75,0 90,80' fill='url(#mainGrad)'/>"
            $svgo += "<polygon points='0,80 5,40 10,80' fill='$c1'/>"
            $svgo += "<polygon points='90,80 95,50 100,80' fill='$c1'/>"
            $svgo += "<circle cx='25' cy='15' r='3' fill='#F00' filter='url(#glowLight)'/>"
            $svgo += "<circle cx='75' cy='15' r='3' fill='#F00' filter='url(#glowLight)'/>"
            $svgo += "<polygon points='30,0 50,0 40,20' fill='$c2'/>"
        }
    }
    elseif ($Type -match 'fiesta') {
        if ($Position -eq 'top') {
            $svgo += "<line x1='50' y1='0' x2='50' y2='30' stroke='#FFF' stroke-width='3'/>"
            $svgo += "<polygon points='50,20 80,50 50,80 20,50' fill='$c1'/>"
            $svgo += "<polygon points='50,20 50,0 60,20' fill='$c2'/>"
            $svgo += "<polygon points='80,50 100,50 80,60' fill='$c3'/>"
            $svgo += "<polygon points='20,50 0,50 20,60' fill='$c3'/>"
            $svgo += "<polygon points='50,80 50,100 40,80' fill='$c1'/>"
            $svgo += "<circle cx='50' cy='50' r='10' fill='#FFEB3B'/>"
        }
        else {
            $svgo += "<path d='M30,100 Q10,70 30,50 Q40,30 30,0 L70,0 Q60,30 70,50 Q90,70 70,100 Z' fill='url(#mainGrad)'/>"
            $svgo += "<line x1='45' y1='0' x2='45' y2='100' stroke='#FFF' stroke-width='2'/>"
            $svgo += "<line x1='50' y1='0' x2='50' y2='100' stroke='#FFF' stroke-width='2'/>"
            $svgo += "<line x1='55' y1='0' x2='55' y2='100' stroke='#FFF' stroke-width='2'/>"
            $svgo += "<circle cx='50' cy='60' r='15' fill='#000'/>"
            $svgo += "<rect x='0' y='90' width='10' height='10' fill='$c1'/>"
            $svgo += "<rect x='90' y='90' width='10' height='10' fill='$c1'/>"
        }
    }
    elseif ($Type -match 'hielo') {
        if ($Position -eq 'top') {
            $svgo += "<polygon points='0,0 20,100 40,0' fill='url(#mainGrad)' opacity='0.8'/>"
            $svgo += "<polygon points='30,0 60,80 90,0' fill='$c2' opacity='0.7'/>"
            $svgo += "<polygon points='70,0 85,100 100,0' fill='url(#mainGrad)' opacity='0.9'/>"
            $svgo += "<polygon points='40,0 50,50 60,0' fill='#FFF' opacity='0.5'/>"
        }
        else {
            $svgo += "<polygon points='0,100 20,0 40,100' fill='url(#mainGrad)' opacity='0.8'/>"
            $svgo += "<polygon points='30,100 60,20 90,100' fill='$c2' opacity='0.7'/>"
            $svgo += "<polygon points='70,100 85,0 100,100' fill='url(#mainGrad)' opacity='0.9'/>"
            $svgo += "<polygon points='40,100 50,50 60,100' fill='#FFF' opacity='0.5'/>"
        }
    }
    elseif ($Type -match 'arcade' -or $Type -match 'espacio' -or $Type -match 'retro') {
        # Neon / Digital / Cyber theme
        if ($Position -eq 'top') {
            $svgo += "<rect x='45' y='0' width='10' height='80' fill='$c1' filter='url(#glowLight)'/>"
            $svgo += "<rect x='10' y='80' width='80' height='20' fill='$c2' rx='5'/>"
            $svgo += "<rect x='20' y='85' width='60' height='10' fill='#000' opacity='0.6'/>" # Screen look
        }
        else {
            $svgo += "<rect x='10' y='0' width='80' height='20' fill='$c1' rx='5' filter='url(#glowLight)'/>"
            $svgo += "<rect x='45' y='20' width='10' height='80' fill='$c2'/>"
            $svgo += "<circle cx='50' cy='10' r='5' fill='#FFF'/>" # Glowing bulb
        }
    }
    elseif ($Type -match 'lava') {
        # Magma theme
        $svgo += "<rect x='0' y='0' width='100' height='100' fill='url(#mainGrad)' filter='url(#texNoise)'/>"
        $svgo += "<path d='M0,50 Q25,30 50,50 T100,50' fill='none' stroke='#FFD700' stroke-width='4' opacity='0.6'/>"
    }
    else {
        # Generic fallback: Square block with inner bevel
        $svgo += "<rect x='0' y='0' width='100' height='100' fill='url(#mainGrad)'/>"
        $svgo += "<rect x='10' y='10' width='80' height='80' fill='#000' opacity='0.2'/>"
    }

    $svgContent = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
    $defs
    $svgo
</svg>
"@
    return $svgContent
}

foreach ($ch in $Chapters) {
    if ($ch.dir -eq '2-desierto-dorado') { continue; } # Skipping, Desert already has its own specific detailed script

    $dirName = $ch.dir
    $DirPath = Join-Path $AssetsDir $dirName | Join-Path -ChildPath "obstaculos"
    if (-not (Test-Path $DirPath)) {
        New-Item -ItemType Directory -Path $DirPath | Out-Null
    }

    for ($i = 1; $i -le 30; $i++) {
        # Para rotar tipos de obstáculos mod 6, podemos mapearlo así:
        $lvlType = ($i - 1) % 6 + 1
        $svgTop = Generate-AaaObstacle -Type $ch.type -Colors $ch.colors -Level $lvlType -Position 'top'
        $FilePathTop = Join-Path $DirPath "obs_top_l0$i.svg"
        $svgTop | Out-File -FilePath $FilePathTop -Encoding utf8
        
        $svgBot = Generate-AaaObstacle -Type $ch.type -Colors $ch.colors -Level $lvlType -Position 'bot'
        $FilePathBot = Join-Path $DirPath "obs_bot_l0$i.svg"
        $svgBot | Out-File -FilePath $FilePathBot -Encoding utf8
        
        # Fallback for systems looking for generic obs_l0
        $FilePathG = Join-Path $DirPath "obs_l0$i.svg"
        $svgBot | Out-File -FilePath $FilePathG -Encoding utf8
    }
    Write-Host "Generated AAA Top/Bottom obstacles for $dirName"
}

Write-Host "Proceso Completado: Todo Xanezu tiene obstáculos 100% dinámicos AAA."
