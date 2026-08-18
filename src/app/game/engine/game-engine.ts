import { EngineState, LOGICAL_WIDTH, LOGICAL_HEIGHT, LOGICAL_GROUND_Y, GROUND_LEVEL_Y_PERCENT, PLAYER_SIZE, OBSTACLE_W_SIZE, ITEM_SIZE } from './engine.constants';
export { EngineState };
import { Player } from '../entities/player';
import { Obstacle, ObstacleType } from '../entities/obstacle';
import { CollectibleItem, ItemType } from '../entities/item';
import { IEntity } from './entity.model';
import { ParticleSystem } from './particle-system';
import { AudioService } from '../../core/audio.service';
import { BiomeRenderer } from '../renderer/biome-renderer';
import { Chapter } from '../../core/models/chapter.model';
import { LoadingRenderer } from '../renderer/loading-renderer';
import { AbliaRenderer } from '../renderer/ablia-renderer';
import { AssetLoader } from './asset-loader';
import { MusicSynth } from './music-synth';
import { CHAPTER_REGISTRY } from './chapter-registry';
import { ARCADE_CHAPTER_REGISTRY } from './arcade-registry';
import { ABLIA_CHAPTER_REGISTRY } from './ablia-registry';
import { GameDataService } from '../../core/services/game-data.service';
import { 
  calculateLevelFromXP, 
  getLevelProgressPercentage,
  XP_PROGRESSION_TABLE, 
  MAX_LEVEL 
} from '../../core/constants/progression.constants';
import { PhysicsSystem } from './physics-system';
import { CollisionSystem } from './collision-system';
import { DirectorSystem } from './director-system';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    public state: EngineState = EngineState.BOOT;
    private lastTime: number = 0;
    private animationId: number | null = null;
    
    private physicsSystem: PhysicsSystem;
    private collisionSystem: CollisionSystem;
    private directorSystem: DirectorSystem;

    // --- GAMEPLAY PROPERTIES ---
    public score: number = 0;
    public level: number = 0;
    public maxXP: number = 350000;
    public minXP: number = 600;
    public highScore: number = 0;
    public coins: number = 0;
    public totalXP: number = 0;
    public chapter: Chapter | null = null;
    public mode: string = 'story'; // story, arcade, ablia
    public progress: number = 0;
    public multiplier: number = 1;
    public multiplierTimer: number = 0; // percentage for HUD
    public maxMultiplier: number = 1;
    public timer: number = 0;

    // Combos & Special States
    public bananaComboActive: boolean = false;
    public bananaComboTimer: number = 0;
    public multiplierDuration: number = 30; // seconds
    public multiplierTimeLeft: number = 0;

    // Shop Flags
    private hasShield: boolean = false;
    private hasMagnet: boolean = false;
    private hasGemRadar: boolean = false;

    // Stat Tracking (Session)
    private sessionJumps: number = 0;
    private sessionGems: number = 0;
    private sessionCoins: number = 0;

    // --- ENTITIES ---
    public player: Player;
    public entities: IEntity[] = [];
    private spawnTimer: number = 0;
    private currentSpeed: number = 7;
    private currentSpawnDelay: number = 80;
    public bgScrollX: number = 0;

    // --- SYSTEMS ---
    private particles: ParticleSystem;
    private audio: AudioService;
    private biomeRenderer: BiomeRenderer;
    private abliaRenderer: AbliaRenderer;
    private loadingRenderer: LoadingRenderer;
    private assetLoader: AssetLoader;
    public musicSynth: MusicSynth;
    private gameStateService: any;
    private gameData: GameDataService;
    private trauma: number = 0;
    private flashT: number = 0;
    private flashColor: string = '#FFF';
    public loadingProgress: number = 0;
    public currentTip: string = "INICIANDO SISTEMAS...";

    // Callbacks para comunicar eventos a la UI (Angular)
    public onStateChange: ((newState: EngineState) => void) | null = null;
    public onProgressChange: ((progress: number) => void) | null = null;
    public onReady: (() => void) | null = null;

    constructor(canvas: HTMLCanvasElement, audio: AudioService, gameStateService: any, gameData: GameDataService, chapter?: Chapter) {
        this.canvas = canvas;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Could not get 2D context');
        this.ctx = context;

        this.audio = audio;
        this.gameStateService = gameStateService;
        this.gameData = gameData;
        this.assetLoader = new AssetLoader();
        this.musicSynth = new MusicSynth();
        this.player = new Player();
        this.particles = new ParticleSystem(300);
        this.biomeRenderer = new BiomeRenderer(this.assetLoader);
        this.abliaRenderer = new AbliaRenderer();
        this.loadingRenderer = new LoadingRenderer();
        this.chapter = chapter || null;
        
        this.physicsSystem = new PhysicsSystem(this);
        this.collisionSystem = new CollisionSystem(this);
        this.directorSystem = new DirectorSystem(this);
        
        this.loadPersistence();
        this.loadShopUpgrades();
        
        this.keydownListener = (e: KeyboardEvent) => this.handleInput(e);
        this.mousedownListener = (e: MouseEvent) => this.handleMouseDown(e);
        this.resizeListener = () => this.resize();
        
        window.addEventListener('keydown', this.keydownListener);
        window.addEventListener('mousedown', this.mousedownListener);
        window.addEventListener('resize', this.resizeListener);
    }

    private keydownListener: (e: KeyboardEvent) => void;
    private mousedownListener: (e: MouseEvent) => void;
    private resizeListener: () => void;

    public destroy(): void {
        this.stop();
        if (this.musicSynth) {
            this.musicSynth.stopAll(this);
        }
        if (this.audio) {
            this.audio.stopMusic();
        }
        this.assetLoader.clearAll();
        window.removeEventListener('keydown', this.keydownListener);
        window.removeEventListener('mousedown', this.mousedownListener);
        window.removeEventListener('resize', this.resizeListener);
        console.log('[GameEngine] 💀 Destroyed and cleaned up.');
    }

    private loadShopUpgrades(): void {
        this.hasShield = localStorage.getItem('shop_item_shield_up') === 'true';
        this.hasMagnet = localStorage.getItem('shop_item_magnet_up') === 'true';
        this.hasGemRadar = localStorage.getItem('shop_item_gem_finder') === 'true';
        
        if (this.hasShield) {
            console.log('[GameEngine] 🛡️ Shield Upgrade Active');
            this.player.shieldActive = true;
        }
    }


    private handleInput(e: KeyboardEvent): void {
        const key = e.key.toLowerCase();
        
        if (key === 'escape' || key === 'esc') {
            this.togglePause();
            return;
        }

        if (key === ' ' || key === 'arrowup' || key === 'w') {
            if (this.state === EngineState.PAUSED) {
                this.togglePause();
            } else {
                this.jump();
            }
        }
    }

    private togglePause(): void {
        if (this.state === EngineState.PLAYING) {
            this.stop(); // Sets EngineState.PAUSED
            // notify pause UI if necessary or just stop updating
            console.log('[GameEngine] ⏸️ Game Paused');
        } else if (this.state === EngineState.PAUSED) {
            console.log('[GameEngine] ▶️ Resuming game...');
            this.state = EngineState.PLAYING;
            this.lastTime = performance.now();
            this.loop(this.lastTime);
        }
    }

    private handleMouseDown(e: MouseEvent): void {
        if (e.button === 0) { // Left Click
            if (this.state === EngineState.PAUSED) {
                this.togglePause();
            } else {
                this.jump();
            }
        }
    }

    private jump(): void {
        if (this.state === EngineState.PLAYING && this.player.jump()) {
            this.audio.playJump();
            this.sessionJumps++;
        }
    }

    private loadPersistence(): void {
        this.highScore = parseInt(localStorage.getItem('mx_high_score') || '0');
        this.totalXP = parseInt(localStorage.getItem('mx_total_xp') || '0');
        this.coins = parseInt(localStorage.getItem('mx_total_coins') || '0');

        // Inicializar nivel y progreso a 0 para el gameplay
        this.level = calculateLevelFromXP(this.score);
        this.progress = 0;
    }

    public async init(tips: string[] = []): Promise<void> {
        console.log('[GameEngine] 🚀 Initializing...');
        console.log('%c[GameEngine] ⚡ MODALIDAD DESARROLLO ACTIVA (INSTANT-RELOAD)', 'color: #00f2ff; font-weight: bold; background: #000; padding: 5px;');
        this.state = EngineState.LOADING;
        this.loadingProgress = 0;
        
        const updateProgress = async (target: number, msg: string) => {
            this.currentTip = msg;
            while (this.loadingProgress < target) {
                this.loadingProgress = Math.min(target, this.loadingProgress + 5);
                if (this.onProgressChange) this.onProgressChange(this.loadingProgress);
                await new Promise(r => setTimeout(r, 20)); // Velocidad de actualización de UI
            }
        };

        await updateProgress(5, "CONECTANDO CON LA NAVE...");
        this.gameStateService.addLoadingLog("Protocolos de comunicación establecidos.");
        
        // Sincronizar modo con el capítulo si es necesario
        if (this.chapter && this.chapter.mode) {
            this.mode = this.chapter.mode;
        }

        // Cargar assets del Bioma si hay un capítulo seleccionado
        if (this.chapter) {
            console.log(`[GameEngine] 📂 Loading chapter resources: mode=${this.mode}, theme=${this.chapter.folder}`);
            this.gameStateService.addLoadingLog(`Iniciando descarga de Sector: ${this.chapter.title}`);
            
            if (this.mode.toUpperCase() === 'ABLIA') {
                this.abliaRenderer.setCivilization(this.chapter.folder);
                await updateProgress(40, "GENERANDO ENTORNOS ABLIA...");
            } else {
                // Vincular AssetLoader con GameStateService
                const loader = this.biomeRenderer.getLoader ? this.biomeRenderer.getLoader() : null;
                if (loader) {
                    loader.onAssetLoaded = (name: string) => {
                        this.gameStateService.currentLoadingFile.set(name);
                        this.gameStateService.addLoadingLog(name);
                    };
                    loader.onProgress = (p: number) => {
                        // Mapeamos el progreso de activos (0-100) al rango (20-90) del motor
                        const mapped = 20 + (p * 0.7); 
                        this.loadingProgress = Math.max(this.loadingProgress, mapped);
                        if (this.onProgressChange) this.onProgressChange(this.loadingProgress);
                    };
                }

                await this.biomeRenderer.loadChapterAssets(
                    this.mode, 
                    this.chapter.folder, 
                    Math.max(1, this.level),
                    (assetName: string) => {
                        this.gameStateService.addLoadingLog(assetName);
                    }
                );
            }
            
            // Reproducir música del capítulo usando el AudioService
            this.currentTip = "SINCRONIZANDO AUDIO...";
            this.gameStateService.addLoadingLog("Buffer de audio sincronizado.");
            
            if (this.musicSynth) {
                this.musicSynth.stopAll(this);
            }
            if (this.audio && this.chapter) {
                this.audio.playChapterMusic(this.mode, this.chapter.folder);
            }
        }
        
        await updateProgress(95, "FINALIZANDO SINCRONÍA...");
        this.gameStateService.addLoadingLog("Sistemas de vuelo listos.");
        await updateProgress(100, "¡TODO LISTO!");
        
        await new Promise(r => setTimeout(r, 500));
        
        this.state = EngineState.READY;
        console.log('[GameEngine] ✅ Ready to start.');
        
        if (this.onStateChange) this.onStateChange(this.state);
        if (this.onReady) this.onReady();
    }

    public start(): void {
        if (this.state !== EngineState.READY && this.state !== EngineState.GAMEOVER) return;
        
        console.log('[GameEngine] ▶️ Starting game loop...');
        this.reset();
        this.state = EngineState.PLAYING;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    public stop(): void {
        console.log('[GameEngine] ⏹️ Stopping game loop...');
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.state = EngineState.PAUSED;
    }

    public onJump(): void {
        if (this.state !== EngineState.PLAYING) return;
        this.player.jump();
        if (this.mode.toUpperCase() === 'ABLIA') {
            // Un pequeño toque de AB al saltar
            this.abliaRenderer.triggerAB();
        }
    }

    private loop(timestamp: number): void {
        if (this.state === EngineState.PAUSED) return;

        const dt = (timestamp - this.lastTime) / 16.67;
        this.lastTime = timestamp;

        if (this.state === EngineState.PLAYING) {
            this.update(dt);
        } else if (this.state === EngineState.LOADING) {
            this.loadingRenderer.update(dt, this.loadingProgress, this.currentTip);
        }

        this.render();
        
        // Efectos globales post-update
        if (this.trauma > 0) this.trauma = Math.max(0, this.trauma - 0.02 * dt);
        if (this.flashT > 0) this.flashT -= dt;
        
        // --- ABLIA CAMERA BREATHING ---
        if (this.mode.toUpperCase() === 'ABLIA') {
            const time = performance.now() * 0.001;
            const swayX = Math.sin(time * 0.5) * 5;
            const swayY = Math.cos(time * 0.7) * 3;
            // Aplicamos esto en el render, pero actualizamos el valor aquí si fuera necesario
        }
        
        this.animationId = requestAnimationFrame((t) => this.loop(t));
    }

    private update(dt: number): void {
        this.timer += dt / 60;
        this.bgScrollX += 7 * dt;

        // Update Combo Timers
        if (this.bananaComboActive) {
            this.bananaComboTimer -= dt / 60;
            if (this.bananaComboTimer <= 0) {
                this.bananaComboActive = false;
            }
        }

        if (this.multiplierTimeLeft > 0) {
            this.multiplierTimeLeft -= dt / 60;
            this.multiplierTimer = (this.multiplierTimeLeft / this.multiplierDuration) * 100;
            if (this.multiplierTimeLeft <= 0) {
                this.multiplier = 1;
                this.multiplierTimer = 0;
            }
        }

        this.player.update(dt);
        this.particles.update(dt);
        
        // --- SCORE & LEVEL PROGRESSION (Determinista) ---
        this.timer += dt / 60;
        if (this.score > this.maxXP) this.score = this.maxXP;

        // Actualizar progreso (HUD usa this.progress para mostrar avance al siguiente nivel local)
        const nextLevel = calculateLevelFromXP(this.score);
        this.progress = getLevelProgressPercentage(this.score) / 100;
        
        // --- DETECTAR SUBIDA DE NIVEL ---
        if (nextLevel > this.level && this.chapter) {
            const oldLevel = this.level;
            this.level = nextLevel;
            console.log(`[GameEngine] 🆙 Level Up! ${oldLevel} -> ${this.level}`);
            
            // Recalcular dificultad (Dificultad base en Nivel 0)
            this.currentSpeed = 7 + (this.level) * 0.3;
            this.currentSpawnDelay = 80 * Math.pow(0.98, this.level - 1);
            
            // Notificar al BiomeRenderer para actualización de fondos (precarga)
            if (this.mode.toUpperCase() !== 'ABLIA') {
                this.biomeRenderer.prepareLevel(Math.max(1, this.level), this.mode, this.chapter.folder);
            }

            this.triggerFlash('#A6F616', 15);
            this.addTrauma(0.3);
        }

        // --- JUMP TRAIL ---
        if (this.mode.toUpperCase() === 'ABLIA' && Math.abs(this.player.vy) > 2) {
            const theme = (this.abliaRenderer as any).getThemeColors();
            this.particles.spawn(this.player.x + 20, this.player.y + this.player.h / 2, theme.accent, 1, 'trail');
        }

        if (this.mode.toUpperCase() === 'ABLIA') {
            this.abliaRenderer.update(dt);
        } else {
            this.biomeRenderer.update(dt);
        }

        // --- ABLIA LOGIC (Adaptive Difficulty) ---
        if (this.mode.toLowerCase() === 'ablia') {
            // Si tiene mucha vida, subir dificultad ligeramente más rápido
            if (this.player.health > 80) {
                this.currentSpeed += 0.001 * dt;
            } 
            // Si tiene poca vida, dar un respiro
            else if (this.player.health < 40) {
                this.currentSpeed = Math.max(5, this.currentSpeed - 0.005 * dt);
                this.currentSpawnDelay = Math.min(120, this.currentSpawnDelay + 0.1 * dt);
            }
        }

        // --- TRAUMA DECAY (Fix Earthquake) ---
        if (this.trauma > 0) {
            this.trauma *= 0.95;
            if (this.trauma < 0.01) this.trauma = 0;
        }

        // --- MULTIPLIER LOGIC (Time-based per dom_superior.md) ---
        if (this.multiplier > 1) {
            this.multiplierTimeLeft -= dt / 60;
            this.multiplierTimer = (this.multiplierTimeLeft / this.multiplierDuration) * 100;
            
            if (this.multiplierTimeLeft <= 0) {
                console.log('[GameEngine] ⏳ Multiplier Expired');
                this.multiplier = 1;
                this.multiplierTimeLeft = 0;
                this.multiplierTimer = 0;
            }
        } else {
            this.multiplierTimer = 0;
        }

        if (this.multiplier > this.maxMultiplier) this.maxMultiplier = this.multiplier;

        // --- CHECK VICTORY (Condición Final 350.000 XP) ---
        if (this.score >= this.maxXP) {
            this.victory();
            return;
        }

        // --- SPAWNING LOGIC (DIRECTOR SYSTEM) ---
        this.directorSystem.update(dt, this.currentSpeed, this.currentSpawnDelay);

        // --- ENTITIES LOOP ---
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const ent = this.entities[i];
            ent.update(dt);

            // COLLISION DETECTION
            if (this.collisionSystem.check(this.player, ent)) {
                this.handleCollision(ent, i);
            }

            // CLEANUP
            if (ent.x + ent.w < -100) {
                this.entities.splice(i, 1);
                continue;
            }
        }

        // --- PHYSICS SYSTEM ---
        this.physicsSystem.update(dt);
    }


    private handleCollision(ent: IEntity, index: number): void {
        if (ent instanceof Obstacle) {
            // Invulnerable during Banana Combo
            if (this.bananaComboActive) return;

            // --- SHIELD LOGIC ---
            if (this.player.shieldActive) {
                this.player.shieldActive = false;
                this.audio.playDamage(); 
                this.addTrauma(0.3);
                this.triggerFlash('#00f2ff', 5);
                this.particles.addFloatingText(ent.x, ent.y, 'SHIELD LOST', '#00f2ff', 30, 'pop');
                this.entities.splice(index, 1);
                return;
            }

            this.audio.playDamage();
            this.player.lives--;
            this.player.health = Math.max(0, (this.player.lives / 3) * 100);
            
            this.particles.spawn(ent.x, ent.y, '#FF4D4D', 20, 'square');
            
            // Impacto ABLIA temático
            if (this.mode.toUpperCase() === 'ABLIA') {
                const theme = (this.abliaRenderer as any).getThemeColors();
                this.particles.spawn(ent.x, ent.y, theme.accent, 15, 'shard');
            }

            this.particles.addFloatingText(ent.x, ent.y - 20, '-1 VIDA ❤️', '#FF0000', 40, 'shake');
            this.trauma = Math.min(1.0, this.trauma + 0.5);
            this.triggerFlash('#FF0000', 10);
            if (this.mode.toUpperCase() === 'ABLIA') this.abliaRenderer.triggerAB();
            
            this.entities.splice(index, 1);

            if (this.player.lives <= 0) {
                this.gameOver();
            }
        } else if (ent instanceof CollectibleItem) {
            let col = '#FFE135';
            let points = 50;
            const sName = (ent as any).spriteName || 'coin';
            let abilityText = '';

            // 1. CHECKEAR CADA OBJETO INDIVIDUAL PARA ASIGNAR PODERES/HABILIDADES (MAGIAS)
            if (sName === 'shield') {
                this.player.shieldActive = true;
                col = '#00f2ff';
                points = 100;
                abilityText = 'ESCUDO ACTIVADO 🛡️';
            } else if (sName === 'magnet') {
                this.player.magnetT = 15;
                col = '#ff79c6';
                points = 100;
                abilityText = 'IMÁN ACTIVADO 🧲';
            } else if (sName === 'star') {
                if (this.multiplier === 1) this.multiplier = 2;
                else this.multiplier *= 2;
                this.multiplierTimeLeft = this.multiplierDuration;
                this.maxMultiplier = Math.max(this.maxMultiplier, this.multiplier);
                col = '#A6F616';
                points = 100;
                abilityText = `MULTIPLICADOR x${this.multiplier} 🌟`;
            } else if (sName === 'bolt') {
                this.currentSpeed = Math.min(15, this.currentSpeed + 1.5);
                col = '#ffd84d';
                points = 150;
                abilityText = 'SUPER VELOCIDAD ⚡';
            } else if (sName === 'bomb') {
                col = '#ff4d4d';
                points = 120;
                abilityText = 'DETONACIÓN ACTIVA 💣';
                for (const other of this.entities) {
                    if (other instanceof Obstacle) {
                        this.particles.spawn(other.x + other.w/2, other.y + other.h/2, '#ff4d4d', 20, 'shard');
                    }
                }
                this.entities = this.entities.filter(other => !(other instanceof Obstacle));
                this.addTrauma(0.4);
                this.triggerFlash('#ff4d4d', 10);
            } else if (sName === 'clock') {
                this.currentSpeed = Math.max(5, this.currentSpeed - 2.5);
                col = '#00f2ff';
                points = 100;
                abilityText = 'TIEMPO LENTIFICADO ⏱️';
            } else if (sName === 'clover') {
                col = '#7cf27c';
                points = 300;
                abilityText = 'SUERTE TRÉBOL +300 🍀';
            } else if (sName === 'crown') {
                col = '#ffd700';
                points = 500;
                abilityText = 'CORONA REAL +500 👑';
            } else if (sName === 'emerald') {
                col = '#2ecc71';
                points = 300;
                abilityText = 'ESMERALDA RARA +300 💎';
            } else if (sName === 'pearl') {
                col = '#f3e5ab';
                points = 250;
                abilityText = 'PERLA MARINA +250 🦪';
            } else if (sName === 'feather') {
                this.player.vy = -14;
                col = '#e0f7fa';
                points = 100;
                abilityText = 'SALTO FLOTANTE 🪶';
            } else if (sName === 'fly_gold') {
                col = '#ffd700';
                points = 400;
                abilityText = 'MOSCA DORADA +400 🪰';
            } else if (sName === 'ghost') {
                this.bananaComboActive = true;
                this.bananaComboTimer = 5.0;
                col = '#cfd8dc';
                points = 150;
                abilityText = 'MODO INVISIBLE (FANTASMA) 👻';
            } else if (sName === 'gift') {
                col = '#ff8a80';
                points = 180;
                abilityText = 'REGALO DE PUNTOS +180 🎁';
            } else if (sName === 'hourglass') {
                col = '#ffe082';
                points = 200;
                abilityText = 'TIEMPO EXTRA +200 ⏳';
            } else if (sName === 'ice') {
                this.currentSpeed = 4;
                col = '#80deea';
                points = 100;
                abilityText = 'PANTALLA CONGELADA ❄️';
            } else if (sName === 'mini') {
                col = '#a5d6a7';
                points = 150;
                abilityText = 'MINI RANA +150 🐸';
            } else if (sName === 'rainbow') {
                this.bananaComboActive = true;
                this.bananaComboTimer = 6.0;
                this.multiplier = Math.max(this.multiplier * 2, 4);
                this.multiplierTimeLeft = this.multiplierDuration;
                col = '#ff80ab';
                points = 250;
                abilityText = 'MODO ARCOÍRIS ACTIVADO 🌈';
            } else if (sName === 'banana') {
                this.player.bananasCollected++;
                col = '#FFE135';
                points = 50;
                abilityText = `BANANA COMBO +1 (${this.player.bananasCollected}/5) 🍌`;
                if (this.player.bananasCollected >= 5) {
                    this.triggerBananaCombo();
                }
            } else if (sName === 'heart') {
                this.player.extraLifeProgress++;
                col = '#FF4D4D';
                points = 80;
                abilityText = `VIDA EXTRA +1 (${this.player.extraLifeProgress}/10) ❤️`;
                if (this.player.extraLifeProgress >= 10) {
                    this.player.extraLifeProgress = 0;
                    this.player.lives++;
                }
            } else if (sName.startsWith('candy_') || sName === 'candy_red') {
                this.player.bombsCollected++;
                col = '#ff79c6';
                points = 60;
                abilityText = `CHUCHES COMBO +1 (${this.player.bombsCollected}/10) 🍬`;
                if (this.player.bombsCollected >= 10) {
                    this.player.bombsCollected = 0;
                }
            } else if (ent.type === ItemType.COIN) {
                this.coins++;
                this.sessionCoins++;
                col = '#FFD700';
                abilityText = `MONEDA +${points * this.multiplier} 🪙`;
            } else if (ent.type === ItemType.GEM) {
                points = 200;
                this.sessionGems++;
                col = '#00f2ff';
                abilityText = `GEMA +${points * this.multiplier} 💎`;
            } else {
                abilityText = `OBJETO +${points * this.multiplier} ✨`;
            }
            
            this.score += points * this.multiplier;
            this.audio.playCollect(Math.floor(this.score / 1000));
            this.particles.spawn(ent.x + ent.w / 2, ent.y + ent.h / 2, col, 15, 'circle');
            
            // Indicador de la magia o el poder que da el objeto
            this.particles.addFloatingText(ent.x + ent.w / 2, ent.y - 45, abilityText, col, 26, 'pop');
            
            // Indicador flotante de puntos restantes
            const nextLvl = calculateLevelFromXP(this.score);
            const currentThreshold = nextLvl === 0 ? 0 : XP_PROGRESSION_TABLE[nextLvl];
            const nextThreshold = XP_PROGRESSION_TABLE[nextLvl + 1] || 350000;
            const currentPointsInLevel = this.score - currentThreshold;
            const neededInLevel = nextThreshold - currentThreshold;
            const remaining = Math.max(0, neededInLevel - currentPointsInLevel);
            this.particles.addFloatingText(ent.x + ent.w / 2, ent.y - 15, `Faltan ${remaining} pts`, '#00f2ff', 20, 'shake');
            
            this.entities.splice(index, 1);
        }
    }

    private triggerBananaCombo(): void {
        this.player.bananasCollected = 0;
        this.bananaComboActive = true;
        this.bananaComboTimer = 1.5; // seconds
        
        this.audio.playVictory(); 
        this.triggerFlash('#A6F616', 15);
        this.addTrauma(0.5);
        
        // Explode all obstacles currently on screen
        for (const ent of this.entities) {
            if (ent instanceof Obstacle) {
                this.particles.spawn(ent.x + ent.w/2, ent.y + ent.h/2, '#A6F616', 30, 'shard');
            }
        }
        // Remove them
        this.entities = this.entities.filter(ent => !(ent instanceof Obstacle));
        
        console.log('[GameEngine] 🍌 BANANA COMBO ACTIVATED!');
    }

    private gameOver(): void {
        this.musicSynth.stopMusic();
        this.saveFinalStats();
        this.state = EngineState.GAMEOVER;
        if (this.onStateChange) {
            this.onStateChange(EngineState.GAMEOVER);
        }
    }

    private victory(): void {
        this.musicSynth.stopMusic();
        this.saveFinalStats();
        this.state = EngineState.VICTORY;
        if (this.onStateChange) {
            this.onStateChange(EngineState.VICTORY);
        }
    }

    private saveFinalStats(): void {
        console.log('[GameEngine] 💾 Saving Session Stats...');
        
        // Acumular totales para Trofeos
        const totalJumps = parseInt(localStorage.getItem('mx_total_jumps') || '0') + this.sessionJumps;
        const totalCoins = parseInt(localStorage.getItem('mx_total_coins_collected') || '0') + this.sessionCoins;
        const totalGems = parseInt(localStorage.getItem('mx_total_gems_collected') || '0') + this.sessionGems;
        const totalDeaths = parseInt(localStorage.getItem('mx_total_deaths') || '0') + 1;
        
        localStorage.setItem('mx_total_jumps', totalJumps.toString());
        localStorage.setItem('mx_total_coins_collected', totalCoins.toString());
        localStorage.setItem('mx_total_gems_collected', totalGems.toString());
        localStorage.setItem('mx_total_deaths', totalDeaths.toString());

        // Last Session Stats for UI
        localStorage.setItem('mx_last_score', Math.floor(this.score).toString());
        localStorage.setItem('mx_last_coins', this.sessionCoins.toString());
        localStorage.setItem('mx_last_gems', this.sessionGems.toString());

        // High Score
        if (this.score > this.highScore) {
            localStorage.setItem('mx_high_score', Math.floor(this.score).toString());
        }

        // Coins actuales para la tienda
        localStorage.setItem('mx_total_coins', this.coins.toString());

        // Max Level
        const maxLevel = Math.max(parseInt(localStorage.getItem('mx_max_level') || '0'), this.level);
        localStorage.setItem('mx_max_level', maxLevel.toString());
        
        // XP (un poco por cada score)
        const xpEarned = Math.floor(this.score / 10);
        const newXP = this.totalXP + xpEarned;
        localStorage.setItem('mx_total_xp', newXP.toString());

        // Sincronizar con GameDataService para la UI (GameOver)
        this.gameData.lastGameStats = {
            score: Math.floor(this.score),
            time: this.formatTime(this.timer),
            level: calculateLevelFromXP(newXP),
            maxMultiplier: this.maxMultiplier,
            xp: xpEarned
        };
    }

    public addTrauma(amount: number): void {
        this.trauma = Math.min(1.0, this.trauma + amount);
    }

    public triggerFlash(color: string, duration: number): void {
        this.flashColor = color;
        this.flashT = duration;
    }



    public reset(): void {
        this.score = 0;
        this.level = 0; // Inicia en 0 per rules
        this.currentSpeed = 7;
        this.currentSpawnDelay = 60; // Más denso (antes 80)
        this.entities = [];
        this.spawnTimer = 0;
        this.trauma = 0;
        this.player.reset();
        this.progress = 0;
        this.multiplier = 1;
        this.multiplierTimer = 100;
        this.maxMultiplier = 1;
        this.timer = 0;
        this.bgScrollX = 0;
    }

    private render(): void {
        this.ctx.save();

        // --- SISTEMA DE RESOLUCIÓN LÓGICA (CALIBRACIÓN AUTOMÁTICA) ---
        const scaleX = this.canvas.width / LOGICAL_WIDTH;
        const scaleY = this.canvas.height / LOGICAL_HEIGHT;
        this.ctx.scale(scaleX, scaleY);

        // Aplicar Shake y Breathing
        let finalShakeX = 0;
        let finalShakeY = 0;

        if (this.trauma > 0) {
            const shake = Math.pow(this.trauma, 2) * 12; // Reducido de 20 a 12
            finalShakeX += (Math.random() - 0.5) * shake;
            finalShakeY += (Math.random() - 0.5) * shake;
        }

        if (this.mode === 'ablia' || this.mode === 'ABLIA') {
            const time = performance.now() * 0.0005; // Más lento
            // Mucho más sutil
            finalShakeX += Math.sin(time * 0.5) * 0.8;
            finalShakeY += Math.cos(time * 0.4) * 0.4;
        }

        this.ctx.translate(finalShakeX, finalShakeY);

        // Zoom Dinámico por Velocidad
        if (this.mode === 'ablia' || this.mode === 'ABLIA') {
            const zoom = 1 + (this.currentSpeed - 7) * 0.01;
            this.ctx.scale(zoom, zoom);
            this.ctx.translate(-(LOGICAL_WIDTH * (zoom - 1)) / 2, -(LOGICAL_HEIGHT * (zoom - 1)) / 2);
        }

        // Limpiar fondo base
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

        // Fondo Parallax / Procedimiento
        if (this.mode.toUpperCase() === 'ABLIA') {
            this.abliaRenderer.drawBackground(this.ctx, this.bgScrollX);
            this.drawAbliaTorch();
        } else {
            this.biomeRenderer.drawBackground(this.ctx, this.bgScrollX, this.mode); 
        }
        if (this.state === EngineState.LOADING) {
            this.loadingRenderer.draw(this.ctx, performance.now());
        } else {
            // Gameplay
            for (const ent of this.entities) {
                if (ent instanceof Obstacle) {
                    ent.draw(this.ctx, this.biomeRenderer, this.level);
                } else {
                    ent.draw(this.ctx, this.biomeRenderer);
                }
            }
            this.player.draw(this.ctx, this.biomeRenderer);
            this.particles.draw(this.ctx);
            
            // Primer Plano
            if (this.mode.toUpperCase() === 'ABLIA') {
                this.abliaRenderer.drawForeground(this.ctx, this.bgScrollX);
            } else {
                this.biomeRenderer.drawForeground(this.ctx, this.bgScrollX, this.mode);
            }
            
            // UI Overlay (Health Bar) -> REMOVED: Managed by Angular DOM
            this.drawLowHealthFX();
        }

        // Pantalla de Flash (Dinámico)
        if (this.flashT > 0) {
            this.ctx.globalAlpha = Math.min(0.3, this.flashT / 10);
            this.ctx.fillStyle = this.flashColor;
            this.ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        }

        this.ctx.restore();
    }

    // drawUI removed: UI is now rendered in Angular DOM via HUDComponent

    private drawAbliaTorch(): void {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'overlay';
        const cx = this.player.x + this.player.w / 2;
        const cy = this.player.y + this.player.h / 2;
        const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
        grad.addColorStop(0, 'rgba(255, 220, 150, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        this.ctx.restore();
    }

    private drawLowHealthFX(): void {
        if (this.player.health < 30) {
            const pulse = (Math.sin(performance.now() * 0.01) + 1) / 2;
            this.ctx.save();
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${pulse * 0.3})`;
            this.ctx.lineWidth = 40;
            this.ctx.strokeRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
            this.ctx.restore();
        }
    }

    // --- PROGRESIÓN DETERMINISTA ---
    
    /**
     * Calcula el nivel n basado en el XP acumulado (n entre 1 y 30)
     */
    private calculateLevel(xp: number): number {
        return calculateLevelFromXP(xp);
    }

    /**
     * Retorna el umbral de XP necesario para ENTRAR en el nivel n
     */
    private getXPThreshold(n: number): number {
        if (n <= 1) return XP_PROGRESSION_TABLE[1];
        if (n >= MAX_LEVEL) return XP_PROGRESSION_TABLE[MAX_LEVEL];
        
        return XP_PROGRESSION_TABLE[n] || XP_PROGRESSION_TABLE[1];
    }

    public resize(w?: number, h?: number): void {
        if (w && h) {
            this.canvas.width = w;
            this.canvas.height = h;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

function ctxBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string, r: number) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
}
