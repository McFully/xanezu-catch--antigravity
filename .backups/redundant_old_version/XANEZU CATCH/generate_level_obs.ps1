$AssetsDir = Join-Path $PSScriptRoot "assets"

$Chapters = @(
    @{ dir = '1-selva-tropical'; colors = @('#2E7D32', '#1B5E20', '#388E3C', '#4CAF50'); type = 'selva' },
    @{ dir = '2-desierto-dorado'; colors = @('#E65100', '#F57C00', '#FF9800', '#FFB74D', '#BF360C'); type = 'desierto' },
    @{ dir = '3-japon-feudal'; colors = @('#b71c1c', '#c62828', '#f44336', '#ffcdd2'); type = 'japon' },
    @{ dir = '4-bosque-encantado'; colors = @('#4a148c', '#6a1b9a', '#8e24aa', '#e1bee7', '#26c6da'); type = 'magia' },
    @{ dir = '5-pantano-maldito'; colors = @('#1b5e20', '#33691e', '#827717', '#9e9d24', '#004d40'); type = 'pantano' },
    @{ dir = '6-fabrica-de-juguetes'; colors = @('#01579b', '#0277bd', '#0288d1', '#03a9f4', '#fbc02d', '#d32f2f'); type = 'fabrica' },
    @{ dir = '7-fiesta-mexicana'; colors = @('#bf360c', '#d84315', '#e64a19', '#f4511e', '#ffeb3b', '#4caf50'); type = 'fiesta' },
    @{ dir = '8-reino-glacial'; colors = @('#01579b', '#0277bd', '#03a9f4', '#4fc3f7', '#81d4fa', '#e1f5fe'); type = 'hielo' }
)

function Generate-ObsSVG {
    param($Type, $Colors, $Level)
    $svgo = ""
    # We want tall obstacles, like 100x400
    
    $c1 = $Colors[0]
    $c2 = $Colors[1]
    if ($Colors.Count -gt 2) { $c1 = $Colors[$Level % $Colors.Count]; $c2 = $Colors[($Level + 1) % $Colors.Count] }

    if ($Type -match 'desierto') {
        # Cactus / Columns
        $h1 = 150 + $Level * 40
        $svgo += "<rect x='30' y='$((400 - $h1))' width='40' height='$h1' fill='$c1' rx='10'/>"
        $svgo += "<rect x='10' y='$((400 - $h1 + 50))' width='20' height='80' fill='$c2' rx='10'/>"
        $svgo += "<rect x='70' y='$((400 - $h1 + 80))' width='20' height='60' fill='$c2' rx='10'/>"
    }
    elseif ($Type -match 'selva' -or $Type -match 'pantano') {
        # Vines or big trunks
        $h1 = 180 + $Level * 30
        $svgo += "<path d='M 30,400 Q 10,$((400 - $h1/2)) 50,$((400 - $h1)) Q 80,$((400 - $h1/2)) 60,400 Z' fill='$c1'/>"
        $svgo += "<path d='M 40,400 Q 80,$((400 - $h1/2)) 30,$((400 - $h1))' stroke='$c2' stroke-width='6' fill='none'/>"
    }
    elseif ($Type -match 'magia') {
        # Crystals
        $h1 = 160 + $Level * 30
        $svgo += "<polygon points='50,400 20,$((400 - $h1/2)) 50,$((400 - $h1)) 80,$((400 - $h1/2))' fill='$c1'/>"
        $svgo += "<polygon points='50,400 50,$((400 - $h1)) 80,$((400 - $h1/2))' fill='$c2'/>"
    }
    elseif ($Type -match 'japon') {
        # Torii parts or bamboo
        $h1 = 200 + $Level * 20
        $svgo += "<rect x='40' y='$((400 - $h1))' width='20' height='$h1' fill='$c1'/>"
        $svgo += "<rect x='20' y='$((400 - $h1))' width='60' height='10' fill='$c2'/>"
        $svgo += "<rect x='30' y='$((400 - $h1 + 20))' width='40' height='10' fill='$c2'/>"
    }
    elseif ($Type -match 'hielo') {
        # Ice Spikes
        $h1 = 150 + $Level * 40
        $svgo += "<polygon points='10,400 50,$((400 - $h1)) 90,400' fill='$c1'/>"
        $svgo += "<polygon points='50,400 50,$((400 - $h1)) 90,400' fill='$c2'/>"
        $svgo += "<polygon points='0,400 30,$((400 - $h1 + 50)) 60,400' fill='$c1' opacity='0.8'/>"
    }
    else {
        # Generic blocks
        $h1 = 180 + $Level * 30
        $svgo += "<rect x='20' y='$((400 - $h1))' width='60' height='$h1' fill='$c1'/>"
        $svgo += "<rect x='30' y='$((400 - $h1 + 10))' width='40' height='$(( $h1 - 20 ))' fill='$c2'/>"
    }

    return @"
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="400" viewBox="0 0 100 400">
    $svgo
</svg>
"@
}

foreach ($ch in $Chapters) {
    $dirName = $ch.dir
    $DirPath = Join-Path $AssetsDir $dirName | Join-Path -ChildPath "obstaculos"
    if (-not (Test-Path $DirPath)) {
        New-Item -ItemType Directory -Path $DirPath | Out-Null
    }

    for ($i = 1; $i -le 6; $i++) {
        $svgContent = Generate-ObsSVG -Type $ch.type -Colors $ch.colors -Level $i
        $FilePath = Join-Path $DirPath "obs_l0$i.svg"
        $svgContent | Out-File -FilePath $FilePath -Encoding utf8
    }
    Write-Host "Generated obstacles for $dirName"
}
