$AssetsDir = Join-Path $PSScriptRoot "assets"

$Chapters = @(
    @{ dir = '1-selva-tropical'; colors = @('#2E7D32', '#1B5E20', '#388E3C', '#4CAF50') },
    @{ dir = '2-desierto-dorado'; colors = @('#E65100', '#F57C00', '#FF9800', '#FFB74D', '#BF360C') },
    @{ dir = '3-japon-feudal'; colors = @('#b71c1c', '#c62828', '#f44336', '#ffcdd2') },
    @{ dir = '4-bosque-encantado'; colors = @('#4a148c', '#6a1b9a', '#8e24aa', '#e1bee7', '#26c6da') },
    @{ dir = '5-pantano-maldito'; colors = @('#1b5e20', '#33691e', '#827717', '#9e9d24', '#004d40') },
    @{ dir = '6-fabrica-de-juguetes'; colors = @('#01579b', '#0277bd', '#0288d1', '#03a9f4', '#fbc02d', '#d32f2f') },
    @{ dir = '7-fiesta-mexicana'; colors = @('#bf360c', '#d84315', '#e64a19', '#f4511e', '#ffeb3b', '#4caf50') },
    @{ dir = '8-reino-glacial'; colors = @('#01579b', '#0277bd', '#03a9f4', '#4fc3f7', '#81d4fa', '#e1f5fe') }
)

function Generate-LevelSVG {
    param($Type, $Colors, $Level)
    $svgo = ""
    $svgEnd = ""

    if ($Type -match 'desierto') {
        if ($Level -eq 1) {
            $svgo += "<path d='M 200,600 Q 250,550 300,600 Z' fill='$($Colors[0])'/><path d='M 800,620 Q 860,540 920,620 Z' fill='$($Colors[1])'/>"
        } elseif ($Level -eq 2) {
            $svgo += "<rect x='300' y='450' width='80' height='200' fill='$($Colors[0])'/><rect x='380' y='400' width='60' height='250' fill='$($Colors[1])'/><rect x='800' y='420' width='70' height='230' fill='$($Colors[0])'/>"
        } elseif ($Level -eq 3) {
            $svgo += "<circle cx='400' cy='500' r='150' fill='$($Colors[2])' opacity='0.6'/><polygon points='500,650 600,450 700,650' fill='$($Colors[3])'/>"
        } elseif ($Level -eq 4) {
            $svgo += "<path d='M 100,500 L 200,600 L 0,600 Z' fill='$($Colors[0])'/><path d='M 1000,400 L 1150,650 L 850,650 Z' fill='$($Colors[1])'/>"
        } elseif ($Level -eq 5) {
            $svgo += "<rect x='500' y='350' width='20' height='300' fill='$($Colors[0])'/><rect x='450' y='320' width='120' height='30' fill='$($Colors[1])'/>"
        } elseif ($Level -eq 6) {
            $svgo += "<path d='M 200,600 Q 640,300 1080,600' stroke='$($Colors[4])' stroke-width='30' fill='none'/>"
        }
    }
    elseif ($Type -match 'selva') {
        for ($i = 0; $i -lt (3 + $Level); $i++) {
            $x = (100 + $i * 200 + $Level * 50) % 1200
            $svgo += "<rect x='$x' y='300' width='40' height='420' fill='$($Colors[0])'/><circle cx='$($x+20)' cy='300' r='$($80 + $Level*10)' fill='$($Colors[1])' opacity='0.8'/>"
        }
    }
    else {
        $c1 = $Colors[$Level % $Colors.Count]
        $c2 = $Colors[($Level + 1) % $Colors.Count]
        for ($i = 0; $i -lt ($Level + 2); $i++) {
            $x = (150 + $i * 300) % 1280
            $px1 = $x; $py1 = 600; $px2 = $x+100; $py2 = 350 - $Level*20; $px3 = $x+200; $py3 = 600;
            $cx = $x+100; $cy = 500 - $Level*10;
            $svgo += "<polygon points='$px1,$py1 $px2,$py2 $px3,$py3' fill='$c1' opacity='0.7'/><ellipse cx='$cx' cy='$cy' rx='60' ry='100' fill='$c2' opacity='0.5'/>"
        }
    }

    return @"
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    $svgo
</svg>
"@
}

foreach ($ch in $Chapters) {
    $dirName = $ch.dir
    $DirPath = Join-Path $AssetsDir $dirName | Join-Path -ChildPath "fondos"
    if (-not (Test-Path $DirPath)) {
        New-Item -ItemType Directory -Path $DirPath | Out-Null
    }

    for ($i = 1; $i -le 6; $i++) {
        $svgContent = Generate-LevelSVG -Type $dirName -Colors $ch.colors -Level $i
        $FilePath = Join-Path $DirPath "bg_l0$i.svg"
        $svgContent | Out-File -FilePath $FilePath -Encoding utf8
    }
    Write-Host "Generated backgrounds for $dirName"
}
