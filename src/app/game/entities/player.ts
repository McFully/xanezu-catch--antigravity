import { LOGICAL_WIDTH, LOGICAL_HEIGHT, GROUND_LEVEL_Y_PERCENT, LOGICAL_GROUND_Y, PLAYER_SIZE } from '../engine/engine.constants';
import { BaseEntity } from '../engine/entity.model';

export class Player extends BaseEntity {
    public vy: number = 0;
    private baseX: number = LOGICAL_WIDTH / 6;
    private onGround: boolean = false;
    private jSpd: number = -11; // Adoptado de PARA OPENCODE Ver1.5
    
    // Animación & FX
    private rot: number = 0;
    private animTime: number = 0;
    private breatheScale: number = 1;
    private trail: any[] = [];
    private prevVy: number = 0;
    private landSquash: number = 0;

    private _cachedSprites: Map<string, HTMLImageElement> = new Map();

    // Power-ups
    public shieldActive: boolean = false;
    public magnetT: number = 0;
    public health: number = 100;
    public skinColor: string = '#A6F616';
    public skinEmoji: string = '🐸';
    public lives: number = 3;
    public bananasCollected: number = 0;
    public bombsCollected: number = 0;
    public extraLifeProgress: number = 0;

    constructor() {
        super();
        this.reset();
    }

    public reset(): void {
        this.w = PLAYER_SIZE;
        this.h = PLAYER_SIZE;
        this.health = 100;
        this.x = this.baseX;
        this.y = LOGICAL_GROUND_Y - this.h;
        this.vy = 0;
        this.onGround = false;
        this.trail = [];
        this.rot = 0;
        this.animTime = 0;
        this.lives = 3;
        this.bananasCollected = 0;
        this.bombsCollected = 0;
        this.extraLifeProgress = 0;

        // Cargar Skin
        this.loadSkin();
    }

    private loadSkin(): void {
        const skinId = localStorage.getItem('mx_active_skin') || 'frog_og';
        // Mapeo simple de colores/emojis basado en SkinSelector (para no importar el componente)
        const skinMap: any = {
            'frog_og': { c: '#A6F616', e: '🐸' },
            'frog_cyber': { c: '#00f2ff', e: '🤖' },
            'frog_fire': { c: '#FF4D4D', e: '🔥' },
            'frog_ninja': { c: '#ffffff', e: '🥷' },
            'frog_alien': { c: '#FF00FF', e: '👽' },
            'frog_king': { c: '#FFD700', e: '👑' }
        };
        const skin = skinMap[skinId] || skinMap['frog_og'];
        this.skinColor = skin.c;
        this.skinEmoji = skin.e;
    }

    public jump(): void {
        this.vy = this.jSpd;
        this.onGround = false;
    }

    public update(dt: number): void {
        // Gravedad y física básica
        const grav = 0.32; // Adoptado de PARA OPENCODE Ver1.5
        const lerpFactor = 0.15;

        // Retorno a la base X
        this.x += (this.baseX - this.x) * lerpFactor * dt;

        // Gravedad
        this.vy += grav * dt;
        this.y += this.vy * dt;

        // Suelo lógicamente calibrado
        const groundThreshold = LOGICAL_GROUND_Y;
        
        // Evitar que se salga por arriba
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
        }

        if (this.y + this.h > groundThreshold) {
            this.y = groundThreshold - this.h;
            this.vy = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // Animación sutil
        this.animTime += 0.05 * dt;
        this.breatheScale = 1 + Math.sin(this.animTime) * 0.03;
        this.rot = Math.max(-0.25, Math.min(0.25, this.vy * 0.06));

        // Decremento del temporizador del iman
        if (this.magnetT > 0) {
            this.magnetT -= dt / 60;
        }

        // Squash on land
        if (this.onGround && this.prevVy > 3) {
            this.landSquash = 12;
        }
        if (this.landSquash > 0) this.landSquash -= dt;
        this.prevVy = this.vy;
    }

    public override draw(ctx: CanvasRenderingContext2D, biomeRenderer?: any): void {
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        ctx.save();
        
        // Aplicar transformaciones
        ctx.translate(cx, this.y + this.h);
        ctx.rotate(this.rot);
        
        // Squash effect
        const sx = 1 + (this.landSquash > 0 ? 0.2 : 0);
        const sy = this.breatheScale - (this.landSquash > 0 ? 0.2 : 0);
        ctx.scale(sx, sy);

        // Elegir sprite según estado
        let spriteName = 'frog';
        if (this.health <= 0) spriteName = 'frog_c';
        else if (this.vy < -2) spriteName = 'frog_up';
        else if (this.vy > 2) spriteName = 'frog_dn';

        const sprite = biomeRenderer?.getPlayerSprite(spriteName);

        // Flicker fix: Cache sprites once loaded
        if (sprite) {
            this._cachedSprites.set(spriteName, sprite);
        }
        
        let activeSprite = this._cachedSprites.get(spriteName) || sprite;

        // Fallback robusto: Si el sprite de acción (vuelo/caída) no está listo, 
        // intentar usar el sprite base antes que el procedimental
        if (!activeSprite && spriteName !== 'frog') {
            activeSprite = this._cachedSprites.get('frog');
        }

        if (activeSprite) {
            ctx.drawImage(activeSprite, -this.w / 2, -this.h, this.w, this.h);
        } else {
            // Solo dibujamos procedimental si realmente no hay ningún asset cargado aún
            this._drawProceduralFrog(ctx);
        }


        // Visual de Escudo
        if (this.shieldActive) {
            ctx.save();
            ctx.translate(cx, cy - this.h/2);
            ctx.strokeStyle = '#00f2ff';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, this.w * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            
            // Glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00f2ff';
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }

    private _drawProceduralFrog(ctx: CanvasRenderingContext2D): void {
        // Cuerpo principal
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, -this.h / 2, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brillo sutil superior
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, -this.h * 0.7, this.w * 0.3, this.h * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ojos
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-this.w * 0.2, -this.h * 0.7, this.w * 0.1, 0, Math.PI * 2);
        ctx.arc(this.w * 0.2, -this.h * 0.7, this.w * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-this.w * 0.2, -this.h * 0.7, this.w * 0.05, 0, Math.PI * 2);
        ctx.arc(this.w * 0.2, -this.h * 0.7, this.w * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Procedural frog drawing (no text)
    }
}
