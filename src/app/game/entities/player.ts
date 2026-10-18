import { LOGICAL_WIDTH, LOGICAL_GROUND_Y, PLAYER_SIZE } from '../engine/engine.constants';
import { BaseEntity } from '../engine/entity.model';

export class Player extends BaseEntity {
  public vy: number = 0;
  private baseX: number = LOGICAL_WIDTH / 6;
  private onGround: boolean = false;
  public jSpd: number = -11;

  private rot: number = 0;
  private animTime: number = 0;
  private breatheScale: number = 1;
  private prevVy: number = 0;
  private landSquash: number = 0;

  private _cachedSprites: Map<string, HTMLImageElement> = new Map();

  public shieldActive: boolean = false;
  public magnetT: number = 0;
  public health: number = 100;
  public skinColor: string = '#A6F616';
  public skinEmoji: string = '🐸';
  public lives: number = 3;
  public bananasCollected: number = 0;
  public bombsCollected: number = 0;
  public collectedCandyTypes: string[] = [];
  public extraLifeProgress: number = 1; // Regla dom_superior.md Sección 6: Estado inicial 1 corazón lleno

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
    this.rot = 0;
    this.animTime = 0;
    this.lives = 3;
    this.bananasCollected = 0;
    this.bombsCollected = 0;
    this.collectedCandyTypes = [];
    this.extraLifeProgress = 1;
    this.loadSkin();
  }

  private loadSkin(): void {
    const skinId = localStorage.getItem('mx_active_skin') || 'frog_og';
    const skinMap: Record<string, { c: string; e: string }> = {
      frog_og: { c: '#A6F616', e: '🐸' },
      frog_cyber: { c: '#00f2ff', e: '🤖' },
      frog_fire: { c: '#FF4D4D', e: '🔥' },
      frog_ninja: { c: '#ffffff', e: '🥷' },
      frog_alien: { c: '#FF00FF', e: '👽' },
      frog_king: { c: '#FFD700', e: '👑' }
    };
    const skin = skinMap[skinId] || skinMap['frog_og'];
    this.skinColor = skin.c;
    this.skinEmoji = skin.e;
  }

  public jump(): boolean {
    this.vy = this.jSpd;
    this.onGround = false;
    return true;
  }

  public update(dt: number): void {
    const grav = 0.32;
    const lerpFactor = 0.15;

    this.x += (this.baseX - this.x) * lerpFactor * dt;
    this.vy += grav * dt;
    this.y += this.vy * dt;

    if (this.y < 0) {
      this.y = 0;
      this.vy = 0;
    }

    if (this.y + this.h > LOGICAL_GROUND_Y) {
      this.y = LOGICAL_GROUND_Y - this.h;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    this.animTime += 0.05 * dt;
    this.breatheScale = 1 + Math.sin(this.animTime) * 0.03;
    this.rot = Math.max(-0.25, Math.min(0.25, this.vy * 0.06));

    if (this.magnetT > 0) {
      this.magnetT = Math.max(0, this.magnetT - dt / 60);
    }

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
    ctx.translate(cx, this.y + this.h);
    ctx.rotate(this.rot);

    const sx = 1 + (this.landSquash > 0 ? 0.2 : 0);
    const sy = this.breatheScale - (this.landSquash > 0 ? 0.2 : 0);
    ctx.scale(sx, sy);

    let spriteName = 'frog';
    if (this.health <= 0) spriteName = 'frog_c';
    else if (this.vy < -2) spriteName = 'frog_up';
    else if (this.vy > 2) spriteName = 'frog_dn';

    const sprite = biomeRenderer?.getPlayerSprite(spriteName);
    if (sprite) {
      this._cachedSprites.set(spriteName, sprite);
    }

    let activeSprite = this._cachedSprites.get(spriteName) || sprite;
    if (!activeSprite && spriteName !== 'frog') {
      activeSprite = this._cachedSprites.get('frog');
    }

    if (activeSprite) {
      ctx.drawImage(activeSprite, -this.w / 2, -this.h, this.w, this.h);
    } else {
      this.drawProceduralFrog(ctx);
    }

    if (this.shieldActive) {
      ctx.save();
      ctx.translate(0, -this.h / 2);
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, this.w * 0.7, 0, Math.PI * 2);
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f2ff';
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  private drawProceduralFrog(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.skinColor;
    ctx.beginPath();
    ctx.ellipse(0, -this.h / 2, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, -this.h * 0.7, this.w * 0.3, this.h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

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
  }
}
