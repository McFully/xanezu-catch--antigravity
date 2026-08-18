import { LOGICAL_WIDTH, LOGICAL_HEIGHT, LOGICAL_GROUND_Y } from './engine.constants';

export class FloatingText {
    public dead: boolean = false;
    private life: number = 1.0;
    private vx: number;
    private vy: number;
    private gravity: number;

    constructor(
        public x: number,
        public y: number,
        public text: string,
        public color: string,
        public size: number = 22,
        public type: 'float' | 'pop' | 'shake' = 'float'
    ) {
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = type === 'pop' ? -8 : -1.5;
        this.gravity = type === 'pop' ? 0.4 : 0;
    }

    update(dt: number): void {
        this.life -= 0.02 * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;

        if (this.type === 'shake') {
            this.x += Math.sin(Date.now() * 0.1) * 2;
        }

        if (this.life <= 0) this.dead = true;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.life * 2));

        const scale = this.type === 'pop'
            ? 1 + Math.sin((1 - this.life) * Math.PI) * 0.5
            : 1 + (1 - this.life) * 0.2;

        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);

        ctx.font = `900 ${this.size}px Impact, Inter, sans-serif`;
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
    public active: boolean = false;
    public x: number = 0;
    public y: number = 0;
    public vx: number = 0;
    public vy: number = 0;
    public size: number = 0;
    public color: string = '#FFF';
    public life: number = 0;
    public decay: number = 0.02;
    public type: string = 'circle';
    public rot: number = 0;
    public rotSpd: number = 0;

    constructor() {}

    init(x: number, y: number, color: string, type: string = 'circle'): void {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.active = true;
        this.size = Math.random() * 6 + 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = Math.random() * 0.04 + 0.02;
        this.rot = Math.random() * Math.PI * 2;
        this.rotSpd = (Math.random() - 0.5) * 0.4;
    }

    update(dt: number): void {
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 0.12 * dt; // Gravedad
        this.rot += this.rotSpd * dt;
        this.life -= this.decay * dt;
        this.size *= 0.96;

        // Rebote en suelo
        const floorY = LOGICAL_GROUND_Y;
        if (this.y + this.size > floorY) {
            this.y = floorY - this.size;
            this.vy *= -0.55;
            this.vx *= 0.8;
        }

        if (this.life <= 0 || this.size < 0.3) this.active = false;
    }
}

export class ParticleSystem {
    private pool: Particle[] = [];
    private floatingTexts: FloatingText[] = [];

    constructor(poolSize: number = 200) {
        for (let i = 0; i < poolSize; i++) {
            this.pool.push(new Particle());
        }
    }

    spawn(x: number, y: number, color: string, count: number = 10, type: string = 'circle'): void {
        let spawned = 0;
        for (const p of this.pool) {
            if (!p.active) {
                p.init(x, y, color, type);
                spawned++;
                if (spawned >= count) break;
            }
        }
    }

    addFloatingText(x: number, y: number, text: string, color: string, size: number = 22, type: any = 'float'): void {
        this.floatingTexts.push(new FloatingText(x, y, text, color, size, type));
    }

    update(dt: number): void {
        for (const p of this.pool) {
            if (p.active) p.update(dt);
        }
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update(dt);
            if (this.floatingTexts[i].dead) this.floatingTexts.splice(i, 1);
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        for (const p of this.pool) {
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
            } else if (p.type === 'shard') {
                // Fragmentos triangulares tipo piedra/cristal
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.lineTo(p.size, p.size);
                ctx.lineTo(-p.size, p.size);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (p.type === 'trail') {
                // Estela alargada
                ctx.globalAlpha *= 0.6;
                ctx.fillRect(-p.size * 2, -p.size / 2, p.size * 4, p.size);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        for (const ft of this.floatingTexts) {
            ft.draw(ctx);
        }
    }
}
