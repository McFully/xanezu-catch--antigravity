import { Entity } from './BaseEntity.js';
import { CHAPTER_REGISTRY } from '../core/ChapterRegistry.js';

export class Fly extends Entity {
    constructor(x, y, type, img, speed) {
        super(x, y, 90, 90, speed);
        this.img = img;
        this.type = type;
        this.pts = { banana: 10, gold: 25, heart: 50 }[type] || 10;
        this.osc = Math.random() * 10;
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
            if (dist < 600) {
                // Smooth organic attraction
                this.x += (dx / dist) * 18 * dt;
                this.y += (dy / dist) * 18 * dt;
            } else {
                this.y += Math.sin(this.osc) * 3;
            }
        } else {
            const config = CHAPTER_REGISTRY[window.game.chapter] || CHAPTER_REGISTRY[1];
            const amp = config.flyAmp || 3.0;
            // Add a bit of horizontal "jitter" for a more insect-like feel
            this.y += Math.sin(this.osc) * amp;
            this.x += Math.cos(this.osc * 0.5) * 1.5;
        }

        // AAA Trail Particles
        if (window.game && window.game.particles && Math.random() > 0.85) {
            const col = this.type === 'banana' ? '#FFE135' : (this.type === 'heart' ? '#FF4444' : '#FFD700');
            window.game.particles.spawn(this.x + this.w / 2, this.y + this.h / 2, col, 1, 'circle');
        }

    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

        // Base juicy transformations
        ctx.scale(this.flap, 2.0 - this.flap); // Stretch vertically when squashed horizontally

        // Apply Heart Pulse specifically
        if (this.type === 'heart') {
            ctx.scale(this.heartPulse, this.heartPulse);
        }

        if (this.type === 'heart' && !this.img) {
            ctx.fillStyle = '#FF4444';
            ctx.font = '55px Outfit, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // AAA Heart Pulsing Glow
            ctx.shadowBlur = 15 + Math.sin(this.osc * 2) * 10;
            ctx.shadowColor = '#FF0000';
            ctx.fillText('❤', 0, 0);
        } else if (this.img) {
            // Draw with a subtle glow based on type
            if (this.type === 'gold' || this.type === 'banana' || this.type === 'heart') {
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.type === 'heart' ? '#FF0000' : 'rgba(255, 220, 0, 0.4)';
            }
            ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
        }
        ctx.restore();
    }
}
