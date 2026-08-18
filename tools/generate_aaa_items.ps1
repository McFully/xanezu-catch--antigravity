$AssetsDir = Join-Path $PSScriptRoot "assets"

$Chapters = @(
    '1-selva-tropical',
    '2-desierto-dorado',
    '3-japon-feudal',
    '4-bosque-encantado',
    '5-pantano-maldito',
    '6-fabrica-de-juguetes',
    '7-fiesta-mexicana',
    '8-reino-glacial',
    '9-neon-arcade',
    '10-cosmos-pop',
    '11-volcano-rush',
    '12-retro-speedway',
    '13-ruinas-sumergidas',
    '14-valle-lunar',
    '15-catedral-de-cristal',
    '16-ciudad-nocturna'
)

$Items = @('coin', 'banana', 'fly_gold', 'heart', 'star_crystal', 'cyber_drone', 'hourglass', 'magnet', 'shield', 'star', 'clock', 'ghost', 'bolt', 'gift', 'feather', 'spring', 'bomb', 'mini', 'ice', 'clover', 'rainbow', 'ruby', 'crown', 'emerald', 'pearl', 'diamond', 'heart', 'candy_red', 'candy_orange', 'candy_yellow', 'candy_green', 'candy_cyan', 'candy_blue', 'candy_purple', 'candy_pink', 'candy_brown', 'candy_grey')

function Generate-AaaItem {
    param($Type)
    $W = 100
    $H = 100
    $svg = ""
    
    $defs = @"
    <defs>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.4"/>
        </filter>
        <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <filter id="superGlow">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        
        <!-- Gold Gradient -->
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFD700" />
            <stop offset="50%" stop-color="#FFA500" />
            <stop offset="100%" stop-color="#FF8C00" />
        </linearGradient>
        <linearGradient id="goldLight" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFE4B5" />
            <stop offset="100%" stop-color="#FFD700" />
        </linearGradient>

        <!-- Silver/Steel Gradient -->
        <linearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E0E0E0" />
            <stop offset="50%" stop-color="#9E9E9E" />
            <stop offset="100%" stop-color="#616161" />
        </linearGradient>

        <!-- Gem Gradients -->
        <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF5252" />
            <stop offset="100%" stop-color="#B71C1C" />
        </linearGradient>
        <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#69F0AE" />
            <stop offset="100%" stop-color="#1B5E20" />
        </linearGradient>
        <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E0F7FA" />
            <stop offset="100%" stop-color="#00BCD4" />
        </linearGradient>

        <radialGradient id="highlight" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
        </radialGradient>
    </defs>
"@

    $svg += "<g filter='url(#dropShadow)'>"

    if ($Type -eq 'coin') {
        # AAA Coin: Outer rim, inner rim, star center, highlight
        $svg += "<circle cx='50' cy='50' r='40' fill='url(#gold)'/>"
        $svg += "<circle cx='50' cy='50' r='34' fill='url(#goldLight)'/>"
        $svg += "<circle cx='50' cy='50' r='30' fill='url(#gold)'/>"
        $svg += "<polygon points='50,28 55,42 70,42 58,52 62,68 50,58 38,68 42,52 30,42 45,42' fill='#FFF' opacity='0.7'/>"
        $svg += "<ellipse cx='35' cy='30' rx='15' ry='8' fill='#FFF' opacity='0.6' transform='rotate(-40 35 30)'/>"
    }
    elseif ($Type -eq 'banana') {
        # Smooth Banana
        $svg += "<path d='M80,20 Q100,50 80,80 Q50,90 20,80 Q0,50 20,20 Q50,40 80,20 Z' fill='#FFEB3B'/>"
        $svg += "<path d='M80,20 Q50,40 20,20 Q30,10 50,15 Q70,10 80,20 Z' fill='#8D6E63'/>"
        $svg += "<path d='M80,80 Q50,90 20,80 Q50,70 80,80 Z' fill='#8D6E63'/>"
        $svg += "<path d='M30,50 Q50,65 70,50' fill='none' stroke='#FBC02D' stroke-width='4' stroke-linecap='round'/>"
        $svg += "<path d='M25,35 Q50,50 75,35' fill='none' stroke='#FBC02D' stroke-width='4' stroke-linecap='round'/>"
    }
    elseif ($Type -eq 'fly_gold') {
        # Winged Coin
        $svg += "<path d='M20,50 Q-10,30 20,10 Q40,30 20,50 Z' fill='#FFFFFF' opacity='0.8'/>"
        $svg += "<path d='M80,50 Q110,30 80,10 Q60,30 80,50 Z' fill='#FFFFFF' opacity='0.8'/>"
        $svg += "<circle cx='50' cy='50' r='25' fill='url(#gold)'/>"
        $svg += "<circle cx='50' cy='50' r='18' fill='url(#goldLight)'/>"
        $svg += "<circle cx='38' cy='42' r='6' fill='#FFF' opacity='0.5'/>"
    }
    elseif ($Type -eq 'heart') {
        # Winged Crystal
        $svg += "<path d='M30,50 Q0,20 30,10 Q45,30 30,50 Z' fill='#E0F7FA' opacity='0.8'/>"
        $svg += "<path d='M70,50 Q100,20 70,10 Q55,30 70,50 Z' fill='#E0F7FA' opacity='0.8'/>"
        $svg += "<polygon points='50,20 75,50 50,80 25,50' fill='url(#diamondGrad)' filter='url(#glow)'/>"
        $svg += "<polygon points='50,20 50,80 25,50' fill='#FFF' opacity='0.4'/>"
    }
    elseif ($Type -eq 'star_crystal' -or $Type -eq 'star') {
        # Premium Star
        $svg += "<g filter='url(#superGlow)'>"
        $svg += "<polygon points='50,10 60,35 90,35 65,55 75,85 50,65 25,85 35,55 10,35 40,35' fill='url(#goldLight)'/>"
        $svg += "<polygon points='50,20 50,65 35,55' fill='#FFF' opacity='0.6'/>"
        $svg += "<polygon points='50,20 50,65 65,55' fill='url(#gold)' opacity='0.8'/>"
        $svg += "</g>"
    }
    elseif ($Type -eq 'magnet') {
        # Classic U-Magnet
        $svg += "<path d='M20,80 L20,40 A30,30 0 0,1 80,40 L80,80 L60,80 L60,40 A10,10 0 0,0 40,40 L40,80 Z' fill='#E53935'/>"
        $svg += "<rect x='20' y='70' width='20' height='20' fill='#E0E0E0'/>"
        $svg += "<rect x='60' y='70' width='20' height='20' fill='#E0E0E0'/>"
        $svg += "<path d='M20,80 L20,40 A30,30 0 0,1 80,40' fill='none' stroke='#FFF' stroke-width='4' opacity='0.5'/>"
    }
    elseif ($Type -eq 'shield') {
        # Energy Shield / Metal Shield
        $svg += "<path d='M50,10 L90,25 L90,50 Q90,80 50,95 Q10,80 10,50 L10,25 Z' fill='url(#silver)'/>"
        $svg += "<path d='M50,18 L80,30 L80,50 Q80,75 50,87 Q20,75 20,50 L20,30 Z' fill='#2196F3'/>"
        $svg += "<path d='M50,18 L50,87 Q20,75 20,50 L20,30 Z' fill='#64B5F6' opacity='0.6'/>"
        $svg += "<polygon points='50,35 65,55 50,70 35,55' fill='#FFF'/>"
    }
    elseif ($Type -match 'candy_') {
        $colorCode = '#FF4081' # default pink
        if ($Type -match 'red') { $colorCode = '#F44336' }
        if ($Type -match 'orange') { $colorCode = '#FF9800' }
        if ($Type -match 'yellow') { $colorCode = '#FFEB3B' }
        if ($Type -match 'green') { $colorCode = '#4CAF50' }
        if ($Type -match 'cyan') { $colorCode = '#00BCD4' }
        if ($Type -match 'blue') { $colorCode = '#2196F3' }
        if ($Type -match 'purple') { $colorCode = '#9C27B0' }
        if ($Type -match 'brown') { $colorCode = '#795548' }
        if ($Type -match 'grey') { $colorCode = '#9E9E9E' }
        
        # Wrapped Candy
        $svg += "<polygon points='50,50 10,30 10,70' fill='$colorCode' filter='url(#glow)'/>"
        $svg += "<polygon points='50,50 90,30 90,70' fill='$colorCode' filter='url(#glow)'/>"
        $svg += "<circle cx='50' cy='50' r='30' fill='#FFF'/>"
        $svg += "<circle cx='50' cy='50' r='25' fill='$colorCode'/>"
        # Swirl
        $svg += "<path d='M50,25 Q70,25 70,50 Q70,75 50,75 Q35,75 35,60 Q35,40 50,40' fill='none' stroke='#FFF' stroke-width='6' stroke-linecap='round'/>"
    }
    elseif ($Type -eq 'ruby') {
        $svg += "<polygon points='50,15 85,40 50,90 15,40' fill='url(#rubyGrad)'/>"
        $svg += "<polygon points='50,15 85,40 50,45 25,35' fill='#FF8A80'/>"
        $svg += "<polygon points='50,15 50,45 15,40' fill='#FF5252'/>"
        $svg += "<polygon points='50,45 85,40 50,90' fill='#D50000'/>"
        $svg += "<polygon points='15,40 50,45 50,90' fill='#B71C1C'/>"
        $svg += "<circle cx='35' cy='35' r='5' fill='#FFF' filter='url(#glow)'/>"
    }
    elseif ($Type -eq 'emerald') {
        $svg += "<polygon points='30,15 70,15 90,40 70,90 30,90 10,40' fill='url(#emeraldGrad)'/>"
        $svg += "<polygon points='30,15 70,15 50,40' fill='#B9F6CA'/>"
        $svg += "<polygon points='70,15 90,40 50,40' fill='#69F0AE'/>"
        $svg += "<polygon points='10,40 30,15 50,40' fill='#00C853'/>"
        $svg += "<polygon points='90,40 70,90 50,40' fill='#1B5E20'/>"
        $svg += "<polygon points='10,40 30,90 50,40' fill='#388E3C'/>"
        $svg += "<polygon points='30,90 70,90 50,40' fill='#2E7D32'/>"
        $svg += "<polygon points='40,25 60,25 50,35' fill='#FFF' opacity='0.7'/>"
    }
    elseif ($Type -eq 'diamond') {
        $svg += "<polygon points='25,20 75,20 95,45 50,95 5,45' fill='url(#diamondGrad)'/>"
        $svg += "<polygon points='25,20 75,20 60,45 40,45' fill='#E0F7FA'/>"
        $svg += "<polygon points='75,20 95,45 60,45' fill='#B2EBF2'/>"
        $svg += "<polygon points='5,45 25,20 40,45' fill='#80DEEA'/>"
        $svg += "<polygon points='40,45 60,45 50,95' fill='#4DD0E1'/>"
        $svg += "<polygon points='60,45 95,45 50,95' fill='#00ACC1'/>"
        $svg += "<polygon points='5,45 40,45 50,95' fill='#00838F'/>"
        $svg += "<circle cx='40' cy='30' r='6' fill='#FFF' filter='url(#glow)'/>"
    }
    elseif ($Type -eq 'pearl') {
        $svg += "<circle cx='50' cy='50' r='35' fill='#F5F5F5'/>"
        $svg += "<circle cx='50' cy='50' r='35' fill='url(#highlight)'/>"
        $svg += "<path d='M25,50 A25,25 0 0,1 50,25' fill='none' stroke='#FFF' stroke-width='6' stroke-linecap='round'/>"
        $svg += "<circle cx='50' cy='50' r='35' fill='none' stroke='#E0E0E0' stroke-width='2'/>"
        $svg += "<circle cx='50' cy='50' r='40' fill='none' stroke='#FFF' stroke-width='1' filter='url(#superGlow)' opacity='0.5'/>"
    }
    elseif ($Type -eq 'crown') {
        $svg += "<path d='M10,30 L25,60 L50,15 L75,60 L90,30 L80,80 L20,80 Z' fill='url(#gold)'/>"
        $svg += "<circle cx='10' cy='25' r='8' fill='#E0F7FA'/>"
        $svg += "<circle cx='50' cy='10' r='10' fill='#FF5252'/>"
        $svg += "<circle cx='90' cy='25' r='8' fill='#E0F7FA'/>"
        $svg += "<rect x='25' y='65' width='50' height='10' fill='#F44336' rx='3'/>"
    }
    elseif ($Type -eq 'bomb') {
        $svg += "<circle cx='50' cy='60' r='35' fill='#212121'/>"
        $svg += "<circle cx='40' cy='50' r='15' fill='url(#highlight)' opacity='0.4'/>"
        $svg += "<rect x='40' y='15' width='20' height='15' fill='#757575'/>"
        $svg += "<path d='M50,15 Q60,5 75,10' fill='none' stroke='#8D6E63' stroke-width='4'/>"
        # Spark
        $svg += "<polygon points='75,10 80,0 85,10 95,15 85,20 80,30 75,20 65,15' fill='#FFEB3B' filter='url(#glow)'/>"
    }
    elseif ($Type -eq 'heart' -or $Type -match 'life') {
        $svg += "<path d='M50,90 Q50,90 20,60 A20,20 0 0,1 50,30 A20,20 0 0,1 80,60 Q50,90 50,90 Z' fill='#E91E63'/>"
        $svg += "<path d='M30,45 A10,10 0 0,1 45,35' fill='none' stroke='#FFF' stroke-width='4' stroke-linecap='round' opacity='0.7'/>"
    }
    elseif ($Type -eq 'clock') {
        $svg += "<circle cx='50' cy='50' r='40' fill='#FFF'/>"
        $svg += "<circle cx='50' cy='50' r='40' fill='none' stroke='#2196F3' stroke-width='8'/>"
        $svg += "<circle cx='50' cy='50' r='35' fill='none' stroke='#90CAF9' stroke-width='2'/>"
        $svg += "<line x1='50' y1='50' x2='50' y2='25' stroke='#1976D2' stroke-width='6' stroke-linecap='round'/>"
        $svg += "<line x1='50' y1='50' x2='70' y2='50' stroke='#F44336' stroke-width='4' stroke-linecap='round'/>"
        $svg += "<circle cx='50' cy='50' r='5' fill='#1976D2'/>"
    }
    else {
        # Generic fallback for unstyled items, nice bouncy sphere
        $svg += "<circle cx='50' cy='50' r='30' fill='url(#gold)'/>"
        $svg += "<circle cx='40' cy='40' r='10' fill='#FFF' opacity='0.5'/>"
    }

    $svg += "</g>"

    return @"
<svg xmlns="http://www.w3.org/2000/svg" width="$W" height="$H" viewBox="0 0 $W $H">
    $defs
    $svg
</svg>
"@
}

Write-Host "Re-imaginando todos los coleccionables, frutas y monedas a Calidad AAA..."

foreach ($ch in $Chapters) {
    $ObjDir = Join-Path $AssetsDir $ch | Join-Path -ChildPath "objetos"
    
    if (-not (Test-Path $ObjDir)) { New-Item -ItemType Directory -Path $ObjDir -Force | Out-Null }

    foreach ($item in $Items) {
        $svgContent = Generate-AaaItem -Type $item
        $FilePath = Join-Path $ObjDir "$item.svg"
        $svgContent | Out-File -FilePath $FilePath -Encoding utf8
    }
    Write-Host "Generados 36 items Triple-A para $ch"
}

Write-Host "Todos los objetos del mapa han sido llevados a la Nueva Era (Shiny!)."
