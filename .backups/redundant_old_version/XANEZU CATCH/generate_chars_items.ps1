$AssetsDir = Join-Path $PSScriptRoot "assets"

$Chapters = @(
    @{ dir = '1-selva-tropical'; c1 = '#4CAF50'; c2 = '#388E3C' },
    @{ dir = '2-desierto-dorado'; c1 = '#FF9800'; c2 = '#F57C00' },
    @{ dir = '3-japon-feudal'; c1 = '#f44336'; c2 = '#c62828' },
    @{ dir = '4-bosque-encantado'; c1 = '#9c27b0'; c2 = '#7b1fa2' },
    @{ dir = '5-pantano-maldito'; c1 = '#827717'; c2 = '#33691e' },
    @{ dir = '6-fabrica-de-juguetes'; c1 = '#03a9f4'; c2 = '#0277bd' },
    @{ dir = '7-fiesta-mexicana'; c1 = '#ffeb3b'; c2 = '#fbc02d' },
    @{ dir = '8-reino-glacial'; c1 = '#81d4fa'; c2 = '#4fc3f7' }
)

$Items = @('coin', 'banana', 'fly_gold', 'heart', 'star_crystal', 'cyber_drone', 'hourglass', 'magnet', 'shield', 'star', 'clock', 'ghost', 'bolt', 'gift', 'feather', 'spring', 'bomb', 'mini', 'ice', 'clover', 'rainbow', 'ruby', 'crown', 'emerald', 'pearl', 'diamond', 'candy_red', 'candy_orange', 'candy_yellow', 'candy_green', 'candy_cyan', 'candy_blue', 'candy_purple', 'candy_pink', 'candy_brown', 'candy_grey')

function Generate-SVG($type, $c1, $c2) {
    if ($type -eq 'frog') {
        return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='$c1'/><circle cx='30' cy='40' r='10' fill='#fff'/><circle cx='70' cy='40' r='10' fill='#fff'/><circle cx='30' cy='40' r='4' fill='#000'/><circle cx='70' cy='40' r='4' fill='#000'/></svg>"
    }
    elseif ($type -match 'frog_') {
        return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='$c2'/><ellipse cx='50' cy='70' rx='20' ry='10' fill='#fff'/></svg>"
    }
    elseif ($type -eq 'comp') {
        return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='20' y='30' width='60' height='50' fill='$c1' rx='10'/><circle cx='35' cy='45' r='5' fill='#fff'/><circle cx='65' cy='45' r='5' fill='#fff'/></svg>"
    }
    elseif ($type -match 'candy') {
        $color = $type.Split('_')[1]
        return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='30' fill='$color'/><polygon points='20,50 0,30 0,70' fill='$color'/><polygon points='80,50 100,30 100,70' fill='$color'/></svg>"
    }
    elseif ($type -match 'fly') {
        return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><ellipse cx='50' cy='50' rx='20' ry='10' fill='$c2'/><ellipse cx='50' cy='30' rx='30' ry='10' fill='#fff' opacity='0.7'/></svg>"
    }
    else {
        return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='50,10 90,50 50,90 10,50' fill='$c1'/><circle cx='50' cy='50' r='15' fill='$c2'/></svg>"
    }
}

foreach ($ch in $Chapters) {
    $dirName = $ch.dir
    $PersDir = Join-Path $AssetsDir $dirName | Join-Path -ChildPath "personaje"
    $ObjDir = Join-Path $AssetsDir $dirName | Join-Path -ChildPath "objetos"
    
    if (-not (Test-Path $PersDir)) { New-Item -ItemType Directory -Path $PersDir -Force | Out-Null }
    if (-not (Test-Path $ObjDir)) { New-Item -ItemType Directory -Path $ObjDir -Force | Out-Null }

    # Characters
    @('frog', 'frog_up', 'frog_dn', 'frog_c', 'comp') | ForEach-Object {
        $svg = Generate-SVG $_ $ch.c1 $ch.c2
        $svg | Out-File -FilePath (Join-Path $PersDir "$_.svg") -Encoding utf8
    }

    # Items
    $Items | ForEach-Object {
        $svg = Generate-SVG $_ $ch.c1 $ch.c2
        $svg | Out-File -FilePath (Join-Path $ObjDir "$_.svg") -Encoding utf8
    }
    
    Write-Host "Generated pers & obj for $dirName"
}
