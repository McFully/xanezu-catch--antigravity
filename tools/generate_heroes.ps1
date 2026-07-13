$AssetsDir = Join-Path $PSScriptRoot "assets"

$Heroes = @(
    @{ 
        idx = 1; dir = '1-selva-tropical'; 
        desc = "Explorador"; 
        skin = "#FFCC99"; coat = "#8B5A2B"; hat = "#654321"; pants = "#556B2F" 
    },
    @{ 
        idx = 2; dir = '2-desierto-dorado'; 
        desc = "Faraón"; 
        skin = "#D2B48C"; coat = "#FFD700"; hat = "#0000CD"; pants = "#FFFFFF" 
    },
    @{ 
        idx = 3; dir = '3-japon-feudal'; 
        desc = "Ninja"; 
        skin = "#FFE4E1"; coat = "#1C1C1C"; hat = "#1C1C1C"; pants = "#0A0A0A" 
    },
    @{ 
        idx = 4; dir = '4-bosque-encantado'; 
        desc = "Mago"; 
        skin = "#E6E6FA"; coat = "#4B0082"; hat = "#2F4F4F"; pants = "#483D8B" 
    },
    @{ 
        idx = 5; dir = '5-pantano-maldito'; 
        desc = "Aldeano"; 
        skin = "#F5DEB3"; coat = "#8B4513"; hat = "#DEB887"; pants = "#A0522D" 
    },
    @{ 
        idx = 6; dir = '6-fabrica-de-juguetes'; 
        desc = "Muñeco de trapo"; 
        skin = "#D2B48C"; coat = "#FF6347"; hat = "#4682B4"; pants = "#32CD32" 
    },
    @{ 
        idx = 7; dir = '7-fiesta-mexicana'; 
        desc = "Mariachi Calavera"; 
        skin = "#FFFFFF"; coat = "#000000"; hat = "#000000"; pants = "#000000"; accent = "#FF0000" 
    },
    @{ 
        idx = 8; dir = '8-reino-glacial'; 
        desc = "Esquimal"; 
        skin = "#FFE4C4"; coat = "#B0E0E6"; hat = "#FFFFFF"; pants = "#5F9EA0" 
    }
)

function Generate-Hero {
    param($HeroData, $State)
    $W = 100
    $H = 100
    
    $Skin = $HeroData.skin
    $Coat = $HeroData.coat
    $Hat = $HeroData.hat
    $Pants = $HeroData.pants
    $Type = $HeroData.idx

    # State offsets
    $HeadY = 25
    $ArmsY = 60
    $LegsY = 85
    $Mouth = ""
    $Eyes = ""

    if ($State -eq "up") { 
        $ArmsY = 40; $LegsY = 90; $HeadY = 20 
        $Mouth = "<path d='M45,40 Q50,45 55,40' stroke='#333' stroke-width='2' fill='none'/>"
        $Eyes = "<line x1='40' y1='30' x2='46' y2='28' stroke='#333' stroke-width='3'/><line x1='60' y1='30' x2='54' y2='28' stroke='#333' stroke-width='3'/>"
    }
    elseif ($State -eq "dn") { 
        $ArmsY = 70; $LegsY = 75; $HeadY = 30 
        $Mouth = "<circle cx='50' cy='45' r='4' fill='#333'/>"
        $Eyes = "<circle cx='42' cy='32' r='4' fill='#333'/><circle cx='58' cy='32' r='4' fill='#333'/>"
    }
    elseif ($State -eq "catch") { 
        $ArmsY = 45; $HeadY = 25; $W = 120 # Wider for catching
        $Mouth = "<path d='M42,40 Q50,55 58,40 Z' fill='#900'/>"
        $Eyes = "<circle cx='40' cy='30' r='5' fill='#333'/><circle cx='60' cy='30' r='5' fill='#333'/>"
        $Skin = "#FFB6C1" # Blush
    }
    else { 
        $Mouth = "<path d='M45,45 Q50,50 55,45' stroke='#333' stroke-width='2' fill='none'/>"
        $Eyes = "<circle cx='42' cy='32' r='3' fill='#333'/><circle cx='58' cy='32' r='3' fill='#333'/>"
    }

    $svg = "<g>"

    # --- LEGS ---
    if ($State -eq "up") {
        $svg += "<rect x='35' y='70' width='10' height='25' fill='$Pants' rx='5'/>"
        $svg += "<rect x='55' y='70' width='10' height='25' fill='$Pants' rx='5'/>"
    }
    elseif ($State -eq "dn") {
        $svg += "<rect x='30' y='70' width='14' height='15' fill='$Pants' rx='5'/>"
        $svg += "<rect x='56' y='70' width='14' height='15' fill='$Pants' rx='5'/>"
    }
    else {
        $svg += "<rect x='38' y='70' width='10' height='20' fill='$Pants' rx='5'/>"
        $svg += "<rect x='52' y='70' width='10' height='20' fill='$Pants' rx='5'/>"
    }

    # --- BODY ---
    $svg += "<rect x='30' y='45' width='40' height='30' fill='$Coat' rx='10'/>"
    
    # Detail on body based on type
    if ($Type -eq 1) {
        # Explorer
        $svg += "<line x1='35' y1='45' x2='65' y2='75' stroke='#5c3a21' stroke-width='3'/>" # Strap
        $svg += "<rect x='40' y='55' width='20' height='15' fill='#e2cdb3' rx='2'/>" # Shirt
    }
    elseif ($Type -eq 2) {
        # Pharaoh
        $svg += "<path d='M30,45 L70,45 L60,60 L40,60 Z' fill='#1E90FF'/>" # Collar
        $svg += "<path d='M35,45 L65,45 L55,55 L45,55 Z' fill='#FFD700'/>"
    }
    elseif ($Type -eq 3) {
        # Ninja
        $svg += "<line x1='30' y1='45' x2='70' y2='75' stroke='#8B0000' stroke-width='4'/>" # Sash
    }
    elseif ($Type -eq 6) {
        # Ragdoll
        $svg += "<line x1='50' y1='45' x2='50' y2='75' stroke='#333' stroke-width='2' stroke-dasharray='4'/>" # Stitches
    }
    elseif ($Type -eq 7) {
        # Mariachi
        $svg += "<rect x='45' y='45' width='10' height='30' fill='#FFF'/>" # Shirt
        $svg += "<circle cx='50' cy='50' r='2' fill='$($HeroData.accent)'/>" # Buttons
        $svg += "<circle cx='50' cy='60' r='2' fill='$($HeroData.accent)'/>"
        $svg += "<line x1='35' y1='45' x2='65' y2='75' stroke='$($HeroData.accent)' stroke-width='2'/>"
    }

    # --- ARMS ---
    if ($State -eq "catch") {
        $svg += "<rect x='10' y='40' width='25' height='10' fill='$Coat' rx='5'/>" # Left reaching
        $svg += "<rect x='65' y='40' width='25' height='10' fill='$Coat' rx='5'/>" # Right reaching
        $svg += "<circle cx='10' cy='45' r='6' fill='$Skin'/>" # Hands
        $svg += "<circle cx='90' cy='45' r='6' fill='$Skin'/>"
    }
    elseif ($State -eq "up") {
        $svg += "<rect x='20' y='30' width='10' height='25' fill='$Coat' rx='5'/>" # Arms up
        $svg += "<rect x='70' y='30' width='10' height='25' fill='$Coat' rx='5'/>"
        $svg += "<circle cx='25' cy='30' r='6' fill='$Skin'/>"
        $svg += "<circle cx='75' cy='30' r='6' fill='$Skin'/>"
    }
    else {
        $svg += "<rect x='20' y='45' width='10' height='25' fill='$Coat' rx='5'/>" # Normal
        $svg += "<rect x='70' y='45' width='10' height='25' fill='$Coat' rx='5'/>"
        $svg += "<circle cx='25' cy='65' r='6' fill='$Skin'/>"
        $svg += "<circle cx='75' cy='65' r='6' fill='$Skin'/>"
    }

    # --- HEAD ---
    $svg += "<circle cx='50' cy='$HeadY' r='18' fill='$Skin'/>"

    # Head details per type
    if ($Type -eq 1) {
        # Explorer hat (Fedora)
        $svg += "<ellipse cx='50' cy='$($HeadY - 5)' rx='25' ry='6' fill='$Hat'/>"
        $svg += "<path d='M35,$($HeadY - 5) Q50,$($HeadY - 25) 65,$($HeadY - 5) Z' fill='$Hat'/>"
    }
    elseif ($Type -eq 2) {
        # Pharaoh Nemes
        $svg += "<path d='M25,$($HeadY) Q50,$($HeadY - 30) 75,$($HeadY) L70,$($HeadY + 20) L60,$($HeadY + 5) L40,$($HeadY + 5) L30,$($HeadY + 20) Z' fill='$Hat'/>"
        $svg += "<path d='M30,$($HeadY - 5) Q50,$($HeadY - 25) 70,$($HeadY - 5) Z' fill='#FFD700'/>"
    }
    elseif ($Type -eq 3) {
        # Ninja hood
        $svg += "<circle cx='50' cy='$HeadY' r='19' fill='$Hat'/>"
        $svg += "<rect x='35' y='$($HeadY - 5)' width='30' height='12' fill='$Skin'/>" # Eye opening
    }
    elseif ($Type -eq 4) {
        # Wizard Hat
        $svg += "<ellipse cx='50' cy='$($HeadY - 8)' rx='22' ry='5' fill='$Hat'/>"
        $svg += "<polygon points='35,$($HeadY - 8) 65,$($HeadY - 8) 50,$($HeadY - 35)' fill='$Hat'/>"
        $svg += "<circle cx='50' cy='$($HeadY - 35)' r='3' fill='#FFD700'/>" # Hat star
    }
    elseif ($Type -eq 5) {
        # Villager straw hat
        $svg += "<ellipse cx='50' cy='$($HeadY - 10)' rx='24' ry='8' fill='$Hat'/>"
        $svg += "<ellipse cx='50' cy='$($HeadY - 15)' rx='14' ry='8' fill='$Hat'/>"
    }
    elseif ($Type -eq 6) {
        # Ragdoll (Button eyes)
        $Eyes = "<circle cx='42' cy='32' r='4' fill='#333'/><circle cx='58' cy='32' r='4' fill='#333'/><line x1='40' y1='30' x2='44' y2='34' stroke='#FFF'/><line x1='44' y1='30' x2='40' y2='34' stroke='#FFF'/><line x1='56' y1='30' x2='60' y2='34' stroke='#FFF'/><line x1='60' y1='30' x2='56' y2='34' stroke='#FFF'/>"
    }
    elseif ($Type -eq 7) {
        # Mariachi Sombrero
        $Eyes = "<circle cx='40' cy='32' r='5' fill='#000'/><circle cx='60' cy='32' r='5' fill='#000'/><circle cx='40' cy='32' r='2' fill='#FF0000'/><circle cx='60' cy='32' r='2' fill='#FF0000'/>"
        $svg += "<ellipse cx='50' cy='$($HeadY - 5)' rx='32' ry='8' fill='$Hat'/>"
        $svg += "<path d='M30,$($HeadY - 5) Q50,$($HeadY - 25) 70,$($HeadY - 5) Z' fill='$Hat'/>"
        $svg += "<ellipse cx='50' cy='$($HeadY - 5)' rx='28' ry='6' fill='none' stroke='$($HeroData.accent)' stroke-width='2'/>"
    }
    elseif ($Type -eq 8) {
        # Eskimo hood
        $svg += "<circle cx='50' cy='$HeadY' r='21' fill='$Coat'/>"
        $svg += "<circle cx='50' cy='$HeadY' r='18' fill='#FFF'/>" # Fur rim
        $svg += "<circle cx='50' cy='$HeadY' r='14' fill='$Skin'/>" # Face inner
    }

    # Eyes & Mouth
    if ($Type -ne 3 -or $State -ne "up") {
        # Ninja hiding face partially
        $svg += $Eyes
        $svg += $Mouth
    }

    $svg += "</g>"

    # Render shading for AAA feel
    $Lighting = "<rect x='0' y='0' width='$W' height='$H' fill='url(#charGlow)' style='mix-blend-mode: overlay;'/>"
    $Lighting += "<circle cx='30' cy='20' r='40' fill='white' opacity='0.15' filter='url(#blurLighting)'/>"

    $Defs = @"
    <defs>
        <radialGradient id="charGlow" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0.2"/>
        </radialGradient>
        <filter id="blurLighting">
            <feGaussianBlur stdDeviation="5"/>
        </filter>
        <filter id="dropShadow">
            <feDropShadow dx="0" dy="8" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
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

Write-Host "Iniciando generación de personajes AAA..."

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
        $svgContent = Generate-Hero -HeroData $ch -State $st.name
        $fileName = "frog$($st.suffix).svg"
        $FilePath = Join-Path $DirPath $fileName
        $svgContent | Out-File -FilePath $FilePath -Encoding utf8
    }
    Write-Host "Generados 4 sprites ultra detallados para $($ch.desc) ($dirName)"
}

Write-Host "Generación de personajes completada con éxito."
