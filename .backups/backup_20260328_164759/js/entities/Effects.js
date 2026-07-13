import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

export class FloatingText {
    constructor(x, y, text, color, size = 22, type = 'float') {
        this.x = x; this.y = y;
        this.text = text; this.color = color;
        this.size = size;
        this.type = type;
        this.life = 1.0; this.dead = false;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = type === 'pop' ? -8 : -1.5;
        this.gravity = type === 'pop' ? 0.4 : 0;
    }
    update(dt) {
        this.life -= 0.02 * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;

        if (this.type === 'shake') {
            this.x += Math.sin(Date.now() * 0.1) * 2;
        }

        if (this.life <= 0) this.dead = true;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.life * 2);

        const scale = this.type === 'pop'
            ? 1 + Math.sin((1 - this.life) * Math.PI) * 0.5
            : 1 + (1 - this.life) * 0.2;

        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);

        ctx.font = `900 ${this.size}px Impact, Inter, 'Titan One', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(this.text, 0, 0);

        ctx.fillStyle = this.color;
        ctx.fillText(this.text, 0, 0);

        ctx.restore();
    }
}

export class Particle {
    constructor() { this.active = false; }
    init(x, y, color, type = 'circle') {
        this.x = x; this.y = y; this.color = color; this.active = true;
        this.type = type;
        this.size = Math.random() * 6 + 2;
        this.vx = Math.random() * 10 - 5; this.vy = Math.random() * 10 - 5;
        this.life = 1.0;
        this.decay = Math.random() * 0.04 + 0.02;
        this.rot = Math.random() * Math.PI * 2;
        this.rotSpd = (Math.random() - 0.5) * 0.4;
    }
    update(dt) {
        if (!this.active) return;
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.vy += 0.12 * dt;
        this.rot += this.rotSpd * dt;
        this.life -= this.decay * dt;
        this.size *= 0.96;

        // Físicas de rebote (Fase 6: Advanced FX)
        const floorY = CANVAS_HEIGHT - 30;
        if (this.y + this.size > floorY) {
            this.y = floorY - this.size;
            this.vy *= -0.55; // Rebote con pérdida de energía
            this.vx *= 0.8;  // Fricción al rebotar
        }

        if (this.life <= 0 || this.size < 0.3) this.active = false;
    }
}

export class Debris {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.rot = Math.random() * 6.28;
        this.rotSpd = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 8 + 4;
        this.life = 1.0;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 0.8 * dt;
        this.rot += this.rotSpd * dt;
        this.life -= 0.015 * dt;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

export class ParticlePool {
    constructor(size = 300) {
        this.pool = Array.from({ length: size }, () => new Particle());
        this.debris = [];
    }
    clear() {
        for (const p of this.pool) p.active = false;
        this.debris = [];
    }
    spawn(x, y, color, count = 10, type = 'circle') {
        let spawned = 0;
        for (let i = 0; i < this.pool.length && spawned < count; i++) {
            if (!this.pool[i].active) { this.pool[i].init(x, y, color, type); spawned++; }
        }
    }
    spawnDebris(x, y, colors = ['#333', '#555'], count = 15) {
        for (let i = 0; i < count; i++) {
            const col = colors[Math.floor(Math.random() * colors.length)];
            this.debris.push(new Debris(x, y, col));
        }
    }

    createThematicBurst(x, y, colors, ambient = 'default') {
        const primary = colors[0] || '#FFF';
        const secondary = colors[1] || primary;
        const accent = colors[2] || secondary;

        switch (ambient) {
            case 'digital':
            case 'glitch':
                this.spawn(x, y, primary, 15, 'square');
                this.spawn(x, y, accent, 10, 'spark');
                this.spawnDebris(x, y, [primary, secondary, accent], 8);
                break;
            case 'sand':
            case 'dust':
                this.spawn(x, y, secondary, 20, 'circle');
                this.spawn(x, y, accent, 10, 'circle');
                this.spawnDebris(x, y, [secondary, accent], 6);
                break;
            case 'sakura':
                this.spawn(x, y, primary, 12, 'square');
                this.spawn(x, y, accent, 8, 'circle');
                this.spawnDebris(x, y, [primary, accent], 5);
                break;
            case 'bubbles':
                this.spawn(x, y, 'rgba(255,255,255,0.6)', 15, 'circle');
                this.spawn(x, y, primary, 6, 'circle');
                break;
            case 'embers':
                this.spawn(x, y, primary, 16, 'spark');
                this.spawn(x, y, accent, 10, 'circle');
                this.spawnDebris(x, y, [primary, secondary, accent], 7);
                break;
            case 'fireflies':
            case 'sparkles':
            case 'glitter':
            case 'glints':
                this.spawn(x, y, accent, 12, 'spark');
                this.spawn(x, y, primary, 10, 'circle');
                break;
            case 'rain':
            case 'snow':
            case 'snowflakes':
                this.spawn(x, y, primary, 14, 'circle');
                this.spawn(x, y, secondary, 8, 'spark');
                break;
            case 'magic_dust':
                this.spawn(x, y, primary, 10, 'spark');
                this.spawn(x, y, accent, 10, 'square');
                this.spawnDebris(x, y, [primary, accent], 6);
                break;
            case 'confetti':
                this.spawn(x, y, primary, 8, 'square');
                this.spawn(x, y, secondary, 8, 'square');
                this.spawn(x, y, accent, 8, 'square');
                break;
            case 'steam':
                this.spawn(x, y, secondary, 16, 'circle');
                this.spawn(x, y, primary, 6, 'circle');
                break;
            default:
                this.spawn(x, y, accent, 10, 'circle');
                this.spawn(x, y, primary, 8, 'circle');
                this.spawnDebris(x, y, [primary, secondary, accent], 6);
                break;
        }
    }
    update(dt) {
        // Límite de seguridad para evitar excesivo consumo de memoria si hay muchas explosiones
        if (this.debris.length > 300) {
            this.debris.splice(0, this.debris.length - 300);
        }

        // Update particles in pool
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) this.pool[i].update(dt);
        }
        
        // Update and cleanup debris
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];
            d.update(dt);
            // Strict cleanup: life exhausted or out of bounds
            if (d.life <= 0 || d.y > CANVAS_HEIGHT + 50 || d.x < -50 || d.x > CANVAS_WIDTH + 50) {
                this.debris.splice(i, 1);
            }
        }
    }
    draw(ctx) {
        // Draw particles from pool
        for (let i = 0; i < this.pool.length; i++) {
            const p = this.pool[i];
            if (!p.active) continue;
            
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            
            if (p.type === 'spark') {
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillRect(-p.size, -p.size / 4, p.size * 2, p.size / 2);
            } else if (p.type === 'square') {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, 6.28);
                ctx.fill();
            }
            ctx.restore();
        }

        // Draw debris
        for (let i = 0; i < this.debris.length; i++) {
            this.debris[i].draw(ctx);
        }
    }
}
