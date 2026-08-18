import { LOGICAL_HEIGHT, ITEM_SIZE } from '../engine/engine.constants';
import { BaseEntity } from '../engine/entity.model';

export enum ItemType {
    CANDY = 'candy',
    COIN = 'coin',
    GEM = 'gem',
    POWERUP = 'powerup'
}

export class CollectibleItem extends BaseEntity {
    public speed: number = 7;
    public type: ItemType = ItemType.CANDY;
    private osc: number = 0;
    private baseY: number = 0;

    public isZigzag: boolean = false;
    private zigzagAmplitude: number = 100;

    constructor(x: number, y: number, type: ItemType = ItemType.CANDY, speed: number = 7) {
        super();
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.type = type;
        
        // Tamaños dinámicos del proyecto de referencia + 20%
        if (type === ItemType.COIN || type === ItemType.GEM) {
            this.w = 96;
            this.h = 96;
        } else if (type === ItemType.CANDY) {
            this.w = 79;
            this.h = 79;
        } else if (type === ItemType.POWERUP) {
            this.w = 108;
            this.h = 108;
        } else {
            this.w = 77;
            this.h = 77;
        }
        
        this.speed = speed;
        this.osc = Math.random() * 10;
        this.isZigzag = Math.random() > 0.5; // 50% zigzag, 50% straight
        this.zigzagAmplitude = 60 + Math.random() * 80;
    }

    public update(dt: number): void {
        this.x -= this.speed * dt;
        
        this.osc += 0.05 * dt;
        if (this.isZigzag) {
            this.y = this.baseY + Math.sin(this.osc) * this.zigzagAmplitude;
        } else {
            this.y = this.baseY + Math.sin(this.osc) * 5;
        }

        // Limitar pantalla dinámicamente
        if (this.y < 20) this.y = 20;
        const hLimit = LOGICAL_HEIGHT - this.h - 20;
        if (this.y > hLimit) this.y = hLimit;
    }

    public draw(ctx: CanvasRenderingContext2D, biomeRenderer?: any): void {
        // 1. Determinar el nombre del sprite (inyectado por el engine o determinado por tipo)
        let sName = (this as any).spriteName;
        
        if (!sName) {
            if (this.type === ItemType.COIN) sName = 'coin';
            else if (this.type === ItemType.GEM) sName = 'diamond';
            else if (this.type === ItemType.CANDY) sName = 'banana';
            else if (this.type === ItemType.POWERUP) sName = 'candy_red';
            else sName = 'coin';
        }

        // 2. Intentar obtener el sprite del BiomeRenderer
        const sprite = biomeRenderer?.getItemSprite(sName);

        if (sprite) {
            ctx.drawImage(sprite, this.x, this.y, this.w, this.h);
            return;
        }

        // 3. Fallback Procedural si no hay assets
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(this.osc * 0.2);
        this._drawProcedural(ctx);
        ctx.restore();
    }

    private _drawProcedural(ctx: CanvasRenderingContext2D): void {
        let color = '#7cf27c'; // Green candy by default
        let glow = 'rgba(124, 242, 124, 0.4)';

        if (this.type === ItemType.COIN) {
            color = '#ffd84d'; glow = 'rgba(255, 216, 77, 0.5)';
        } else if (this.type === ItemType.GEM) {
            color = '#38d996'; glow = 'rgba(56, 217, 150, 0.4)';
        } else if (this.type === ItemType.POWERUP) {
            color = '#f3a7ff'; glow = 'rgba(243, 167, 255, 0.5)';
        }

        ctx.shadowColor = glow;
        ctx.shadowBlur = 15;
        ctx.fillStyle = color;
        ctx.strokeStyle = '#FFFFFF88';
        ctx.lineWidth = 2;

        ctx.beginPath();
        if (this.type === ItemType.COIN) {
            ctx.arc(0, 0, this.w / 2, 0, Math.PI * 2);
        } else {
            // Forma de rombo/diamante
            ctx.moveTo(0, -this.h / 2);
            ctx.lineTo(this.w / 2, 0);
            ctx.lineTo(0, this.h / 2);
            ctx.lineTo(-this.w / 2, 0);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Destello (Shine)
        ctx.fillStyle = '#FFFFFFCC';
        ctx.fillRect(-this.w * 0.1, -this.h * 0.3, this.w * 0.2, this.h * 0.4);
    }
}
