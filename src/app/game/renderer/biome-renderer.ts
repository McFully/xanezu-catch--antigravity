import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../engine/engine.constants';
import { AssetLoader } from '../engine/asset-loader';

const THEMED_ITEMS = [
  'coin.svg', 'ruby.svg', 'diamond.svg', 'banana.svg', 'candy_red.svg', 'magnet.svg', 'shield.svg', 'star.svg',
  'bolt.svg', 'bomb.svg', 'candy_blue.svg', 'candy_brown.svg', 'candy_cyan.svg', 'candy_green.svg',
  'candy_grey.svg', 'candy_orange.svg', 'candy_pink.svg', 'candy_purple.svg', 'candy_yellow.svg',
  'clock.svg', 'clover.svg', 'crown.svg', 'emerald.svg', 'feather.svg', 'fly_gold.svg', 'ghost.svg',
  'gift.svg', 'heart.svg', 'hourglass.svg', 'ice.svg', 'mini.svg', 'pearl.svg', 'rainbow.svg'
];

export class BiomeRenderer {
  private t: number = 0;
  private seeds: any = {};
  private currentBackground: HTMLImageElement | null = null;
  private nextBackground: HTMLImageElement | null = null;
  private currentBGLevel: number = -1;
  private nextBGLevel: number = -1;

  private playerSprites: Map<string, HTMLImageElement> = new Map();
  private obstacleSprites: Map<string, HTMLImageElement> = new Map();
  private itemSprites: Map<string, HTMLImageElement> = new Map();
  private assetLoader: AssetLoader;

  constructor(loader: AssetLoader) {
    this.assetLoader = loader;
    this.generateSeeds();
  }

  public getLoader(): AssetLoader {
    return this.assetLoader;
  }

  public async prepareLevel(level: number, mode: string, folder: string): Promise<void> {
    const modeFolder = mode.toLowerCase();

    if (level === this.nextBGLevel && this.nextBackground) {
      this.currentBackground = this.nextBackground;
      this.currentBGLevel = this.nextBGLevel;
    } else if (level !== this.currentBGLevel) {
      const url = `assets/${modeFolder}/${folder}/fondos/nivel_${level}/fondo_intermedio.webp`;
      const fallbackUrl = `assets/${modeFolder}/${folder}/fondos/nivel_1/fondo_intermedio.webp`;
      const img = (await this.assetLoader.loadImage(url)) || (await this.assetLoader.loadImage(fallbackUrl));
      if (img) {
        this.currentBackground = img;
        this.currentBGLevel = level;
      }
    }

    const nextLevel = level + 1;
    if (nextLevel <= 30 && nextLevel !== this.nextBGLevel) {
      const nextUrl = `assets/${modeFolder}/${folder}/fondos/nivel_${nextLevel}/fondo_intermedio.webp`;
      this.nextBGLevel = nextLevel;
      this.assetLoader.loadImage(nextUrl).then(img => {
        if (img) this.nextBackground = img;
      });
    }
  }

  public async loadChapterAssets(
    mode: string,
    folder: string,
    level: number = 1,
    onAssetLoad?: (name: string) => void
  ): Promise<void> {
    const modeLower = mode.toLowerCase();
    await this.prepareLevel(level, mode, folder);

    this.playerSprites.clear();
    this.itemSprites.clear();
    this.obstacleSprites.clear();

    const pFiles = ['frog.svg', 'frog_up.svg', 'frog_dn.svg', 'frog_c.svg'];
    await this.assetLoader.loadBatch(
      pFiles.map(f => ({
        key: f.split('.')[0],
        url: `assets/${modeLower}/${folder}/personaje/${f}`,
        fallbackUrl: `assets/story/1-selva-tropical/personaje/${f}`,
        label: `SPRITE: ${f}`
      })),
      this.playerSprites,
      onAssetLoad
    );

    await this.assetLoader.loadBatch(
      THEMED_ITEMS.map(it => ({
        key: it.split('.')[0],
        url: `assets/${modeLower}/${folder}/objetos/${it}`,
        fallbackUrl: `assets/story/1-selva-tropical/objetos/${it}`,
        label: `OBJETO: ${it}`
      })),
      this.itemSprites,
      onAssetLoad
    );

    let flavorObs: string[] = [];
    if (folder.includes('mexicana')) {
      flavorObs = ['obs_cactus_hat.svg', 'obs_pinata.svg', 'obs_luchador.svg'];
    } else if (folder.includes('selva')) {
      flavorObs = ['obs_bot_tronco.svg', 'obs_bot_totem.svg', 'obs_bot_estatua.svg', 'obs_bot_ruina.svg', 'obs_top_liana.svg'];
    } else if (folder.includes('desierto')) {
      flavorObs = ['obs_bot_cactus.svg', 'obs_bot_craneo.svg', 'obs_bot_obelisco.svg', 'obs_top_lampara.svg', 'obs_top_toldo.svg', 'obs_scorpion.svg'];
    }

    const lvlPad = String(level).padStart(2, '0');
    const obstacles = [...flavorObs, `obs_l${lvlPad}.svg`, `obs_bot_l${lvlPad}.svg`, `obs_top_l${lvlPad}.svg`];

    await this.assetLoader.loadBatch(
      obstacles.map(f => ({
        key: f,
        url: `assets/${modeLower}/${folder}/obstaculos/${f}`,
        fallbackUrl: f.startsWith('obs_top')
          ? 'assets/story/1-selva-tropical/obstaculos/obs_top_liana.svg'
          : 'assets/story/1-selva-tropical/obstaculos/obs_bot_tronco.svg',
        label: `OBSTÁCULO: ${f}`
      })),
      this.obstacleSprites,
      onAssetLoad
    );
  }

  public getPlayerSprite(name: string): HTMLImageElement | undefined { return this.playerSprites.get(name); }
  public getItemSprite(name: string): HTMLImageElement | undefined { return this.itemSprites.get(name); }
  public getObstacleSprite(key: string): HTMLImageElement | undefined { return this.obstacleSprites.get(key); }

  public getRandomBotKey(): string {
    const keys = Array.from(this.obstacleSprites.keys()).filter(
      k => k.includes('bot') || k.includes('cactus') || k.includes('pinata') || k.includes('tronco')
    );
    return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : 'obs_bot_tronco.svg';
  }

  public getRandomTopKey(): string {
    const keys = Array.from(this.obstacleSprites.keys()).filter(
      k => k.includes('top') || k.includes('liana') || k.includes('serpiente')
    );
    return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : 'obs_top_liana.svg';
  }

  private generateSeeds(): void {
    const rng = (i: number) => (Math.sin(i * 9301 + 49297) + 1) / 2;
    this.seeds.trees = Array.from({ length: 40 }, (_, i) => ({
      x: rng(i + 300),
      h: 0.3 + rng(i + 400) * 0.6,
      w: 0.02 + rng(i + 500) * 0.04
    }));
    this.seeds.particles = Array.from({ length: 50 }, (_, i) => ({
      x: rng(i + 1300),
      y: rng(i + 1400),
      size: 1 + rng(i + 1500) * 3,
      speed: 0.2 + rng(i + 1600) * 0.8,
      alpha: 0.1 + rng(i + 1700) * 0.4
    }));
  }

  public update(dt: number): void {
    this.t += 0.016 * dt;
  }

  public drawBackground(ctx: CanvasRenderingContext2D, scrollX: number, mode: string = 'arcade'): void {
    const modeLower = mode.toLowerCase();

    // REGLA ESTRICTA fondos.md: En Story mode, renderizar única y exclusivamente fondo_intermedio.webp fijo
    if (modeLower === 'story') {
      if (this.currentBackground) {
        ctx.drawImage(this.currentBackground, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      }
      return;
    }

    this.drawSky(ctx, ['#051a05', '#0d3d1a', '#1a5c1a']);
    this.drawFarTrees(ctx, scrollX, 0.05, 'rgba(5, 50, 20, 0.3)');

    if (this.currentBackground) {
      this.drawParallaxImage(ctx, this.currentBackground, scrollX, 0.1);
    } else {
      this.drawFarTrees(ctx, scrollX, 0.1, 'rgba(10, 60, 30, 0.5)');
    }
  }

  private drawParallaxImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, scrollX: number, parallax: number): void {
    const xOffset = (scrollX * parallax) % LOGICAL_WIDTH;
    ctx.drawImage(img, -xOffset, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.drawImage(img, -xOffset + LOGICAL_WIDTH, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    if (xOffset < 0) {
      ctx.drawImage(img, -xOffset - LOGICAL_WIDTH, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
  }

  private drawSky(ctx: CanvasRenderingContext2D, colors: string[]): void {
    const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  private drawFarTrees(ctx: CanvasRenderingContext2D, scrollX: number, parallax: number, color: string): void {
    const xOffset = (Math.abs(scrollX) * parallax) % LOGICAL_WIDTH;
    ctx.save();
    ctx.translate(-xOffset, 0);
    this.renderTreeBatch(ctx, color);
    ctx.translate(LOGICAL_WIDTH, 0);
    this.renderTreeBatch(ctx, color);
    ctx.restore();
  }

  private renderTreeBatch(ctx: CanvasRenderingContext2D, color: string): void {
    ctx.fillStyle = color;
    const baseY = LOGICAL_HEIGHT - 50;
    for (let i = 0; i < this.seeds.trees.length; i++) {
      const s = this.seeds.trees[i];
      const x = s.x * LOGICAL_WIDTH;
      const h = s.h * 400;
      const w = 40 + s.w * 60;

      ctx.fillRect(x - 5, baseY - h, 10, h);
      ctx.beginPath();
      ctx.arc(x, baseY - h, w, 0, Math.PI * 2);
      ctx.arc(x - w * 0.5, baseY - h + w * 0.3, w * 0.7, 0, Math.PI * 2);
      ctx.arc(x + w * 0.5, baseY - h + w * 0.3, w * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  public drawForeground(ctx: CanvasRenderingContext2D, _scrollX: number, mode: string = 'arcade'): void {
    if (mode.toLowerCase() === 'story') return;

    ctx.save();
    for (let i = 0; i < this.seeds.particles.length; i++) {
      const p = this.seeds.particles[i];
      const x = (p.x * LOGICAL_WIDTH + this.t * 20 * p.speed) % LOGICAL_WIDTH;
      const y = (p.y * LOGICAL_HEIGHT + Math.sin(this.t * 0.5 + i) * 30) % LOGICAL_HEIGHT;

      ctx.globalAlpha = p.alpha * (0.5 + Math.sin(this.t + i) * 0.5);
      ctx.fillStyle = '#A6F616';
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
