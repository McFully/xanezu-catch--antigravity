$AssetsDir = Join-Path $PSScriptRoot "assets"

$Heroes = @(
    @{ 
        idx = 1; dir = '1-selva-tropical'; desc = "Rana Exploradora"; 
        skin = "#4CAF50"; belly = "#81C784"; hat = "#654321"; detail = "fedora"; glove = "#C19A6B"; shoe = "#3E2723"
    },
    @{ 
        idx = 2; dir = '2-desierto-dorado'; desc = "Rana Faraón"; 
        skin = "#FF9800"; belly = "#FFCC80"; hat = "#0000CD"; detail = "nemes"; glove = "#FFFFFF"; shoe = "#8B4513"
    },
    @{ 
        idx = 3; dir = '3-japon-feudal'; desc = "Rana Ninja"; 
        skin = "#f44336"; belly = "#ef9a9a"; hat = "#1C1C1C"; detail = "hood"; glove = "#1C1C1C"; shoe = "#0A0A0A"
    },
    @{ 
        idx = 4; dir = '4-bosque-encantado'; desc = "Rana Mago"; 
        skin = "#9c27b0"; belly = "#ce93d8"; hat = "#4B0082"; detail = "wizard"; glove = "#FFFFFF"; shoe = "#6A5ACD"
    },
    @{ 
        idx = 5; dir = '5-pantano-maldito'; desc = "Rana Aldeana"; 
        skin = "#827717"; belly = "#cddc39"; hat = "#DEB887"; detail = "straw"; glove = "#D2B48C"; shoe = "#5C4033"
    },
    @{ 
        idx = 6; dir = '6-fabrica-de-juguetes'; desc = "Rana Muñeco"; 
        skin = "#03a9f4"; belly = "#81d4fa"; hat = "#FF6347"; detail = "stitches"; glove = "#FFFFFF"; shoe = "#32CD32"
    },
    @{ 
        idx = 7; dir = '7-fiesta-mexicana'; desc = "Rana Mariachi"; 
        skin = "#ffeb3b"; belly = "#fff59d"; hat = "#000000"; detail = "sombrero"; glove = "#FFFFFF"; shoe = "#000000"
    },
    @{ 
        idx = 8; dir = '8-reino-glacial'; desc = "Rana Esquimal"; 
        skin = "#81d4fa"; belly = "#e1f5fe"; hat = "#FFFFFF"; detail = "fur_hood"; glove = "#808080"; shoe = "#5F9EA0"
    }
)

function Generate-RaymanHero {
    param($HeroData, $State)
    $W = 100
    $H = 100
    
    $Skin = $HeroData.skin
    $Belly = $HeroData.belly
    $Hat = $HeroData.hat
    $Detail = $HeroData.detail
    $Glove = $HeroData.glove
    $Shoe = $HeroData.shoe

    # Rayman style = Floating Hands and Feet
    $BodyY = 55
    $EyeY = 40
    $HandY = 65
    $FootY = 90
    
    $Mouth = "<path d='M35,60 Q50,70 65,60' stroke='#000' stroke-width='3' fill='none' stroke-linecap='round'/>"
    $Eyes = ""

    if ($State -eq "up") {
        $BodyY = 45
        $EyeY = 25
        $HandY = 20 # Hands UP in the air!
        $FootY = 95
        $Mouth = "<circle cx='50' cy='50' r='5' fill='#900'/>"
    }
    elseif ($State -eq "dn") {
        $BodyY = 70
        $EyeY = 65
        $HandY = 85
        $FootY = 95
        $Mouth = "<path d='M40,80 Q50,75 60,80' stroke='#000' stroke-width='3' fill='none'/>"
        $W = 120 # Squash horizontally
    }
    elseif ($State -eq "catch") {
        $BodyY = 50
        $EyeY = 40
        $HandY = 50 # Hands reaching out wide
        $Mouth = "<path d='M35,50 Q50,75 65,50 Z' fill='#900'/>"
        $W = 120
    }

    $cx = $W / 2
    $svg = "<g id='rayman_ch' filter='url(#dropShadow)'>"

    # --- FLOATING FEET ---
    if ($State -eq "up") {
        $svg += "<ellipse cx='$($cx - 20)' cy='$FootY' rx='12' ry='18' fill='$Shoe'/>"
        $svg += "<ellipse cx='$($cx + 20)' cy='$FootY' rx='12' ry='18' fill='$Shoe'/>"
    }
    elseif ($State -eq "dn") {
        $svg += "<ellipse cx='$($cx - 35)' cy='$FootY' rx='18' ry='8' fill='$Shoe'/>"
        $svg += "<ellipse cx='$($cx + 35)' cy='$FootY' rx='18' ry='8' fill='$Shoe'/>"
    }
    else {
        $svg += "<ellipse cx='$($cx - 25)' cy='$FootY' rx='15' ry='10' fill='$Shoe'/>"
        $svg += "<ellipse cx='$($cx + 25)' cy='$FootY' rx='15' ry='10' fill='$Shoe'/>"
    }

    # --- FLOATING HANDS ---
    if ($State -eq "catch") {
        $svg += "<circle cx='$($cx - 45)' cy='$HandY' r='14' fill='$Glove'/>"
        $svg += "<circle cx='$($cx + 45)' cy='$HandY' r='14' fill='$Glove'/>"
    }
    elseif ($State -eq "up") {
        $svg += "<circle cx='$($cx - 30)' cy='$HandY' r='12' fill='$Glove'/>"
        $svg += "<circle cx='$($cx + 30)' cy='$HandY' r='12' fill='$Glove'/>"
    }
    else {
        $svg += "<circle cx='$($cx - 35)' cy='$HandY' r='12' fill='$Glove'/>"
        $svg += "<circle cx='$($cx + 35)' cy='$HandY' r='12' fill='$Glove'/>"
    }

    # --- BODY (Torso) ---
    if ($State -eq "dn") {
        $svg += "<ellipse cx='$cx' cy='$BodyY' rx='40' ry='25' fill='$Skin'/>"
        $svg += "<ellipse cx='$cx' cy='$($BodyY + 5)' rx='25' ry='12' fill='$Belly'/>"
    }
    elseif ($State -eq "up") {
        $svg += "<ellipse cx='$cx' cy='$BodyY' rx='30' ry='40' fill='$Skin'/>"
        $svg += "<ellipse cx='$cx' cy='$($BodyY + 10)' rx='18' ry='22' fill='$Belly'/>"
    }
    else {
        $svg += "<circle cx='$cx' cy='$BodyY' r='35' fill='$Skin'/>"
        $svg += "<ellipse cx='$cx' cy='$($BodyY + 8)' rx='22' ry='18' fill='$Belly'/>"
    }

    # --- EYES (Big Globes on Torso) ---
    $EyeDist = 18
    if ($State -eq "dn") { $EyeDist = 22; $EyeY = $BodyY - 5 }
    if ($State -eq "catch") { $EyeDist = 22 }

    if ($Detail -ne "stitches") {
        $svg += "<circle cx='$($cx - $EyeDist)' cy='$EyeY' r='13' fill='#FFF'/>"
        $svg += "<circle cx='$($cx + $EyeDist)' cy='$EyeY' r='13' fill='#FFF'/>"
        
        # Pupils
        if ($State -eq "dn") {
            $svg += "<circle cx='$($cx - $EyeDist)' cy='$EyeY' r='5' fill='#000'/>"
            $svg += "<circle cx='$($cx + $EyeDist)' cy='$EyeY' r='5' fill='#000'/>"
        }
        elseif ($State -eq "catch") {
            $svg += "<circle cx='$($cx - $EyeDist + 2)' cy='$EyeY' r='6' fill='#000'/>"
            $svg += "<circle cx='$($cx + $EyeDist - 2)' cy='$EyeY' r='6' fill='#000'/>"
        }
        else {
            $svg += "<circle cx='$($cx - $EyeDist + 2)' cy='$EyeY' r='5' fill='#000'/>"
            $svg += "<circle cx='$($cx + $EyeDist - 2)' cy='$EyeY' r='5' fill='#000'/>"
        }
    }
    else {
        # Toy stitches eyes
        $svg += "<circle cx='$($cx - $EyeDist)' cy='$EyeY' r='12' fill='#4CAF50'/>"
        $svg += "<circle cx='$($cx + $EyeDist)' cy='$EyeY' r='12' fill='#FF5722'/>"
        $svg += "<line x1='$($cx - $EyeDist - 5)' y1='$($EyeY - 5)' x2='$($cx - $EyeDist + 5)' y2='$($EyeY + 5)' stroke='#000' stroke-width='3'/>"
        $svg += "<line x1='$($cx - $EyeDist - 5)' y1='$($EyeY + 5)' x2='$($cx - $EyeDist + 5)' y2='$($EyeY - 5)' stroke='#000' stroke-width='3'/>"
        
        $svg += "<line x1='$($cx + $EyeDist - 5)' y1='$($EyeY - 5)' x2='$($cx + $EyeDist + 5)' y2='$($EyeY + 5)' stroke='#000' stroke-width='3'/>"
        $svg += "<line x1='$($cx + $EyeDist - 5)' y1='$($EyeY + 5)' x2='$($cx + $EyeDist + 5)' y2='$($EyeY - 5)' stroke='#000' stroke-width='3'/>"
    }

    $svg += $Mouth

    # --- THEMATIC CLOTHING / HATS ---
    $HatY = $EyeY - 12
    if ($Detail -eq "fedora") {
        $svg += "<ellipse cx='$cx' cy='$HatY' rx='35' ry='8' fill='$Hat'/>"
        $svg += "<path d='M$($cx - 20),$HatY Q$cx,$($HatY - 30) $($cx + 20),$HatY Z' fill='$Hat'/>"
        $svg += "<path d='M$($cx - 20),$HatY Q$cx,$($HatY - 10) $($cx + 20),$HatY Z' fill='#8B0000'/>" # Hat band
    }
    elseif ($Detail -eq "nemes") { 
        # Pharaoh
        $svg += "<path d='M$($cx - 30),$($HatY + 15) Q$cx,$($HatY - 45) $($cx + 30),$($HatY + 15) L$($cx + 42),$($HatY + 45) L$($cx + 20),$($HatY + 45) L$cx,$($HatY + 25) L$($cx - 20),$($HatY + 45) L$($cx - 42),$($HatY + 45) Z' fill='$Hat'/>"
        $svg += "<path d='M$($cx - 22),$($HatY - 5) Q$cx,$($HatY - 35) $($cx + 22),$($HatY - 5) Z' fill='#FFD700'/>"
        $svg += "<path d='M$($cx - 35),$($HatY + 30) L$($cx - 25),$($HatY + 30) L$($cx - 20),$($HatY + 45) L$($cx - 38),$($HatY + 45) Z' fill='#FFD700'/>"
        $svg += "<path d='M$($cx + 35),$($HatY + 30) L$($cx + 25),$($HatY + 30) L$($cx + 20),$($HatY + 45) L$($cx + 38),$($HatY + 45) Z' fill='#FFD700'/>"
        $svg += "<polygon points='$cx,$($EyeY - 20) $($cx-5),$($EyeY-5) $($cx+5),$($EyeY-5)' fill='#FFD700'/>"
        $svg += "<circle cx='$cx' cy='$($EyeY - 22)' r='3' fill='#F00'/>"
    }
    elseif ($Detail -eq "hood") { 
        # Ninja
        $svg += "<path d='M$($cx - 40),$($BodyY + 10) Q$cx,$($HatY - 40) $($cx + 40),$($BodyY + 10) Z' fill='$Hat' opacity='0.9'/>"
        $svg += "<rect x='$($cx - 30)' y='$($EyeY - 15)' width='60' height='30' fill='$Skin' rx='10'/>" # Eye hole
        $svg += "<line x1='$($cx - 40)' y1='$BodyY' x2='$($cx + 40)' y2='$BodyY' stroke='#8B0000' stroke-width='6'/>" # Scarf
    }
    elseif ($Detail -eq "wizard") {
        $svg += "<ellipse cx='$cx' cy='$HatY' rx='32' ry='8' fill='$Hat'/>"
        $svg += "<polygon points='$($cx - 20),$HatY $($cx + 20),$HatY $cx,$($HatY - 40)' fill='$Hat'/>"
        $svg += "<circle cx='$cx' cy='$($HatY - 20)' r='4' fill='#FFD700'/>"
    }
    elseif ($Detail -eq "straw") {
        $svg += "<ellipse cx='$cx' cy='$($HatY + 5)' rx='35' ry='10' fill='$Hat'/>"
        $svg += "<ellipse cx='$cx' cy='$HatY' rx='20' ry='12' fill='$Hat'/>"
    }
    elseif ($Detail -eq "stitches") {
        # Toy details (torso stitches)
        $svg += "<line x1='$cx' y1='$($BodyY - 20)' x2='$cx' y2='$($BodyY + 30)' stroke='#333' stroke-width='3' stroke-dasharray='4'/>"
        $svg += "<rect x='$($cx - 25)' y='$($BodyY + 5)' width='15' height='15' fill='#FFEB3B' rx='2' transform='rotate(15 $($cx - 17) $($BodyY + 12))'/>"
        $svg += "<line x1='$($cx - 27)' y1='$($BodyY + 7)' x2='$($cx - 10)' y2='$($BodyY + 7)' stroke='#000'/>"
    }
    elseif ($Detail -eq "sombrero") {
        $svg += "<ellipse cx='$cx' cy='$HatY' rx='45' ry='12' fill='$Hat'/>"
        $svg += "<path d='M$($cx - 25),$HatY Q$cx,$($HatY - 40) $($cx + 25),$HatY Z' fill='$Hat'/>"
        $svg += "<ellipse cx='$cx' cy='$HatY' rx='40' ry='9' fill='none' stroke='#FF0000' stroke-width='2'/>"
    }
    elseif ($Detail -eq "fur_hood") {
        $svg += "<circle cx='$cx' cy='$($EyeY)' r='30' fill='#B0E0E6'/>" # Hood
        $svg += "<circle cx='$cx' cy='$($EyeY)' r='22' fill='#FFFFFF' stroke='#DDDDDD' stroke-width='4'/>" # Fur Rim
        $svg += "<circle cx='$cx' cy='$($EyeY)' r='18' fill='$Skin'/>" # Face inner
    }

    $svg += "</g>"

    # 3D AAA Lighting overlay
    $Lighting = "<circle cx='$($cx - 15)' cy='$($BodyY - 15)' r='30' fill='white' opacity='0.15' filter='url(#blurLighting)'/>"

    $Defs = @"
    <defs>
        <filter id="blurLighting">
            <feGaussianBlur stdDeviation="6"/>
        </filter>
        <filter id="dropShadow">
            <feDropShadow dx="0" dy="8" stdDeviation="4" flood-color="#000" flood-opacity="0.35"/>
        </filter>
    </defs>
"@

    return @"
<svg xmlns="http://www.w3.org/2000/svg" width="$W" height="$H" viewBox="0 0 $W $H">
    $Defs
    $svg
    $Lighting
</svg>
"@
}

Write-Host "Generando Ranas estilo RAYMAN para TODO el juego..."

$States = @(
    @{ suffix = ""; name = "normal" },
    @{ suffix = "_up"; name = "up" },
    @{ suffix = "_dn"; name = "dn" },
    @{ suffix = "_c"; name = "catch" }
)

foreach ($ch in $Heroes) {
    $dirName = $ch.dir
    $DirPath = Join-Path $AssetsDir $dirName | Join-Path -ChildPath "personaje"
    if (-not (Test-Path $DirPath)) {
        New-Item -ItemType Directory -Path $DirPath | Out-Null
    }

    foreach ($st in $States) {
        $svgContent = Generate-RaymanHero -HeroData $ch -State $st.name
        $fileName = "frog$($st.suffix).svg"
        $FilePath = Join-Path $DirPath $fileName
        $svgContent | Out-File -FilePath $FilePath -Encoding utf8
    }
    Write-Host "Recreado torso Rayman: $($ch.desc) ($dirName)"
}

Write-Host "Re-imaginacion estilo Rayman para TODAS las ranas terminada!"
