$files = Get-ChildItem -Path "c:\Users\Aritz\Desktop\Proyectos Antigravity\Ver1.5-Xanezu Games\assets" -Filter "candy_*.svg" -Recurse
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    
    if ($content -match "fill='(#[0-9a-fA-F]{3,6})'") {
        $color = $matches[1]
        $newG = "<g filter='url(#dropShadow)'><circle cx='50' cy='50' r='30' fill='$color'/><circle cx='40' cy='40' r='10' fill='#FFF' opacity='0.5'/></g>`r`n</svg>`r`n"
        
        # Use single quotes for regex and escape the parentheses. (?s) makes . match newlines.
        $content = $content -replace "(?s)<g filter='url\(#dropShadow\)'>.*</svg>.*`$", $newG
        
        Set-Content -Path $f.FullName -Value $content
    }
}
Write-Host "Updated all candies to look like bolts with their original colors."
