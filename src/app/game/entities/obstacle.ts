import { LOGICAL_WIDTH, LOGICAL_HEIGHT, LOGICAL_GROUND_Y } from '../engine/engine.constants';
import { BaseEntity } from '../engine/entity.model';

export enum ObstacleType {
    BOX = 'box',
    SPIKE = 'spike',
    TRONCO = 'tronco'
}

export class Obstacle extends BaseEntity {
    public speed: number = 7;
    public type: ObstacleType = ObstacleType.BOX;
    private spriteSeed: number = Math.random();
    public isDynamic: boolean = false;
    private dynamicT: number = Math.random() * Math.PI * 2;
    private dynamicDir: number = Math.random() > 0.5 ? 1 : -1;
    private assignedSpriteKey: string | null = null;
    private mode: string = 'STORY';

    constructor(x: number, y: number, w: number, h: number, type: ObstacleType = ObstacleType.BOX, speed: number = 7, spriteKey?: string) {
        super();
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.type = type;
        this.speed = speed;
        this.spriteSeed = Math.random();
        this.assignedSpriteKey = spriteKey || null;
    }

    public update(dt: number): void {
        this.x -= this.speed * dt;

        if (this.isDynamic) {
            this.dynamicT += 0.05 * dt;
            // Movimiento vertical sinusoidal (tipo hacha pendular o serpiente)
            this.y += Math.sin(this.dynamicT) * 3 * this.dynamicDir;
        }
    }

    public setMode(mode: string): void {
        this.mode = mode.toUpperCase();
        // En MODO ABLIA hay más probabilidad de obstáculos dinámicos
        if (this.mode === 'ABLIA') {
            this.isDynamic = Math.random() > 0.6;
        }
    }

    public draw(ctx: CanvasRenderingContext2D, biomeRenderer?: any, level: number = 1): void {
        if (this.mode === 'ABLIA') {
            this.drawAblia(ctx);
            return;
        }

        // Prioridad: 
        // 1. Sprite asignado por el motor (Themed/Flavor)
        // 2. Nivel específico
        // 3. Fallback genérico
        const levelKey = `obs_l${String(level).padStart(2, '0')}.svg`;
        
        const sprite = biomeRenderer?.getObstacleSprite(this.assignedSpriteKey || '') || 
                       biomeRenderer?.getObstacleSprite(levelKey) ||
                       biomeRenderer?.getObstacleSprite('obs_bot_tronco.svg');

        if (sprite) {
            ctx.drawImage(sprite, this.x, this.y, this.w, this.h);
            return;
        }

        this.drawGeneric(ctx);
    }

    private drawAblia(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.fillStyle = '#1a1a1a';
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 4;
        
        // Rotación sutil basada en movimiento para efecto "smear"
        if (this.isDynamic) {
            const rot = Math.cos(this.dynamicT) * 0.1;
            ctx.translate(this.x + this.w/2, this.y + this.h/2);
            ctx.rotate(rot);
            ctx.translate(-(this.x + this.w/2), -(this.y + this.h/2));
        }

        // Forma de cristal o bloque tecnológico (Stylized Ablia Mode)
        ctx.beginPath();
        if (this.isDynamic) {
            // Hacha pendular / Trampa circular
            ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w/2, 0, Math.PI * 2);
        } else {
            ctx.roundRect(this.x, this.y, this.w, this.h, 12);
        }
        ctx.fill();
        ctx.stroke();

        // Brillo interno reactivo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3 + Math.sin(this.dynamicT) * 0.2;
        ctx.stroke();
        
        ctx.restore();
    }

    private drawGeneric(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        // Estilo Holograma Premium (Fallback)
        const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y + this.h);
        grad.addColorStop(0, 'rgba(60, 60, 60, 0.9)');
        grad.addColorStop(1, 'rgba(20, 20, 20, 0.95)');
        
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#A6F616';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, 15);
        ctx.fill();
        ctx.stroke();

        // Patrón de rejilla tecnológica
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        for(let gx = this.x + 20; gx < this.x + this.w; gx += 20) {
            ctx.beginPath(); ctx.moveTo(gx, this.y); ctx.lineTo(gx, this.y + this.h); ctx.stroke();
        }
        
        ctx.restore();
    }
}
