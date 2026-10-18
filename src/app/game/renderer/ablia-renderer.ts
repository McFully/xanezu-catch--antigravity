import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../engine/engine.constants';
import { ABLIA_WEATHER_MAP, AbliaThemePalette, getAbliaTheme } from './ablia-themes.constants';
import { AbliaPrimitives } from './ablia-primitives';

export class AbliaRenderer {
  private t: number = 0;
  private seeds: any = {};
  private currentCivilization: string = 'maya';
  private ambientParticles: any[] = [];
  private weatherParticles: any[] = [];
  private backgroundEntities: any[] = [];
  private currentWeather: string = 'clear';
  private abIntensity: number = 0;

  constructor() {
    this.generateSeeds();
  }

  public setCivilization(folder: string): void {
    this.currentCivilization = folder.toLowerCase();
    this.generateSeeds();
    this.generateWeather();
    this.generateBackgroundEntities();
  }

  public getThemeColors(): AbliaThemePalette {
    return getAbliaTheme(this.currentCivilization);
  }

  private generateSeeds(): void {
    const rng = (i: number) => (Math.sin(i * 9301 + 49297) + 1) / 2;

    this.seeds.structures = Array.from({ length: 8 }, (_, i) => ({
      x: rng(i + 100),
      w: 200 + rng(i + 200) * 300,
      h: 150 + rng(i + 300) * 250,
      type: Math.floor(rng(i + 400) * 3)
    }));

    this.seeds.decos = Array.from({ length: 15 }, (_, i) => ({
      x: rng(i + 500),
      y: 0.2 + rng(i + 600) * 0.6,
      size: 20 + rng(i + 700) * 40,
      rot: rng(i + 800) * Math.PI * 2
    }));

    this.seeds.foreground = Array.from({ length: 3 }, (_, i) => ({
      x: rng(i + 900),
      w: 400 + rng(i + 1000) * 200,
      h: LOGICAL_HEIGHT * 1.5,
      type: Math.floor(rng(i + 1100) * 2)
    }));

    this.ambientParticles = Array.from({ length: 20 }, () => ({
      x: Math.random() * LOGICAL_WIDTH,
      y: Math.random() * LOGICAL_HEIGHT,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.2
    }));
  }

  public update(dt: number): void {
    this.t += 0.016 * dt;
    for (const p of this.ambientParticles) {
      p.x = (p.x + p.vx * dt + LOGICAL_WIDTH) % LOGICAL_WIDTH;
      p.y = (p.y + p.vy * dt + LOGICAL_HEIGHT) % LOGICAL_HEIGHT;
    }
    this.updateWeatherParticles(dt);
    for (const e of this.backgroundEntities) {
      e.x -= e.v * dt;
      if (e.x < -200) e.x = LOGICAL_WIDTH + 200;
    }
    if (this.abIntensity > 0) this.abIntensity = Math.max(0, this.abIntensity - 0.05 * dt);
  }

  public triggerAB(): void {
    this.abIntensity = 1.0;
  }

  public drawBackground(ctx: CanvasRenderingContext2D, scrollX: number): void {
    const theme = this.getThemeColors();
    this.drawSky(ctx, theme.sky);
    if (this.currentCivilization === 'nordico' || this.currentCivilization === 'nordica') {
      AbliaPrimitives.drawAurora(ctx, this.t);
    }
    this.drawBackgroundEntities(ctx, theme.accent);
    this.drawStructures(ctx, scrollX, 0.02, theme.structureFar + '44', true);
    this.drawAmbientGroup(ctx, 0, 10);
    this.drawStructures(ctx, scrollX, 0.05, theme.structureFar, true);
    this.drawStructures(ctx, scrollX, 0.1, theme.structureMid, false);
    this.drawWeather(ctx, true);
  }

  public drawForeground(ctx: CanvasRenderingContext2D, scrollX: number): void {
    const theme = this.getThemeColors();
    ctx.save();
    const parallax = 0.2;
    for (let i = 0; i < this.seeds.decos.length; i++) {
      const d = this.seeds.decos[i];
      const x = ((d.x * LOGICAL_WIDTH - scrollX * parallax) % LOGICAL_WIDTH + LOGICAL_WIDTH) % LOGICAL_WIDTH;
      ctx.save();
      ctx.translate(x, d.y * LOGICAL_HEIGHT + Math.sin(this.t * 0.5 + i) * 20);
      ctx.rotate(d.rot + this.t * 0.2);
      AbliaPrimitives.drawCartoonGlyph(ctx, d.size, theme.accent);
      ctx.restore();
    }
    ctx.restore();

    this.drawAmbientGroup(ctx, 10, 20);
    this.drawExtremeForeground(ctx, scrollX, theme.structureFar);
    this.drawWeather(ctx, false);
    this.drawPostFX(ctx);
  }

  private drawExtremeForeground(ctx: CanvasRenderingContext2D, scrollX: number, color: string): void {
    const xOffset = (scrollX * 0.5) % (LOGICAL_WIDTH * 2);
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.translate(-xOffset, 0);
    for (let i = 0; i < 2; i++) {
      ctx.save();
      ctx.translate(i * LOGICAL_WIDTH * 2, 0);
      for (const f of this.seeds.foreground) {
        const x = f.x * LOGICAL_WIDTH * 2;
        ctx.fillRect(x, -100, f.w, f.h);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 10;
        ctx.strokeRect(x, -100, f.w, f.h);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  private drawAmbientGroup(ctx: CanvasRenderingContext2D, start: number, end: number): void {
    ctx.fillStyle = this.getThemeColors().accent;
    for (let i = start; i < end; i++) {
      const p = this.ambientParticles[i];
      if (!p) continue;
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  private drawPostFX(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createRadialGradient(
      LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, 0,
      LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, LOGICAL_WIDTH * 0.8
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    for (let i = 0; i < LOGICAL_HEIGHT; i += 4) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(LOGICAL_WIDTH, i);
      ctx.stroke();
    }
    ctx.restore();

    if (this.abIntensity > 0) {
      const offset = 10 * this.abIntensity;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.25 * this.abIntensity;
      ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
      ctx.fillRect(-offset, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
      ctx.fillRect(offset, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      ctx.restore();
    }
  }

  private generateBackgroundEntities(): void {
    this.backgroundEntities = [];
    if (this.currentCivilization === 'china' || this.currentCivilization === 'japonesa') {
      const count = this.currentCivilization === 'china' ? 1 : 10;
      this.backgroundEntities = Array.from({ length: count }, () => ({
        x: Math.random() * LOGICAL_WIDTH,
        y: 50 + Math.random() * 200,
        v: 0.5 + Math.random() * 1,
        size: this.currentCivilization === 'china' ? 100 : 10,
        type: this.currentCivilization === 'china' ? 'dragon' : 'bird'
      }));
    }
  }

  private drawBackgroundEntities(ctx: CanvasRenderingContext2D, accent: string): void {
    ctx.save();
    ctx.globalAlpha = 0.4;
    for (const e of this.backgroundEntities) {
      if (e.type === 'dragon') AbliaPrimitives.drawDragon(ctx, e.x, e.y, e.size, this.t, accent);
      else AbliaPrimitives.drawBird(ctx, e.x, e.y, e.size, this.t);
    }
    ctx.restore();
  }

  private generateWeather(): void {
    this.currentWeather = ABLIA_WEATHER_MAP[this.currentCivilization] || 'clear';
    this.weatherParticles = Array.from({ length: 80 }, () => ({
      x: Math.random() * LOGICAL_WIDTH,
      y: Math.random() * LOGICAL_HEIGHT,
      v: 5 + Math.random() * 10,
      size: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2
    }));
  }

  private updateWeatherParticles(dt: number): void {
    for (const p of this.weatherParticles) {
      if (this.currentWeather === 'snow') { p.y += p.v * 0.2 * dt; p.x += Math.sin(this.t + p.y * 0.01) * dt; }
      else if (this.currentWeather === 'rain') { p.y += p.v * 1.5 * dt; p.x -= p.v * 0.5 * dt; }
      else if (this.currentWeather === 'sand') { p.x -= p.v * 2 * dt; p.y += (Math.random() - 0.5) * dt; }
      else if (this.currentWeather === 'sakura') { p.y += p.v * 0.3 * dt; p.x += Math.sin(this.t * 0.5 + p.y * 0.01) * 2 * dt; p.rot += 0.05 * dt; }

      if (p.y > LOGICAL_HEIGHT) p.y = -20;
      if (p.x < 0) p.x = LOGICAL_WIDTH;
      if (p.x > LOGICAL_WIDTH) p.x = 0;
    }
  }

  private drawWeather(ctx: CanvasRenderingContext2D, far: boolean): void {
    if (this.currentWeather === 'clear') return;
    ctx.save();
    ctx.globalAlpha = far ? 0.3 : 0.8;
    for (const p of this.weatherParticles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (this.currentWeather === 'snow') {
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (this.currentWeather === 'rain') {
        ctx.strokeStyle = '#AAF'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, 15); ctx.stroke();
      } else if (this.currentWeather === 'sand') {
        ctx.fillStyle = 'rgba(200, 150, 50, 0.5)';
        ctx.fillRect(0, 0, p.size * 2, p.size);
      } else if (this.currentWeather === 'sakura') {
        ctx.fillStyle = '#FFB7C5'; ctx.rotate(p.rot);
        ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  private drawSky(ctx: CanvasRenderingContext2D, colors: string[]): void {
    const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(LOGICAL_WIDTH * 0.8, 150, 80, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawStructures(ctx: CanvasRenderingContext2D, scrollX: number, parallax: number, color: string, far: boolean): void {
    const xOffset = (scrollX * parallax) % LOGICAL_WIDTH;
    ctx.save();
    ctx.translate(-xOffset, 0);
    this.renderStructureBatch(ctx, color, far);
    ctx.translate(LOGICAL_WIDTH, 0);
    this.renderStructureBatch(ctx, color, far);
    ctx.restore();
  }

  private renderStructureBatch(ctx: CanvasRenderingContext2D, color: string, far: boolean): void {
    ctx.fillStyle = color;
    ctx.strokeStyle = this.getThemeColors().stroke;
    ctx.lineWidth = far ? 2 : 4;
    for (const s of this.seeds.structures) {
      ctx.save();
      ctx.translate(s.x * LOGICAL_WIDTH, LOGICAL_HEIGHT);
      AbliaPrimitives.drawStructureByCivilization(ctx, this.currentCivilization, s.w, s.h);
      ctx.restore();
    }
  }
}
