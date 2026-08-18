$AssetsDir = Join-Path $PSScriptRoot "assets"

$Heroes = @(
    @{ 
        idx = 1; dir = '1-selva-tropical'; desc = "Rana Exploradora"; 
        skin = "#4CAF50"; belly = "#81C784"; hat = "#654321"; detail = "fedora"
    },
    @{ 
        idx = 2; dir = '2-desierto-dorado'; desc = "Rana Faraón"; 
        skin = "#FF9800"; belly = "#FFCC80"; hat = "#0000CD"; detail = "nemes"
    },
    @{ 
        idx = 3; dir = '3-japon-feudal'; desc = "Rana Ninja"; 
        skin = "#f44336"; belly = "#ef9a9a"; hat = "#1C1C1C"; detail = "hood"
    },
    @{ 
        idx = 4; dir = '4-bosque-encantado'; desc = "Rana Mago"; 
        skin = "#9c27b0"; belly = "#ce93d8"; hat = "#4B0082"; detail = "wizard"
    },
    @{ 
        idx = 5; dir = '5-pantano-maldito'; desc = "Rana Aldeana"; 
        skin = "#827717"; belly = "#cddc39"; hat = "#DEB887"; detail = "straw"
    },
    @{ 
        idx = 6; dir = '6-fabrica-de-juguetes'; desc = "Rana Muñeco"; 
        skin = "#03a9f4"; belly = "#81d4fa"; hat = "#FF6347"; detail = "stitches"
    },
    @{ 
        idx = 7; dir = '7-fiesta-mexicana'; desc = "Rana Mariachi"; 
        skin = "#ffeb3b"; belly = "#fff59d"; hat = "#000000"; detail = "sombrero"
    },
    @{ 
        idx = 8; dir = '8-reino-glacial'; desc = "Rana Esquimal"; 
        skin = "#81d4fa"; belly = "#e1f5fe"; hat = "#FFFFFF"; detail = "fur_hood"
    }
)

function Generate-FrogHero {
    param($HeroData, $State)
    $W = 100
    $H = 100
    
    $Skin = $HeroData.skin
    $Belly = $HeroData.belly
    $Hat = $HeroData.hat
    $Detail = $HeroData.detail

    # --- BASE ANIMATION OFFSETS ---
    $BodyY = 50
    $EyeY = 40
    $ArmY = 60
    $LegY = 80
    
    $Mouth = "<path d='M35,55 Q50,65 65,55' stroke='#000' stroke-width='3' fill='none' stroke-linecap='round'/>"
    $Eyes = ""
    $Cheeks = ""

    if ($State -eq "up") {
        $BodyY = 40
        $EyeY = 25
        $ArmY = 35
        $LegY = 85
        $Mouth = "<circle cx='50' cy='45' r='5' fill='#900'/>"
    }
    elseif ($State -eq "dn") {
        $BodyY = 65
        $EyeY = 60
        $ArmY = 75
        $LegY = 85
        $Mouth = "<path d='M40,75 Q50,70 60,75' stroke='#000' stroke-width='3' fill='none'/>"
        $W = 120 # Squash horizontally
    }
    elseif ($State -eq "catch") {
        $BodyY = 45
        $EyeY = 35
        $ArmY = 45
        $Mouth = "<path d='M35,45 Q50,70 65,45 Z' fill='#900'/>"
        $Cheeks = "<circle cx='20' cy='50' r='10' fill='#FF1493' opacity='0.5'/><circle cx='80' cy='50' r='10' fill='#FF1493' opacity='0.5'/>"
        $W = 120
    }
    else {
        # Normal
        $Cheeks = "<circle cx='25' cy='50' r='6' fill='#FF69B4' opacity='0.4'/><circle cx='75' cy='50' r='6' fill='#FF69B4' opacity='0.4'/>"
    }

    $cx = $W / 2
    $svg = "<g id='frog_ch'>"

    # --- LEGS ---
    if ($State -eq "up") {
        $svg += "<rect x='$($cx - 25)' y='$LegY' width='12' height='25' fill='$Skin' rx='6'/>"
        $svg += "<rect x='$($cx + 13)' y='$LegY' width='12' height='25' fill='$Skin' rx='6'/>"
    }
    elseif ($State -eq "dn") {
        $svg += "<ellipse cx='$($cx - 30)' cy='$LegY' rx='15' ry='8' fill='$Skin'/>"
        $svg += "<ellipse cx='$($cx + 30)' cy='$LegY' rx='15' ry='8' fill='$Skin'/>"
    }
    else {
        $svg += "<ellipse cx='$($cx - 25)' cy='$LegY' rx='15' ry='10' fill='$Skin'/>"
        $svg += "<ellipse cx='$($cx + 25)' cy='$LegY' rx='15' ry='10' fill='$Skin'/>"
    }

    # --- BODY (Squash & Stretch) ---
    if ($State -eq "dn") {
        $svg += "<ellipse cx='$cx' cy='$BodyY' rx='45' ry='30' fill='$Skin'/>"
        $svg += "<ellipse cx='$cx' cy='$($BodyY + 5)' rx='30' ry='15' fill='$Belly'/>"
    }
    elseif ($State -eq "up") {
        $svg += "<ellipse cx='$cx' cy='$BodyY' rx='35' ry='45' fill='$Skin'/>"
        $svg += "<ellipse cx='$cx' cy='$($BodyY + 10)' rx='20' ry='25' fill='$Belly'/>"
    }
    else {
        $svg += "<circle cx='$cx' cy='$BodyY' r='40' fill='$Skin'/>"
        $svg += "<ellipse cx='$cx' cy='$($BodyY + 10)' rx='25' ry='20' fill='$Belly'/>"
    }

    # --- ARMS ---
    if ($State -eq "catch") {
        # Reaching wide
        $svg += "<path d='M$($cx - 30),$ArmY Q$($cx - 60),$($ArmY - 10) $($cx - 50),$($ArmY - 20)' fill='none' stroke='$Skin' stroke-width='10' stroke-linecap='round'/>"
        $svg += "<path d='M$($cx + 30),$ArmY Q$($cx + 60),$($ArmY - 10) $($cx + 50),$($ArmY - 20)' fill='none' stroke='$Skin' stroke-width='10' stroke-linecap='round'/>"
    }
    elseif ($State -eq "up") {
        # Arms raised
        $svg += "<rect x='$($cx - 35)' y='$ArmY' width='10' height='25' fill='$Skin' rx='5'/>"
        $svg += "<rect x='$($cx + 25)' y='$ArmY' width='10' height='25' fill='$Skin' rx='5'/>"
    }
    else {
        # Relaxed or squatting
        $svg += "<ellipse cx='$($cx - 35)' cy='$ArmY' rx='8' ry='15' fill='$Skin'/>"
        $svg += "<ellipse cx='$($cx + 35)' cy='$ArmY' rx='8' ry='15' fill='$Skin'/>"
    }

    # --- EYES (Frog style big globes) ---
    $EyeDist = 20
    if ($State -eq "dn") { $EyeDist = 25; $EyeY = $BodyY - 10 }
    if ($State -eq "catch") { $EyeDist = 25 }

    if ($Detail -ne "stitches") {
        $svg += "<circle cx='$($cx - $EyeDist)' cy='$EyeY' r='14' fill='#FFF'/>"
        $svg += "<circle cx='$($cx + $EyeDist)' cy='$EyeY' r='14' fill='#FFF'/>"
        # Pupils
        if ($State -eq "dn") {
            $svg += "<circle cx='$($cx - $EyeDist)' cy='$EyeY' r='5' fill='#000'/>"
            $svg += "<circle cx='$($cx + $EyeDist)' cy='$EyeY' r='5' fill='#000'/>"
        }
        elseif ($State -eq "catch") {
            # Stars/Hearts eyes can be fun, but regular big pupils for catching
            $svg += "<circle cx='$($cx - $EyeDist + 3)' cy='$EyeY' r='7' fill='#000'/>"
            $svg += "<circle cx='$($cx + $EyeDist - 3)' cy='$EyeY' r='7' fill='#000'/>"
        }
        else {
            $svg += "<circle cx='$($cx - $EyeDist + 2)' cy='$EyeY' r='6' fill='#000'/>"
            $svg += "<circle cx='$($cx + $EyeDist - 2)' cy='$EyeY' r='6' fill='#000'/>"
        }
    }
    else {
        # Toy stitches eyes
        $svg += "<circle cx='$($cx - $EyeDist)' cy='$EyeY' r='10' fill='#4CAF50'/>"
        $svg += "<circle cx='$($cx + $EyeDist)' cy='$EyeY' r='10' fill='#FF5722'/>"
        $svg += "<line x1='$($cx - $EyeDist - 5)' y1='$($EyeY - 5)' x2='$($cx - $EyeDist + 5)' y2='$($EyeY + 5)' stroke='#000' stroke-width='3'/>"
        $svg += "<line x1='$($cx - $EyeDist - 5)' y1='$($EyeY + 5)' x2='$($cx - $EyeDist + 5)' y2='$($EyeY - 5)' stroke='#000' stroke-width='3'/>"
        
        $svg += "<line x1='$($cx + $EyeDist - 5)' y1='$($EyeY - 5)' x2='$($cx + $EyeDist + 5)' y2='$($EyeY + 5)' stroke='#000' stroke-width='3'/>"
        $svg += "<line x1='$($cx + $EyeDist - 5)' y1='$($EyeY + 5)' x2='$($cx + $EyeDist + 5)' y2='$($EyeY - 5)' stroke='#000' stroke-width='3'/>"
    }

    $svg += $Mouth
    $svg += $Cheeks

    # --- THEMATIC CLOTHING / HATS ---
    $HatY = $EyeY - 15
    if ($Detail -eq "fedora") {
        $svg += "<ellipse cx='$cx' cy='$HatY' rx='35' ry='8' fill='$Hat'/>"
        $svg += "<path d='M$($cx - 20),$HatY Q$cx,$($HatY - 30) $($cx + 20),$HatY Z' fill='$Hat'/>"
        $svg += "<path d='M$($cx - 20),$HatY Q$cx,$($HatY - 10) $($cx + 20),$HatY Z' fill='#8B0000'/>" # Hat band
    }
    elseif ($Detail -eq "nemes") {
        # Pharaoh
        $svg += "<path d='M$($cx - 30),$($HatY + 10) Q$cx,$($HatY - 40) $($cx + 30),$($HatY + 10) L$($cx + 40),$($HatY + 40) L$($cx + 20),$($HatY + 40) L$cx,$($HatY + 20) L$($cx - 20),$($HatY + 40) L$($cx - 40),$($HatY + 40) Z' fill='$Hat'/>"
        $svg += "<path d='M$($cx - 20),$($HatY - 5) Q$cx,$($HatY - 30) $($cx + 20),$($HatY - 5) Z' fill='#FFD700'/>"
        $svg += "<polygon points='$cx,$($EyeY - 10) $($cx-5),$($EyeY+5) $($cx+5),$($EyeY+5)' fill='#FFD700'/>" # Snake piece
    }
    elseif ($Detail -eq "hood") {
        # Ninja
        $svg += "<path d='M$($cx - 40),$($BodyY + 10) Q$cx,$($HeadY - 50) $($cx + 40),$($BodyY + 10) Z' fill='$Hat' opacity='0.9'/>"
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
        # Toy details
        $svg += "<line x1='$cx' y1='$($BodyY - 20)' x2='$cx' y2='$($BodyY + 30)' stroke='#333' stroke-width='3' stroke-dasharray='4'/>"
        # Patch
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
    # Removed <rect> overlay as HTML Canvas doesn't support mix-blend-mode well on SVGs and leaves a box
    $Lighting = "<circle cx='$($cx - 15)' cy='$($BodyY - 15)' r='30' fill='white' opacity='0.15' filter='url(#blurLighting)'/>"

    $Defs = @"
    <defs>
        <radialGradient id="charGlow" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0.3"/>
        </radialGradient>
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
    <g filter="url(#dropShadow)">
        $svg
    </g>
    $Lighting
</svg>
"@
}

Write-Host "Re-generando verdaderas Ranas Temáticas..."

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
        $svgContent = Generate-FrogHero -HeroData $ch -State $st.name
        $fileName = "frog$($st.suffix).svg"
        $FilePath = Join-Path $DirPath $fileName
        $svgContent | Out-File -FilePath $FilePath -Encoding utf8
    }
    Write-Host "Generadas 4 versiones de RANA para $($ch.desc) ($dirName)"
}

Write-Host "Generación de ARTE COMPLETADA. Las ranas han vuelto."
