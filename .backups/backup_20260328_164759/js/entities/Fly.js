import { Entity } from './BaseEntity.js';
import { CHAPTER_REGISTRY } from '../core/ChapterRegistry.js';

export class Fly extends Entity {
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
        this.osc = Math.random() * 10;
        this.pts = { banana: 10, gold: 25, heart: 50, bomb: 15 }[type] || 10;
    }
    update(dt, target = null) {
        super.update(dt);
        this.osc += 0.12 * dt;

        // AAA Wing Flap Simulation (Fast scale oscillation)
        this.flap = 1.0 + Math.sin(this.osc * 4) * 0.15;
        this.heartPulse = 1.0 + Math.sin(this.osc * 2) * 0.05;

        if (target && target.magnetT > 0) {
            const dx = (target.x + target.w / 2) - (this.x + this.w / 2);
            const dy = (target.y + target.h / 2) - (this.y + this.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1200) {
                // Smooth organic attraction
                this.x += (dx / dist) * 36 * dt;
                this.y += (dy / dist) * 36 * dt;
            } else {
                this.y += Math.sin(this.osc) * 3;
            }
        } else {
            const config = window.game?.getActiveChapterConfig
                ? (window.game.getActiveChapterConfig(window.game.chapter) || CHAPTER_REGISTRY[1])
                : (CHAPTER_REGISTRY[window.game.chapter] || CHAPTER_REGISTRY[1]);
            const amp = config.flyAmp || 3.0;
            // Add a bit of horizontal "jitter" for a more insect-like feel
            this.y += Math.sin(this.osc) * amp;
            this.x += Math.cos(this.osc * 0.5) * 1.5;
        }

        // AAA Trail Particles
        if (window.game && window.game.particles && Math.random() > 0.85) {
            const col = this.type === 'banana'
                ? '#FFE135'
                : (this.type === 'heart' ? '#FF4444' : (this.type === 'bomb' ? '#FF8C42' : '#FFD700'));
            window.game.particles.spawn(this.x + this.w / 2, this.y + this.h / 2, col, 1, 'circle');
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

        // Base juicy transformations
        ctx.scale(this.flap, 2.0 - this.flap);

        // Apply Heart Pulse specifically
        if (this.type === 'heart') {
            ctx.scale(this.heartPulse, this.heartPulse);
        }

        if (this.img && !this.img.isPlaceholder) {
            if (this.type === 'gold' || this.type === 'banana' || this.type === 'heart') {
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.type === 'heart' ? '#FF0000' : 'rgba(255, 220, 0, 0.4)';
            }
            ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
        } else {
            this._drawProcedural(ctx);
        }
        ctx.restore();
    }

    _drawProcedural(ctx) {
        const config = window.game?.getActiveChapterConfig
            ? (window.game.getActiveChapterConfig(window.game.chapter) || CHAPTER_REGISTRY[1])
            : (CHAPTER_REGISTRY[window.game.chapter] || CHAPTER_REGISTRY[1]);
        const biome = String(config.biome || config.bg || 'forest').toLowerCase();
        const wingColor = /arcade|space|retro|tech/.test(biome)
            ? 'rgba(140, 245, 255, 0.75)'
            : /lava|volcano/.test(biome)
                ? 'rgba(255, 180, 90, 0.75)'
                : /ice|crystal/.test(biome)
                    ? 'rgba(220, 248, 255, 0.8)'
                    : 'rgba(255, 255, 255, 0.75)';

        ctx.fillStyle = wingColor;
        ctx.beginPath();
        ctx.ellipse(-32, -8, 26, 40, -0.6, 0, Math.PI * 2);
        ctx.ellipse(32, -8, 26, 40, 0.6, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === 'heart') {
            ctx.shadowBlur = 15 + Math.sin(this.osc * 2) * 10;
            ctx.shadowColor = '#ff335e';
            ctx.fillStyle = '#ff5c7a';
            ctx.beginPath();
            ctx.moveTo(0, 18);
            ctx.bezierCurveTo(46, -4, 28, -42, 0, -14);
            ctx.bezierCurveTo(-46, -4, -28, -42, 0, 18);
            ctx.fill();
            return;
        }

        if (this.type === 'banana') {
            ctx.strokeStyle = '#f7b500';
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0.8, 2.4, true);
            ctx.stroke();
            ctx.strokeStyle = '#fff3a0';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(-2, -2, 16, 0.9, 2.3, true);
            ctx.stroke();
            return;
        }

        if (this.type === 'bomb') {
            ctx.shadowBlur = 16;
            ctx.shadowColor = 'rgba(255, 140, 66, 0.45)';
            ctx.fillStyle = '#343a40';
            ctx.strokeStyle = '#ff8c42';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 8, 32, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = '#ffd166';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(8, -20);
            ctx.quadraticCurveTo(28, -42, 12, -60);
            ctx.stroke();

            ctx.fillStyle = '#fff3a0';
            ctx.beginPath();
            ctx.arc(18, -60, 10, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(255, 216, 77, 0.45)';
        ctx.fillStyle = '#ffd84d';
        ctx.strokeStyle = '#b87900';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 32, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(-4, -12, 8, 24);
    }
}
