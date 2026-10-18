import { EngineState } from './engine.constants';
export { EngineState };
import { Player } from '../entities/player';
import { IEntity } from './entity.model';
import { ParticleSystem } from './particle-system';
import { BiomeRenderer } from '../renderer/biome-renderer';
import { Chapter } from '../../core/models/chapter.model';
import { LoadingRenderer } from '../renderer/loading-renderer';
import { AbliaRenderer } from '../renderer/ablia-renderer';
import { SceneRenderer } from '../renderer/scene-renderer';
import { AssetLoader } from './asset-loader';
import { MusicSynth } from './music-synth';
import { calculateLevelFromXP, getLevelProgressPercentage } from '../../core/constants/progression.constants';
import { PhysicsSystem } from './physics-system';
import { CollisionSystem } from './collision-system';
import { DirectorSystem } from './director-system';
import { InputController } from './input-controller';
import { ItemEffectSystem } from './item-effect.system';
import { IEngineAudio, IGameEngineContext } from './engine.interfaces';

export class GameEngine implements IGameEngineContext {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public state: EngineState = EngineState.BOOT;
  private lastTime = 0;
  private animationId: number | null = null;

  private physicsSystem: PhysicsSystem;
  private collisionSystem: CollisionSystem;
  private directorSystem: DirectorSystem;
  private itemEffectSystem: ItemEffectSystem;
  private inputController: InputController;

  public score = 0; public level = 0; public maxXP = 350000; public minXP = 600;
  public highScore = 0; public coins = 0; public totalXP = 0;
  public chapter: Chapter | null = null; public mode = 'story';
  public progress = 0; public multiplier = 1; public multiplierTimer = 0;
  public maxMultiplier = 1; public timer = 0;
  public bananaComboActive = false; public bananaComboTimer = 0;
  public multiplierDuration = 30; public multiplierTimeLeft = 0;
  public hasShield = false; public hasMagnet = false; public hasGemRadar = false;
  public hasSpeedBoost = false; public hasRevive = false;
  public sessionJumps = 0; public sessionGems = 0; public sessionCoins = 0;
  public sessionItemsBySprite: Record<string, number> = {};

  public player: Player;
  public entities: IEntity[] = [];
  public currentSpeed = 7;
  private currentSpawnDelay = 60;
  public bgScrollX = 0;

  public particles: ParticleSystem;
  public audio: IEngineAudio;
  public biomeRenderer: BiomeRenderer;
  public abliaRenderer: AbliaRenderer;
  private loadingRenderer: LoadingRenderer;
  private assetLoader: AssetLoader;
  public musicSynth: MusicSynth;
  private gameStateService: any;
  private gameData: any;
  private trauma = 0; private flashT = 0; private flashColor = '#FFF';
  public loadingProgress = 0; public currentTip = 'INICIANDO SISTEMAS...';

  public onStateChange: ((newState: EngineState) => void) | null = null;
  public onProgressChange: ((progress: number) => void) | null = null;
  public onReady: (() => void) | null = null;
  public onHudChange: (() => void) | null = null;
  public onSessionEnd: ((isVictory: boolean) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, audio: IEngineAudio, gameStateService: any, gameData: any, chapter?: Chapter) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    this.audio = audio; this.gameStateService = gameStateService; this.gameData = gameData;
    this.assetLoader = new AssetLoader();
    this.musicSynth = (audio as any).synth || new MusicSynth();
    this.player = new Player();
    this.particles = new ParticleSystem(300);
    this.biomeRenderer = new BiomeRenderer(this.assetLoader);
    this.abliaRenderer = new AbliaRenderer();
    this.loadingRenderer = new LoadingRenderer();
    this.chapter = chapter || null;

    this.physicsSystem = new PhysicsSystem(this);
    this.collisionSystem = new CollisionSystem(this);
    this.directorSystem = new DirectorSystem(this);
    this.itemEffectSystem = new ItemEffectSystem(this);
    this.inputController = new InputController(this);
    this.loadPersistence();
    this.loadShopUpgrades();
  }

  public destroy(): void {
    this.stop(); this.musicSynth.stopAll(); this.audio.stopMusic();
    this.assetLoader.clearAll(); this.inputController.destroy();
  }

  private loadShopUpgrades(): void {
    this.hasShield = localStorage.getItem('shop_item_shield_up') === 'true';
    this.hasMagnet = localStorage.getItem('shop_item_magnet_up') === 'true';
    this.hasGemRadar = localStorage.getItem('shop_item_gem_finder') === 'true';
    this.hasSpeedBoost = localStorage.getItem('shop_item_speed_boost') === 'true';
    this.hasRevive = localStorage.getItem('shop_item_revive') === 'true';
    if (this.hasShield) this.player.shieldActive = true;
    if (this.hasSpeedBoost) this.player.jSpd = -12.2;
  }

  public togglePause(): void {
    if (this.state === EngineState.PLAYING) {
      this.stop(); this.notifyHudChange();
    } else if (this.state === EngineState.PAUSED) {
      this.state = EngineState.PLAYING;
      this.lastTime = performance.now();
      this.notifyHudChange();
      this.loop(this.lastTime);
    }
  }

  public jump(): void {
    if (this.state === EngineState.PLAYING && this.player.jump()) {
      this.audio.playJump(); this.sessionJumps++;
      if (this.mode.toUpperCase() === 'ABLIA') this.abliaRenderer.triggerAB();
    }
  }

  private loadPersistence(): void {
    this.highScore = parseInt(localStorage.getItem('mx_high_score') || '0', 10);
    this.totalXP = parseInt(localStorage.getItem('mx_total_xp') || '0', 10);
    this.coins = parseInt(localStorage.getItem('mx_total_coins') || '0', 10);
    this.level = 0; this.progress = 0;
  }

  public async init(_tips: string[] = []): Promise<void> {
    this.state = EngineState.LOADING;
    this.loadingProgress = 5;
    this.onProgressChange?.(this.loadingProgress);
    if (this.chapter?.mode) this.mode = this.chapter.mode;

    if (this.chapter) {
      this.gameStateService?.addLoadingLog?.(`Iniciando descarga de Sector: ${this.chapter.title}`);
      if (this.mode.toUpperCase() === 'ABLIA') {
        this.abliaRenderer.setCivilization(this.chapter.folder);
        this.loadingProgress = 90;
        this.onProgressChange?.(this.loadingProgress);
      } else {
        this.assetLoader.onAssetLoaded = (name: string) => {
          this.gameStateService?.currentLoadingFile?.set(name);
          this.gameStateService?.addLoadingLog?.(name);
        };
        this.assetLoader.onProgress = (p: number) => {
          this.loadingProgress = Math.max(this.loadingProgress, Math.floor(15 + p * 0.75));
          this.onProgressChange?.(this.loadingProgress);
        };
        await this.biomeRenderer.loadChapterAssets(this.mode, this.chapter.folder, Math.max(1, this.level));
      }
      this.musicSynth.stopAll();
      await this.audio.playChapterMusic(this.mode, this.chapter.folder);
    }

    this.loadingProgress = 100;
    this.onProgressChange?.(100);
    this.state = EngineState.READY;
    this.onStateChange?.(this.state);
    this.onReady?.();
  }

  public start(): void {
    if (this.state !== EngineState.READY && this.state !== EngineState.GAMEOVER) return;
    this.reset(); this.state = EngineState.PLAYING;
    this.lastTime = performance.now(); this.notifyHudChange(); this.loop(this.lastTime);
  }

  public stop(): void {
    if (this.animationId !== null) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    this.state = EngineState.PAUSED;
  }

  private loop(timestamp: number): void {
    if (this.state === EngineState.PAUSED) return;
    const dt = Math.min(3, (timestamp - this.lastTime) / 16.67);
    this.lastTime = timestamp;
    if (this.state === EngineState.PLAYING) this.update(dt);
    else if (this.state === EngineState.LOADING) this.loadingRenderer.update(dt, this.loadingProgress, this.currentTip);
    this.render();
    if (this.flashT > 0) this.flashT -= dt;
    this.animationId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    const prevTimerSec = Math.floor(this.timer);
    this.timer += dt / 60; this.bgScrollX += 7 * dt;
    if (this.bananaComboActive && (this.bananaComboTimer -= dt / 60) <= 0) this.bananaComboActive = false;

    if (this.multiplier > 1) {
      const prevMultPct = Math.floor(this.multiplierTimer);
      this.multiplierTimeLeft -= dt / 60;
      this.multiplierTimer = Math.max(0, (this.multiplierTimeLeft / this.multiplierDuration) * 100);
      if (this.multiplierTimeLeft <= 0) {
        this.multiplier = 1; this.multiplierTimeLeft = 0; this.multiplierTimer = 0;
        this.notifyHudChange();
      } else if (Math.floor(this.multiplierTimer) !== prevMultPct) {
        this.notifyHudChange();
      }
    } else {
      this.multiplierTimer = 0;
    }

    this.player.update(dt); this.particles.update(dt);
    if (this.score > this.maxXP) this.score = this.maxXP;
    const nextLevel = calculateLevelFromXP(this.score);
    this.progress = getLevelProgressPercentage(this.score) / 100;

    if (nextLevel > this.level && this.chapter) {
      this.level = nextLevel;
      const diffMult = localStorage.getItem('mx_difficulty') === 'DIFÍCIL' ? 1.2 : 1.0;
      this.currentSpeed = (7 + this.level * 0.3) * diffMult;
      this.currentSpawnDelay = 60 * Math.pow(0.98, this.level - 1);
      if (this.mode.toUpperCase() !== 'ABLIA') this.biomeRenderer.prepareLevel(Math.max(1, this.level), this.mode, this.chapter.folder);
      this.triggerFlash('#A6F616', 15); this.addTrauma(0.3); this.notifyHudChange();
    }

    if (this.mode.toUpperCase() === 'ABLIA') {
      if (Math.abs(this.player.vy) > 2) this.particles.spawn(this.player.x + 20, this.player.y + this.player.h / 2, this.abliaRenderer.getThemeColors().accent, 1, 'trail');
      this.abliaRenderer.update(dt);
      if (this.player.health > 80) this.currentSpeed += 0.001 * dt;
      else if (this.player.health < 40) {
        this.currentSpeed = Math.max(5, this.currentSpeed - 0.005 * dt);
        this.currentSpawnDelay = Math.min(120, this.currentSpawnDelay + 0.1 * dt);
      }
    } else {
      this.biomeRenderer.update(dt);
    }

    if (this.trauma > 0 && (this.trauma *= 0.95) < 0.01) this.trauma = 0;
    if (this.score >= this.maxXP) { this.victory(); return; }

    this.directorSystem.update(dt, this.currentSpeed, this.currentSpawnDelay);
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const ent = this.entities[i];
      ent.update(dt);
      if (this.collisionSystem.check(this.player, ent)) this.itemEffectSystem.handleCollision(ent, i);
      else if (ent.x + ent.w < -100) this.entities.splice(i, 1);
    }
    this.physicsSystem.update(dt);
    if (Math.floor(this.timer) !== prevTimerSec) this.notifyHudChange();
  }

  public triggerGameOver(): void { this.audio.stopMusic(); this.saveFinalStats(false); this.state = EngineState.GAMEOVER; this.onStateChange?.(EngineState.GAMEOVER); }
  private victory(): void { this.audio.stopMusic(); this.saveFinalStats(true); this.state = EngineState.VICTORY; this.onStateChange?.(EngineState.VICTORY); }

  private saveFinalStats(isVictory: boolean): void {
    const mins = Math.floor(this.timer / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.timer % 60).toString().padStart(2, '0');
    if (this.gameData) {
      this.gameData.lastGameStats = {
        score: Math.floor(this.score), time: `${mins}:${secs}`, level: this.level, maxMultiplier: this.maxMultiplier,
        xp: Math.floor(this.score / 10), coinsEarned: this.sessionCoins, gemsEarned: this.sessionGems, itemsBySprite: { ...this.sessionItemsBySprite }
      };
    }
    this.onSessionEnd?.(isVictory);
  }

  public addTrauma(amount: number): void { this.trauma = Math.min(1.0, this.trauma + amount); }
  public triggerFlash(color: string, duration: number): void { this.flashColor = color; this.flashT = duration; }
  public notifyHudChange(): void { this.onHudChange?.(); }
  public resize(w?: number, h?: number): void { this.canvas.width = w || window.innerWidth; this.canvas.height = h || window.innerHeight; }

  public reset(): void {
    this.score = 0; this.level = 0; this.currentSpeed = 7; this.currentSpawnDelay = 60;
    this.entities = []; this.trauma = 0; this.player.reset(); this.loadShopUpgrades();
    this.progress = 0; this.multiplier = 1; this.multiplierTimer = 0; this.multiplierTimeLeft = 0;
    this.maxMultiplier = 1; this.timer = 0; this.bgScrollX = 0;
    this.sessionCoins = 0; this.sessionGems = 0; this.sessionJumps = 0; this.sessionItemsBySprite = {};
  }

  private render(): void {
    SceneRenderer.render({
      ctx: this.ctx, canvasWidth: this.canvas.width, canvasHeight: this.canvas.height, state: this.state, mode: this.mode,
      level: this.level, bgScrollX: this.bgScrollX, trauma: this.trauma, flashT: this.flashT, flashColor: this.flashColor,
      entities: this.entities, player: this.player, particles: this.particles, biomeRenderer: this.biomeRenderer,
      abliaRenderer: this.abliaRenderer, loadingRenderer: this.loadingRenderer
    });
  }
}
