import { Entity } from './BaseEntity.js';
import { CANVAS_HEIGHT } from '../constants.js';

export class BonusItem extends Entity {
    constructor(x, y, type, img, speed) {
        // Base size 80, but coins could be slightly smaller/larger if wanted, keeping 80
        super(x, y, 80, 80, speed);
        this.type = type;
        this.img = img;
        this.osc = Math.random() * 10;
        this.baseY = y;
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
            if (this.y > 600) this.y = 600;
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
        ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}

export class Candy extends Entity {
    constructor(x, y, type, img, speed) {
        super(x, y, 66, 66, speed); // Increased size by 10%
        this.type = type;
        this.img = img;
        this.pts = Math.floor(Math.random() * 95) + 5;
        this.osc = Math.random() * 10;
        this.baseY = y;
        this.vx = speed; // Make sure the candy still moves horizontally
    }
    update(dt) {
        super.update(dt);
        this.osc += 0.06 * dt; // Zigzag speed
        // Zigzag vertically by ~120px amplitude
        this.y = this.baseY + Math.sin(this.osc) * 60;

        // Ensure it doesn't leave the screen from top or bottom
        if (this.y < 20) this.y = 20;
        if (this.y > CANVAS_HEIGHT - 80) this.y = CANVAS_HEIGHT - 80;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        const scale = 1.0 + Math.sin(this.osc * 2) * 0.05;
        ctx.scale(scale, scale);
        ctx.rotate(this.osc * 0.2);
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 10;
        ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}

export class PowerUp extends Entity {
    constructor(x, y, type, img, speed) {
        super(x, y, 90, 90, speed);
        this.type = type;
        this.img = img;
        this.angle = 0;
    }
    update(dt) {
        super.update(dt);
        this.angle += 0.05 * dt;
    }
    draw(ctx) {
        if (this.img && this.img.complete) {
            ctx.save();
            ctx.translate(this.x + 45, this.y + 45);
            ctx.rotate(Math.sin(this.angle) * 0.2);
            ctx.drawImage(this.img, -45, -45, 90, 90);
            ctx.restore();
        } else {
            this._drawEmoji(ctx);
        }
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
        ctx.translate(this.x + 45, this.y + 45);
        ctx.rotate(Math.sin(this.angle) * 0.2);
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 0, 0);

        // Glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.fillText(emoji, 0, 0);
        ctx.restore();
    }
}

export class LevelArtifact extends Entity {
    constructor(x, y, level, speed) {
        super(x, y, 80, 80, speed);
        this.level = level;
        this.pts = level * 100;
        this.rot = 0;
        const hues = [0, 60, 120, 180, 240, 300];
        this.hue = hues[level % hues.length];
        this.shape = level % 4;
    }
    update(dt) {
        super.update(dt);
        this.rot += 0.05 * dt;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + 40, this.y + 40);
        ctx.rotate(this.rot);

        // Art Director Phase 2: Comic Style instead of shadowBlur
        ctx.fillStyle = `hsl(${this.hue}, 80%, 60%)`;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (this.shape === 0) ctx.arc(0, 0, 35, 0, 6.28);
        else if (this.shape === 1) ctx.rect(-30, -30, 60, 60);
        else if (this.shape === 2) { ctx.moveTo(0, -40); ctx.lineTo(40, 0); ctx.lineTo(0, 40); ctx.lineTo(-40, 0); }
        else ctx.moveTo(0, -40); ctx.lineTo(35, 30); ctx.lineTo(-35, 30);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "900 24px Impact, Inter, 'Titan One', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(this.level, 0, 0);
        ctx.fillText(this.level, 0, 0);

        // AAA: Add a small sparkle effect to artifacts
        if (Math.random() > 0.9) {
            ctx.fillStyle = "#fff";
            const sx = (Math.random() - 0.5) * 60;
            const sy = (Math.random() - 0.5) * 60;
            ctx.fillRect(sx, sy, 4, 4);
        }
        ctx.restore();
    }
}
