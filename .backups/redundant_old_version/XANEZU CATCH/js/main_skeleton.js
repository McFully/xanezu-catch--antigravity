/**
 * XANEZU CATCH - Monolithic Version for Direct File Access
 * (Bypasses CORS for file:// protocol)
 */

// --- Constants ---
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

// --- Entities ---
class Entity {
    constructor(x, y, w, h, speed) { this.x = x; this.y = y; this.w = w; this.h = h; this.speed = speed; this.dead = false; }
    update(dt) { this.x -= this.speed * dt; if (this.x + this.w < 0) this.dead = true; }
    getBounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

class Player {
    constructor(assets, game) {
        this.assets = assets; this.game = game; this.reset();
    }
    reset() {
        this.w = 75; this.h = 75; this.baseX = CANVAS_WIDTH / 6; this.x = this.baseX; this.y = CANVAS_HEIGHT / 2;
        this.vy = 0; this.canJump = true; this.canDash = true; this.dashCd = 0; this.dashT = 0; this.onGround = false;
        this.magnetT = 0; this.shieldActive = false; this.shieldHitT = 0; this.slowT = 0; this.ghostT = 0;
        this.infiniteDashT = 0; this.featherT = 0; this.springT = 0; this.miniT = 0; this.rainbowT = 0; this.cloverT = 0;
        this.trail = []; this.prevVy = 0; this.landSquash = 0; this.rot = 0; this.animTime = 0;
        this.breatheScale = 1; this.windSkew = 0; if (this.game) this.game.stats.tempAirDashes = 0;
        this.coyoteT = 0; // Coyote Time buffer
    }
    jump() {
        if (this.y > 50 && (this.onGround || this.coyoteT > 0)) {
            this.vy = -10; this.isJumping = true; this.coyoteT = 0;
            if (this.game.synth) this.game.synth.playJumpBark(); return true;
        }
        return false;
    }
    dash() { if (this.dashCd <= 0 || this.infiniteDashT > 0) { this.dashT = 20; this.dashCd = 120; if (this.game.synth) this.game.synth.playDashBark(); return true; } return false; }
    update(dt) {
        if (this.dashT > 0) { this.x += 14 * dt; this.dashT -= dt; this.vy = 0; }
        else { this.x += (this.baseX - this.x) * 0.15 * dt; let grav = 0.32; if (this.featherT > 0) grav = 0.15; this.vy += grav * dt; this.y += this.vy * dt; }
        if (this.onGround && Math.random() > 0.7 && this.game) this.game.particles.spawn(this.x, this.y + this.h, '#8B4513', 1);
        if (this.dashCd > 0) this.dashCd -= dt; if (this.magnetT > 0) this.magnetT -= dt;
        if (this.shieldT > 0) { this.shieldT -= dt; if (this.shieldT <= 0) this.shieldActive = false; }
        if (this.shieldHitT > 0) this.shieldHitT -= dt; if (this.slowT > 0) this.slowT -= dt;
        if (this.ghostT > 0) this.ghostT -= dt; if (this.infiniteDashT > 0) this.infiniteDashT -= dt;
        if (this.featherT > 0) this.featherT -= dt; if (this.springT > 0) this.springT -= dt;
        if (this.miniT > 0) this.miniT -= dt; if (this.rainbowT > 0) this.rainbowT -= dt;
        if (this.cloverT > 0) this.cloverT -= dt;
        if (this.y + this.h > CANVAS_HEIGHT - 30) {
            this.y = CANVAS_HEIGHT - 30 - this.h; this.vy = 0;
            if (!this.onGround) this.landSquash = 12; // Landing squash effect
            this.onGround = true; this.canDash = true; this.coyoteT = 8; // Reset coyote time
        } else {
            this.onGround = false; if (this.coyoteT > 0) this.coyoteT -= dt;
        }
        this.animTime = (this.animTime || 0) + 0.05 * dt; this.breatheScale = 1 + Math.sin(this.animTime) * 0.03; this.windSkew = Math.sin(this.animTime * 0.5) * 0.05;
        if (this.y < 0) { this.y = 0; this.vy = 0; }
        if (this.onGround && this.prevVy > 3) { this.landSquash = 10; if (this.game) { this.game.particles.spawn(this.x + this.w / 2, this.y + this.h, '#555', 8); this.game.shake(10, 200); } }
        this.prevVy = this.vy; if (this.landSquash > 0) this.landSquash -= dt;
        if (!this.trail) this.trail = []; this.trail.push({ x: this.x, y: this.y, life: 1.0 }); if (this.trail.length > 8) this.trail.shift();
        for (let i = this.trail.length - 1; i >= 0; i--) { this.trail[i].life -= 0.12 * dt; if (this.trail[i].life <= 0) this.trail.splice(i, 1); }
        this.rot = Math.max(-0.25, Math.min(0.25, this.vy * 0.06));
        if (this.isCatching) { this.catchT -= dt; if (this.catchT <= 0) this.isCatching = false; }
        if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) { this.x = this.baseX; this.y = CANVAS_HEIGHT / 2; this.vy = 0; }
    }
    draw(ctx) {
        const img = this.getCurrentImage(); if (!img) return;
        let scale = (this.miniT > 0) ? 0.5 : 1.0;
        this._drawTrail(ctx, img, scale);
        ctx.save(); this._applyStatusEffects(ctx, scale);
        let [sx, sy] = this._calculateTransformation(scale);
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2); ctx.rotate(this.rot || 0); ctx.scale(sx, sy);
        ctx.transform(1, 0, this.windSkew || 0, 1, 0, 0); this._drawChapterDecoration(ctx, img);
        ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.restore();
        this._drawDashCooldown(ctx, scale);
    }
    _drawTrail(ctx, img, scale) {
        if (this.trail && (this.dashT > 0 || (this.game && this.game.mult > 1))) {
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i]; ctx.save(); ctx.globalAlpha = t.life * 0.25;
                if (this.game && this.game.mult > 1) { const hue = (Date.now() / 5 + i * 40) % 360; ctx.filter = `hue-rotate(${hue}deg) brightness(0.7)`; }
                else { ctx.filter = 'brightness(2) saturate(0.3)'; }
                ctx.translate(t.x + this.w / 2, t.y + this.h / 2); ctx.scale(scale * (0.6 + t.life * 0.4), scale * (0.6 + t.life * 0.4));
                ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h); ctx.restore();
            }
        }
    }
    _applyStatusEffects(ctx, scale) {
        if (this.rainbowT > 0) { const ref = Math.floor(Date.now() / 100) % 360; ctx.filter = `hue-rotate(${ref}deg) brightness(1.5)`; }
        if (this.cloverT > 0 && Math.random() > 0.8) { ctx.fillStyle = "#32CD32"; ctx.fillRect(this.x + Math.random() * this.w, this.y, 4, 4); }
        if (this.slowT > 0) { ctx.beginPath(); ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 50 * scale, 0, 6.28); ctx.fillStyle = "rgba(0,0,255,0.2)"; ctx.fill(); }
        if (this.infiniteDashT > 0) { ctx.shadowBlur = 20; ctx.shadowColor = "#9370DB"; }
        if (this.magnetT > 0) { ctx.beginPath(); ctx.arc(this.x + this.w / 2, this.y + this.h / 2, (60 + Math.sin(Date.now() / 100) * 10) * scale, 0, 6.28); ctx.strokeStyle = "rgba(24, 238, 216, 0.5)"; ctx.lineWidth = 3; ctx.stroke(); }
        if (this.shieldActive) { ctx.beginPath(); ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 55 * scale, 0, 6.28); ctx.fillStyle = "rgba(0, 191, 255, 0.3)"; ctx.fill(); ctx.strokeStyle = "#00BFFF"; ctx.lineWidth = 2; ctx.stroke(); }
        if (this.dashT > 0 || this.ghostT > 0 || (this.shieldHitT > 0 && Math.floor(Date.now() / 50) % 2 === 0)) { ctx.globalAlpha = 0.4; }
    }
    _calculateTransformation(scale) {
        let sx = scale, sy = scale;
        // Advanced Squash & Stretch
        if (this.landSquash > 0) {
            const ts = this.landSquash / 12;
            sx = scale * (1 + ts * 0.5); // Wide
            sy = scale * (1 - ts * 0.4); // Flat
        }
        else if (this.vy < -1) {
            const ts = Math.min(1, Math.abs(this.vy) / 12);
            sx = scale * (1 - ts * 0.2); // Narrow
            sy = scale * (1 + ts * 0.35); // Long (Jump stretch)
        }
        else if (this.vy > 1) {
            const ts = Math.min(1, Math.abs(this.vy) / 12);
            sx = scale * (1 - ts * 0.1);
            sy = scale * (1 + ts * 0.2); // Fall stretch
        }
        else if (this.dashT > 0) { sx = scale * 1.6; sy = scale * 0.7; }

        const b = this.breatheScale || 1;
        sx *= b; sy *= (2 - b);
        return [sx, sy];
    }
    _drawChapterDecoration(ctx, img) {
        const chapter = this.game ? this.game.chapter : 1;
        if (chapter === 1) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.15; ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h); ctx.restore(); }
        const rimColors = { 1: '#A6F616', 2: '#FFD700', 3: '#FE0000', 4: '#18EED8', 5: '#FF00FF', 6: '#FF4500', 7: '#FFFFFF', 8: '#00FFFF' };
        ctx.shadowBlur = 25; ctx.shadowColor = rimColors[chapter] || '#FFF';
        ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5; ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
        if (chapter === 4) { ctx.save(); ctx.fillStyle = 'rgba(100, 200, 255, 0.4)'; ctx.strokeStyle = '#CD7F32'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -25, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255, 255, 200, 0.2)'; ctx.beginPath(); ctx.arc(10, -35, 10, 0, Math.PI * 2); ctx.fill(); if (this.game && Math.random() > 0.8) this.game.particles.spawn(this.x, this.y, '#FFF', 1); ctx.restore(); }
        if (chapter === 5) { ctx.save(); ctx.strokeStyle = '#0FF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(20, 0); ctx.moveTo(0, -20); ctx.lineTo(0, 20); ctx.stroke(); ctx.fillStyle = '#111'; ctx.fillRect(-35, -45, 70, 15); ctx.fillStyle = '#0FF'; ctx.shadowBlur = 10; ctx.shadowColor = '#0FF'; ctx.fillRect(-30, -42, 60, 5); ctx.restore(); }
        if (chapter === 6) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.strokeStyle = `rgba(255, 100, 0, ${0.6 + Math.sin(Date.now() / 150) * 0.4})`; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 5; i++) { const x = -30 + Math.random() * 60, y = -30 + Math.random() * 60; ctx.moveTo(x, y); ctx.lineTo(x + 15, y + 15); } ctx.stroke(); ctx.fillStyle = '#FF4500'; ctx.shadowBlur = 15; ctx.shadowColor = '#FF0000'; ctx.beginPath(); ctx.arc(-8, -35, 6, 0, Math.PI * 2); ctx.arc(8, -35, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        if (chapter === 7) { ctx.save(); const wingOsc = Math.sin(Date.now() / 100) * 0.5; ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.strokeStyle = '#DDD'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(-45, -10, 25, 15, -0.5 + wingOsc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(45, -10, 25, 15, 0.5 - wingOsc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() / 300) * 0.3})`; ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = '#FFD700'; ctx.beginPath(); ctx.ellipse(0, -65, 30, 8, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        if (chapter === 8) { ctx.save(); const suitOSC = Math.sin(Date.now() / 250) * 2; ctx.fillStyle = '#DDD'; ctx.strokeStyle = '#999'; ctx.lineWidth = 2; ctx.fillRect(-45, -15 + suitOSC, 22, 50); ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-10, -75); ctx.lineTo(-10, -90); ctx.stroke(); ctx.fillStyle = '#F00'; ctx.beginPath(); ctx.arc(-10, -92, 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(200, 230, 255, 0.35)'; ctx.strokeStyle = '#888'; ctx.beginPath(); ctx.arc(0, -25 + suitOSC, 55, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'; ctx.beginPath(); ctx.ellipse(15, -35 + suitOSC, 25, 15, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = Math.floor(Date.now() / 500) % 2 === 0 ? '#F00' : '#400'; ctx.beginPath(); ctx.arc(-10, 10 + suitOSC, 3, 0, Math.PI * 2); ctx.fill(); if (this.vy < 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#0FF'; ctx.beginPath(); ctx.ellipse(-35, 45, 8, 15, 0, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
    }
    _drawDashCooldown(ctx, scale) { if (this.dashCd > 0) { ctx.save(); const cx = this.x + this.w / 2, cy = this.y + this.h / 2; const radius = 45 * scale; ctx.beginPath(); ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (1 - this.dashCd / 120))); ctx.strokeStyle = "rgba(24, 238, 216, 0.4)"; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); } }
    getBounds() { let scale = (this.miniT > 0) ? 0.5 : 1.0; return { x: this.x + this.w * 0.2 + (this.w * (1 - scale) / 2), y: this.y + this.h * 0.2 + (this.h * (1 - scale) / 2), w: this.w * 0.6 * scale, h: this.h * 0.6 * scale }; }
    getCurrentImage() {
        if (this.game && this.game.chapter === 2 && this.assets.frogPharaoh) return this.assets.frogPharaoh;
        if (this.game && this.game.chapter === 3 && this.assets.frogMariachi) return this.assets.frogMariachi;
        let img = this.assets.frog; if (this.isCatching) img = this.assets.frogCatch || img; else if (this.vy < -1) img = this.assets.frogUp || img; else if (this.vy > 1) img = this.assets.frogDown || img; return img;
    }
}

class Obstacle extends Entity {
    constructor(x, y, w, h, speed, vy, type) { super(x, y, w, h, speed); this.vy = vy || 0; this.type = type || 'spike'; }
    update(dt) {
        super.update(dt); this.y += this.vy * dt; if (this.y < 0 || this.y + this.h > CANVAS_HEIGHT) this.vy *= -1;
        if (window.game && window.game.synth && !this.dead && this.x > 0 && this.x < CANVAS_WIDTH && Math.random() > 0.985) window.game.synth.playSpatial('triangle', this.x, 120 + Math.sin(Date.now() / 200) * 40, 0.1, 0.015);
    }
    draw(ctx) {
        const chapter = window.game ? window.game.chapter : 1;
        if (chapter === 2 || chapter === 3) { ctx.save(); ctx.translate(this.x, this.y); ctx.fillStyle = (chapter === 2) ? "#E4D00A" : "#2E8B57"; if (chapter === 2) ctx.filter = "sepia(0.6) brightness(0.9)"; ctx.fillRect(0, 0, this.w, this.h); ctx.fillRect(-15, this.h * 0.3, 15, 15); ctx.fillRect(-15, this.h * 0.3 - 15, 15, 15); ctx.fillRect(this.w, this.h * 0.4, 15, 15); ctx.fillRect(this.w, this.h * 0.4 - 15, 15, 15); ctx.fillStyle = "#000"; for (let i = 0; i < this.h; i += 20) { ctx.fillRect(-2, i, 4, 1); ctx.fillRect(this.w - 2, i + 10, 4, 1); } ctx.restore(); return; }
        if (chapter === 4) { ctx.save(); ctx.translate(this.x, this.y); ctx.fillStyle = "#4B0082"; ctx.beginPath(); ctx.moveTo(10, 0); ctx.bezierCurveTo(-20, this.h * 0.3, 80, this.h * 0.6, 10, this.h); ctx.lineTo(50, this.h); ctx.bezierCurveTo(120, this.h * 0.6, 20, this.h * 0.3, 50, 0); ctx.fill(); if (Math.random() > 0.5) { ctx.strokeStyle = "#00FFFF"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, Math.random() * this.h); ctx.lineTo(this.w, Math.random() * this.h); ctx.stroke(); } ctx.fillStyle = "#FFFF00"; ctx.beginPath(); ctx.arc(20, 30, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return; }
        if (chapter === 5) { ctx.save(); ctx.translate(this.x + this.w / 2, this.y + this.h / 2); const t = Date.now() * 0.004; ctx.fillStyle = "#333"; ctx.strokeStyle = "#0FF"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = Math.sin(t * 2) > 0 ? "#F00" : "#400"; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(0, 255, 255, ${Math.random() * 0.5})`; ctx.beginPath(); ctx.arc(0, 0, 35 + Math.sin(t) * 5, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); return; }
        if (chapter === 6) { ctx.save(); ctx.translate(this.x, this.y); ctx.fillStyle = "#222"; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(this.w - 5, 10); ctx.lineTo(this.w, this.h - 15); ctx.lineTo(5, this.h); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#FF4500"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, 20); ctx.lineTo(this.w - 10, 40); ctx.moveTo(this.w / 2, 10); ctx.lineTo(this.w / 2, this.h - 10); ctx.stroke(); ctx.shadowBlur = 10; ctx.shadowColor = "#FF0000"; ctx.fillStyle = "rgba(255, 69, 0, 0.3)"; ctx.fillRect(5, 5, this.w - 10, this.h - 10); ctx.restore(); return; }
        if (chapter === 7) { ctx.save(); ctx.translate(this.x + this.w / 2, this.y + 20); ctx.fillStyle = "#444"; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.arc(-20, 10, 25, 0, Math.PI * 2); ctx.arc(20, 10, 25, 0, Math.PI * 2); ctx.fill(); if (Math.random() > 0.93) { ctx.strokeStyle = "#FF0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(-10, 40); ctx.lineTo(5, 45); ctx.lineTo(-5, 65); ctx.stroke(); ctx.shadowBlur = 15; ctx.shadowColor = "#FF0"; } ctx.restore(); return; }
        if (chapter === 8) { ctx.save(); ctx.translate(this.x + this.w / 2, this.y + this.h / 2); const t = Date.now() * 0.005; const pulse = Math.sin(t) * 5; const plasma = ctx.createRadialGradient(0, 0, 5, 0, 0, this.w / 2 + pulse); plasma.addColorStop(0, "#fff"); plasma.addColorStop(0.3, "#0ff"); plasma.addColorStop(1, "transparent"); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = plasma; ctx.beginPath(); ctx.arc(0, 0, this.w / 2 + pulse, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#444"; ctx.lineWidth = 3; for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2 + t * 0.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * (this.w / 2 + 10), Math.sin(ang) * (this.w / 2 + 10)); ctx.stroke(); } ctx.restore(); return; }
        const grad = ctx.createLinearGradient(0, 0, 0, this.h); grad.addColorStop(0, "#FF290B"); grad.addColorStop(1, "#AD0000"); ctx.save(); ctx.translate(this.x, this.y); ctx.fillStyle = grad; ctx.fillRect(0, 0, this.w, this.h); ctx.fillStyle = "#600";
        for (let i = 0; i < Math.floor(this.h / 20); i++) { const sy = i * 20; ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(-16, sy + 10); ctx.lineTo(0, sy + 20); ctx.fill(); ctx.beginPath(); ctx.moveTo(this.w, sy); ctx.lineTo(this.w + 16, sy + 10); ctx.lineTo(this.w, sy + 20); ctx.fill(); } ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fillRect(0, 0, this.w * 0.3, this.h); ctx.restore();
    }
}

class Fly extends Entity {
    constructor(x, y, type, img, speed) { super(x, y, 90, 90, speed); this.img = img; this.type = type; this.pts = { banana: 10, gold: 25, crystal: 50 }[type] || 10; this.osc = Math.random() * 10; }
    update(dt, target = null) {
        super.update(dt); this.osc += 0.1 * dt; if (target && target.magnetT > 0) { const dx = target.x - this.x, dy = target.y - this.y, dist = Math.sqrt(dx * dx + dy * dy); if (dist < 600) { this.x += (dx / dist) * 15 * dt; this.y += (dy / dist) * 15 * dt; } else { this.y += Math.sin(this.osc) * 2.5; } } else { this.y += Math.sin(this.osc) * ((window.game && window.game.chapter === 4) ? 4.5 : 2.5); }
        if (window.game && window.game.synth && this.x > 500 && this.x < 700 && !this.playedPass) { this.playedPass = true; window.game.synth.playSpatial('sawtooth', this.x, 800, 0.3, 0.05); }
    }
    draw(ctx) { if (this.type === 'crystal') { ctx.save(); ctx.translate(this.x + this.w / 2, this.y + this.h / 2); const scale = 1 + Math.sin(this.osc * 2) * 0.1; ctx.scale(scale, scale); ctx.fillStyle = '#FF4444'; ctx.font = '50px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('❤', 0, 0); ctx.shadowBlur = 15; ctx.shadowColor = '#FF0000'; ctx.fillText('❤', 0, 0); ctx.restore(); } else if (this.img) { ctx.drawImage(this.img, this.x, this.y, this.w, this.h); } }
}

class BonusItem extends Entity {
    constructor(x, y, type, img, speed) { super(x, y, 80, 80, speed); this.type = type; this.img = img; this.osc = Math.random() * 10; this.pts = { coin: 200, ruby: 500, crown: 1000, emerald: 800, pearl: 1200, diamond: 2000 }[type] || 0; }
    update(dt) { super.update(dt); this.osc += 0.05 * dt; this.y += Math.cos(this.osc) * 1.5; }
    draw(ctx) { if (this.img) ctx.drawImage(this.img, this.x, this.y, this.w, this.h); }
}

class Candy extends Entity {
    constructor(x, y, type, img, speed) { super(x, y, 60, 60, speed); this.type = type; this.img = img; this.pts = Math.floor(Math.random() * 95) + 5; this.osc = Math.random() * 10; }
    update(dt) { super.update(dt); this.osc += 0.08 * dt; this.y += Math.sin(this.osc) * 2; }
    draw(ctx) { if (this.img) ctx.drawImage(this.img, this.x, this.y, this.w, this.h); }
}

class PowerUp extends Entity {
    constructor(x, y, type, img, speed) { super(x, y, 90, 90, speed); this.type = type; this.img = img; this.angle = 0; }
    update(dt) { super.update(dt); this.angle += 0.05 * dt; }
    draw(ctx) { if (!this.img) return; ctx.save(); ctx.translate(this.x + 45, this.y + 45); ctx.rotate(Math.sin(this.angle) * 0.2); ctx.drawImage(this.img, -45, -45, 90, 90); ctx.restore(); }
}

class LevelArtifact extends Entity {
    constructor(x, y, level, speed) { super(x, y, 80, 80, speed); this.level = level; this.pts = level * 100; this.rot = 0; this.hue = [0, 60, 120, 180, 240, 300][level % 6]; this.shape = level % 4; }
    update(dt) { super.update(dt); this.rot += 0.05 * dt; }
    draw(ctx) { ctx.save(); ctx.translate(this.x + 40, this.y + 40); ctx.rotate(this.rot); ctx.shadowBlur = 15; ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`; ctx.fillStyle = `hsl(${this.hue}, 80%, 60%)`; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); if (this.shape === 0) ctx.arc(0, 0, 35, 0, 6.28); else if (this.shape === 1) ctx.rect(-30, -30, 60, 60); else if (this.shape === 2) { ctx.moveTo(0, -40); ctx.lineTo(40, 0); ctx.lineTo(0, 40); ctx.lineTo(-40, 0); } else { ctx.moveTo(0, -40); ctx.lineTo(35, 30); ctx.lineTo(-35, 30); } ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.font = "bold 20px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.shadowBlur = 0; ctx.fillText(this.level, 0, 0); ctx.restore(); }
}

class Companion {
    constructor(assets) { this.assets = assets; this.x = 20; this.y = CANVAS_HEIGHT / 2 - 25; this.w = 50; this.h = 55; this.active = false; this.timer = 0; this.shootCd = 0; this.bullets = []; this.bounce = 0; this.aimAngle = 0; }
    activate(duration) { if (this.active) this.timer += duration; else { this.active = true; this.timer = duration; this.bullets = []; } }
    findNearestObstacle(entities) { let nearest = null, minDist = Infinity; for (const e of entities) { if (e instanceof Obstacle) { const dx = e.x - this.x, dy = (e.y + e.h / 2) - (this.y + this.h / 2), dist = Math.sqrt(dx * dx + dy * dy); if (dist < minDist) { minDist = dist; nearest = e; } } } return nearest; }
    update(dt, entities) {
        if (!this.active) return; this.timer -= dt; this.bounce += 0.12 * dt; if (this.timer <= 0) { this.active = false; this.bullets = []; return; }
        const target = this.findNearestObstacle(entities); if (target) { const dx = target.x + target.w / 2 - (this.x + this.w), dy = target.y + target.h / 2 - (this.y + this.h / 2); this.aimAngle = Math.atan2(dy, dx); }
        this.shootCd -= dt; if (this.shootCd <= 0 && target) { this.bullets.push({ x: this.x + this.w, y: this.y + this.h / 2, vx: Math.cos(this.aimAngle) * 22, vy: Math.sin(this.aimAngle) * 22, targetId: target }); this.shootCd = 18; }
        for (let i = this.bullets.length - 1; i >= 0; i--) { const b = this.bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; if (b.x > CANVAS_WIDTH || b.x < 0 || b.y < -50 || b.y > CANVAS_HEIGHT + 50) { this.bullets.splice(i, 1); continue; } for (let j = entities.length - 1; j >= 0; j--) { if (entities[j] instanceof Obstacle) { const o = entities[j]; if (b.x > o.x && b.x < o.x + o.w && b.y > o.y && b.y < o.y + o.h) { entities.splice(j, 1); this.bullets.splice(i, 1); break; } } } }
    }
    draw(ctx) {
        if (!this.active) return; ctx.save(); const bY = Math.sin(this.bounce) * 1, scale = 0.55, cx = this.x + 25, cy = this.y + 28 + bY; ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
        const chapter = window.game ? window.game.chapter : 1; ctx.fillStyle = (chapter === 5) ? '#AAA' : (chapter === 6 ? '#333' : '#228B22'); ctx.fillRect(cx - 20, cy + 30, 14, 22); ctx.fillRect(cx + 6, cy + 30, 14, 22); ctx.fillStyle = '#8B4513'; ctx.fillRect(cx - 22, cy + 46, 18, 8); ctx.fillRect(cx + 4, cy + 46, 18, 8);
        ctx.fillStyle = (chapter === 5) ? '#555' : '#87CEEB'; ctx.beginPath(); ctx.ellipse(cx, cy, 22, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = (chapter === 5) ? '#AAA' : '#228B22'; ctx.beginPath(); ctx.ellipse(cx, cy - 35, 18, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 7, cy - 38, 5, 0, Math.PI * 2); ctx.arc(cx + 7, cy - 38, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - 6, cy - 38, 2.5, 0, Math.PI * 2); ctx.arc(cx + 8, cy - 38, 2.5, 0, Math.PI * 2); ctx.fill();
        for (const b of this.bullets) { ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color) { this.x = x; this.y = y; this.text = text; this.color = color; this.life = 1.0; this.dead = false; this.curve = (Math.random() - 0.5) * 40; }
    update(dt) { this.life -= 0.015 * dt; this.y -= 1.5 * dt; this.x += Math.sin(this.life * Math.PI * 2) * this.curve * 0.02 * dt; if (this.life <= 0) this.dead = true; }
    draw(ctx) { ctx.save(); ctx.globalAlpha = this.life; ctx.font = 'bold 22px Montserrat'; ctx.textAlign = 'center'; ctx.translate(this.x, this.y); ctx.fillStyle = '#000'; ctx.fillText(this.text, 1, 1); ctx.fillStyle = this.color; ctx.fillText(this.text, 0, 0); ctx.restore(); }
}

class ParticlePool {
    constructor(size = 300) { this.pool = Array.from({ length: size }, () => ({ active: false })); this.debris = []; }
    spawn(x, y, color, count = 10) {
        let s = 0; for (let p of this.pool) { if (!p.active && s < count) { p.active = true; p.x = x; p.y = y; p.color = color; p.life = 1.0; p.vx = Math.random() * 8 - 4; p.vy = Math.random() * 8 - 4; p.size = Math.random() * 6 + 2; p.decay = Math.random() * 0.03 + 0.015; s++; } }
    }
    update(dt) { this.pool.forEach(p => { if (p.active) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.15 * dt; p.life -= p.decay * dt; p.size *= 0.95; if (p.life <= 0) p.active = false; } }); }
    draw(ctx) { this.pool.forEach(p => { if (p.active) { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.28); ctx.fill(); } }); }
}

// --- Managers ---
class AssetLoader {
    constructor() { this.assets = {}; this.sounds = {}; }
    async load(images, audio) {
        const loadImg = (k, s) => new Promise(r => { const i = new Image(); i.src = s; i.onload = () => { this.assets[k] = i; r(); }; i.onerror = r; });
        const loadAud = (k, s) => new Promise(r => { const a = new Audio(s); a.oncanplaythrough = () => { this.sounds[k] = a; r(); }; a.onerror = r; });
        const ps = Object.entries(images).map(([k, s]) => loadImg(k, s));
        if (audio) ps.push(...Object.entries(audio).map(([k, s]) => loadAud(k, s)));
        await Promise.race([Promise.all(ps), new Promise(r => setTimeout(r, 2000))]);
        return { assets: this.assets, sounds: this.sounds };
    }
}

class WeatherManager {
    constructor() { this.type = 'none'; this.particles = []; }
    set(t, i = 1) { this.type = t; this.intensity = i; this.particles = []; }
    update(dt) {
        if (this.type === 'none') return; if (Math.random() < 0.3) this.particles.push({ x: Math.random() * CANVAS_WIDTH, y: -20, vy: (this.type === 'rain' ? 15 : 5), vx: 0, size: 2 });
        for (let i = this.particles.length - 1; i >= 0; i--) { const p = this.particles[i]; p.y += p.vy * dt; if (p.y > CANVAS_HEIGHT) this.particles.splice(i, 1); }
    }
    draw(ctx) { if (this.type === 'none') return; ctx.strokeStyle = '#fff'; this.particles.forEach(p => { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + 10); ctx.stroke(); }); }
}

class RankManager {
    constructor() { this.ranks = [{ name: 'BRONZE', min: 0 }, { name: 'SILVER', min: 10000 }, { name: 'GOLD', min: 50000 }]; }
    getRank(s) { return this.ranks.reverse().find(r => s >= r.min) || this.ranks[0]; }
}

class AchievementManager {
    constructor(game) { this.game = game; this.unlocked = JSON.parse(localStorage.getItem('mx_achievements') || '[]'); this.toast = document.getElementById('achievement-toast'); }
    check() { if (this.game.score > 1000 && !this.unlocked.includes('1k')) this.showToast("1,000 PTS!"); }
    showToast(t) { if (this.toast) { this.toast.querySelector('.ach-desc').textContent = t; this.toast.classList.add('active'); setTimeout(() => this.toast.classList.remove('active'), 3000); } }
}

class MilestoneManager {
    constructor(game) { this.game = game; this.reached = JSON.parse(localStorage.getItem('mx_milestones_reached') || '[]'); this._tick = 0; }
    update() { if (this._tick++ < 60) return; this._tick = 0; }
    render(c) { if (c) c.innerHTML = '<p style="color:white;text-align:center;">Milestones Loaded!</p>'; }
}

class SpawnManager {
    constructor(g) { this.game = g; }
    handleSpawning(s) { if (Math.random() > 0.5) this.spawnCandy(s); else this.spawnFly(s); }
    spawnObs(s) { const h = Math.random() * 300 + 100; this.game.entities.push(new Obstacle(CANVAS_WIDTH, Math.random() < 0.5 ? 0 : CANVAS_HEIGHT - h, 65, h, s, 0)); }
    spawnFly(s) { this.game.entities.push(new Fly(CANVAS_WIDTH, Math.random() * 500 + 100, 'banana', this.game.assets.banana, s)); }
    spawnCandy(s) { this.game.entities.push(new Candy(CANVAS_WIDTH, Math.random() * 500 + 100, 'red', this.game.assets.candy_red, s)); }
    spawnBonus(s) { this.game.entities.push(new BonusItem(CANVAS_WIDTH, Math.random() * 500 + 100, 'coin', this.game.assets.coin, s)); }
    spawnPowerUp(s) { this.game.entities.push(new PowerUp(CANVAS_WIDTH, Math.random() * 500 + 100, 'hourglass', this.game.assets.hourglass, s)); }
}

class UIManager {
    constructor(g) {
        this.game = g;
        this.overlays = {
            menu: document.getElementById('menu-overlay'),
            chapter: document.getElementById('chapter-overlay'),
            shop: document.getElementById('shop-overlay'),
            trophy: document.getElementById('trophy-overlay'),
            gameover: document.getElementById('gameover-overlay'),
            victory: document.getElementById('victory-overlay'),
            settings: document.getElementById('settings-overlay')
        };
        this.vals = {
            score: document.getElementById('score-val'),
            final: document.getElementById('final-score'),
            victoryScore: document.getElementById('victory-score-val-new'),
            level: document.getElementById('level-val'),
            progressText: document.getElementById('level-progress-text'),
            progressBar: document.getElementById('level-progress-fill'),
            shopCoins: document.getElementById('shop-coins'),
            trophyList: document.getElementById('trophy-list')
        };
        this.cache = { heartsGrid: document.getElementById('hearts-grid'), livesVal: document.getElementById('lives-val') };
    }
    showOverlay(k) {
        const next = this.overlays[k];

        // If key is invalid (e.g. 'none'), hide all overlays and return
        if (!next) {
            Object.values(this.overlays).forEach(o => {
                if (o?.classList.contains('active')) {
                    o.classList.add('exiting');
                    setTimeout(() => { o.classList.remove('active', 'exiting'); }, 400);
                }
            });
            return;
        }

        if (next.classList.contains('active') && !next.classList.contains('exiting')) return;

        Object.values(this.overlays).forEach(o => {
            if (o?.classList.contains('active') && o !== next) {
                o.classList.add('exiting');
                setTimeout(() => { o.classList.remove('active', 'exiting'); }, 400);
            }
        });

        next.classList.add('active', 'entering');
        setTimeout(() => next.classList.remove('entering'), 600);
    }
    triggerClickFeedback(el) {
        if (!el) return;
        el.classList.add('clicked');
        setTimeout(() => el.classList.remove('clicked'), 300);
    }
    updateHUD() {
        if (this.vals.score) this.vals.score.innerText = Math.floor(this.game.score);
        if (this.cache.livesVal) this.cache.livesVal.innerHTML = `❤ x${this.game.lives}`;

        // New HUD Updates
        if (this.vals.level) this.vals.level.innerText = `LEVEL ${this.game.level}`;
        if (this.vals.progressText) this.vals.progressText.innerText = `${Math.floor(this.game.progress)}%`;
        if (this.vals.progressBar) this.vals.progressBar.style.width = `${this.game.progress}%`;
    }
    updateShopUI() { if (this.vals.shopCoins) this.vals.shopCoins.innerText = this.game.totalCoins; }
    updateChaptersUI() { }
}

class LevelPainter {
    constructor(g) { this.game = g; this._cache = { gradients: new Map() }; }
    draw(ctx) { this.drawGodRays(ctx); }
    drawGodRays(ctx) {
        if (![2, 3, 7].includes(this.game.chapter)) return; ctx.save(); const t = Date.now() * 0.0005, cx = CANVAS_WIDTH * 0.9, cy = -100;
        ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255, 255, 200, 0.1)';
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 0.5 + Math.sin(t + i) * 0.1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 1200, a - 0.05, a + 0.05); ctx.fill(); } ctx.restore();
    }
}

class MusicSynth {
    constructor() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    playTone() { } playCollect() { } playMenuMusic() { } stopMenuMusic() { } start() { } stopProcedural() { } playJumpBark() { } playDashBark() { } playDamageBark() { } playBtnHover() { } playBtnClick() { }
}

// --- Main Game Engine ---
class Game {
    constructor() {
        this.canvas = document.getElementById("game"); this.ctx = this.canvas.getContext("2d", { alpha: false });
        this.loader = new AssetLoader(); this.ui = new UIManager(this); this.painter = new LevelPainter(this); this.weather = new WeatherManager(this);
        this.ranks = new RankManager(); this.particles = new ParticlePool(400); this.synth = new MusicSynth(); this.spawn = new SpawnManager(this);
        this.entities = []; this.floatingTexts = []; this.state = 'LOADING'; this.score = 0; this.level = 1; this.highScore = 0; this.bgX = 0;
        this.spawnT = { obs: 0, fly: 0, power: 0 }; this.mult = 1; this.multT = 0; this.lives = 1; this.plus50Count = 0; this.chapter = 1;
        this.menuParticles = Array.from({ length: 20 }, () => ({ x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT, vx: Math.random() - 0.5, vy: Math.random() - 0.5, size: 2 }));
        this.loadPersistence(); this.achievements = new AchievementManager(this); this.milestones = new MilestoneManager(this);
        window.addEventListener('resize', () => this.resize()); this.resize(); this.init();
        this._shake = { amp: 0, dur: 0, start: 0 };
    }
    shake(amp, dur) { this._shake = { amp, dur, start: Date.now() }; }
    loadPersistence() {
        this.totalCoins = parseInt(localStorage.getItem('mx_total_coins') || '0'); this.unlockedChapters = [1, 2, 3, 4, 5, 6, 7, 8]; this.totalItemsCaught = 0; this.totalDeaths = 0; this.totalDashes = 0; this.totalTimePlayed = 0; this.highLevelReached = 1;
        this.stats = { tempAirDashes: 0, maxAirDashes: 0, explotions: 0, levelNoDamage: true, totalBananas: 0, totalGreenCandies: 0, combosInCurrentLife: { explotion: false, cowboy: false }, doubleComboInLife: false };
        this.skills = { jumpBoost: 0, dashEfficiency: 0, resilience: 0 }; this.unlocks = { magnet: 0, shield: 0, skins: [] };
    }
    async init() {
        const { assets } = await this.loader.load({
            frog: "assets/frog.idl.svg",
            banana: "assets/banana.svg",
            candy_red: "assets/candy_red.svg",
            coin: "assets/coin.svg",
            hourglass: "assets/hourglass.svg",
            bug: "assets/bug.svg",
            lilypad: "assets/lilypad.svg",
            grass: "assets/bg_l01.png"
        });
        this.assets = assets; this.frog = new Player(assets, this);
        this.state = 'MENU';
        this.returnToMenu();
        // Force immediate render of menu particles or hide them if background is preferred
        this.setupInput(); requestAnimationFrame(t => this.loop(t));
    }
    resize() { const cw = this.canvas.parentElement.clientWidth, ch = this.canvas.parentElement.clientHeight, scale = Math.min(cw / CANVAS_WIDTH, ch / CANVAS_HEIGHT); this.canvas.style.width = `${CANVAS_WIDTH * scale}px`; this.canvas.style.height = `${CANVAS_HEIGHT * scale}px`; }
    setupInput() {
        window.onkeydown = e => { if (this.state === 'PLAYING') { if (e.code === 'Space') this.frog.jump(); if (e.code === 'KeyD') this.handleDash(); } else if (e.code === 'Space') this.goToStory(); };
        this.canvas.onmousedown = e => { if (this.state === 'PLAYING') { if (e.button === 0) this.frog.jump(); else this.handleDash(); } };
    }
    handleDash() { if (this.frog.dash()) this.particles.spawn(this.frog.x, this.frog.y + 35, '#18EED8', 10); }
    start(ch = 1) { this.chapter = ch; this.score = 0; this.level = 1; this.entities = []; this.frog.reset(); this.state = 'PLAYING'; this.ui.showOverlay('none'); this.ui.updateHUD(); }
    goToStory() {
        this.state = 'CHAPTER_SELECT';
        this.ui.showOverlay('chapter');
    }
    startInfinite() { this.start(Math.floor(Math.random() * 8) + 1); }
    showShop() { this.state = 'SHOP'; this.ui.showOverlay('shop'); this.ui.updateShopUI(); }
    showTrophies() { this.state = 'TROPHIES'; this.ui.showOverlay('trophy'); this.ui.updateTrophyRecords(); }
    returnToMenu() { this.state = 'MENU'; this.ui.showOverlay('menu'); }
    retry() { this.start(this.chapter); }
    getLevelTarget(l) { return 300 * (l + 1); }
    loop(t) {
        if (!this.lastT) this.lastT = t; let dt = (t - this.lastT) / 16.67 || 1; this.lastT = t;
        if (this.state === 'PLAYING') this.update(dt); else this.updateMenu(dt);
        this.draw(); requestAnimationFrame(t => this.loop(t));
    }
    updateMenu(dt) { this.menuParticles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x < 0 || p.x > CANVAS_WIDTH) p.vx *= -1; if (p.y < 0 || p.y > CANVAS_HEIGHT) p.vy *= -1; }); }
    update(dt) {
        this.frog.update(dt); this.spawnT.obs += dt * 16.67; if (this.spawnT.obs > 2000) { this.spawn.spawnObs(6); this.spawnT.obs = 0; }
        this.spawnT.power += dt * 16.67; if (this.spawnT.power > 3000) { this.spawn.handleSpawning(6); this.spawnT.power = 0; }
        this.entities.forEach((e, i) => { e.update(dt); if (this.collide(this.frog.getBounds(), e.getBounds())) this.entities.splice(i, 1); });
        this.entities = this.entities.filter(e => !e.dead && e.x > -100);
        if (this.score >= this.getLevelTarget(this.level)) { this.level++; this.ui.updateHUD(); }
    }
    draw() {
        this.ctx.save();
        if (this._shake.dur > 0) {
            const elapsed = Date.now() - this._shake.start;
            if (elapsed < this._shake.dur) {
                const ratio = 1 - (elapsed / this._shake.dur);
                const ox = (Math.random() - 0.5) * this._shake.amp * ratio;
                const oy = (Math.random() - 0.5) * this._shake.amp * ratio;
                this.ctx.translate(ox, oy);
            }
        }
        this.ctx.fillStyle = "#112244"; this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (this.state === 'MENU' || this.state === 'CHAPTER_SELECT') {
            // We only draw if there is no background image in overlay (fallback)
            // But since we want to see the image requested, we skip drawing particles here
            // this.ctx.fillStyle = '#A6F616'; this.menuParticles.forEach(p => { this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, 6.28); this.ctx.fill(); }); 
        }
        else { this.painter.draw(this.ctx); this.entities.forEach(e => e.draw(this.ctx)); this.frog.draw(this.ctx); this.particles.draw(this.ctx); }
        this.ctx.restore();
    }
    collide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
    buySkill() { }
    buyItem(id) { console.log(`Bought item ${id}`); this.synth.playBtnClick(); }
    toggleSound() { console.log("Toggle Sound"); this.synth.playBtnClick(); }
    toggleMusic() { console.log("Toggle Music"); this.synth.playBtnClick(); }
    showSettings() { this.state = 'SETTINGS'; this.ui.showOverlay('settings'); }
}

// Global Level Loader (Requested interface)
function LoadChapter(id) {
    if (window.game) {
        window.game.ui.triggerClickFeedback(document.querySelector(`.chapter-card[data-chapter="${id}"]`));
        if (window.game.synth) window.game.synth.playBtnClick();
        window.game.start(id);
    }
}

// Global Initialization
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();

    // Update menu coins display
    const menuCoins = document.getElementById('menu-coins-val');
    if (menuCoins) menuCoins.innerText = window.game.totalCoins || 0;
});
