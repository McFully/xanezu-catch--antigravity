import { Entity } from './BaseEntity.js';
import { CANVAS_HEIGHT } from '../constants.js';

function getActiveItemConfig() {
    const game = window.game;
    const chapter = game?.chapter || 1;
    return game?.getActiveChapterConfig?.(chapter) || { colors: ['#7cf27c', '#2f7d32'], bg: 'forest', biome: 'forest' };
}

function getItemPalette(type) {
    const config = getActiveItemConfig();
    const biome = String(config.biome || config.bg || 'forest').toLowerCase();
    const base = config.colors || ['#7cf27c', '#2f7d32'];

    if (type === 'coin') return { main: '#ffd84d', accent: '#ff9f1a', glow: 'rgba(255, 216, 77, 0.45)' };
    if (type === 'ruby') return { main: '#ff4d6d', accent: '#8a0f2a', glow: 'rgba(255, 77, 109, 0.45)' };
    if (type === 'emerald') return { main: '#38d996', accent: '#13795b', glow: 'rgba(56, 217, 150, 0.4)' };
    if (type === 'diamond') return { main: '#dff7ff', accent: '#7ac7e8', glow: 'rgba(223, 247, 255, 0.45)' };
    if (type === 'pearl') return { main: '#fff7e6', accent: '#d1c4b0', glow: 'rgba(255, 247, 230, 0.4)' };
    if (type === 'crown') return { main: '#ffe37a', accent: '#b77b00', glow: 'rgba(255, 227, 122, 0.45)' };

    if (type === 'power') {
        if (/lava|volcano/.test(biome)) return { main: '#ff8740', accent: '#5b1300', glow: 'rgba(255, 135, 64, 0.45)' };
        if (/ice|crystal/.test(biome)) return { main: '#c6f3ff', accent: '#61b6d9', glow: 'rgba(198, 243, 255, 0.45)' };
        if (/arcade|tech|space|retro/.test(biome)) return { main: '#77f7ff', accent: '#1740a1', glow: 'rgba(119, 247, 255, 0.45)' };
        if (/japan|enchanted/.test(biome)) return { main: '#f3a7ff', accent: '#7b2cbf', glow: 'rgba(243, 167, 255, 0.45)' };
        if (/desert|moon/.test(biome)) return { main: '#ffd27d', accent: '#a85b00', glow: 'rgba(255, 210, 125, 0.4)' };
        if (/underwater|rain/.test(biome)) return { main: '#7ed6ff', accent: '#005f99', glow: 'rgba(126, 214, 255, 0.45)' };
        return { main: base[0] || '#7cf27c', accent: base[1] || '#2f7d32', glow: 'rgba(124, 242, 124, 0.35)' };
    }

    return { main: base[0] || '#7cf27c', accent: base[1] || '#2f7d32', glow: 'rgba(124, 242, 124, 0.35)' };
}

function getArtifactHue(level) {
    const config = getActiveItemConfig();
    const biome = String(config.biome || config.bg || 'forest').toLowerCase();
    if (/lava|volcano/.test(biome)) return 16;
    if (/ice|crystal/.test(biome)) return 196;
    if (/arcade|space|retro|tech/.test(biome)) return 186;
    if (/japan|enchanted/.test(biome)) return 286;
    if (/desert|moon/.test(biome)) return 42;
    if (/underwater|rain/.test(biome)) return 204;
    const hues = [0, 60, 120, 180, 240, 300];
    return hues[level % hues.length];
}

export class BonusItem extends Entity {
    constructor(x, y, type, img, speed) {
        // Base size 140 (Escalado x1.75 desde 80)
        super(x, y, 140, 140, speed);
        this.init(x, y, type, img);
    }

    init(x, y, type, img) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.type = type;
        this.img = img;
        this.active = true;
        this.osc = Math.random() * 10;
        this.pts = {
            coin: 200, ruby: 500, crown: 1000, emerald: 800, pearl: 1200, diamond: 2000
        }[type] || 0;
    }
    update(dt) {
        super.update(dt);

        if (this.type === 'coin') {
            // Coin moves much faster vertically, zigzagging across the entire screen
            this.osc += 0.08 * dt;
            // Amplitude of 200 means it will sweep up and down by 400 pixels total
            this.y = this.baseY + Math.sin(this.osc) * 250;
            // Prevent going out of screen bounds top/bottom
            if (this.y < 20) this.y = 20;
            if (this.y > CANVAS_HEIGHT - 140) this.y = CANVAS_HEIGHT - 140;
        } else {
            // Standard gems just float gently
            this.osc += 0.05 * dt;
            this.y = this.baseY + Math.cos(this.osc) * 15;
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        const angle = Math.sin(this.osc * 0.5) * 0.1;
        ctx.rotate(angle);
        if (this.type !== 'banana' && this.type !== 'heart') {
            ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
            ctx.shadowBlur = 15;
        }
        if (this.img && this.img.complete && !this.img.isPlaceholder) {
            ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
        } else {
            this._drawProcedural(ctx);
        }
        ctx.restore();
    }
    _drawProcedural(ctx) {
        const palette = getItemPalette(this.type);
        ctx.shadowColor = palette.glow;
        ctx.shadowBlur = 18;
        ctx.fillStyle = palette.main;
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 5;

        ctx.beginPath();
        if (this.type === 'coin') {
            ctx.ellipse(0, 0, 45, 55, 0, 0, Math.PI * 2);
        } else if (this.type === 'diamond') {
            ctx.moveTo(0, -52); ctx.lineTo(42, -7); ctx.lineTo(24, 49); ctx.lineTo(-24, 49); ctx.lineTo(-42, -7);
        } else if (this.type === 'crown') {
            ctx.moveTo(-49, 35); ctx.lineTo(-35, -17); ctx.lineTo(-7, 10); ctx.lineTo(0, -42); ctx.lineTo(10, 10); ctx.lineTo(38, -17); ctx.lineTo(49, 35);
        } else {
            ctx.moveTo(0, -49); ctx.lineTo(42, 0); ctx.lineTo(0, 49); ctx.lineTo(-42, 0);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        if (this.type === 'coin') ctx.fillRect(-10, -32, 20, 63);
        else ctx.fillRect(-7, -32, 14, 35);
    }
}

export class Candy extends Entity {
    constructor(x, y, type, img, speed) {
        super(x, y, 115, 115, speed); // Escalado x1.75 desde 66
        this.init(x, y, type, img);
    }

    init(x, y, type, img) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.type = type;
        this.img = img;
        this.active = true;
        this.osc = Math.random() * 10;
        this.pts = Math.floor(Math.random() * 95) + 5;
    }
    update(dt) {
        super.update(dt);
        this.osc += 0.06 * dt; // Zigzag speed
        // Zigzag vertically by ~120px amplitude
        this.y = this.baseY + Math.sin(this.osc) * 60;

        // Ensure it doesn't leave the screen from top or bottom
        if (this.y < 20) this.y = 20;
        if (this.y > CANVAS_HEIGHT - 115) this.y = CANVAS_HEIGHT - 115;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        const scale = 1.0 + Math.sin(this.osc * 2) * 0.05;
        ctx.scale(scale, scale);
        ctx.rotate(this.osc * 0.2);
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 10;
        if (this.img && this.img.complete && !this.img.isPlaceholder) {
            ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
        } else {
            this._drawProcedural(ctx);
        }
        ctx.restore();
    }
    _drawProcedural(ctx) {
        const palette = getItemPalette('candy');
        const colors = [
            '#ff5d8f', '#ffa64d', '#ffe066', '#52d681', '#56cfe1',
            '#5aa9ff', '#b388ff', '#ff8fab', '#8d6e63', '#adb5bd'
        ];
        const idx = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'grey'].indexOf(this.type);
        const candyColor = colors[idx >= 0 ? idx : 0];

        ctx.fillStyle = candyColor;
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillRect(-49, -10, 31, 21);
        ctx.fillRect(17, -10, 31, 21);
        ctx.beginPath();
        ctx.moveTo(-49, 0); ctx.lineTo(-70, -21); ctx.lineTo(-70, 21);
        ctx.moveTo(49, 0); ctx.lineTo(70, -21); ctx.lineTo(70, 21);
        ctx.closePath();
        ctx.fill();
    }
}

export class PowerUp extends Entity {
    constructor(x, y, type, img, speed) {
        super(x, y, 160, 160, speed);
        this.init(x, y, type, img);
    }

    init(x, y, type, img) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.img = img;
        this.active = true;
        this.angle = 0;
    }
    update(dt) {
        super.update(dt);
        this.angle += 0.05 * dt;
    }
    draw(ctx) {
        if (this.img && this.img.complete && !this.img.isPlaceholder) {
            ctx.save();
            ctx.translate(this.x + 80, this.y + 80);
            ctx.rotate(Math.sin(this.angle) * 0.2);
            ctx.drawImage(this.img, -80, -80, 160, 160);
            ctx.restore();
        } else {
            this._drawProcedural(ctx);
        }
    }
    _drawProcedural(ctx) {
        const palette = getItemPalette('power');
        ctx.save();
        ctx.translate(this.x + 80, this.y + 80);
        ctx.rotate(Math.sin(this.angle) * 0.2);
        ctx.shadowColor = palette.glow;
        ctx.shadowBlur = 18;

        ctx.fillStyle = palette.main;
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        if (this.type === 'shield') {
            ctx.beginPath();
            ctx.moveTo(0, -35); ctx.lineTo(28, -14); ctx.lineTo(21, 28); ctx.lineTo(0, 42); ctx.lineTo(-21, 28); ctx.lineTo(-28, -14);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'bolt') {
            ctx.beginPath();
            ctx.moveTo(7, -38); ctx.lineTo(-14, 3); ctx.lineTo(3, 3); ctx.lineTo(-7, 38); ctx.lineTo(28, -7); ctx.lineTo(10, -7);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'magnet') {
            ctx.fillRect(-26, -31, 17, 52);
            ctx.fillRect(9, -31, 17, 52);
            ctx.fillRect(-26, 14, 52, 17);
        } else if (this.type === 'clock' || this.type === 'hourglass') {
            ctx.beginPath();
            ctx.arc(0, 0, 23, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = palette.accent;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(0, -14);
            ctx.moveTo(0, 0); ctx.lineTo(12, 5);
            ctx.stroke();
        } else if (this.type === 'heart') {
            ctx.beginPath();
            ctx.moveTo(0, 31);
            ctx.bezierCurveTo(52, -7, 31, -49, 0, -17);
            ctx.bezierCurveTo(-31, -49, -52, -7, 0, 31);
            ctx.fill();
        } else if (this.type === 'star' || this.type === 'clover' || this.type === 'rainbow') {
            for (let i = 0; i < 5; i++) {
                const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
                const r = i % 2 === 0 ? 31 : 14;
                const px = Math.cos(a) * r;
                const py = Math.sin(a) * r;
                if (i === 0) ctx.beginPath(), ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.font = '700 45px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', 0, 2);
        }
        ctx.restore();
    }
    _drawEmoji(ctx) {
        const emojis = {
            'firework': '🎆',
            'winter_sun': '☀️',
            'ski': '⛷️',
            'thermal_suit': '🧥',
            'ice_warm': '🔥',
            'aurora': '🌌',
            'hourglass': '⏳',
            'heart': '❤️',
            'magnet': '🧲',
            'shield': '🛡️',
            'star': '⭐',
            'clock': '⏰',
            'ghost': '👻',
            'bolt': '⚡',
            'ice': '🧊',
            'clover': '🍀',
            'rainbow': '🌈'
        };
        const emoji = emojis[this.type] || '✨';

        ctx.save();
        ctx.translate(this.x + 80, this.y + 80);
        ctx.rotate(Math.sin(this.angle) * 0.2);
        ctx.font = '87px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 0, 0);

        // Glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 35;
        ctx.fillText(emoji, 0, 0);
        ctx.restore();
    }
}

export class LevelArtifact extends Entity {
    constructor(x, y, level, speed) {
        super(x, y, 140, 140, speed); // Escalado x1.75 desde 80
        this.level = level;
        this.pts = level * 100;
        this.rot = 0;
        this.hue = getArtifactHue(level);
        this.shape = level % 4;
    }
    update(dt) {
        super.update(dt);
        this.rot += 0.05 * dt;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + 70, this.y + 70);
        ctx.rotate(this.rot);

        // Art Director Phase 2: Comic Style instead of shadowBlur
        ctx.fillStyle = `hsl(${this.hue}, 80%, 60%)`;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 7;
        ctx.beginPath();
        if (this.shape === 0) ctx.arc(0, 0, 61, 0, 6.28);
        else if (this.shape === 1) ctx.rect(-52, -52, 105, 105);
        else if (this.shape === 2) { ctx.moveTo(0, -70); ctx.lineTo(70, 0); ctx.lineTo(0, 70); ctx.lineTo(-70, 0); }
        else ctx.moveTo(0, -70); ctx.lineTo(61, 52); ctx.lineTo(-61, 52);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "900 42px Impact, Inter, 'Titan One', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;
        ctx.strokeText(this.level, 0, 0);
        ctx.fillText(this.level, 0, 0);

        // AAA: Add a small sparkle effect to artifacts
        if (Math.random() > 0.9) {
            ctx.fillStyle = "#fff";
            const sx = (Math.random() - 0.5) * 105;
            const sy = (Math.random() - 0.5) * 105;
            ctx.fillRect(sx, sy, 7, 7);
        }
        ctx.restore();
    }
}
