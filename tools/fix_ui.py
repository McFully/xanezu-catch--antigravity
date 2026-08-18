import os

path = r'c:\Users\Aritz\Desktop\Proyectos Antigravity\XANEZU CATCH  ANTIGRAVITY\js\core\UIManager.js'
with open(path, 'r', encoding='latin-1') as f:
    content = f.read()

# Replace the broken compatibility section
old_part = '    // --- MÃ‰TODOS DE COMPATIBILIDAD'
# Find the start of the broken section
idx = content.find(old_part)

if idx != -1:
    new_content = content[:idx]
    new_content += '''    _renderOrientationWarning() {
        if (window.innerHeight > window.innerWidth) {
            const ctx = this.ctx;
            const W = 1920; 
            const H = 1080;
            ctx.save();
            ctx.fillStyle = 'rgba(6, 8, 18, 0.98)';
            ctx.fillRect(0, 0, W, H);
            const t = performance.now() / 1000;
            const rot = Math.sin(t * 3) * 0.45;
            ctx.translate(W / 2, H / 2 - 80);
            ctx.rotate(rot);
            ctx.font = "120px Inter";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#fff";
            ctx.fillText("📱", 0, 0);
            ctx.restore();
            this._drawText("GIRA TU DISPOSITIVO", W / 2, H / 2 + 50, "bold 60px Outfit", "center", this.colors.primary, True);
            this._drawText("XANEZU CATCH requiere orientación horizontal", W / 2, H / 2 + 110, "24px Inter", "center", "rgba(255,255,255,0.6)");
            ctx.restore();
        }
    }

    updateHUD(pts) {}
    showOverlay(k) {}
    hideAllOverlays() {}
    updateAudioStatus() {}
    showNearMiss() {}
    showDamageVignette() {}
    toggleCinematicMode(active) {}
    formatCurrency(val) { return `🐸 ${val}`; }
}
'''
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("FIXED")
else:
    print("NOT FOUND")
