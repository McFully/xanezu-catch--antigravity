import sys

path = r'c:\Users\Aritz\Desktop\Proyectos Antigravity\XANEZU CATCH  ANTIGRAVITY\js\core\UIManager.js'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

corrupted_idx = -1
for i, line in enumerate(lines):
    if 'if (ts.alpha' in line and '_renderShopScreen' in line:
        corrupted_idx = i
        break

if corrupted_idx != -1:
    clean_lines = lines[:corrupted_idx]
    clean_lines.append('                if (ts.alpha <= 0) {\n')
    clean_lines.append('                    ts.phase = "hidden";\n')
    clean_lines.append('                    ts.ach = null;\n')
    clean_lines.append('                    if (achManager) achManager.currentAchievement = null;\n')
    clean_lines.append('                }\n')
    clean_lines.append('                break;\n')
    clean_lines.append('        }\n')
    clean_lines.append('\n')
    clean_lines.append('        if (!ts.ach) return;\n')
    clean_lines.append('        const W = 500, H = 70, X = (1920 - W) / 2, Y = ts.y;\n')
    clean_lines.append('        this.ctx.save();\n')
    clean_lines.append('        this.ctx.globalAlpha = ts.alpha;\n')
    clean_lines.append('        this._drawRoundedRect(X, Y, W, H, 15, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.3)");\n')
    clean_lines.append('        this._drawText("🏆", X + 45, Y + H/2 + 5, "32px Inter", "center", this.colors.primary);\n')
    clean_lines.append('        this._drawText("LOGRO DESBLOQUEADO!", X + 85, Y + 25, "bold 10px Outfit", "left", this.colors.primary);\n')
    clean_lines.append('        this._drawText(ts.ach.title.toUpperCase(), X + 85, Y + 48, "bold 18px Outfit", "left", "#fff");\n')
    clean_lines.append('        this.ctx.restore();\n')
    clean_lines.append('    }\n\n')
    clean_lines.append('    _wrapText(text, x, y, maxWidth, lineHeight) {\n')
    clean_lines.append('        if (!text) return;\n')
    clean_lines.append('        const words = text.split(" ");\n')
    clean_lines.append('        let line = "";\n')
    clean_lines.append('        for (let n = 0; n < words.length; n++) {\n')
    clean_lines.append('            const testLine = line + words[n] + " ";\n')
    clean_lines.append('            if (this.ctx.measureText(testLine).width > maxWidth) {\n')
    clean_lines.append('                this.ctx.fillText(line, x, y);\n')
    clean_lines.append('                line = words[n] + " ";\n')
    clean_lines.append('                y += lineHeight;\n')
    clean_lines.append('            } else {\n')
    clean_lines.append('                line = testLine;\n')
    clean_lines.append('            }\n')
    clean_lines.append('        }\n')
    clean_lines.append('        this.ctx.fillText(line, x, y);\n')
    clean_lines.append('    }\n\n')
    clean_lines.append('    _lerp(a, b, t) { return a + (b - a) * t; }\n\n')
    clean_lines.append('    _renderTrophiesScreen() {\n')
    clean_lines.append('        const centerX = 1920 / 2;\n')
    clean_lines.append('        this._drawText("MIS LOGROS Y TROFEOS", centerX, 80, "bold 48px Outfit", "center", "#FFD700");\n')
    clean_lines.append('        this._drawMenuButton("VOLVER AL MENÚ", centerX - 150, 1080 - 80, 300, 50, () => this.game.stateManager.back());\n')
    clean_lines.append('    }\n\n')
    clean_lines.append('    _renderShopScreen() {\n')
    clean_lines.append('        const centerX = 1920 / 2;\n')
    clean_lines.append('        this._drawText("TIENDA PREMIUM XANEZU", centerX, 80, "bold 48px Outfit", "center", "#FF2EF7");\n')
    clean_lines.append('        this._drawMenuButton("VOLVER AL MENÚ", centerX - 150, 1080 - 80, 300, 50, () => this.game.stateManager.back());\n')
    clean_lines.append('    }\n\n')
    clean_lines.append('    _renderOrientationWarning() {\n')
    clean_lines.append('        if (window.innerHeight > window.innerWidth) {\n')
    clean_lines.append('            const W = 1920, H = 1080;\n')
    clean_lines.append('            this.ctx.save();\n')
    clean_lines.append('            this.ctx.fillStyle = "rgba(6, 8, 18, 0.98)";\n')
    clean_lines.append('            this.ctx.fillRect(0, 0, W, H);\n')
    clean_lines.append('            this._drawText("GIRA TU DISPOSITIVO", W / 2, H / 2, "bold 60px Outfit", "center", this.colors.primary);\n')
    clean_lines.append('            this.ctx.restore();\n')
    clean_lines.append('        }\n')
    clean_lines.append('    }\n\n')
    clean_lines.append('    formatCurrency(val) { return "🐸 " + val; }\n')
    clean_lines.append('    updateHUD(pts) {}\n')
    clean_lines.append('    showOverlay(k) {}\n')
    clean_lines.append('    hideAllOverlays() {}\n')
    clean_lines.append('    updateAudioStatus() {}\n')
    clean_lines.append('    showNearMiss() {}\n')
    clean_lines.append('    showDamageVignette() {}\n')
    clean_lines.append('    toggleCinematicMode(active) {}\n')
    clean_lines.append('}\n')

    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(clean_lines)
    print("REPAIRED")
else:
    print("NOT CORRUPTED")
