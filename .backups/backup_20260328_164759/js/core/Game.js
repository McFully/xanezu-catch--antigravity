import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { AssetLoader } from './AssetLoader.js';
import { Boss } from '../entities/Boss.js';
import { BossProjectile } from '../entities/BossProjectile.js';
import { MusicSynth } from './MusicSynth.js';
import { WeatherManager } from '../managers/WeatherManager.js';
import { RankManager } from '../managers/RankManager.js';
import { MilestoneManager } from '../managers/MilestoneManager.js';
import { AchievementManager } from '../managers/AchievementManager.js';
import { UIManager } from './UIManager.js';
import { BiomeRenderer } from './BiomeRenderer.js';
import { Player } from '../entities/Player.js';
import { Companion } from '../entities/Companion.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Fly } from '../entities/Fly.js';
import { Candy, BonusItem, PowerUp, LevelArtifact } from '../entities/Items.js';
import { FloatingText, ParticlePool } from '../entities/Effects.js';
import { CHAPTER_REGISTRY } from './ChapterRegistry.js';
import { ARCADE_CHAPTER_REGISTRY } from './ArcadeChapterRegistry.js';
import { ABL_CHAPTER_REGISTRY } from './ABLChapterRegistry.js';
import { SpawnManager } from '../managers/SpawnManager.js';
import { SaveSystem } from '../managers/SaveSystem.js';
import { ScoreSystem } from '../managers/ScoreSystem.js';
import { ChapterManager } from '../managers/ChapterManager.js';
import { UnlockSystem } from '../managers/UnlockSystem.js';
import { LevelManager } from '../managers/LevelManager.js';
import { GameStateManager } from '../managers/GameStateManager.js';
import { CharacterFactory } from '../managers/CharacterFactory.js';
import { ProceduralMusicEngine } from './ProceduralMusicEngine.js';
import { ShopManager } from '../managers/ShopManager.js';
import { SKINS } from './SkinRegistry.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById("game");
        this.ctx = this.canvas.getContext("2d", { alpha: false });

        this.assetLoader = new AssetLoader();
        this.synth = new MusicSynth();
        this.saveSystem = new SaveSystem();
        
        // --- SISTEMA DE SKINS (Fase 12) ---
        this.activeSkinId = localStorage.getItem('mx_active_skin') || 'default';
        this.activeSkin = SKINS[this.activeSkinId] || SKINS['default'];
        
        // El StateManager ahora recibe 'this' para tener acceso bidireccional si es necesario
        this.stateManager = new GameStateManager(this);
        
        this.chapterManager = new ChapterManager(ARCADE_CHAPTER_REGISTRY);
        this.levelManager = new LevelManager();
        this.characterFactory = new CharacterFactory();
        this.ranks = new RankManager();
        this.proceduralMusic = new ProceduralMusicEngine(this.synth);
        this.shopManager = new ShopManager(this);

        // UIManager ya no toca el DOM, ahora sÃ³lo dibuja sobre este contexto.
        this.ui = new UIManager(this);
        
        this.biomeRenderer = new BiomeRenderer(this);
        this.weather = new WeatherManager(this);
        this.particles = new ParticlePool(400);
        this.spawn = new SpawnManager(this);

        this.entities = [];
        this.floatingTexts = [];
        
        // --- Entity Pools para optimizaciÃ³n (Evitar GC spikes) ---
        this.obstaclePool = [];
        this.itemPool = {
            fly: [], candy: [], powerup: [], bonus: [], artifact: []
        };
        this.maxPoolSize = 50;
        
        // Estado inicial sincronizado con StateManager
        this.state = this.stateManager.state; // 'MAIN_MENU'
        
        this.score = 0;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('mx_high_score')) || 0;
        this.maxChapter = parseInt(localStorage.getItem('mx_max_chapter')) || 1;
        this.maxLevel = parseInt(localStorage.getItem('mx_max_level')) || 1;
        this.maxMult = parseInt(localStorage.getItem('mx_max_mult')) || 1;
        this.totalGamesPlayed = parseInt(localStorage.getItem('mx_games_played')) || 0;
        this.totalDeaths = parseInt(localStorage.getItem('mx_total_deaths')) || 0;
        this.totalItemsCaught = parseInt(localStorage.getItem('mx_total_items')) || 0;
        this.totalDashes = parseInt(localStorage.getItem('mx_total_dashes')) || 0;
        this.totalTimePlayed = parseFloat(localStorage.getItem('mx_total_time')) || 0;
        this.highLevelReached = parseInt(localStorage.getItem('mx_high_level')) || 1;
        
        this.bgX = 0;
        this.spawnT = { obs: 0, fly: 0, power: 0, art: 0, bonus: 0, candy: 0 };
        this.collectionStreak = 0;
        this.feverT = 0;
        this.camTrauma = 0; // Sistema de trauma 0-1 (AAA Style)
        this.camShakeAngle = 0;
        this.camOffsetX = 0;
        this.camOffsetY = 0;
        this.damageT = 0;
        
        this.isMusicOn = localStorage.getItem('mx_music_on') !== '0';
        this.isSoundOn = localStorage.getItem('mx_sound_on') !== '0';
        this.inTransition = false;
        
        this.multT = 0;
        this.iceT = 0;
        this.nearMissT = 0;

        // --- GAMEPLAY JUICE (Fase 7) ---
        this.timeScale = 1.0;
        this.bulletTimeT = 0;
        this.perfectT = 0;

        // --- PROGRESIÃ“N (Fase 8) ---
        this.totalXP = parseInt(localStorage.getItem('mx_total_xp')) || 0; 

        this.inNearMiss = false;
        this.eventT = 0;
        this.activeEvent = null;
        this.lives = 1;
        this.extraLifeHearts = 0;
        this.bananaCombo = 0;
        this.bombCombo = 0;
        this.plus50Count = 0;
        this.candyStreak = 0;
        this.chapter = 1;
        this.isInfinite = false;
        
        // --- Optimizaciones de Rendimiento ---
        this.warmedChapters = new Set(); // CapÃ­tulos con assets ya procesados en GPU
        this.storySpeedFactor = 3.0;     // Velocidad de fondo x3 para Modo Historia
        
        // Mouse para menÃºs interactivos 100% canvas
        this.mouse = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, down: false, wasDown: false, justDown: false };
        
        // Terminal de DepuraciÃ³n en Tiempo Real
        this.debugLog = ["ðŸš€ Motor iniciado..."];
        this._setupErrorCapture();
        
        this.menuParticles = Array.from({ length: 50 }, () => ({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            size: Math.random() * 3 + 1,
            life: Math.random()
        }));

        this.initSkillTree();
        this.initDailyChallenge();
        this.loadPersistence();

        this.achievements = new AchievementManager(this);
        this.milestones = new MilestoneManager(this);

        // Control de Redimensionamiento Global
        window.addEventListener('resize', () => this.resize());
        this.resize();

        // Audio Unlocker robusto para web
        this.audioUnlocked = false;
        this._setupAudioUnlocker();
        
        // --- Combate de Jefe (Fase 14) ---
        this.activeBoss = null;
        this.isBossLevel = false;
    }

    _setupErrorCapture() {
        window.onerror = (msg, url, line, col, error) => {
            const err = `âŒ ERROR: ${msg} (L${line}:${col})`;
            this.debugLog.push(err);
            if (this.debugLog.length > 5) this.debugLog.shift();
            console.error(err, error);
            return false;
        };
        
        // Atrapa promesas rechazadas (async errors)
        window.onunhandledrejection = (event) => {
            const err = `âŒ ASYNC ERROR: ${event.reason}`;
            this.debugLog.push(err);
            if (this.debugLog.length > 5) this.debugLog.shift();
        };
    }

    /**
     * Habilita el AudioContext de la Web Audio API tras la primera interacciÃ³n del usuario.
     * Requerido por navegadores modernos para permitir la reproducciÃ³n de sonido.
     */
    _setupAudioUnlocker() {
        const unlock = () => {
            if (this.audioUnlocked) return;
            
            this.synth.resumeContext().then(() => {
                this.audioUnlocked = true;
                console.log("ðŸ”Š Audio desbloqueado por el usuario.");
                
                // Remover listeners una vez desbloqueado
                window.removeEventListener('click', unlock);
                window.removeEventListener('keydown', unlock);
                window.removeEventListener('touchstart', unlock);
            }).catch(e => console.warn("Fallo al desbloquear audio:", e));
        };

        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        window.addEventListener('touchstart', unlock);
    }

    loadPersistence() {
        try {
            const savedStats = JSON.parse(localStorage.getItem('mx_stats') || '{}');
            this.stats = {
                totalBananas: savedStats.totalBananas || 0,
                totalGreenCandies: savedStats.totalGreenCandies || 0,
                explosions: savedStats.explosions || 0,
                tempAirDashes: 0,
                maxAirDashes: 0,
                levelNoDamage: true,
                combosInCurrentLife: { explosion: false, cowboy: false },
                doubleComboInLife: false
            };

            this.totalCoins = parseInt(localStorage.getItem('mx_total_coins') || '0');
            this.unlocks = JSON.parse(localStorage.getItem('mx_unlocks') || '{"magnet":0,"shield":0,"skins":[]}');

            const arcade = this.saveSystem.loadModeProgress('arcade');
            const abl = this.saveSystem.loadModeProgress('abl');

            const arcadeUnlock = new UnlockSystem(new ChapterManager(ARCADE_CHAPTER_REGISTRY));
            const ablUnlock = new UnlockSystem(new ChapterManager(ABL_CHAPTER_REGISTRY));

            this.arcadeProgress = {
                scoreGlobal: arcade.scoreGlobal,
                unlockedChapters: (arcade.unlockedChapters && arcade.unlockedChapters.length)
                    ? arcade.unlockedChapters
                    : [1],
                lastPlayedChapter: arcade.lastPlayedChapter || 1,
            };

            this.ablProgress = {
                scoreGlobal: abl.scoreGlobal,
                unlockedChapters: (abl.unlockedChapters && abl.unlockedChapters.length)
                    ? abl.unlockedChapters
                    : ablUnlock.getUnlockedChapters(abl.scoreGlobal),
                lastPlayedChapter: abl.lastPlayedChapter || 1,
            };

            this.scoreSystem = new ScoreSystem(this.arcadeProgress.scoreGlobal);
            this.unlockSystem = new UnlockSystem(this.chapterManager);
            this.unlockedChapters = this.arcadeProgress.unlockedChapters;
            this.scoreGlobal = this.arcadeProgress.scoreGlobal;
            this.lastPlayedChapter = this.arcadeProgress.lastPlayedChapter;
            // Progreso de historia: solo capÃ­tulo 1 desbloqueado por defecto
            const savedStory = JSON.parse(localStorage.getItem('mx_story_unlocked') || 'null');
            this.unlockedStoryChapters = (savedStory && savedStory.length)
                ? savedStory
                : [1];
            this.saveSystem.saveModeProgress('arcade', this.arcadeProgress);
            this.saveSystem.saveModeProgress('abl', this.ablProgress);

            this.totalItemsCaught = parseInt(localStorage.getItem('mx_total_catches') || '0');
            this.totalDeaths = parseInt(localStorage.getItem('mx_total_deaths') || '0');
            this.totalDashes = parseInt(localStorage.getItem('mx_total_dashes') || '0');
            this.totalTimePlayed = parseInt(localStorage.getItem('mx_total_time') || '0');
            this.highLevelReached = parseInt(localStorage.getItem('mx_high_level') || '1');
        } catch (e) {
            console.error("Persistence Load Error:", e);
            // Reset to defaults if corrupted
            this.stats = { totalBananas: 0, totalGreenCandies: 0, explosions: 0, tempAirDashes: 0, maxAirDashes: 0, levelNoDamage: true, combosInCurrentLife: { explosion: false, cowboy: false }, doubleComboInLife: false };
            this.totalCoins = 0;
            this.unlocks = { magnet: 0, shield: 0, skins: [] };
            this.scoreGlobal = 0;
            this.scoreSystem = new ScoreSystem(0);
            this.unlockSystem = new UnlockSystem(this.chapterManager);
            this.unlockedChapters = [1];
            this.arcadeProgress = { scoreGlobal: 0, unlockedChapters: [1], lastPlayedChapter: 1 };
            this.ablProgress = { scoreGlobal: 0, unlockedChapters: [1], lastPlayedChapter: 1 };
            this.unlockedStoryChapters = [1]; // Solo capÃ­tulo 1 por defecto en error
            this.lastPlayedChapter = 1;
            this.totalItemsCaught = 0; this.totalDeaths = 0; this.totalDashes = 0; this.totalTimePlayed = 0; this.highLevelReached = 1;
        }
    }

    initSkillTree() {
        try {
            const savedTree = JSON.parse(localStorage.getItem('mx_skill_tree') || '{}');
            this.skills = {
                jumpBoost: savedTree.jumpBoost || 0,
                dashEfficiency: savedTree.dashEfficiency || 0,
                luckFactor: savedTree.luckFactor || 0,
                resilience: savedTree.resilience || 0
            };
        } catch (e) {
            console.error("Skill Tree Load Error:", e);
            this.skills = { jumpBoost: 0, dashEfficiency: 0, luckFactor: 0, resilience: 0 };
        }
    }

    initDailyChallenge() {
        try {
            const today = new Date().toDateString();
            const lastDaily = localStorage.getItem('mx_last_daily');
            let savedDaily = null;
            try { savedDaily = JSON.parse(localStorage.getItem('mx_daily')); } catch (e) { }

            if (lastDaily !== today || !savedDaily) {
                const types = ['CATCH', 'SCORE', 'LEVEL', 'DASH'];
                this.daily = { type: types[Math.floor(Math.random() * types.length)], target: Math.floor(Math.random() * 50) + 10, reached: false, date: today };
                localStorage.setItem('mx_daily', JSON.stringify(this.daily)); localStorage.setItem('mx_last_daily', today);
            } else { this.daily = savedDaily; }
        } catch (e) {
            console.error("Daily Challenge Load Error:", e);
            this.daily = { type: 'SCORE', target: 5000, reached: false, date: new Date().toDateString() };
        }
    }
    async init() {
        console.log("GAME: Starting init()...");
        try {
            console.log("ðŸŽ® Game Core: Cargando Assets Iniciales...");
            
            this.loadingProgress = 0.3;
            const { assets, sounds } = await this.assetLoader.load({
                flyGold: "assets/story/1-selva-tropical/objetos/fly_gold.svg",
                heart: "assets/story/1-selva-tropical/objetos/heart.svg",
                banana: "assets/story/1-selva-tropical/objetos/banana.svg",
                coin: "assets/story/1-selva-tropical/objetos/coin.svg",
                star: "assets/story/1-selva-tropical/objetos/star.svg",
                shield: "assets/story/1-selva-tropical/objetos/shield.svg",
                // Skins Personaje Cap 1 (Globales por defecto)
                frog: "assets/story/1-selva-tropical/personaje/frog.svg",
                frogUp: "assets/story/1-selva-tropical/personaje/frog_up.svg",
                frogDown: "assets/story/1-selva-tropical/personaje/frog_dn.svg",
                frogCatch: "assets/story/1-selva-tropical/personaje/frog_c.svg",
                comp: "assets/story/1-selva-tropical/personaje/comp.svg",
                menuBG: "assets/menu/fondo/mainmenu-image.webp",
                modeSelectBG: "assets/menu/fondo/mode-selection-bg.png",
                settingsBG: "assets/menu/fondo/menu_bg_modes.png",
                chapterSelectBG: "assets/menu/fondo/charper-menu-image.webp",
                abliaBG: "assets/menu/fondo/menu_bg_modes_new.png",
            }, {
                musica_menu: 'assets/menu/audio/musica menu.ogg'
            });

            this.assets = assets;
            this.sounds = sounds;
            this.loadingProgress = 0.7;

            // Carga de skins globales
            await this.assetLoader.loadGlobalObjects();

            // Precargar thumbnails de capÃ­tulos para la pantalla de selecciÃ³n
            // (no bloqueante: se lanza en background para no retrasar el inicio)
            if (this.assetLoader.preloadChapterThumbnails) {
                this.assetLoader.preloadChapterThumbnails().catch(e =>
                    console.warn('Thumbnail preload failed (non-critical):', e)
                );
            }

            this.loadingProgress = 1.0;

            this.frog = new Player(assets, this);
            this.elephant = new Companion(assets);

            this.setupInput();
            
            // Estado inicial segÃºn el plan maestro
            this.stateManager.navigate('main_menu');
        } catch (e) {
            console.error("âŒ ERROR CRÃTICO en init():", e);
            this.stateManager.navigate('main_menu');
        }

        // Iniciar mÃºsica si estÃ¡ habilitada
        if (this.synth && this.isMusicOn) {
            this.synth.playMenuMusic();
        }

        console.log("GAME: init() finished, requesting first frame.");
        requestAnimationFrame(t => this.loop(t));
    }

    resize() {
        const container = document.getElementById('game-container');
        if (!container) return;
        
        // El canvas interno mantiene su resoluciÃ³n lÃ³gica para no romper colisiones
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        // El estilo visual se expande a pantalla completa
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.objectFit = 'fill';
    }

    setupInput() {
        // Toda la lÃ³gica de entrada de menÃº ahora se delega a UIManager.js vÃ­a eventos de Mouse.
        // Solo mantenemos controles de acciÃ³n para el gameplay.
        
        this.canvas.onmousedown = (e) => {
            if ((this.state === 'PLAYING' || this.state === 'gameplay') && e.button === 2) {
                this.handleDash();
            }
        };
        this.canvas.oncontextmenu = (e) => e.preventDefault();

        window.onmousedown = (e) => {
            if ((this.state === 'PLAYING' || this.state === 'gameplay' || this.state === 'COUNTDOWN') && e.button === 0) {
                this.frog.jump();
            }
        };

        window.onkeydown = (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }

            if (this.state === 'PLAYING' || this.state === 'gameplay' || this.state === 'COUNTDOWN') {
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.frog.jump();
                if (e.code === 'ShiftLeft' || e.code === 'KeyD' || e.code === 'ArrowRight') this.handleDash();
            }
            else if (['GAMEOVER', 'VICTORY'].includes(this.state)) {
                if (e.code === 'Space' || e.code === 'Enter') {
                    this.retry();
                }
            }
        };

        window.addEventListener('touchstart', (e) => {
            if (this.state !== 'PLAYING' && this.state !== 'gameplay') return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const x = t.clientX - rect.left;
                if (x < rect.width / 2) this.frog.jump();
                else this.handleDash();
            }
        }, { passive: false });

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
        });
        
        window.addEventListener('mousedown', () => {
             this.mouse.down = true;
        });
        
        window.addEventListener('mouseup', () => {
             this.mouse.down = false;
        });
    }

    handleMenuInput(e) {
        if (this.ui) this.ui.handleInput(e);
    }

    // --- MÃ‰TODOS DE COMBATE DE JEFE (Fase 14) ---
    triggerBossEncounter(chapter) {
        if (this.activeBoss) return;
        this.isBossLevel = true;
        this.addTrauma(0.5);
        const bossHp = 3 + (chapter * 2);
        const bossName = this._getBossName(chapter);
        this.activeBoss = new Boss(CANVAS_WIDTH + 200, CANVAS_HEIGHT / 2, bossHp, bossName, null, chapter);
        if (this.ui) this.ui.showBossWarning(bossName);
        if (this.synth) this.synth.playZenAtmosphere();
    }

    _getBossName(ch) {
        const names = ["GARGANTÃšA TÃ“TEM", "SCORPIO DESERT", "ONI-SAMURAI", "HADA DE CRISTAL", "ESPECTRO DEL LODO", "GENERAL MECÃNICO", "PIÃ‘ATA LUCHADORA", "REINA DE HIELO", "NEÃ“N GLITCHER", "CENTINELA ESPACIAL", "LORD LAVA", "VOID WALKER", "ARCÃNGEL RUINAS", "PERFORADOR LUNAR", "COLOSO CRISTALINO", "XANEZU PRIME"];
        return names[ch - 1] || "DESCONOCIDO";
    }

    spawnBossProjectile(x, y, isCatchable) {
        if (!this.activeBoss) return;
        const speed = 7 + (this.chapter * 0.5);
        const p = new BossProjectile(x, y, speed, isCatchable, 'plasma');
        this.entities.push(p);
    }

    shootPlayerProjectile(x, y) {
        const speed = -15; 
        const p = new BossProjectile(x, y, speed, false, 'player_charge');
        p.isPlayerReturn = true; p.w = 80; p.h = 80;
        this.entities.push(p);
    }

    handleDash() {
        if (this.frog.dash()) {
            const dashColor = this.characterTheme?.particleSecondary || this.characterTheme?.particlePrimary || '#18EED8';
            this.shake(6, 200);
            this.particles.spawn(this.frog.x, this.frog.y + this.frog.h / 2, dashColor, 10);
            this.totalDashes++;
            localStorage.setItem('mx_total_dashes', this.totalDashes);
            if (this.frog.vy != 0) {
                this.stats.tempAirDashes++;
                this.stats.maxAirDashes = Math.max(this.stats.maxAirDashes, this.stats.tempAirDashes);
            }
            this.synth.playDashWhoosh();
        }
    }

    async _preloadChapterMusic(chapter) {
        // En modo historia o arcade, intentamos cargar musica especifica del capitulo
        const isStory = this.stateManager?.isStoryMode?.() === true;
        const isArcade = this.stateManager?.isArcadeMode?.() === true;
        if (!isStory && !isArcade) return;

        const config = (isArcade ? ARCADE_CHAPTER_REGISTRY[chapter] : CHAPTER_REGISTRY[chapter]) || CHAPTER_REGISTRY[1];
        if (config.musicMode === 'procedural') return;
        
        const dir = config.assetsDir || '1-selva-tropical';
        const audioBaseName = dir.split('/').pop();

        const candidates = [
            `assets/${dir}/audios/${audioBaseName}.mp3`,
            `assets/${dir}/audios/${audioBaseName}.ogg`,
            `assets/${dir}/audios/${audioBaseName}.wav`,
            `assets/${dir}/audios/music.mp3` // Fallback genÃ©rico
        ];

        return new Promise((resolve) => {
            const tryLoad = (idx) => {
                if (idx >= candidates.length) {
                    console.warn(`ASSETS: No music found for chapter ${chapter}`);
                    resolve();
                    return;
                }

                const audio = new Audio();
                audio.src = candidates[idx];
                audio.preload = 'auto';

                audio.oncanplay = () => {
                    console.log(`ASSETS: Chapter music ready: ${candidates[idx]}`);
                    if (this.assetLoader) {
                        this.assetLoader.sounds[`bg${chapter}`] = audio;
                    }
                    resolve();
                };

                audio.onerror = () => tryLoad(idx + 1);
                audio.load();
            };

            tryLoad(0);
        });
    }

    _updateLoadingProgress(percent, text) {
        this.loadingProgress = percent / 100;
        this.loadingStatus = text;
        console.log(`[Loading] ${percent}% - ${text}`);
    }

    _showLoadingScreen(chapterName = '') {
        this.stateManager.navigate('loading_screen');
        this._updateLoadingProgress(0, `Cargando: ${chapterName}`);
    }

    _hideLoadingScreen() {
        // La pantalla se oculta al cambiar de estado
    }

    _calculateAssetCount(chapter) {
        // Calculate total assets to be loaded for progress tracking
        // Character: 5 sprites
        // Backgrounds: 30 levels x 5 layers = 150
        // Obstacles: 6 types
        // Items: ~25 types
        // Chapter specific: varies
        let count = 5 + 150 + 6 + 25 + 20;
        return count;
    }

    async _preloadBackgrounds(chapter) {
        // Force background rendering to cache
        const ctx = this.canvas.getContext('2d');
        const chKey = `ch${chapter}`;
        const cache = this.assetLoader?.cache[chKey] || {};

        // Pre-render a few background layers
        for (let l = 1; l <= 5; l++) {
            const bgKey = `new_bg_ch${chapter}_l1_fondo_intermedio`;
            if (cache[bgKey]) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.canvas.width;
                tempCanvas.height = this.canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(cache[bgKey], 0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    async _preloadEntityPools() {
        // Pre-warm entity creation by creating invisible instances
        // This ensures all constructors are JIT compiled
        const ctx = this.canvas.getContext('2d');

        // Create hidden canvas for sprite pre-rendering
        const warmupCanvas = document.createElement('canvas');
        warmupCanvas.width = this.canvas.width;
        warmupCanvas.height = this.canvas.height;
        const warmupCtx = warmupCanvas.getContext('2d');

        // Get cache for current chapter
        const chKey = `ch${this.chapter}`;
        const cache = this.assetLoader?.cache?.[chKey] || {};

        // Pre-render ALL sprites to ensure they're in GPU memory
        const allKeys = Object.keys(cache);
        const totalSprites = allKeys.length;

        for (let i = 0; i < allKeys.length; i++) {
            const key = allKeys[i];
            const img = cache[key];
            if (img && img.complete && img.width > 0) {
                try {
                    // Draw at full size to ensure texture is uploaded to GPU
                    warmupCtx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                } catch (e) {
                    // Silent fail for individual sprites
                }
            }
        }

        // Also pre-render to a smaller canvas
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = 200;
        smallCanvas.height = 200;
        const smallCtx = smallCanvas.getContext('2d');

        for (const key of allKeys) {
            const img = cache[key];
            if (img && img.complete && img.width > 0) {
                try {
                    smallCtx.drawImage(img, 0, 0, 200, 200);
                } catch (e) { }
            }
        }

        // Clear canvases
        warmupCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        smallCtx.clearRect(0, 0, 200, 200);
    }

    async _prewarmRendering() {
        // Warm up the main canvas rendering
        const ctx = this.canvas.getContext('2d');

        // Do a few dummy draws to warm up the GPU/texture pipeline
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 10, 10);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, 5, 5);

        // Force texture binding
        ctx.getImageData(0, 0, 1, 1);
    }

    _initializeGameEntities() {
        // Pre-allocate arrays for entities
        if (!this.entities) this.entities = [];
        if (!this.floatingTexts) this.floatingTexts = [];

        // Pre-allocate entity pools if spawn manager exists
        if (this.spawnManager) {
            // Ensure spawn manager is ready
            this.spawnManager.reset();
        }
    }

    async start(chapter = 1, level = 1) {
        // Fallback for invalid chapter
        if (!chapter || isNaN(chapter)) chapter = 1;

        if (!this.isChapterUnlocked(chapter)) {
            console.warn(`Attempted to start locked chapter: ${chapter}`);
            this.achievements.showToast({ title: "Locked!", desc: `Reach higher levels to unlock!`, icon: "ðŸ”’" });
            return;
        }

        console.log(`GAME: Loading Chapter ${chapter}`);
        // Stop menu music immediately when entering chapter flow
        if (this.synth) {
            this.synth.stopArcadeSelectMusic?.();
            this.synth.stopMenuMusic?.();
            if (this.synth.currentMusicSource) {
                this.synth.currentMusicSource.pause();
                this.synth.currentMusicSource.currentTime = 0;
            }
        }
        this.chapter = chapter;
        if (!this.stateManager?.isStoryMode?.()) {
            this.lastPlayedChapter = chapter;
            this._saveAdaptiveProgress();
        }

        const chapterCfg = this.getActiveChapterConfig(this.chapter);
        const isStory = this.stateManager?.isStoryMode?.() === true;
        this.characterFactory.applyTheme(this, chapterCfg);

        // Si ya estÃ¡ "caliente" (procesado en GPU), podemos ir mÃ¡s rÃ¡pido
        const isWarmed = this.warmedChapters.has(chapter);

        // Track max chapter reached
        if (chapter > this.maxChapter) {
            this.maxChapter = chapter;
            localStorage.setItem('mx_max_chapter', chapter);
        }
        
        // Load max level for this specific chapter
        this.maxLevel = parseInt(localStorage.getItem(`mx_ch${this.chapter}_max_level`) || '1');

        this.inTransition = true;
        this.ui.hideAllOverlays();

        // Show loading screen with chapter name
        const chapterName = this.getChapterName ? this.getChapterName(chapter) : `CapÃ­tulo ${chapter}`;
        this._showLoadingScreen(chapterName);

        // Force a delay to ensure loading screen renders
        await new Promise(r => setTimeout(r, 200));

        // Calculate total assets to load for accurate progress
        const totalAssets = this._calculateAssetCount(chapter);

        // ===== FASE 1: INICIALIZACIÃ“N (0-5%) =====
        this._updateLoadingProgress(1, 'Inicializando motores del juego...', {
            assetsLoaded: 0,
            assetsTotal: totalAssets,
            soundsLoaded: 0,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 300));

        this._updateLoadingProgress(3, 'Preparando sistema de renderizado...', {
            assetsLoaded: 1,
            assetsTotal: totalAssets,
            soundsLoaded: 0,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 200));

        this._updateLoadingProgress(5, 'Cargando configuraciÃ³n del capÃ­tulo...', {
            assetsLoaded: 2,
            assetsTotal: totalAssets,
            soundsLoaded: 0,
            soundsTotal: 1
        });

        // ===== FASE 2: MÃšSICA (5-15%) =====
        this._updateLoadingProgress(6, 'Cargando mÃºsica del capÃ­tulo...', {
            assetsLoaded: 2,
            assetsTotal: totalAssets,
            soundsLoaded: 0,
            soundsTotal: 1
        });
        await this._preloadChapterMusic(chapter);

        this._updateLoadingProgress(8, 'Decodificando audio...', {
            assetsLoaded: 3,
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 300));

        this._updateLoadingProgress(10, 'Preparando sistema de sonido...', {
            assetsLoaded: 3,
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        this._updateLoadingProgress(12, 'Configurando efectos de audio...', {
            assetsLoaded: 4,
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        // ===== FASE 3: CARGAR ASSETS VISUALES (15-40%) =====
        this._updateLoadingProgress(15, 'Cargando recursos visuales...', {
            assetsLoaded: 5,
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });

        // Load all chapter assets (this is the main loading)
        const assetPromise = (async () => {
            if (this.assetLoader && typeof this.assetLoader.loadChapterAssets === 'function') {
                // Si es el CapÃ­tulo 1, cargar assets especÃ­ficos del diseÃ±o original
                if (this.chapter === 1 && typeof this.assetLoader.preloadChapter1Full === 'function') {
                    await this.assetLoader.preloadChapter1Full(1);
                }
                await this.assetLoader.loadChapterAssets(this.chapter);
            }
        })();

        // Show intermediate progress while assets load
        await new Promise(r => setTimeout(r, 50));

        this._updateLoadingProgress(20, 'Cargando sprites del personaje...', {
            assetsLoaded: Math.floor(totalAssets * 0.15),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        this._updateLoadingProgress(25, 'Cargando fondos del nivel...', {
            assetsLoaded: Math.floor(totalAssets * 0.2),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });

        await assetPromise; // Wait for all assets to fully load

        this._updateLoadingProgress(35, 'Verificando recursos cargados...', {
            assetsLoaded: Math.floor(totalAssets * 0.35),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        // ===== FASE 4: PROCESAR FONDOS (40-60%) =====
        if (!isWarmed) {
            this._updateLoadingProgress(40, 'Procesando fondos parallax...', {
                assetsLoaded: Math.floor(totalAssets * 0.4),
                assetsTotal: totalAssets,
                soundsLoaded: 1,
                soundsTotal: 1
            });

            // Pre-cache backgrounds - render them to ensure they're in GPU
            await this._preloadBackgrounds(chapter);
        }

        this._updateLoadingProgress(45, 'Cargando capas de profundidad...', {
            assetsLoaded: Math.floor(totalAssets * 0.45),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        this._updateLoadingProgress(50, 'Procesando efectos de atmÃ³sfera...', {
            assetsLoaded: Math.floor(totalAssets * 0.5),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        // ===== FASE 5: OBSTÃCULOS Y OBJETOS (60-75%) =====
        this._updateLoadingProgress(55, 'Cargando obstÃ¡culos...', {
            assetsLoaded: Math.floor(totalAssets * 0.55),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        this._updateLoadingProgress(60, 'Cargando objetos colecionables...', {
            assetsLoaded: Math.floor(totalAssets * 0.6),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        this._updateLoadingProgress(65, 'Cargando power-ups...', {
            assetsLoaded: Math.floor(totalAssets * 0.65),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        this._updateLoadingProgress(70, 'Cargando gemas y recompensas...', {
            assetsLoaded: Math.floor(totalAssets * 0.7),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        // ===== FASE 6: ENTIDADES Y POOLS (75-85%) =====
        if (!isWarmed) {
            this._updateLoadingProgress(75, 'Inicializando entidades del juego...', {
                assetsLoaded: Math.floor(totalAssets * 0.75),
                assetsTotal: totalAssets,
                soundsLoaded: 1,
                soundsTotal: 1
            });

            // Pre-create all entity pools and render all sprites to GPU
            await this._preloadEntityPools();
        }

        this._updateLoadingProgress(80, 'Preparando pool de objetos...', {
            assetsLoaded: Math.floor(totalAssets * 0.8),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        // ===== FASE 7: RENDERIZADO (85-92%) =====
        if (!isWarmed) {
            this._updateLoadingProgress(85, 'Calentando motor de renderizado...', {
                assetsLoaded: Math.floor(totalAssets * 0.85),
                assetsTotal: totalAssets,
                soundsLoaded: 1,
                soundsTotal: 1
            });

            await this._prewarmRendering();

            this._updateLoadingProgress(90, 'Optimizando texturas...', {
                assetsLoaded: Math.floor(totalAssets * 0.9),
                assetsTotal: totalAssets,
                soundsLoaded: 1,
                soundsTotal: 1
            });
            await new Promise(r => setTimeout(r, 50));
        }

        // ===== FASE 8: ÃšLTIMOS PREPARATIVOS (92-100%) =====
        this._updateLoadingProgress(92, 'Configurando nivel...', {
            assetsLoaded: Math.floor(totalAssets * 0.92),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        this._updateLoadingProgress(95, 'Inicializando spawn manager...', {
            assetsLoaded: Math.floor(totalAssets * 0.95),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 200));

        this._updateLoadingProgress(98, 'Preparando efectos de partÃ­culas...', {
            assetsLoaded: Math.floor(totalAssets * 0.98),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 50));

        // Now start the game
        try {
            console.log("GAME: Chapter start sequence completed - ALL ASSETS LOADED");
            Obstacle.clearCache();

            // Pre-initialize all entities that will be needed
            this._initializeGameEntities();

            // Sincronizar StateManager para que la UI despache el renderizado del juego
            this.stateManager.navigate('gameplay');
            
            // RESET UNIFICADO DEL ESTADO DEL JUEGO
            this._resetGameState(level);

            // Marcar este capÃ­tulo como procesado en cachÃ© de GPU
            this.warmedChapters.add(this.chapter);

            // Complete loading progress
            const totalAssets = this._calculateAssetCount(this.chapter);
            this._updateLoadingProgress(100, 'Â¡Listo!', {
                assetsLoaded: totalAssets,
                assetsTotal: totalAssets,
                soundsLoaded: 1,
                soundsTotal: 1,
                memory: 'OK'
            });
            await new Promise(r => setTimeout(r, 50));


            this._hideLoadingScreen();
            this.ui.hideAllOverlays(); // Asegurar que pointer-events sea 'none' para que el clic pase al canvas
            this.ui.updateHUD();

            // ðŸŽ¬ ACTIVAR MODO CINEMATOGRÃFICO AL EMPEZAR
            this.ui.toggleCinematicMode(true);
        } catch (e) {
            console.error("Critical Start Error:", e);
            this._hideLoadingScreen();
            this.state = 'MENU';
            this.ui.showOverlay('menu');
        } finally {
            this.inTransition = false;
        }
    }

    /**
     * REINICIO RÃPIDO (INSTANTÃNEO)
     * Evita recargar assets y pre-renderizado pesado.
     */
    softRetry() {
        console.log("GAME: Soft Retry initiated (Instant)");
        this._resetGameState();
        
        // No mostramos pantalla de carga, vamos directo al gameplay
        this.stateManager.navigate('gameplay');
        this.ui.hideAllOverlays();
        this.ui.toggleCinematicMode(true);
        this.ui.updateHUD();
    }

    /**
     * CENTRALIZACIÃ“N DEL RESET DE ESTADO
     * Unifica la lÃ³gica de start() y softRetry() para evitar inconsistencias.
     */
    _resetGameState(level) {
        this.state = 'COUNTDOWN';
        this.lastT = 0; // Reset crÃ­tico para evitar saltos de tiempo
        this.countdown = { val: 3, timer: 60 };
        
        const chName = this.getChapterName(this.chapter);
        this.chapterTransition = { active: true, timer: 120, name: chName };
        
        this.score = 0;
        this.level = Math.max(1, parseInt(level || this.level) || 1);
        this.entities = [];
        this.floatingTexts = [];
        this.mult = 1;
        this.multT = 0;
        this.frog.reset();
        this.iceT = 0;
        this.bananaStreak = 0;
        this.lives = 1;
        this.extraLifeHearts = 0;
        this.plus50Count = 0;
        this.candyStreak = 0;
        this.flashT = 0;
        this.collectionStreak = 0;
        
        if (this.elephant) this.elephant.active = false;
        if (this.particles) this.particles.reset?.() || (this.particles.particles = []);
        
        this.bgX = 0; 
        if (this.biomeRenderer) this.biomeRenderer.t = 0;
        if (this.weather) this.weather.setChapter(this.chapter);
        
        // Reiniciar mÃºsica si es necesario
        this._resumeChapterMusic();
    }

    returnToMenu() {
        console.log("GAME: Returning to Menu");

        // ðŸŽ¬ DESACTIVAR MODO CINEMATOGRÃFICO
        this.ui.toggleCinematicMode(false);

        this.state = 'MENU';
        document.body.classList.add('in-menu');
        this.isInfinite = false;
        this.score = 0; this.entities = []; this.floatingTexts = [];
        if (this.synth) {
            this.synth.stopArcadeSelectMusic?.();
            this.synth.stopProcedural();
            if (this.isMusicOn) this.synth.playMenuMusic();
            else this.synth.stopMenuMusic?.();
        }
        Object.keys(this.sounds).forEach(k => { if (k.startsWith('bg')) { this.sounds[k].pause(); this.sounds[k].currentTime = 0; } });
        this.ui.showOverlay('menu');
    }

    setSkin(skinId) {
        if (!SKINS[skinId]) return;
        
        // Verificar si la skin estÃ¡ desbloqueada por rango
        const skin = SKINS[skinId];
        if (this.ranks.level < skin.reqLevel) {
            console.warn(`[SkinSystem] Skin ${skinId} bloqueada. Requiere Nivel ${skin.reqLevel}`);
            return false;
        }

        this.activeSkinId = skinId;
        this.activeSkin = skin;
        localStorage.setItem('mx_active_skin', skinId);
        
        console.log(`[SkinSystem] Skin cambiada a: ${skin.name}`);
        
        // Efecto de sonido si existe
        if (this.synth) this.synth.playBtnClick();
        
        return true;
    }

    getChapterName(ch) {
        const cfg = this.getActiveChapterConfig(ch);
        return cfg ? cfg.name : `CHAPTER ${ch}`;
    }

    showShop() {
        this.state = 'SHOP';
        this.menuIndex = 0;
        this.ui.showOverlay('shop');
        this.ui.updateShopUI();
    }

    showTrophies() {
        this.state = 'TROPHIES';
        this.menuIndex = 0;
        this.ui.showOverlay('trophy');
    }

    showSettings() {
        this.state = 'SETTINGS';
        this.menuIndex = 0;
        this.ui.showOverlay('settings');
    }

    startInfinite() {
        this.isInfinite = true;
        this.stateManager.setMode('STORY');
        const totalChapters = Object.keys(CHAPTER_REGISTRY).length;
        const randomChapter = Math.floor(Math.random() * totalChapters) + 1;
        this.start(randomChapter);
    }

    retry() {
        this.softRetry();
    }

    softRetry() {
        console.log('GAME: Soft retry - instant restart without loading');

        const chapter = this.chapter;

        this.score = 0;
        this.level = 1;
        this.entities = [];
        this.floatingTexts = [];
        this.lives = 1;
        this.extraLifeHearts = 0;
        this.bananaCombo = 0;
        this.bombCombo = 0;
        this.brunoActive = false;
        this.brunoBananas = 0;

        this.frog.reset();
        this.frog.x = CANVAS_WIDTH * 0.2;
        this.frog.y = CANVAS_HEIGHT / 2;

        if (this.elephant) {
            this.elephant.active = false;
            this.elephant.timer = 0;
            this.elephant.bullets = [];
        }

        this.bgX = 0;
        if (this.biomeRenderer) this.biomeRenderer.t = 0;

        this.plus50Count = 0;

        this.particles.clear();

        this.state = 'PLAYING';
        this.ui.hideAllOverlays();
        this.ui.updateHUD();

        // ðŸŽ¬ ACTIVAR MODO CINEMATOGRÃFICO EN REINTENTO
        this.ui.toggleCinematicMode(true);

        this.lastT = 0;

        console.log('GAME: Soft retry complete');
    }

    goToStory() {
        this.stateManager.setMode('STORY');
        this._openChapterSelect();
    }

    _openChapterSelect() {
        console.log("GAME: Navigating to Chapter Select");
        this.state = 'CHAPTER_SELECT';
        this.menuIndex = 0;
        this.ui.chapterPage = 0;
        this.ui.initChapterGrid();
        this.ui.showOverlay('chapter');
        this.ui.updateChaptersUI();

        if (this.synth) {
            if (!this.isMusicOn) {
                this.synth.stopArcadeSelectMusic?.();
                this.synth.stopMenuMusic?.();
            } else if (this.stateManager?.isArcadeMode?.()) {
                this.synth.startArcadeSelectMusic?.();
            } else {
                this.synth.stopArcadeSelectMusic?.();
                this.synth.playMenuMusic?.();
            }
        }
    }

    startArcadeMode() {
        this.stateManager.setMode('ARCADE');
        this._activateAdaptiveMode('ARCADE');
        this._openChapterSelect();
    }

    startABLMode() {
        this.stateManager.setMode('ABL');
        this._activateAdaptiveMode('ABL');
        this._openChapterSelect();
    }

    _getAdaptiveRegistry(mode = 'ARCADE') {
        return mode === 'ABL' ? ABL_CHAPTER_REGISTRY : ARCADE_CHAPTER_REGISTRY;
    }

    _getProgressForMode(mode = 'ARCADE') {
        return mode === 'ABL' ? this.ablProgress : this.arcadeProgress;
    }

    _setProgressForMode(mode, progress) {
        if (mode === 'ABL') this.ablProgress = progress;
        else this.arcadeProgress = progress;
    }

    _activateAdaptiveMode(mode = 'ARCADE') {
        this.activeAdaptiveMode = mode;
        const reg = this._getAdaptiveRegistry(mode);
        this.chapterManager = new ChapterManager(reg);
        this.unlockSystem = new UnlockSystem(this.chapterManager);

        const progress = this._getProgressForMode(mode);
        const normalized = {
            scoreGlobal: progress?.scoreGlobal || 0,
            unlockedChapters: (progress?.unlockedChapters && progress.unlockedChapters.length)
                ? progress.unlockedChapters
                : (mode === 'ARCADE' ? [1] : this.unlockSystem.getUnlockedChapters(progress?.scoreGlobal || 0)),
            lastPlayedChapter: progress?.lastPlayedChapter || 1,
        };

        this._setProgressForMode(mode, normalized);
        this.scoreGlobal = normalized.scoreGlobal;
        this.unlockedChapters = normalized.unlockedChapters;
        this.lastPlayedChapter = normalized.lastPlayedChapter;
        this.scoreSystem = new ScoreSystem(this.scoreGlobal);
    }

    getActiveRegistry() {
        if (!this.stateManager) return CHAPTER_REGISTRY;
        if (this.stateManager.isStoryMode()) return CHAPTER_REGISTRY;
        if (this.stateManager.isABLMode()) return ABL_CHAPTER_REGISTRY;
        return ARCADE_CHAPTER_REGISTRY;
    }

    getActiveChapterConfig(ch) {
        const reg = this.getActiveRegistry();
        return reg[ch] || reg[1] || CHAPTER_REGISTRY[1];
    }

    getActiveUnlockedChapters() {
        const storyMode = this.stateManager?.isStoryMode?.() === true;
        if (storyMode) {
            return Object.keys(CHAPTER_REGISTRY).map(Number);
        }
        return this.unlockedChapters || [1];
    }

    isChapterUnlocked(chapter) {
        // En modo historia, todos los capÃ­tulos estÃ¡n desbloqueados por peticiÃ³n del usuario
        if (this.stateManager?.isStoryMode?.()) return true;
        return this.getActiveUnlockedChapters().includes(chapter);
    }

    /**
     * Calculates the score target for the current level.
     * @param {number} lvl 
     * @returns {number}
     */
    getLevelTarget(lvl) {
        return this.levelManager.getLevelTarget(lvl);
    }

    _getStoryDifficultyParams(level) {
        const lvl = Math.max(1, Math.floor(level || 1));

        // New story curve:
        // Level 30 should match the old "Level 6" intensity.
        // We map 1..30 -> legacy equivalent 1.5..6 with a smooth early-friendly easing.
        const maxLevel = 30;
        const legacyMaxRef = 6;
        const legacyMinRef = 1.5; // Empezamos en 1.5 en lugar de 1.0 para mayor dinamismo
        const t = Math.max(0, Math.min(1, (lvl - 1) / (maxLevel - 1)));
        const eased = Math.pow(t, 1.25); // Un poco mas lineal

        const legacyEquivalent = legacyMinRef + ((legacyMaxRef - legacyMinRef) * eased);
        const speedMult = 1 + ((legacyEquivalent - 1) * 0.1);

        // Spawn pacing follows the same smooth ramp.
        // At L1 spawn pressure is higher (0.88 instead of 0.72)
        const spawnEase = 0.88 + (0.12 * eased);

        return { speedMult, spawnEase, legacyEquivalent };
    }

    _getAdaptiveDifficultyParams(level, chapterCfg) {
        const lvl = Math.max(1, Math.floor(level || 1));
        const maxLevel = Math.max(1, Number(chapterCfg?.maxLevel || 10));
        const t = Math.max(0, Math.min(1, (lvl - 1) / Math.max(1, maxLevel - 1)));
        const eased = Math.pow(t, 1.2);
        const isABL = this.stateManager?.isABLMode?.() === true;
        const base = Number(chapterCfg?.baseSpeed || 1.0);

        if (isABL) {
            return {
                speedMult: base + (eased * 0.95),
                spawnEase: 0.88 + (0.5 * eased),
                gateChance: 0.1 + (0.16 * eased),
                movingChance: 0.08 + (0.12 * eased),
                obstacleScale: 1.0 + (0.1 * eased)
            };
        }

        return {
            speedMult: base + (eased * 0.8),
            spawnEase: 0.94 + (0.38 * eased),
            gateChance: 0.06 + (0.12 * eased),
            movingChance: 0.05 + (0.08 * eased),
            obstacleScale: 0.96 + (0.08 * eased)
        };
    }

    _saveAdaptiveProgress() {
        const mode = this.stateManager?.isABLMode?.() ? 'ABL' : 'ARCADE';
        const progress = {
            scoreGlobal: this.scoreGlobal,
            unlockedChapters: this.unlockedChapters,
            lastPlayedChapter: this.lastPlayedChapter || 1,
        };
        this._setProgressForMode(mode, progress);
        this.saveSystem.saveModeProgress(mode.toLowerCase(), progress);
    }

    _refreshProjectedUnlocks(projectedTotal, notify = false) {
        if (this.stateManager?.isStoryMode?.()) return;

        const isArcade = this.stateManager?.isArcadeMode?.();
        const oldUnlocked = new Set(this.unlockedChapters || [1]);

        let nextUnlocked;
        if (isArcade) {
            // LÃ³gica Secuencial Arcade: Comprobamos el capÃ­tulo actual contra el siguiente
            nextUnlocked = this.unlockSystem.getArcadeUnlocks(
                this.unlockedChapters || [1],
                this.chapter,
                this.score
            );
        } else {
            // LÃ³gica Global (ABL/Legacy): Basada en puntuaciÃ³n total acumulada
            nextUnlocked = this.unlockSystem.getUnlockedChapters(projectedTotal);
        }

        const changed = nextUnlocked.length !== oldUnlocked.size;
        this.unlockedChapters = nextUnlocked;
        if (changed) {
            this._saveAdaptiveProgress();
            // Si es arcade, actualizamos la lista global de progreso
            if (isArcade) this.arcadeProgress.unlockedChapters = nextUnlocked;
        }

        const newlyUnlocked = nextUnlocked.filter((id) => !oldUnlocked.has(id));
        if (notify && newlyUnlocked.length) {
            const latestId = newlyUnlocked[newlyUnlocked.length - 1];
            const chapterCfg = this.getActiveRegistry()[latestId];
            this.achievements?.showToast?.({
                title: 'Chapter Unlocked!',
                desc: `${chapterCfg?.name || `Capitulo ${latestId}`}`,
                icon: chapterCfg?.icon || 'ðŸ”“',
            });
            this.proceduralMusic?.playUnlockEvent?.();
        }
        if (newlyUnlocked.length) this.ui?.updateChaptersUI?.();
    }

    loop(t) {
        if (!this.firstFrameTime) console.log("GAME: First loop frame reached.");
        if (!this.lastT) this.lastT = t;
        const dt_ms = Math.min(t - this.lastT, 60); // Milliseconds since last frame, capped at 60ms
        this.lastT = t;

        // Convert dt_ms to a normalized dt where 1.0 = 16.67ms (60fps)
        let dt = dt_ms / 16.67;

        // GestiÃ³n de Clics: Detectar el momento exacto en que se presiona
        this.mouse.justDown = this.mouse.down && !this.mouse.wasDown;
        this.mouse.wasDown = this.mouse.down;

        // GestiÃ³n de TimeScale (Fase 7)
        if (this.bulletTimeT > 0) {
            this.bulletTimeT -= 1;
            this.timeScale = 0.4;
        } else {
            this.timeScale = 1.0;
        }

        if (this.nearMissT > 0) { dt *= 0.2; this.nearMissT--; if (this.nearMissT <= 0) this.inNearMiss = false; }
        
        // Aplicar Bullet Time al dt base
        dt *= this.timeScale;

        // Final safety guard for dt
        const finalDt = (Number.isFinite(dt) && dt > 0) ? dt : 1.0;
        this.lastDt = finalDt; // Almacenamos para el renderizador

        try {
            const isMenu = this.stateManager.isMainMenu() || this.state === 'mode_select' || this.state === 'settings_menu';
            if (isMenu) this.updateMenuParticles(finalDt);
            this.update(finalDt, 16.67 * finalDt);
            this.draw();
        } catch (e) {
            console.error("Loop Error:", e);
        }
        requestAnimationFrame(t => this.loop(t));
    }

    update(dt, ms) {
        const safeDt = Number.isFinite(dt) ? dt : 1.0;
        if (this.chapterTransition?.active) { this.chapterTransition.timer -= safeDt; if (this.chapterTransition.timer <= 0) this.chapterTransition.active = false; }
        const activeCfg = this.getActiveChapterConfig(this.chapter);
        const isStoryMode = this.stateManager?.isStoryMode?.() === true;
        let speedMult = this.levelManager.getSpeedMultiplier(activeCfg, this.level);
        let spawnEase = 1.0;
        let gateChance = 0.08;
        let movingChance = 0.05;
        let obstacleScale = 1.0;
        if (isStoryMode) {
            const storyParams = this._getStoryDifficultyParams(this.level);
            speedMult = storyParams.speedMult;
            spawnEase = storyParams.spawnEase;
        } else {
            const adaptiveParams = this._getAdaptiveDifficultyParams(this.level, activeCfg);
            speedMult = adaptiveParams.speedMult;
            spawnEase = adaptiveParams.spawnEase;
            gateChance = adaptiveParams.gateChance;
            movingChance = adaptiveParams.movingChance;
            obstacleScale = adaptiveParams.obstacleScale;
        }
        this.runtimeDifficulty = { speedMult, spawnEase, gateChance, movingChance, obstacleScale };
        const isPlaying = this.state === 'gameplay' || this.state === 'PLAYING';
        const bgSpeedFactor = (isPlaying && this.frog.slowT > 0) ? 0.5 : 1.0;
        
        // --- Aplicar Velocidad x3 en Modo Historia ---
        const finalBgMultiplier = isStoryMode ? (2.5 * this.storySpeedFactor) : 2.5;
        this.bgX = (this.bgX - finalBgMultiplier * safeDt * bgSpeedFactor * speedMult);

        if (this.state === 'COUNTDOWN') {
            this.countdown.timer -= safeDt;
            if (this.countdown.timer <= 0) {
                this.countdown.val--; this.countdown.timer = 60;
                if (this.countdown.val < 0) { this.state = 'PLAYING'; delete this.countdown; }
                else { this.synth.playCollect(0); }
            }
            // Allow frog and background to move during countdown for feeling of "alive"
            this.frog.update(safeDt);
            return;
        }

        if (this.state === 'main_menu' && Math.random() > 0.92) {
            const menuColors = [
                this.characterTheme?.particlePrimary || '#A6F616',
                this.characterTheme?.particleSecondary || '#18EED8'
            ];
            this.particles.spawn(CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, menuColors[Math.floor(Math.random() * menuColors.length)], 1);
        }

        if (this.state === 'gameplay' || this.state === 'PLAYING') {
            this.totalTimePlayed++;
            if (this.totalTimePlayed % 600 === 0) localStorage.setItem('mx_total_time', this.totalTimePlayed);



            // Heartbeat on low health
            if (this.lives === 1 && Math.random() > 0.985) {
                if (this.synth) this.synth.playTone(60, this.synth.ctx.currentTime, { type: 'sine', dur: 0.1, vol: 0.3 });
            }

            if (/enchanted|crystal|ice/.test(activeBiome) && Math.random() > 0.85) {
                this.particles.spawn(
                    Math.random() * CANVAS_WIDTH,
                    CANVAS_HEIGHT,
                    this.characterTheme?.particleSecondary || this.characterTheme?.particlePrimary || '#88CCFF',
                    1
                );
            }

            // Decay de Juice UI (Fase 7)
            if (this.ui.hudJuice) {
                this.ui.hudJuice.banana *= 0.92;
                this.ui.hudJuice.bomb *= 0.92;
                this.ui.hudJuice.score *= 0.92;
            }
        }

        // --- CÃ¡mara AAA: ActualizaciÃ³n de Trauma ---
        if (this.camTrauma > 0) {
            this.camTrauma = Math.max(0, this.camTrauma - 0.02 * dt);
            const shake = Math.pow(this.camTrauma, 2);
            this.camShakeAngle = (Math.random() - 0.5) * 0.1 * shake;
            this.camOffsetX = (Math.random() - 0.5) * 20 * shake;
            this.camOffsetY = (Math.random() - 0.5) * 20 * shake;
        } else {
            this.camOffsetX = 0;
            this.camOffsetY = 0;
            this.camShakeAngle = 0;
        }

        this.weather.update(dt);
        this.particles.update(dt);
        if (this.state !== 'PLAYING') return;

        let timeScale = 1.0;
        this.inNearMiss = false;
        this.entities.forEach(e => {
            if (e instanceof Obstacle && !e.dead) {
                const dx = (this.frog.x + this.frog.w / 2) - (e.x + e.w / 2), dy = (this.frog.y + this.frog.h / 2) - (e.y + e.h / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 85 && dist > 40) {
                    this.inNearMiss = true; timeScale = 0.35;
                    if (!e.dodged) {
                        const dodgeColor = this.characterTheme?.particleSecondary || '#0FF';
                        e.dodged = true;
                        this.score += 100;
                        this.floatingTexts.push(new FloatingText(e.x, e.y - 20, "PERFECT DODGE +100", dodgeColor));
                        this.synth.playCollect(2);
                    }
                }
            }
        });

        const effDt = dt * bgSpeedFactor * timeScale;
        const effMs = ms * bgSpeedFactor * timeScale;
        this.frog.update(effDt);

        const baseMultiplier = isStoryMode ? 7.5 : 5.8;
        const baseSpeed = baseMultiplier * speedMult * bgSpeedFactor * timeScale;
        const spawnTempo = Math.max(0.6, speedMult * spawnEase);

        if (this.iceT > 0) this.iceT -= dt;
        if (this.frog.rainbowT > 0) this.score += 0.2 * dt;

        if (this.iceT <= 0 && (this.spawnT.obs += effMs) > 1150 / spawnTempo) { this.spawn.spawnObs(baseSpeed); this.spawnT.obs = 0; }
        if ((this.spawnT.fly += effMs) > (1000 / spawnTempo)) { this.spawn.spawnFly(baseSpeed * 1.2); this.spawnT.fly = 0; }
        if ((this.spawnT.power += effMs) > 1500) { this.spawn.handleSpawning(baseSpeed); this.spawnT.power = 0; }

        if (this.elephant?.active) this.elephant.update(effDt, this.entities);
        this.achievements.check();
        this.milestones.update();
        this.updateDailyChallenge();

        if (this.level > 5 && (this.spawnT.art += effMs) > 25000) { this.entities.push(new LevelArtifact(CANVAS_WIDTH, Math.random() * (CANVAS_HEIGHT - 100) + 50, this.level, baseSpeed)); this.spawnT.art = 0; }
        if (this.multT > 0) { this.multT -= effDt; if (this.multT <= 0) { this.mult = 1; this.ui.updateHUD(); } else this.ui.updateHUD(); }

        if (this.activeBoss) {
            this.activeBoss.update(effDt, this);
            if (this.activeBoss.dead) {
                // --- SECUENCIA DE VICTORIA (Fase 14-Premium) ---
                this.addTrauma(1.0); // Sacudida mÃ¡xima
                this.playSound('victory'); 
                this.particles.spawn(this.activeBoss.x, this.activeBoss.y, '#FFD700', 50, 'star');
                
                // Limpiar proyectiles residuales del combate
                this.entities = this.entities.filter(e => !(e instanceof BossProjectile));
                
                this.activeBoss = null;
                this.isBossLevel = false;
                this.levelUp(); // Victoria al jefe = Subir de nivel / Ganar capitulo
            }
        }

        const fBounds = this.frog.getBounds();
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const e = this.entities[i];
            
            // Lógica de Proyectiles de Jefe
            if (e instanceof BossProjectile) {
                e.update(effDt);
                
                // Colisión con el Jugador
                if (this.collide(fBounds, e.getBounds())) {
                    if (e.isCatchable) {
                        this.frog.hasBossProjectile = true;
                        if (this.synth) this.synth.playCollect(1);
                        this.entities.splice(i, 1);
                        continue;
                    } else if (!e.isPlayerReturn) {
                        // Impacto dañino si no es devuelto y no es capturable
                        this.triggerDamage();
                        this.entities.splice(i, 1);
                        continue;
                    }
                }
                
                // Colisión de Proyectil Devuelto con el Jefe
                if (e.isPlayerReturn && this.activeBoss) {
                    if (this.collide(e.getBounds(), this.activeBoss.getBounds())) {
                        this.activeBoss.takeDamage(1);
                        this.addTrauma(0.4);
                        if (this.synth) this.synth.playBtnHover(); //Feedback acústico
                        this.entities.splice(i, 1);
                        continue;
                    }
                }
            } else {
                // Actualización de entidades normales (Fly, Obstacle)
                if (!(this.iceT > 0 && e instanceof Obstacle)) { 
                    if (e instanceof Fly) e.update(effDt, this.frog); 
                    else e.update(effDt); 
                }
            }

            // Comprobación de límites (Out of Bounds) para todas las entidades
            if (e.x + e.w < -100 || e.x > CANVAS_WIDTH + 800) {
                this.entities.splice(i, 1);
                continue;
            }

            // Colisión General
            if (this.collide(fBounds, e.getBounds())) {
                this.handleCollision(e, i);
            }
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) { 
            this.floatingTexts[i].update(effDt); 
            if (this.floatingTexts[i].dead) this.floatingTexts.splice(i, 1); 
        }

        if (this.camTrauma > 0) { 
            this.camTrauma = Math.max(0, this.camTrauma - 0.02 * dt); 
        }

        // --- GESTIÓN DE LOGROS E HITOS (Procesamiento Lógico) ---
        if (this.achievements) this.achievements.processQueue();
        if (this.milestones) this.milestones.update();

        if (this.feverT > 0) {
            this.feverT -= dt;
            if (this.particles && Math.random() > 0.7) {
                const feverPalette = [
                    this.characterTheme?.particlePrimary || '#FF00FF',
                    this.characterTheme?.particleSecondary || '#00FFFF',
                    '#FFFF00',
                    '#FF1493'
                ];
                const feverColor = feverPalette[Math.floor(Math.random() * feverPalette.length)];
                this.particles.spawn(Math.random() * CANVAS_WIDTH, -20, feverColor, 1, 'star');
            }
        }
        if (!this.stateManager?.isStoryMode?.()) {
            this._refreshProjectedUnlocks(this.scoreSystem.getProjectedTotal(this.score), false);
        }
        if (this.score >= this.getLevelTarget(this.level)) this.levelUp();

        // Mantener HUD sincronizado (Barra de progreso, etc)
        this.ui.updateHUD();
    } // <-- Este cierra el metodo update() correctamente

    handleCollision(e, i) {
        if (e instanceof Obstacle) {
            if (this.frog.dashT > 0) {
                const smashColor = this.characterTheme?.particleSecondary || '#FF4500';
                this.score += 50 * this.mult;
                this.floatingTexts.push(new FloatingText(e.x, e.y, "SMASH!", smashColor, 35, 'shake'));
                this.addTrauma(0.35); 
                this.playSound('hit');

                // Art Director Phase 3: Thematic Burst Expansion
                const config = this.getActiveChapterConfig(this.chapter);
                this.particles.createThematicBurst(
                    e.x + e.w / 2,
                    e.y + e.h / 2,
                    config.colors || ['#FFF', '#444'],
                    config.ambient || 'default'
                );

                this.addXP(30); // Recompensa por destrucciÃ³n
                this.entities.splice(i, 1);
            }
            else if (this.frog.shieldActive) {
                this.frog.shieldActive = false;
                this.frog.shieldHitT = 60;
                this.triggerDamage();
                this.playSound('hit');
                this.entities.splice(i, 1);
            }
            else if (!(this.frog.ghostT > 0 || this.frog.shieldHitT > 0)) {
                this.lives--;
                this.ui.updateHUD();

                if (this.lives > 0) {
                    // AAA Life Loss Feedback
                    const damageColor = this.characterTheme?.particleSecondary || '#FF4444';
                    this.frog.shieldHitT = 120; // 2 seconds of invincibility
                    this.triggerDamage();
                    this.addTrauma(0.65); // Impacto crÃ­tico
                this.playSound('hit');
                    this.triggerFlash('#FF0000', 10);
                    this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 20, "LIFE LOST!", damageColor, 40, 'shake'));
                    this.entities.splice(i, 1); // Remove the obstacle that hit us
                } else {
                    this.gameOver();
                }
            }
        } else {
            this.processCollectable(e, i);
        }
    }

    processCollectable(e, i) {
        const finalPts = (e.pts || 0) * this.mult;
        this.score += finalPts; this.frog.isCatching = true; this.frog.catchT = 20;

        // AAA Audio: Progresive combo sound
        if (this.synth) this.synth.playCollect(this.collectionStreak);

        this.totalItemsCaught++;
        let col = '#fff';
        let animType = 'float';
        let textSize = 22;

        if (e instanceof Candy) {
            if (e.type === 'green') {
                this.candyStreak++;
                if (this.candyStreak >= 5) {
                    const frenzyColor = this.characterTheme?.particlePrimary || '#32CD32';
                    this.candyStreak = 0;
                    this.stats.combosInCurrentLife.cowboy = true;
                    this.elephant.activate(300);
                    this.triggerFlash(frenzyColor);
                    this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 50, "CANDY FRENZY!", frenzyColor, 40, 'pop'));
                    if (this.synth) this.synth.playCombo(10);
                }
            }
            col = '#32CD32';
        } else if (e instanceof Fly) {
            if (e.type === 'bomb') {
                this.bombCombo++;
                if (this.bombCombo >= 5) {
                    this.triggerBombExplosion();
                    this.bulletTimeT = 45; // Explosion SLOW-MO
                }
                this.ui.hudJuice.bomb = 1.0;
                col = '#FF4500';
                animType = 'shake';
            } else if (e.type === 'heart') {
                this.extraLifeHearts++;
                if (this.extraLifeHearts >= 10) {
                    const extraLifeColor = this.characterTheme?.particlePrimary || '#00FF00';
                    this.lives++;
                    this.triggerFlash(extraLifeColor);
                    this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 50, "Â¡VIDA EXTRA!", "#00FF00", 42, 'pop'));
                    if (this.synth) this.synth.playAchievementFanfare();
                }
                col = '#FF4444';
            } else if (e.type === 'banana' || e.type === 'gold') {
                this.bananaCombo++;
                if (this.bananaCombo >= 5) {
                    this.activateBananaCombo();
                    this.bulletTimeT = 45; // Combo SLOW-MO
                }
                this.ui.hudJuice.banana = 1.0;
                col = e.type === 'gold' ? '#FFD700' : '#FFE135';
            }
        } else if (e instanceof PowerUp) {
            this.handlePowerUp(e);
            col = '#0FF';
            animType = 'pop';
            textSize = 30;
        }

        let floatString = `+${finalPts}`;
        if (finalPts === 0 && e.type) {
            floatString = `${e.type.toUpperCase()}!`;
        }

        // --- PERFECT CATCH SYSTEM (Fase 7) ---
        const frogCenterY = this.frog.y + this.frog.h / 2;
        const itemCenterY = e.y + e.h / 2;
        const distY = Math.abs(frogCenterY - itemCenterY);
        const isPerfect = distY < 18; 

        if (isPerfect) {
            this.score += 250 * this.mult;
            this.addTrauma(0.35);
            this.bulletTimeT = 12; 
            this.floatingTexts.push(new FloatingText(e.x, e.y - 40, "PERFECT!", "#FFD700", 35, 'pop'));
            this.particles.spawn(e.x, e.y, "#FFD700", 20, 'star');
            if (this.synth) this.synth.playBtnClick(); 
            this.addXP(50); // Recompensa Perfecta
        } else {
            this.addXP(10); // Recompensa base
        }

        this.floatingTexts.push(new FloatingText(e.x, e.y, floatString, col, textSize, animType));
        this.particles.spawn(e.x, e.y, col, 15);
        this.entities.splice(i, 1);

        // Actualizar HUD antes de resetear combos para que se vea el estado "lleno"
        this.ui.updateHUD(finalPts);

        // Reseteo diferido de combos tras actualizaciÃ³n visual
        if (this.bananaCombo >= 5) this.bananaCombo = 0;
        if (this.bombCombo >= 5) this.bombCombo = 0;
        if (this.extraLifeHearts >= 10) this.extraLifeHearts = 0;

        this.collectionStreak++;

        // Intensity update
        if (this.synth) this.synth.updateIntensity(this.collectionStreak);

        if (this.collectionStreak === 30) this.triggerFever();
    }

    activateBananaCombo() {
        const comboColor = this.characterTheme?.particlePrimary || '#FFE135';
        const bonusScore = 1000 * Math.max(1, this.mult || 1);
        this.score += bonusScore;
        this.frog.magnetT = Math.max(this.frog.magnetT || 0, 420);
        this.frog.speedBoostT = Math.max(this.frog.speedBoostT || 0, 240);
        this.triggerFlash(comboColor);
        this.addTrauma(0.25); // Feedback de explosiÃ³n de frutas
        this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 50, "BANANA BLAST!", comboColor, 42, 'pop'));
        this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 92, `+${bonusScore}`, this.characterTheme?.particleSecondary || "#FFF3A3", 30, 'float'));
        this.particles.spawn(this.frog.x + this.frog.w / 2, this.frog.y + this.frog.h / 2, comboColor, 25);
        if (this.synth) this.synth.playCombo(5);
        this.ui.updateHUD(bonusScore);
    }

    handlePowerUp(p) {
        const cx = p.x + 45;
        const activeCfg = this.getActiveChapterConfig(this.chapter);
        const primaryFx = this.characterTheme?.particlePrimary || activeCfg?.colors?.[0] || '#FFD700';
        const secondaryFx = this.characterTheme?.particleSecondary || activeCfg?.colors?.[1] || '#00BFFF';
        const accentFx = activeCfg?.colors?.[2] || primaryFx;
        if (p.type === 'hourglass') {
            if (this.mult >= 2) { this.mult = 4; this.multT = 3600; }
            else { this.mult = 2; this.multT = 1800; }
            if (this.mult > this.maxMult) {
                this.maxMult = this.mult;
                localStorage.setItem('mx_max_mult', this.mult);
            }
        }
        else if (p.type === 'magnet') { this.frog.magnetT = 600 + (this.unlocks.magnet || 0) * 120; }
        else if (p.type === 'shield') { this.frog.shieldActive = true; this.frog.shieldT = 300 + (this.unlocks.shield || 0) * 60; }
        else if (p.type === 'star') { this.shake(20, 500); this.clearObs(); }
        else if (p.type === 'clock') { this.frog.slowT = 300; }
        else if (p.type === 'ghost') { this.frog.ghostT = 240; }
        else if (p.type === 'bolt') { this.frog.infiniteDashT = 300; }
        else if (p.type === 'ice') { this.iceT = 240; }
        else if (p.type === 'clover') { this.frog.cloverT = 600; }
        else if (p.type === 'rainbow') { this.frog.rainbowT = 300; }
        else if (p.type === 'golden_heart') {
            // Gema de Vida - Ultra rare: +1 vida instantly
            if (this.lives < 10) {
                this.lives++;
                this.triggerFlash(primaryFx);
                this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 50, "+1 VIDA!", primaryFx, 40, 'pop'));
                if (this.synth) this.synth.playUnlock();
            } else {
                this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 50, "Â¡MAX!", primaryFx, 35, 'pop'));
            }
        }
        // ===== CHAPTER 8 SPECIAL POWER-UPS =====
        else if (p.type === 'firework') {
            // Pirotecnia caliente - Massive score burst + screen clear
            this.shake(30, 800);
            this.clearObs();
            this.score += 500;
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "ðŸŽ† +500!", primaryFx, 40, 'pop'));
            // Firework particles
            for (let i = 0; i < 30; i++) {
                this.particles.spawn(this.frog.x, this.frog.y, [primaryFx, secondaryFx, accentFx][Math.floor(Math.random() * 3)], 5, 'spark');
            }
        }
        else if (p.type === 'winter_sun') {
            // Sol de invierno - Warmth clears ice, gives speed + invincibility
            this.frog.shieldActive = true;
            this.frog.shieldT = 600;
            this.iceT = 0; // Clear ice
            this.frog.speedBoostT = 300;
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "â˜€ï¸ SOL!", primaryFx, 35, 'pop'));
        }
        else if (p.type === 'ski') {
            // EsquÃ­s - Massive speed boost
            this.frog.speedBoostT = 480;
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "â›·ï¸ VELOCIDAD!", secondaryFx, 35, 'pop'));
        }
        else if (p.type === 'thermal_suit') {
            // Traje tÃ©rmico - Full invulnerability + bonus points over time
            this.frog.shieldActive = true;
            this.frog.shieldT = 600;
            this.frog.thermalT = 600;
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "ðŸ§¥ CALOR!", accentFx, 35, 'pop'));
        }
        else if (p.type === 'ice_warm') {
            // Warmth counter - clear ice, get points
            this.iceT = 0;
            this.score += 200;
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "ðŸ”¥ +200", accentFx, 35, 'pop'));
        }
        else if (p.type === 'aurora') {
            // Aurora borealis - Bonus points + temporary score multiplier
            this.score += 300;
            if (this.mult < 3) {
                this.mult = 3;
                this.multT = 300;
            }
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "ðŸŒŒ +300 x3", secondaryFx, 40, 'pop'));
        }
        this.ui.updateHUD();
    }

    clearObs() {
        const obstaclesToDestroy = this.entities.filter(e => e instanceof Obstacle && !e.dead);
        obstaclesToDestroy.forEach(e => this.destroyObstacle(e, false));
    }
    triggerEvent(type) {
        this.activeEvent = type;
        this.eventT = 600; // 10 seconds
        this.achievements.showToast({ title: "EVENT START!", desc: type, icon: "ðŸ”¥" });
    }

    levelUp() {
        const oldChapter = this.chapter;
        const chapterCfg = this.getActiveChapterConfig(this.chapter);
        const maxLevel = this.levelManager.getMaxLevel(chapterCfg);
        const oldSubLevel = ((this.level - 1) % maxLevel) + 1;
        this.level++;
        this.addXP(350); // Recompensa por nivel superado

        // Limite absoluto de niveles por capÃ­tulo (30) para todos los modos de capÃ­tulos
        if (this.level > maxLevel) {
            this.chapterVictory();
            return;
        }

        // Track max level reached
        if (this.level > this.maxLevel) {
            this.maxLevel = this.level;
            localStorage.setItem('mx_max_level', this.level);
            // Save max level reached for this specific chapter
            localStorage.setItem(`mx_ch${this.chapter}_max_level`, this.level);
        }

        // Keep the same chapter, just loop the sub-levels (backgrounds)
        const newChapter = this.chapter;
        const newSubLevel = ((this.level - 1) % maxLevel) + 1;

        console.log(`GAME: Level Up to ${this.level}, transitioning: CH ${oldChapter} L${oldSubLevel} -> CH ${newChapter} L${newSubLevel}`);

        this.levelStartScore = this.score;

        // Start visual transition in renderer
        if (this.biomeRenderer) {
            this.biomeRenderer.startTransition(
                { chapter: oldChapter, subLevel: oldSubLevel },
                { chapter: newChapter, subLevel: newSubLevel }
            );
        }

        this.chapter = newChapter;

        // Preload assets for the next chapter only if it changed
        if (this.assetLoader && this.chapter !== oldChapter) {
            this.assetLoader.loadChapterAssets(this.chapter);
        }

        this.ui.updateHUD();
        const levelColor = this.characterTheme?.particlePrimary || '#A6F616';
        this.floatingTexts.push(new FloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50, `LEVEL ${this.level}`, levelColor, 60, 'pop'));
        this.particles.spawn(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, levelColor, 50, 'spark');
        this.shake(15, 600);
        if (this.synth) this.synth.playLevelUp();
        this.proceduralMusic?.setLevel?.(this.level);

        // Update weather for the new chapter
        if (this.weather) this.weather.setChapter(this.chapter);

        // Art Director Phase 3: GUI Splash Juice
        if (this.ui.vals.level) {
            this.ui.vals.level.classList.remove('level-up-splash');
            void this.ui.vals.level.offsetWidth;
            this.ui.vals.level.classList.add('level-up-splash');
        }
    }
    _finalizeRunScores(finalScore, notifyUnlocks = true) {
        if (finalScore > this.highScore) {
            this.highScore = finalScore;
            this.saveSystem.saveHighScore(this.highScore);
        }

        if (this.chapter) {
            const chBestKey = `mx_ch${this.chapter}_best_score`;
            const chBest = parseInt(localStorage.getItem(chBestKey)) || 0;
            if (finalScore > chBest) {
                this.saveSystem.saveChapterProgress(this.chapter, this.level, finalScore);
            }

            const chMaxLevelKey = `mx_ch${this.chapter}_max_level`;
            const chMaxLevel = parseInt(localStorage.getItem(chMaxLevelKey)) || 0;
            if (this.level > chMaxLevel) {
                this.saveSystem.saveChapterProgress(this.chapter, this.level, finalScore);
            }

            const chBestMultKey = `mx_ch${this.chapter}_best_mult`;
            const chBestMult = parseInt(localStorage.getItem(chBestMultKey)) || 1;
            if (this.maxMult > chBestMult) localStorage.setItem(chBestMultKey, this.maxMult);
        }

        if (!this.stateManager?.isStoryMode?.()) {
            this.scoreGlobal = this.scoreSystem.commitRunScore(finalScore);
            this._refreshProjectedUnlocks(this.scoreGlobal, notifyUnlocks);
            this._saveAdaptiveProgress();
        }

        // ðŸ¸ GANANCIA DE XANEZUS (1 por cada 1000 puntos)
        const xanezusEarned = Math.floor(finalScore / 1000);
        if (xanezusEarned > 0) {
            this.totalCoins += xanezusEarned;
            this.saveSystem.saveCoins(this.totalCoins);

            // Animar monedero HUD (visual feedback)
            const walletEl = document.getElementById('xanezu-wallet');
            const walletVal = document.getElementById('hud-xanezu-val');

            if (walletVal && this.ui) {
                walletVal.innerText = this.ui.formatCurrency(this.totalCoins);
            }
            if (walletEl) {
                walletEl.classList.remove('wallet-earned');
                void walletEl.offsetWidth; // trigger reflow
                walletEl.classList.add('wallet-earned');
            }

            this.achievements.showToast({
                icon: 'ðŸ¸',
                title: 'RECOMPENSA',
                desc: `Â¡Obtienes ${xanezusEarned} FROG COINS ðŸ¸!`
            });
        }
    }

    chapterVictory() {
        // ðŸŽ¬ DESACTIVAR MODO CINEMATOGRÃFICO
        this.ui.toggleCinematicMode(false);

        this.state = 'VICTORY';
        this.ui.showOverlay('congratulations');
        this.synth.stopAll();
        const finalScore = Math.floor(this.score);
        this._finalizeRunScores(finalScore, true);
        if (this.ui.updateCongratulationsUI) this.ui.updateCongratulationsUI(finalScore);

        // Desbloquear el siguiente capÃ­tulo de story al completar el actual
        if (this.stateManager?.isStoryMode?.()) {
            this.unlockNextStoryChapter(this.chapter);
        }
    }

    /**
     * Desbloquea el siguiente capÃ­tulo de story y guarda el progreso.
     * Solo desbloquea el inmediatamente siguiente al completado.
     */
    unlockNextStoryChapter(completedChapterId) {
        const allIds = Object.keys(CHAPTER_REGISTRY).map(Number).sort((a, b) => a - b);
        const nextId = completedChapterId + 1;
        if (!allIds.includes(nextId)) return; // Ya es el Ãºltimo capÃ­tulo

        if (!this.unlockedStoryChapters) this.unlockedStoryChapters = [1];
        if (!this.unlockedStoryChapters.includes(nextId)) {
            this.unlockedStoryChapters = [...this.unlockedStoryChapters, nextId].sort((a, b) => a - b);
            localStorage.setItem('mx_story_unlocked', JSON.stringify(this.unlockedStoryChapters));

            // Notificar al jugador
            const nextCfg = CHAPTER_REGISTRY[nextId];
            this.achievements?.showToast?.({
                title: 'Â¡CapÃ­tulo Desbloqueado!',
                desc: `${nextCfg?.name || `CapÃ­tulo ${nextId}`} estÃ¡ disponible`,
                icon: nextCfg?.icon || 'ðŸ”“'
            });
        }
    }

    gameOver() {
        // ðŸŽ¬ DESACTIVAR MODO CINEMATOGRÃFICO
        if (this.ui && this.ui.toggleCinematicMode) this.ui.toggleCinematicMode(false);

        // TRANSICIÃ“N DE ESTADO FORMAL
        if (this.stateManager) {
            this.stateManager.navigate('GAMEOVER');
        } else {
            this.state = 'GAMEOVER';
        }

        if (this.synth) this.synth.stopAll();
        this.totalDeaths++;
        this.saveSystem.saveTotalStats({ totalDeaths: this.totalDeaths, totalItemsCaught: this.totalItemsCaught, totalDashes: this.totalDashes, totalTimePlayed: this.totalTimePlayed, highLevelReached: this.highLevelReached });

        const finalScore = Math.floor(this.score);
        this._finalizeRunScores(finalScore, true);
        
        // Ensure all pending saves are flushed
        this.saveSystem.flushAllSaves();
    }

    draw() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.filter = 'none';
        this.ctx.globalAlpha = 1.0;
        
        // El UIManager se encarga del despacho dinÃ¡mico del renderizado segÃºn el estado.
        if (this.ui && this.ui.render) {
            this.ui.render(this.ctx);
        } else {
            // Fallback si la UI aÃºn no estÃ¡ lista
            if (['GAMEPLAY', 'COUNTDOWN', 'PLAYING'].includes(this.state)) this.renderGame();
            else this.renderMenu();
        }
    }

    _handleInput() {
        // En un futuro, el gestor de input enviarÃ¡ coordenadas al StateManager/UI
    }

    updateMenuParticles(dt) {
        this.menuParticles.forEach(p => {
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.x < 0 || p.x > CANVAS_WIDTH) p.vx *= -1;
            if (p.y < 0 || p.y > CANVAS_HEIGHT) p.vy *= -1;
        });
    }

    renderMenu() {
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const state = this.stateManager.state;
        
        // ConfiguraciÃ³n de fondos por estado
        const menuThemes = {
            'main_menu': { c1: '#1a2233', c2: '#0a101a', p: '#A6F616', useImage: true },
            'mode_select': { c1: '#2a1a33', c2: '#100a1a', p: '#ff00ff' },
            'settings_menu': { c1: '#1a2a33', c2: '#0a101a', p: '#00f2ff' },
            'load_game_flow': { c1: '#1a3322', c2: '#0a1a10', p: '#00ff88' },
            'chapter_select_story': { c1: '#332a1a', c2: '#1a100a', p: '#ffcc00' },
            'chapter_select_arcade': { c1: '#1a3333', c2: '#0a1a1a', p: '#00ffff' },
            'chapter_select_ablia': { c1: '#331a1a', c2: '#1a0a0a', p: '#ff4444' }
        };

        const theme = menuThemes[state] || menuThemes['main_menu'];

        // Para el menÃº principal, usar la imagen de fondo si estÃ¡ disponible
        if (state === 'main_menu' && this.assets && this.assets.menuBG && this.assets.menuBG.width > 0) {
            this.ctx.drawImage(this.assets.menuBG, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else if (state === 'mode_select' && this.assets && this.assets.modeSelectBG && this.assets.modeSelectBG.width > 0) {
            this.ctx.drawImage(this.assets.modeSelectBG, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else if (state === 'settings_menu' && this.assets && this.assets.settingsBG && this.assets.settingsBG.width > 0) {
            this.ctx.drawImage(this.assets.settingsBG, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else if (state === 'chapter_select_ablia' && this.assets && this.assets.abliaBG && this.assets.abliaBG.width > 0) {
            this.ctx.drawImage(this.assets.abliaBG, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else {
            // Draw Dynamic Background Gradient para otros menÃºs
            const grad = this.ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
            grad.addColorStop(0, theme.c1);
            grad.addColorStop(1, theme.c2);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            // Draw a subtle pattern or grid
            this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            this.ctx.lineWidth = 1;
            for(let x=0; x<CANVAS_WIDTH; x+=50) {
                this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, CANVAS_HEIGHT); this.ctx.stroke();
            }
        }

        this.ctx.save();
        const menuParticleColor = theme.p;
        this.menuParticles.forEach(p => {
            this.ctx.globalAlpha = 0.1 + Math.sin(Date.now() / 1000 + p.life * 10) * 0.05;
            this.ctx.fillStyle = menuParticleColor;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    renderGame() {
        this.ctx.fillStyle = '#000'; this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.ctx.save();
        if (this.camTrauma > 0) { const p = Math.pow(this.camTrauma, 2); this.ctx.translate((Math.random() - 0.5) * 25 * p, (Math.random() - 0.5) * 25 * p); }

        // â•â•â• PASS 1: Background (6 parallax layers) â•â•â•
        // Pasamos dt para que las animaciones sean fluidas y estables
        if (this.biomeRenderer) this.biomeRenderer.drawBackground(this.ctx, this.lastDt || 1.0);



        // â•â•â• PASS 2: Action Layer (entities, player) â•â•â•
        if (this.entities) this.entities.forEach(e => e.draw(this.ctx));
        if (this.frog) this.frog.draw(this.ctx);
        if (this.elephant?.active) this.elephant.draw(this.ctx);

        // â•â•â• PASS 3: Foreground + Atmosphere â•â•â•
        if (this.biomeRenderer) this.biomeRenderer.drawForeground(this.ctx);



        if (this.particles) this.particles.draw(this.ctx);
        if (this.floatingTexts) this.floatingTexts.forEach(ft => ft.draw(this.ctx));
        if (this.weather) this.weather.draw(this.ctx);

        if (this.state === 'COUNTDOWN') this.drawCountdown();
        if (this.flashT > 0) { this.ctx.save(); this.ctx.globalAlpha = this.flashT / 10; this.ctx.fillStyle = this.flashColor; this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); this.ctx.restore(); this.flashT--; }

        this.ctx.restore();

        // â•â•â• PASS 4: Post-Processing (Vignette, Color Grade, Bloom) â•â•â•
        if (this.biomeRenderer) this.biomeRenderer.drawPostFX(this.ctx);
    }

    drawCountdown() {
        if (!this.countdown) return;
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.ctx.font = 'bold 120px Outfit';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const val = this.countdown.val === 0 ? "GO!" : this.countdown.val;
        const scale = 1 + (this.countdown.timer / 60);

        this.ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        this.ctx.scale(scale, scale);

        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'var(--primary)';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(val, 0, 0);
        this.ctx.restore();
    }



    shake(i, d) { this.camTrauma = Math.min(1.0, this.camTrauma + (i / 40)); }
    triggerFlash(c = '#fff', d = 6) { this.flashT = d; this.flashColor = c; }
    triggerDamage() {
        this.shake(20, 400);
        this.camTrauma = Math.min(1.0, this.camTrauma + 0.6);
        this.synth.playDamageBark();
        if (this.ui && this.ui.showDamageVignette) this.ui.showDamageVignette();
        
        // Reset combo and multiplier on damage
        this.mult = 1;
        this.bananaCombo = 0;
        this.bombCombo = 0;
        this.collectionStreak = 0;
        if (this.ui) this.ui.updateHUD(0); // Update UI to reflect reset
    }
    playSound(k) {
        if (!this.isSoundOn) return;
        this.sounds[k]?.play().catch(() => { });
    }
    collide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
    triggerFever() {
        const feverColor = this.characterTheme?.particleSecondary || this.characterTheme?.particlePrimary || '#FF00FF';
        this.feverT = 600;
        this.triggerFlash(feverColor, 15);
        this.floatingTexts.push(new FloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, "FEVER MODE!", feverColor, 80, 'pop'));
        if (this.synth) this.synth.playBtnClick(); // Fallback sound
    }
    triggerNearMiss() {
        if (this.nearMissT > 0) return; // Cooldown for performance
        this.inNearMiss = true;
        this.nearMissT = 45;
        this.score += 100 * this.mult; // Reward for risky play
        this.ui.showNearMiss();
        this.floatingTexts.push(new FloatingText(this.frog.x + this.frog.w / 2, this.frog.y, "CLOSE! +100", this.characterTheme?.particleSecondary || "#FFF", 24, 'float'));
        this.shake(8, 200); // Subtle camera shake for 'near collision' impact
        if (this.synth) this.synth.playNearMiss();
    }
    updateDailyChallenge() { }
    buySkill(id, price) {
        return this.shopManager.buyUpgrade(id);
    }
    buyItem(id) {
        if (id.includes('skin')) return this.shopManager.unlockSkin(id.split('_')[1]);
        return this.shopManager.buyConsumable(id);
    }

    toggleMusic() {
        this.isMusicOn = !this.isMusicOn;
        localStorage.setItem('mx_music_on', this.isMusicOn ? '1' : '0');
        if (!this.isMusicOn) {
            this.synth.stopAll();
        } else {
            if (this.state === 'MENU') {
                this.synth.playMenuMusic();
            } else if (this.state === 'CHAPTER_SELECT') {
                if (this.stateManager?.isArcadeMode?.()) {
                    this.synth.startArcadeSelectMusic?.();
                } else {
                    this.synth.playMenuMusic();
                }
            } else if (this.state === 'PLAYING') {
                this._resumeChapterMusic();
            }
        }
        this.ui.updateSettingsUI();
        this.ui.updateAudioStatus();
    }

    _resumeChapterMusic() {
        if (!this.isMusicOn) return;
        this.synth.resumeContext().then(() => {
            const currentCfg = this.getActiveChapterConfig(this.chapter);
            if (!this.stateManager?.isStoryMode?.() || currentCfg.musicMode === 'procedural') {
                this.proceduralMusic.startChapter(currentCfg, this.level);
            } else {
                this.synth.start(this.chapter);
            }
        }).catch(e => console.warn("Audio: Could not resume context", e));
    }


    toggleSound() {
        this.isSoundOn = !this.isSoundOn;
        localStorage.setItem('mx_sound_on', this.isSoundOn ? '1' : '0');
        this.ui.updateSettingsUI();
        this.ui.updateAudioStatus();
    }



    triggerBombExplosion() {
        const boomColor = this.characterTheme?.particleSecondary || this.characterTheme?.particlePrimary || '#FF4500';
        this.shake(40, 1000);
        this.triggerFlash(boomColor, 15);
        this.floatingTexts.push(new FloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, "BOOM!", boomColor, 65, 'shake'));

        if (this.synth) this.synth.playExplosion?.() || this.synth.playUnlock();

        const obstaclesToDestroy = this.entities.filter(e => e instanceof Obstacle && !e.dead);
        obstaclesToDestroy.forEach(e => this.destroyObstacle(e, false));
    }

    destroyObstacle(obs, awardScore = true) {
        obs.dead = true;
        if (awardScore) {
            this.score += 75 * this.mult;
            if (!this.stateManager?.isStoryMode?.()) {
                this._refreshProjectedUnlocks(this.scoreSystem.getProjectedTotal(this.score), false);
            }
        }

        const config = this.getActiveChapterConfig(this.chapter);
        this.particles.createThematicBurst(
            obs.x + obs.w / 2,
            obs.y + obs.h / 2,
            config.colors || ['#FFF', '#444'],
            config.ambient || 'default'
        );

        const idx = this.entities.indexOf(obs);
        if (idx > -1) this.entities.splice(idx, 1);
        if (awardScore) this.ui.updateHUD(75 * this.mult);

        // Devolver al pool si es un obstÃ¡culo
        if (obs instanceof Obstacle) {
            obs.active = false;
        }
    }

    /**
     * Pooling: Obtiene un obstÃ¡culo reciclado o crea uno nuevo.
     */
    getObstacle(x, y, type, config) {
        let obs = this.obstaclePool.find(o => !o.active);
        if (obs) {
            obs.init(x, y, type, config);
            obs.active = true;
        } else {
            obs = new Obstacle(this, x, y, type, config);
            if (this.obstaclePool.length < this.maxPoolSize) this.obstaclePool.push(obs);
        }
        return obs;
    }

    getFly(x, y, type) {
        let fly = this.itemPool.fly.find(f => !f.active);
        if (fly) {
            fly.init(x, y, type);
            fly.active = true;
        } else {
            fly = new Fly(this, x, y, type);
            if (this.itemPool.fly.length < this.maxPoolSize) this.itemPool.fly.push(fly);
        }
        return fly;
    }

    getCandy(x, y, type) {
        let candy = this.itemPool.candy.find(c => !c.active);
        if (candy) {
            candy.init(x, y, type);
            candy.active = true;
        } else {
            candy = new Candy(this, x, y, type);
            if (this.itemPool.candy.length < this.maxPoolSize) this.itemPool.candy.push(candy);
        }
        return candy;
    }

    getPowerUp(x, y, type) {
        let p = this.itemPool.powerup.find(o => !o.active);
        if (p) {
            p.init(x, y, type);
            p.active = true;
        } else {
            p = new PowerUp(this, x, y, type);
            if (this.itemPool.powerup.length < this.maxPoolSize) this.itemPool.powerup.push(p);
        }
        return p;
    }

    getBonus(x, y, type) {
        let b = this.itemPool.bonus.find(o => !o.active);
        if (b) {
            b.init(x, y, type);
            b.active = true;
        } else {
            b = new BonusItem(this, x, y, type);
            if (this.itemPool.bonus.length < this.maxPoolSize) this.itemPool.bonus.push(b);
        }
        return b;
    }

    getArtifact(x, y, level, speed) {
        let art = this.itemPool.artifact.find(a => !a.active);
        if (art) {
            art.init(x, y, level);
            art.active = true;
        } else {
            art = new LevelArtifact(this, x, y, level, speed);
            if (this.itemPool.artifact.length < this.maxPoolSize) this.itemPool.artifact.push(art);
        }
        return art;
    }

    /**
     * Sistema de CÃ¡mara AAA: AÃ±ade trauma para generar vibraciÃ³n.
     */
    addTrauma(amount) {
        this.camTrauma = Math.min(1.0, this.camTrauma + amount);
    }

    addXP(amount) {
        if (!amount || amount <= 0) return;
        this.totalXP += amount;
        localStorage.setItem('mx_total_xp', this.totalXP);
        
        if (this.ui && this.ui.hudJuice) {
            this.ui.hudJuice.score = 1.0;
        }
    }

    /**
     * Cambia la skin activa del jugador.
     */
    setSkin(skinId) {
        if (SKINS[skinId]) {
            this.activeSkinId = skinId;
            this.activeSkin = SKINS[skinId];
            localStorage.setItem('mx_active_skin', skinId);
            this.debugLog.push(`ðŸŽ­ Skin cambiada a: ${this.activeSkin.name}`);
            return true;
        }
        return false;
    }
}

// Expose Game class to window for global access in main.js
window.Game = Game;

