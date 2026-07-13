import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { Obstacle } from './Obstacle.js';

export class Companion {
    constructor(assets) {
        this.assets = assets;
        this.x = 20; this.y = CANVAS_HEIGHT / 2 - 25;
        this.w = 50; this.h = 55;
        this.active = false; this.timer = 0;
        this.shootCd = 0; this.bullets = [];
        this.bounce = 0; this.aimAngle = 0;

        // Art Director: Gekko Expression System
        this.blinkT = 0;
        this.isBlinking = false;
        this.eyeX = 0; this.eyeY = 0;
    }
    activate(duration) {
        if (this.active) { this.timer += duration; }
        else { this.active = true; this.timer = duration; this.bullets = []; }
    }
    addTime(frames) { this.timer += frames; }
    getTimeRemaining() { return this.active ? Math.ceil(this.timer / 60) : 0; }

    findNearestObstacle(entities) {
        let nearest = null; let minDist = Infinity;
        for (const e of entities) {
            if (e instanceof Obstacle) {
                const dx = e.x - this.x; const dy = (e.y + e.h / 2) - (this.y + this.h / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) { minDist = dist; nearest = e; }
            }
        }
        return nearest;
    }

    update(dt, entities) {
        if (!this.active) return;
        this.timer -= dt;
        this.bounce += 0.12 * dt;
        if (this.timer <= 0) { this.active = false; this.bullets = []; return; }

        if (window.game && window.game.frog) {
            const targetY = window.game.frog.y + window.game.frog.h / 2 - this.h / 2;
            this.y += (targetY - this.y) * 0.05 * dt;
        }

        const target = this.findNearestObstacle(entities);
        if (target) {
            const tx = target.x + target.w / 2;
            const ty = target.y + target.h / 2 + (target.vy || 0) * 5;
            const dx = tx - (this.x + this.w);
            const dy = ty - (this.y + this.h / 2);
            this.aimAngle = Math.atan2(dy, dx);
        }

        this.shootCd -= dt;
        if (this.shootCd <= 0 && target) {
            const speed = 22;
            this.bullets.push({
                x: this.x + this.w, y: this.y + this.h / 2,
                vx: Math.cos(this.aimAngle) * speed,
                vy: Math.sin(this.aimAngle) * speed,
                targetId: target
            });
            this.shootCd = 18;
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            if (b.targetId && !b.targetId.dead && b.targetId.vy) {
                const tx = b.targetId.x; const ty = b.targetId.y + b.targetId.h / 2;
                const dx = tx - b.x; const dy = ty - b.y;
                const angle = Math.atan2(dy, dx);
                const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                b.vx += (Math.cos(angle) * speed - b.vx) * 0.08;
                b.vy += (Math.sin(angle) * speed - b.vy) * 0.08;
            }
            b.x += b.vx * dt; b.y += b.vy * dt;
            if (b.x > CANVAS_WIDTH || b.x < 0 || b.y < -50 || b.y > CANVAS_HEIGHT + 50) {
                this.bullets.splice(i, 1); continue;
            }
            for (let j = entities.length - 1; j >= 0; j--) {
                if (entities[j] instanceof Obstacle) {
                    const o = entities[j];
                    if (b.x > o.x && b.x < o.x + o.w && b.y > o.y && b.y < o.y + o.h) {
                        entities.splice(j, 1); this.bullets.splice(i, 1); break;
                    }
                }
            }
        }

        // Gekko Eyes Logic
        this.blinkT -= dt;
        if (this.blinkT <= 0) {
            if (this.isBlinking) { this.isBlinking = false; this.blinkT = 150 + Math.random() * 250; }
            else { this.isBlinking = true; this.blinkT = 8; }
        }
        const tx = Math.cos(this.aimAngle) * 3, ty = Math.sin(this.aimAngle) * 3;
        this.eyeX += (tx - this.eyeX) * 0.1 * dt;
        this.eyeY += (ty - this.eyeY) * 0.1 * dt;
    }

    draw(ctx) {
        if (!this.active) return;
        const safeX = Number.isFinite(this.x) ? this.x : 20;
        const safeY = Number.isFinite(this.y) ? this.y : CANVAS_HEIGHT / 2;
        ctx.save();
        const bY = Math.sin(this.bounce || 0) * 1;
        const scale = 0.55;
        const cx = safeX + 25; const cy = safeY + 28 + bY;
        ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);

        const chapter = window.game ? window.game.chapter : 1;
        const config = window.game?.getActiveChapterConfig
            ? (window.game.getActiveChapterConfig(chapter) || { colors: ['#228B22', '#8B4513'], bg: 'forest' })
            : { colors: ['#228B22', '#8B4513'], bg: 'forest' };
        const primaryColor = config.colors[0] || '#228B22';
        const secondaryColor = config.colors[1] || '#8B4513';
        const bg = config.bg || '';
        const biome = String(config.biome || bg || config.theme || '').toLowerCase();

        // Try to draw SVG companion if available
        const chapterAssets = this.assets[`ch${chapter}`];
        if (chapterAssets && chapterAssets['comp'] && !chapterAssets['comp'].isPlaceholder) {
            ctx.drawImage(chapterAssets['comp'], cx - 35, cy - 45, 70, 90);
        } else {
            // Procedural adaptive companion fallback
            // Optimized Rim Light (Phase 1: Art Direction Standard)
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = primaryColor;
            ctx.translate(cx + 3, cy + 3);
            ctx.beginPath(); ctx.ellipse(0, 0, 24, 30, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(-2, -37, 19, 21, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // Legs & Feet
            ctx.fillStyle = primaryColor;
            ctx.fillRect(cx - 20, cy + 30, 14, 22);
            ctx.fillRect(cx + 6, cy + 30, 14, 22);
            ctx.fillStyle = secondaryColor;
            ctx.fillRect(cx - 22, cy + 46, 18, 8);
            ctx.fillRect(cx + 4, cy + 46, 18, 8);

            // Body
            const bodyFill = biome.match(/space|arcade|retro|rain|toyfactory/)
                ? `${secondaryColor}AA`
                : (secondaryColor === '#8B4513' ? '#87CEEB' : secondaryColor + '88');
            ctx.fillStyle = bodyFill;
            ctx.beginPath(); ctx.ellipse(cx, cy, 22, 28, 0, 0, Math.PI * 2); ctx.fill();

            // Arms
            ctx.fillStyle = secondaryColor;
            ctx.beginPath(); ctx.moveTo(cx - 18, cy - 20); ctx.lineTo(cx - 22, cy + 25);
            ctx.lineTo(cx - 8, cy + 25); ctx.lineTo(cx - 8, cy - 15); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(cx + 18, cy - 20); ctx.lineTo(cx + 22, cy + 25);
            ctx.lineTo(cx + 8, cy + 25); ctx.lineTo(cx + 8, cy - 15); ctx.closePath(); ctx.fill();

            ctx.fillStyle = '#2F1810'; ctx.fillRect(cx - 20, cy + 15, 40, 6);

            // Trunk & Weapon
            ctx.fillStyle = primaryColor;
            ctx.save(); ctx.translate(cx + 28, cy - 5); ctx.rotate(this.aimAngle);
            ctx.fillRect(-5, -4, 25, 8); ctx.restore();
            ctx.fillRect(cx - 32, cy - 8, 12, 20);

            ctx.save(); ctx.translate(cx + 28, cy - 5); ctx.rotate(this.aimAngle);
            ctx.fillStyle = (biome.match(/arcade|retro|space|rain|toyfactory/)) ? '#0FF' : '#333';
            ctx.fillRect(15, -3, 20, 6);
            ctx.fillStyle = secondaryColor; ctx.fillRect(10, -5, 10, 10);
            ctx.restore();

            // Head & Ears
            ctx.fillStyle = primaryColor; ctx.beginPath();
            ctx.ellipse(cx, cy - 35, 18, 20, 0, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = biome.match(/ice|crystal|space/)
                ? '#E0F7FF'
                : (primaryColor === '#228B22' ? '#32CD32' : primaryColor);
            ctx.beginPath(); ctx.ellipse(cx - 22, cy - 40, 12, 15, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cx + 22, cy - 40, 12, 15, 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFF2';
            ctx.beginPath(); ctx.ellipse(cx - 22, cy - 40, 6, 8, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cx + 22, cy - 40, 6, 8, 0.3, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = primaryColor; ctx.lineWidth = 7; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(cx, cy - 25);
            ctx.quadraticCurveTo(cx + 15, cy - 15, cx + 10, cy - 5); ctx.stroke();

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx - 7, cy - 38, 5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 7, cy - 38, 5, 0, Math.PI * 2); ctx.fill();

            if (!this.isBlinking) {
                ctx.fillStyle = '#222';
                ctx.beginPath(); ctx.arc(cx - 7 + this.eyeX, cy - 38 + this.eyeY, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + 7 + this.eyeX, cy - 38 + this.eyeY, 2.5, 0, Math.PI * 2); ctx.fill();
            }

            // DYNAMIC ACCESSORIES (Skins)
            ctx.save();
            if (biome.match(/jungle|swamp/)) {
                ctx.fillStyle = '#C19A6B'; ctx.beginPath(); ctx.ellipse(cx, cy - 55, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillRect(cx - 15, cy - 65, 30, 12);
            }
            else if (biome.match(/desert|moon/)) {
                ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.moveTo(cx - 25, cy - 35); ctx.lineTo(cx - 35, cy - 10); ctx.lineTo(cx + 35, cy - 10); ctx.lineTo(cx + 25, cy - 35); ctx.fill();
                ctx.fillStyle = '#00f'; ctx.fillRect(cx - 5, cy - 50, 10, 15);
            }
            else if (biome.match(/mexico/)) {
                ctx.fillStyle = '#D2B48C'; ctx.beginPath(); ctx.ellipse(cx, cy - 55, 40, 10, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx, cy - 60, 15, Math.PI, 0); ctx.fill();
                ctx.strokeStyle = '#F00'; ctx.lineWidth = 2; ctx.stroke();
            }
            else if (biome.match(/underwater|rain/)) {
                ctx.fillStyle = 'rgba(205, 127, 50, 0.6)'; ctx.strokeStyle = '#8B4513';
                ctx.beginPath(); ctx.arc(cx, cy - 35, 25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
            else if (biome.match(/japan|enchanted/)) {
                ctx.strokeStyle = '#FFD'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy - 65, 20, 5, 0, 0, Math.PI * 2); ctx.stroke();
            }
            else if (biome.match(/space|arcade|retro|toyfactory/)) {
                ctx.fillStyle = 'rgba(200, 230, 255, 0.4)'; ctx.strokeStyle = '#DDD';
                ctx.beginPath(); ctx.arc(cx, cy - 35, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
            else if (biome.match(/lava/)) {
                ctx.fillStyle = '#2B0B0B';
                ctx.beginPath(); ctx.moveTo(cx - 22, cy - 58); ctx.lineTo(cx, cy - 78); ctx.lineTo(cx + 22, cy - 58); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#FFD166'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(cx - 12, cy - 58); ctx.lineTo(cx, cy - 72); ctx.lineTo(cx + 12, cy - 58); ctx.stroke();
            }
            else if (biome.match(/ice|crystal/)) {
                ctx.fillStyle = 'rgba(224,247,255,0.55)';
                ctx.beginPath(); ctx.moveTo(cx, cy - 78); ctx.lineTo(cx - 18, cy - 48); ctx.lineTo(cx + 18, cy - 48); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#E0F7FF'; ctx.lineWidth = 2; ctx.stroke();
            }
            else {
                ctx.fillStyle = '#333';
                ctx.beginPath(); ctx.ellipse(cx, cy - 55, 28, 7, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#333';
                ctx.beginPath(); ctx.moveTo(cx - 15, cy - 58); ctx.lineTo(cx - 15, cy - 85);
                ctx.lineTo(cx + 15, cy - 85); ctx.lineTo(cx + 15, cy - 85); ctx.closePath(); ctx.fill();
                ctx.fillStyle = primaryColor; ctx.fillRect(cx - 15, cy - 65, 30, 5);
            }
            ctx.restore();
        }

        // Themed bullets
        for (const b of this.bullets) {
            let core = '#FFD700';
            let mid = '#FFA500';
            let tail = '#FF6600';

            if (biome.match(/jungle|swamp/)) {
                core = '#9BE564'; mid = '#4CAF50'; tail = '#1B5E20';
            } else if (biome.match(/desert|moon/)) {
                core = '#FFE082'; mid = '#FFB74D'; tail = '#8D6E63';
            } else if (biome.match(/japan|enchanted/)) {
                core = '#FFD6F6'; mid = '#C084FC'; tail = '#7C3AED';
            } else if (biome.match(/mexico/)) {
                core = '#FFEB3B'; mid = '#FF5252'; tail = '#00C853';
            } else if (biome.match(/underwater|rain/)) {
                core = '#B3E5FC'; mid = '#29B6F6'; tail = '#1565C0';
            } else if (biome.match(/space|arcade|retro|toyfactory/)) {
                core = '#E0F7FA'; mid = '#00E5FF'; tail = '#6A00FF';
            } else if (biome.match(/lava/)) {
                core = '#FFD166'; mid = '#FF6B35'; tail = '#7F1D1D';
            } else if (biome.match(/ice|crystal/)) {
                core = '#FFFFFF'; mid = '#9BE7FF'; tail = '#4FC3F7';
            }

            ctx.fillStyle = core;
            ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill();

            if (biome.match(/ice|crystal/)) {
                ctx.strokeStyle = mid;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(b.x, b.y - 7);
                ctx.lineTo(b.x + 5, b.y);
                ctx.lineTo(b.x, b.y + 7);
                ctx.lineTo(b.x - 5, b.y);
                ctx.closePath();
                ctx.stroke();
            } else if (biome.match(/space|arcade|retro|toyfactory/)) {
                ctx.strokeStyle = mid;
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(b.x, b.y, 9, 0, Math.PI * 2); ctx.stroke();
            } else if (biome.match(/japan|enchanted/)) {
                ctx.fillStyle = mid;
                ctx.beginPath(); ctx.arc(b.x - b.vx * 0.18, b.y - b.vy * 0.18, 4.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = tail;
                ctx.beginPath(); ctx.arc(b.x - b.vx * 0.36, b.y - b.vy * 0.36, 2.5, 0, Math.PI * 2); ctx.fill();
                continue;
            }

            ctx.fillStyle = mid;
            ctx.beginPath(); ctx.arc(b.x - b.vx * 0.3, b.y - b.vy * 0.3, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = tail;
            ctx.beginPath(); ctx.arc(b.x - b.vx * 0.6, b.y - b.vy * 0.6, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}
