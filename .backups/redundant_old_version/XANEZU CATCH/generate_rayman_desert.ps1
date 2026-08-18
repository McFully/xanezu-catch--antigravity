$AssetsDir = Join-Path $PSScriptRoot "assets"
$ChDir = "2-desierto-dorado"
$DirPath = Join-Path $AssetsDir $ChDir | Join-Path -ChildPath "personaje"

if (-not (Test-Path $DirPath)) { New-Item -ItemType Directory -Path $DirPath | Out-Null }

$Skin = "#FF9800"
$Belly = "#FFCC80"
$Hat = "#0000CD" # Nemes Blue
$Gold = "#FFD700" 
$Shoe = "#8B4513"
$Glove = "#FFFFFF"

function Generate-RaymanFrog {
    param($State)
    $W = 100
    $H = 100
    
    # Rayman style = Floating Hands and Feet (No arms/legs)
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
    $svg = "<g id='rayman_frog' filter='url(#dropShadow)'>"

    # --- FLOATING FEET (Rayman Style Shoes) ---
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

    # --- FLOATING HANDS (Rayman Style Big Gloves) ---
    if ($State -eq "catch") {
        # Reaching wide
        $svg += "<circle cx='$($cx - 45)' cy='$HandY' r='14' fill='$Glove'/>"
        $svg += "<circle cx='$($cx + 45)' cy='$HandY' r='14' fill='$Glove'/>"
    }
    elseif ($State -eq "up") {
        # Hands raised high
        $svg += "<circle cx='$($cx - 30)' cy='$HandY' r='12' fill='$Glove'/>"
        $svg += "<circle cx='$($cx + 30)' cy='$HandY' r='12' fill='$Glove'/>"
    }
    else {
        # Relaxed at sides
        $svg += "<circle cx='$($cx - 35)' cy='$HandY' r='12' fill='$Glove'/>"
        $svg += "<circle cx='$($cx + 35)' cy='$HandY' r='12' fill='$Glove'/>"
    }

    # --- BODY (Hovering torso) ---
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

    # --- EYES (Big Globes on Torso Rayman-Frog hybrid) ---
    $EyeDist = 18
    if ($State -eq "dn") { $EyeDist = 22; $EyeY = $BodyY - 5 }
    if ($State -eq "catch") { $EyeDist = 22 }

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

    $svg += $Mouth

    # --- THEMATIC CLOTHING: PHARAOH NEMES ---
    $HatY = $EyeY - 12
    # Nemes back drape
    $svg += "<path d='M$($cx - 30),$($HatY + 15) Q$cx,$($HatY - 45) $($cx + 30),$($HatY + 15) L$($cx + 42),$($HatY + 45) L$($cx + 20),$($HatY + 45) L$cx,$($HatY + 25) L$($cx - 20),$($HatY + 45) L$($cx - 42),$($HatY + 45) Z' fill='$Hat'/>"
    # Gold stripes
    $svg += "<path d='M$($cx - 22),$($HatY - 5) Q$cx,$($HatY - 35) $($cx + 22),$($HatY - 5) Z' fill='$Gold'/>"
    $svg += "<path d='M$($cx - 35),$($HatY + 30) L$($cx - 25),$($HatY + 30) L$($cx - 20),$($HatY + 45) L$($cx - 38),$($HatY + 45) Z' fill='$Gold'/>"
    $svg += "<path d='M$($cx + 35),$($HatY + 30) L$($cx + 25),$($HatY + 30) L$($cx + 20),$($HatY + 45) L$($cx + 38),$($HatY + 45) Z' fill='$Gold'/>"
    
    # Snake emblem
    $svg += "<polygon points='$cx,$($EyeY - 20) $($cx-5),$($EyeY-5) $($cx+5),$($EyeY-5)' fill='$Gold'/>"
    $svg += "<circle cx='$cx' cy='$($EyeY - 22)' r='3' fill='#F00'/>"

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

$States = @(
    @{ suffix = ""; name = "normal" },
    @{ suffix = "_up"; name = "up" },
    @{ suffix = "_dn"; name = "dn" },
    @{ suffix = "_c"; name = "catch" }
)

foreach ($st in $States) {
    $svgContent = Generate-RaymanFrog -State $st.name
    $fileName = "frog$($st.suffix).svg"
    $FilePath = Join-Path $DirPath $fileName
    $svgContent | Out-File -FilePath $FilePath -Encoding utf8
}

Write-Host "Personaje Rayman-Pharaoh generado para el Desierto Dorado!"
