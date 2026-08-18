# ================================================================
#  GENERATE BACKGROUNDS - Capítulos 2-8
#  Genera fondos SVG en capas para los 8 capítulos del juego
# ================================================================

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# ── Configuración de Capítulos ─────────────────────────────────
$chapters = @{
  2 = @{
    dir       = "2-desierto-dorado"
    skyColors = @("#FF8C42", "#FFB347", "#E8D5A3")
    midColors = @("#C19A6B", "#D4A96A", "#8B6914")
    fgColors  = @("#8B4513", "#6B3410", "#A0522D")
    theme     = "desert"
  }
  3 = @{
    dir       = "3-japon-feudal"
    skyColors = @("#FFB7C5", "#FFCDD7", "#E8A4B0")
    midColors = @("#C44569", "#A8334A", "#8B1a2a")
    fgColors  = @("#4a1020", "#2d0a18", "#8B1a2a")
    theme     = "japan"
  }
  4 = @{
    dir       = "4-bosque-encantado"
    skyColors = @("#2d1b69", "#4a2d8a", "#6a3daa")
    midColors = @("#1a3a25", "#2d6a35", "#1a2a3a")
    fgColors  = @("#0d1a20", "#1a2d10", "#0a1510")
    theme     = "enchanted"
  }
  5 = @{
    dir       = "5-pantano-maldito"
    skyColors = @("#0d1a0d", "#1a2d10", "#0a1508")
    midColors = @("#1a3a10", "#2d5a18", "#1a2a0d")
    fgColors  = @("#0a1008", "#152010", "#0a150a")
    theme     = "swamp"
  }
  6 = @{
    dir       = "6-fabrica-de-juguetes"
    skyColors = @("#1a2a40", "#243060", "#2a3a70")
    midColors = @("#34495e", "#455a6e", "#2c3e50")
    fgColors  = @("#1a252f", "#0d1520", "#0a1218")
    theme     = "factory"
  }
  7 = @{
    dir       = "7-fiesta-mexicana"
    skyColors = @("#1a0a2a", "#2d1040", "#3d1550")
    midColors = @("#8B0000", "#CC1100", "#AA0a00")
    fgColors  = @("#3d0a00", "#200500", "#1a0000")
    theme     = "mexico"
  }
  8 = @{
    dir       = "8-reino-glacial"
    skyColors = @("#0d2a40", "#1a3d5c", "#0a2030")
    midColors = @("#1a4060", "#2255AA", "#1a3050")
    fgColors  = @("#0a1820", "#0d2030", "#06101a")
    theme     = "ice"
  }
}

function Get-DesertSVG($layer, $lvl, $ch) {
  if ($layer -eq "fondo_lejano") {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF8C42"/>
      <stop offset="60%" stop-color="#FFB347"/>
      <stop offset="100%" stop-color="#E8C875"/>
    </linearGradient>
    <radialGradient id="sun" cx="70%" cy="25%">
      <stop offset="0%" stop-color="#FFEE80"/>
      <stop offset="40%" stop-color="#FFD700" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#FF8C42" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <circle cx="1344" cy="200" r="280" fill="url(#sun)"/>
  <circle cx="1344" cy="200" r="90" fill="#FFEE80"/>
  <!-- Dune silhouettes far -->
  <ellipse cx="300" cy="900" rx="500" ry="200" fill="#C19A6B"/>
  <ellipse cx="900" cy="950" rx="700" ry="180" fill="#B8904A"/>
  <ellipse cx="1500" cy="920" rx="600" ry="190" fill="#C19A6B"/>
  <ellipse cx="1900" cy="960" rx="400" ry="160" fill="#B8904A"/>
  <!-- Pyramid silhouettes -->
  <polygon points="600,900 700,720 800,900" fill="#8B6914" opacity="0.7"/>
  <polygon points="1100,880 1240,660 1380,880" fill="#8B6914" opacity="0.6"/>
  <!-- Heat shimmer gradient -->
  <rect x="0" y="750" width="1920" height="100" fill="#FFD070" opacity="0.08"/>
</svg>
"@
  }
  elseif ($layer -eq "fondo_intermedio") {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#D4A96A" stop-opacity="0"/>
      <stop offset="60%" stop-color="#C19A6B"/>
      <stop offset="100%" stop-color="#8B6914"/>
    </linearGradient>
  </defs>
  <!-- Mid dunes with detail -->
  <path d="M0 700 Q200 600 400 680 Q600 760 800 640 Q1000 520 1200 620 Q1400 720 1600 640 Q1800 560 1920 660 L1920 1080 L0 1080Z" fill="url(#sand)"/>
  <!-- Cactus silhouettes -->
  <rect x="240" y="580" width="18" height="120" rx="9" fill="#3a6a1a"/>
  <rect x="218" y="620" width="40" height="12" rx="6" fill="#3a6a1a"/>
  <rect x="252" y="540" width="14" height="60" rx="7" fill="#3a6a1a"/>
  <rect x="1600" y="560" width="20" height="130" rx="10" fill="#3a6a1a"/>
  <rect x="1580" y="600" width="42" height="12" rx="6" fill="#3a6a1a"/>
  <!-- Sand ripples -->
  <path d="M0 900 Q480 880 960 900 Q1440 920 1920 900" stroke="#B8904A" stroke-width="3" fill="none" opacity="0.6"/>
  <path d="M0 930 Q480 910 960 930 Q1440 950 1920 930" stroke="#B8904A" stroke-width="2" fill="none" opacity="0.4"/>
</svg>
"@
  }
  elseif ($layer -eq "primer_plano") {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6B3410" stop-opacity="0"/>
      <stop offset="40%" stop-color="#8B4513"/>
      <stop offset="100%" stop-color="#3a1a05"/>
    </linearGradient>
  </defs>
  <!-- Sand floor close up -->
  <path d="M0 850 Q300 800 600 840 Q900 880 1200 820 Q1500 760 1920 830 L1920 1080 L0 1080Z" fill="url(#fg)"/>
  <!-- Rocks -->
  <ellipse cx="150" cy="870" rx="60" ry="35" fill="#7a4520"/>
  <ellipse cx="800" cy="840" rx="45" ry="25" fill="#7a4520"/>
  <ellipse cx="1500" cy="855" rx="55" ry="30" fill="#7a4520"/>
  <!-- Bone fragment -->
  <ellipse cx="400" cy="860" rx="20" ry="10" fill="#E8DCCA"/>
  <rect x="388" y="858" width="24" height="5" rx="2" fill="#E8DCCA"/>
</svg>
"@
  }
  else {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" opacity="0.5">
  <!-- Decoraciones: dunas lejanas decorativas -->
  <ellipse cx="960" cy="200" rx="1920" ry="80" fill="#FFD070" opacity="0.1"/>
  <!-- Heat haze lines -->
  <path d="M0 500 Q480 490 960 500 Q1440 510 1920 500" stroke="#FFAA44" stroke-width="2" fill="none" opacity="0.15"/>
  <path d="M0 520 Q480 510 960 520 Q1440 530 1920 520" stroke="#FFAA44" stroke-width="2" fill="none" opacity="0.1"/>
</svg>
"@
  }
}

function Get-JapanSVG($layer, $lvl) {
  if ($layer -eq "fondo_lejano") {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFB7C5"/>
      <stop offset="50%" stop-color="#FFCDD7"/>
      <stop offset="100%" stop-color="#FFDDE5"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <!-- Mount Fuji -->
  <polygon points="960,120 600,800 1320,800" fill="white"/>
  <polygon points="960,120 720,500 1200,500" fill="#E8E8E8"/>
  <!-- Fujis base -->
  <ellipse cx="960" cy="800" rx="500" ry="80" fill="#D4A0AA"/>
  <!-- Cherry blossoms tree silhouettes far -->
  <ellipse cx="200" cy="720" rx="120" ry="80" fill="#FFB7C5" opacity="0.8"/>
  <ellipse cx="200" cy="650" rx="90" ry="70" fill="#FFAABF" opacity="0.9"/>
  <rect x="190" y="720" width="20" height="120" rx="10" fill="#5a3a2a"/>
  <ellipse cx="1720" cy="720" rx="120" ry="80" fill="#FFB7C5" opacity="0.8"/>
  <ellipse cx="1720" cy="650" rx="90" ry="70" fill="#FFAABF" opacity="0.9"/>
  <rect x="1710" y="720" width="20" height="120" rx="10" fill="#5a3a2a"/>
  <!-- Torii gate silhouette -->
  <rect x="820" y="550" width="30" height="320" fill="#CC2200" opacity="0.7"/>
  <rect x="1070" y="550" width="30" height="320" fill="#CC2200" opacity="0.7"/>
  <rect x="800" y="540" width="320" height="25" rx="5" fill="#CC2200" opacity="0.7"/>
  <rect x="810" y="575" width="300" height="15" rx="5" fill="#CC2200" opacity="0.7"/>
</svg>
"@
  }
  elseif ($layer -eq "fondo_intermedio") {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#C44569" stop-opacity="0"/>
      <stop offset="50%" stop-color="#8B1a2a"/>
      <stop offset="100%" stop-color="#4a0a15"/>
    </linearGradient>
  </defs>
  <!-- Bamboo forest -->
  <rect x="100" y="400" width="14" height="680" rx="7" fill="#448844"/>
  <rect x="130" y="350" width="12" height="730" rx="6" fill="#336633"/>
  <rect x="160" y="420" width="14" height="660" rx="7" fill="#448844"/>
  <rect x="1750" y="380" width="14" height="700" rx="7" fill="#448844"/>
  <rect x="1780" y="420" width="12" height="660" rx="6" fill="#336633"/>
  <rect x="1810" y="360" width="14" height="720" rx="7" fill="#448844"/>
  <!-- Cherry blossom petals (mid) -->
  <ellipse cx="500" cy="500" rx="8" ry="5" fill="#FFB7C5" opacity="0.8" transform="rotate(20,500,500)"/>
  <ellipse cx="900" cy="400" rx="8" ry="5" fill="#FFB7C5" opacity="0.8" transform="rotate(-10,900,400)"/>
  <ellipse cx="1300" cy="450" rx="8" ry="5" fill="#FFAABF" opacity="0.8" transform="rotate(15,1300,450)"/>
  <!-- Ground -->
  <path d="M0 780 Q400 740 800 760 Q1200 780 1600 750 Q1760 740 1920 760 L1920 1080 L0 1080Z" fill="url(#ground)"/>
  <!-- Stone lanterns -->
  <rect x="600" y="680" width="20" height="90" rx="3" fill="#888"/>
  <rect x="590" y="680" width="40" height="15" rx="3" fill="#999"/>
  <rect x="596" y="695" width="28" height="50" rx="5" fill="#FFAA00" opacity="0.7"/>
  <rect x="590" y="744" width="40" height="10" rx="3" fill="#999"/>
  <rect x="1300" y="680" width="20" height="90" rx="3" fill="#888"/>
  <rect x="1290" y="680" width="40" height="15" rx="3" fill="#999"/>
  <rect x="1296" y="695" width="28" height="50" rx="5" fill="#FFAA00" opacity="0.7"/>
  <rect x="1290" y="744" width="40" height="10" rx="3" fill="#999"/>
</svg>
"@
  }
  elseif ($layer -eq "primer_plano") {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="fgj" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a0a15" stop-opacity="0"/>
      <stop offset="50%" stop-color="#3a0810"/>
      <stop offset="100%" stop-color="#1a0408"/>
    </linearGradient>
  </defs>
  <path d="M0 860 Q250 820 500 850 Q750 880 1000 840 Q1250 800 1500 850 Q1700 890 1920 855 L1920 1080 L0 1080Z" fill="url(#fgj)"/>
  <!-- Stones path -->
  <ellipse cx="200" cy="890" rx="50" ry="20" fill="#444" opacity="0.8"/>
  <ellipse cx="350" cy="905" rx="40" ry="18" fill="#555" opacity="0.7"/>
  <ellipse cx="600" cy="875" rx="55" ry="22" fill="#444" opacity="0.8"/>
  <!-- Sakura petals on ground -->
  <ellipse cx="400" cy="870" rx="6" ry="4" fill="#FFB7C5" opacity="0.6" transform="rotate(15,400,870)"/>
  <ellipse cx="900" cy="855" rx="6" ry="4" fill="#FFB7C5" opacity="0.6" transform="rotate(-20,900,855)"/>
  <ellipse cx="1500" cy="865" rx="6" ry="4" fill="#FFAABF" opacity="0.6" transform="rotate(10,1500,865)"/>
</svg>
"@
  }
  else {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" opacity="0.6">
  <!-- Sakura petals falling effect overlay -->
  <ellipse cx="300" cy="200" rx="7" ry="4" fill="#FFB7C5" opacity="0.7" transform="rotate(20,300,200)"/>
  <ellipse cx="700" cy="350" rx="7" ry="4" fill="#FFB7C5" opacity="0.6" transform="rotate(-15,700,350)"/>
  <ellipse cx="1100" cy="250" rx="7" ry="4" fill="#FFAABF" opacity="0.7" transform="rotate(30,1100,250)"/>
  <ellipse cx="1500" cy="180" rx="7" ry="4" fill="#FFB7C5" opacity="0.65" transform="rotate(-5,1500,180)"/>
  <ellipse cx="1800" cy="300" rx="7" ry="4" fill="#FFAABF" opacity="0.6" transform="rotate(25,1800,300)"/>
</svg>
"@
  }
}

function Get-GenericBG($layer, $ch_config, $ch) {
  $sky1 = $ch_config.skyColors[0]
  $sky2 = $ch_config.skyColors[1]
  $mid1 = $ch_config.midColors[0]
  $fg1 = $ch_config.fgColors[0]
  $theme = $ch_config.theme

  if ($layer -eq "fondo_lejano") {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="$sky1"/>
      <stop offset="100%" stop-color="$sky2"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="$sky2" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="$sky1" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <rect width="1920" height="1080" fill="url(#glow)"/>
  <!-- Atmospheric distant hills/structures -->
  <ellipse cx="480" cy="900" rx="600" ry="200" fill="$mid1" opacity="0.4"/>
  <ellipse cx="1440" cy="880" rx="550" ry="180" fill="$mid1" opacity="0.35"/>
  <ellipse cx="960" cy="920" rx="800" ry="220" fill="$mid1" opacity="0.3"/>
</svg>
"@
  }
  elseif ($layer -eq "fondo_intermedio") {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="mid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="$mid1" stop-opacity="0"/>
      <stop offset="40%" stop-color="$mid1"/>
      <stop offset="100%" stop-color="$fg1"/>
    </linearGradient>
  </defs>
  <path d="M0 650 Q320 580 640 640 Q960 700 1280 620 Q1600 540 1920 620 L1920 1080 L0 1080Z" fill="url(#mid)"/>
</svg>
"@
  }
  elseif ($layer -eq "primer_plano") {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="$fg1" stop-opacity="0"/>
      <stop offset="30%" stop-color="$fg1"/>
      <stop offset="100%" stop-color="#030303"/>
    </linearGradient>
  </defs>
  <path d="M0 820 Q240 780 480 810 Q720 840 960 800 Q1200 760 1440 810 Q1680 860 1920 820 L1920 1080 L0 1080Z" fill="url(#fg)"/>
</svg>
"@
  }
  else {
    return @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" opacity="0.3">
  <rect width="1920" height="1080" fill="$sky2" opacity="0.1"/>
</svg>
"@
  }
}

$layers = @("fondo_lejano", "fondo_intermedio", "primer_plano", "decoraciones")
$levels = 1..30

foreach ($chNum in $chapters.Keys) {
  $ch = $chapters[$chNum]
  $chDir = Join-Path $projectRoot "assets\$($ch.dir)\fondos"

  foreach ($lvl in $levels) {
    $lvlDir = Join-Path $chDir "nivel_$lvl"
    $effectsDir = Join-Path $lvlDir "efectos"
    New-Item -ItemType Directory -Force -Path $lvlDir | Out-Null
    New-Item -ItemType Directory -Force -Path $effectsDir | Out-Null

    foreach ($layer in $layers) {
      $outPath = Join-Path $lvlDir "$layer.svg"
            
      if (Test-Path $outPath) { continue } # Skip if already exists

      $svgContent = ""
      if ($chNum -eq 2) {
        $svgContent = Get-DesertSVG $layer $lvl $ch
      }
      elseif ($chNum -eq 3) {
        $svgContent = Get-JapanSVG $layer $lvl
      }
      else {
        $svgContent = Get-GenericBG $layer $ch $chNum
      }

      $svgContent | Out-File -FilePath $outPath -Encoding UTF8 -Force
    }

    # Bruma (mist/fog effect overlay)
    $brumaPath = Join-Path $effectsDir "bruma.svg"
    if (-not (Test-Path $brumaPath)) {
      $sky1 = $ch.skyColors[0]
      @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" opacity="0.4">
  <defs>
    <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="$sky1" stop-opacity="0.5"/>
      <stop offset="40%" stop-color="$sky1" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="$sky1" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="600" fill="url(#mist)"/>
</svg>
"@ | Out-File -FilePath $brumaPath -Encoding UTF8 -Force
    }
        
    Write-Host "  ✅ Ch$chNum Nivel $lvl completado -> $lvlDir"
  }
}

Write-Host ""
Write-Host "✅ TODOS LOS FONDOS GENERADOS CORRECTAMENTE"
Write-Host "   Capítulos 2-8 con niveles 1-3 y capas fondo_lejano, fondo_intermedio, primer_plano, decoraciones + bruma"
