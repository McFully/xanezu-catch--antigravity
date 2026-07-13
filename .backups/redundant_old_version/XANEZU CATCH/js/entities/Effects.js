import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

export class FloatingText {
    constructor(x, y, text, color, size = 22, type = 'float') {
        this.x = x; this.y = y;
        this.text = text; this.color = color;
        this.size = size;
        this.type = type; // 'float', 'pop', 'shake'
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

        // Fill
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
        this.vy += 0.12 * dt; // Gravity
        this.rot += this.rotSpd * dt;
        this.life -= this.decay * dt;
        this.size *= 0.96;
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

    /**
     * Reacción visual única del Director de Arte para colisiones.
     * Crea efectos que varían según la temática del capítulo.
     */
    createThematicBurst(x, y, colors, ambient = 'default') {
        const primary = colors[0] || '#FFF';
        const secondary = colors[1] || primary;

        switch (ambient) {
            case 'digital':
            case 'glitch':
                // Chispas cuadradas y flashes neón
                this.spawn(x, y, primary, 15, 'square');
                this.spawn(x, y, '#0FF', 10, 'spark');
                break;
            case 'sand':
                // Partículas de polvo de diferentes tamaños
                this.spawn(x, y, secondary, 20, 'circle');
                this.spawn(x, y, '#EEDD88', 10, 'circle');
                break;
            case 'sakura':
                // Pétalos rosados rotando
                this.spawn(x, y, '#FFB7C5', 12, 'square');
                this.spawn(x, y, '#FFF', 8, 'circle');
                break;
            case 'bubbles':
                // Burbujas que suben
                this.spawn(x, y, 'rgba(255,255,255,0.6)', 15, 'circle');
                break;
            default:
                // Burst estándar cartoon (blanco + color secundario)
                this.spawn(x, y, '#FFF', 10, 'circle');
                this.spawn(x, y, primary, 8, 'circle');
                this.spawnDebris(x, y, [primary, secondary], 6);
                break;
        }
    }
    update(dt) {
        this.pool.forEach(p => p.update(dt));
        for (let i = this.debris.length - 1; i >= 0; i--) {
            this.debris[i].update(dt);
            if (this.debris[i].life <= 0 || this.debris[i].y > CANVAS_HEIGHT) this.debris.splice(i, 1);
        }
    }
    draw(ctx) {
        // Art Director Phase 2: BATCH RENDERING
        // Group particles by color for better performance
        const groups = {};
        for (const p of this.pool) {
            if (!p.active) continue;
            if (!groups[p.color]) groups[p.color] = [];
            groups[p.color].push(p);
        }

        for (const color in groups) {
            ctx.fillStyle = color;
            for (const p of groups[color]) {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                if (p.type === 'spark') {
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.fillRect(-p.size, -p.size / 4, p.size * 2, p.size / 2);
                } else if (p.type === 'square') {
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                } else {
                    ctx.beginPath(); ctx.arc(0, 0, p.size, 0, 6.28); ctx.fill();
                }
                ctx.restore();
            }
        }

        this.debris.forEach(d => d.draw(ctx));
    }
}

