import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { AssetLoader } from './AssetLoader.js';
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

export class Game {
    constructor() {
        this.canvas = document.getElementById("game");
        this.ctx = this.canvas.getContext("2d", { alpha: false });

        this.assetLoader = new AssetLoader();
        this.ui = new UIManager(this);
        this.biomeRenderer = new BiomeRenderer(this);
        this.weather = new WeatherManager(this);
        this.ranks = new RankManager();
        this.particles = new ParticlePool(400);
        this.synth = new MusicSynth();
        this.spawn = new SpawnManager(this);
        this.saveSystem = new SaveSystem();
        this.chapterManager = new ChapterManager(ARCADE_CHAPTER_REGISTRY);
        this.levelManager = new LevelManager();
        this.stateManager = new GameStateManager();
        this.characterFactory = new CharacterFactory();
        this.proceduralMusic = new ProceduralMusicEngine(this.synth);

        this.entities = [];
        this.floatingTexts = [];
        this.state = 'LOADING';
        this.score = 0;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('mx_high_score')) || 0;
        this.maxChapter = parseInt(localStorage.getItem('mx_max_chapter')) || 1;
        this.maxLevel = parseInt(localStorage.getItem('mx_max_level')) || 1;
        this.maxMult = parseInt(localStorage.getItem('mx_max_mult')) || 1;
        this.totalGamesPlayed = parseInt(localStorage.getItem('mx_games_played')) || 0;
        this.bgX = 0;
        this.spawnT = { obs: 0, fly: 0, power: 0, art: 0, bonus: 0, candy: 0 };
        this.collectionStreak = 0;
        this.feverT = 0;
        this.camTrauma = 0;
        this.damageT = 0;
        this.shakeT = 0;
        this.shakeI = 0;
        this.isMusicOn = localStorage.getItem('mx_music_on') !== '0';
        this.isSoundOn = localStorage.getItem('mx_sound_on') !== '0';
        this.inTransition = false;
        this.mult = 1;
        this.multT = 0;
        this.iceT = 0;
        this.nearMissT = 0;
        this.inNearMiss = false;
        this.eventT = 0;
        this.activeEvent = null;
        this.lives = 1;
        this.extraLifeHearts = 0;
        this.bananaCombo = 0;
        this.bombCombo = 0;
        this.bombCombo = 0;
        this.plus50Count = 0;
        this.candyStreak = 0;
        this.chapter = 1;
        this.isInfinite = false;
        this.scoreGlobal = 0;
        this.lastPlayedChapter = 1;
        this.arcadeProgress = { scoreGlobal: 0, unlockedChapters: [1], lastPlayedChapter: 1 };
        this.ablProgress = { scoreGlobal: 0, unlockedChapters: [1], lastPlayedChapter: 1 };
        this.activeAdaptiveMode = 'ARCADE';
        this.levelStartScore = 0;

        this.menuMouse = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
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

        window.addEventListener('resize', () => this.resize());
        this.resize();

        // 🎵 Robust Audio Unlocker - Try to play music on first interaction
        this.audioUnlocked = false;
        const unlockAudio = () => {
            if (this.audioUnlocked) return;
            this.audioUnlocked = true;

            if (this.synth) {
                this.synth.resumeContext().then(() => {
                    if (!this.isMusicOn) return;
                    if (this.state === 'MENU') {
                        this.synth.playMenuMusic();
                    } else if (this.state === 'CHAPTER_SELECT') {
                        if (this.stateManager?.isArcadeMode?.()) this.synth.startArcadeSelectMusic?.();
                        else this.synth.playMenuMusic();
                    }
                    // Refresh UI audio status after unlocking
                    this.ui?.updateAudioStatus?.();
                    this.ui?.showAudioUnlockTooltip?.();
                });
            }
            // Remove listeners after first unlock
            ['click', 'keydown', 'touchstart', 'mousedown'].forEach(ev =>
                window.removeEventListener(ev, unlockAudio)
            );
        };
        ['click', 'keydown', 'touchstart', 'mousedown'].forEach(ev =>
            window.addEventListener(ev, unlockAudio, { once: true, passive: true })
        );

        this.init();
    }

    loadPersistence() {
        try {
            const savedStats = JSON.parse(localStorage.getItem('mx_stats') || '{}');
            this.stats = {
                totalBananas: savedStats.totalBananas || 0,
                totalGreenCandies: savedStats.totalGreenCandies || 0,
                explotions: savedStats.explotions || 0,
                tempAirDashes: 0,
                maxAirDashes: 0,
                levelNoDamage: true,
                combosInCurrentLife: { explotion: false, cowboy: false },
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
                    : arcadeUnlock.getUnlockedChapters(arcade.scoreGlobal),
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
            this.unlockedCampaignChapters = Object.keys(CHAPTER_REGISTRY).map(Number);
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
            this.stats = { totalBananas: 0, totalGreenCandies: 0, explotions: 0, tempAirDashes: 0, maxAirDashes: 0, levelNoDamage: true, combosInCurrentLife: { explotion: false, cowboy: false }, doubleComboInLife: false };
            this.totalCoins = 0;
            this.unlocks = { magnet: 0, shield: 0, skins: [] };
            this.scoreGlobal = 0;
            this.scoreSystem = new ScoreSystem(0);
            this.unlockSystem = new UnlockSystem(this.chapterManager);
            this.unlockedChapters = [1];
            this.arcadeProgress = { scoreGlobal: 0, unlockedChapters: [1], lastPlayedChapter: 1 };
            this.ablProgress = { scoreGlobal: 0, unlockedChapters: [1], lastPlayedChapter: 1 };
            this.unlockedCampaignChapters = Object.keys(CHAPTER_REGISTRY).map(Number);
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
        try {
            // 🚀 BOOTSTRAP - Load essential items for menu + chapter 1 basics
            const { assets, sounds } = await this.assetLoader.load({
                // Core items
                flyGold: "assets/campaign/1-selva-tropical/objetos/fly_gold.svg",
                heart: "assets/campaign/1-selva-tropical/objetos/heart.svg",
                banana: "assets/campaign/1-selva-tropical/objetos/banana.svg",
                coin: "assets/campaign/1-selva-tropical/objetos/coin.svg",
                star: "assets/campaign/1-selva-tropical/objetos/star.svg",
                shield: "assets/campaign/1-selva-tropical/objetos/shield.svg",

                // Menu BG (WebP with PNG fallback)
                menuBG: "assets/menu/fondo/mainmenu-image.webp",
            }, {
                // Menu music (OGG with MP3 fallback)
                musica_menu: 'assets/menu/audio/musica menu.ogg'
            });

            this.assets = assets;
            this.sounds = sounds;

            // 💎 Load global default skins for objects (User requested)
            await this.assetLoader.loadGlobalObjects();

            this.frog = new Player(assets, this);
            this.elephant = new Companion(assets);

            this.setupInput();
            this.ui.updateHUD();
            this.ui.updateSettingsUI();
            this.state = 'MENU';

            // Ensure the CSS background is also warm and ready
            const menuEl = document.getElementById('menu-overlay');
            if (menuEl && this.assets.menuBG) {
                menuEl.style.backgroundImage = `url(${this.assets.menuBG.src})`;
            }

            // Small delay to let the canvas render its background first
            setTimeout(() => {
                this._hideLoadingScreen();
                this.ui.showOverlay('menu');
            }, 50);
        } catch (e) {
            console.error("Game initialization error:", e);
            // Fallback to menu even on error so buttons might work
            this.state = 'MENU';
            this._hideLoadingScreen();
            this.ui.showOverlay('menu');
        }
        // Attempt an immediate play once assets are ready
        if (this.synth && this.isMusicOn) {
            this.synth.playMenuMusic();
        }

        requestAnimationFrame(t => this.loop(t));
    }

    resize() {
        const container = document.getElementById('game-container');
        if (!container) return;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        const scale = Math.min(cw / CANVAS_WIDTH, ch / CANVAS_HEIGHT);
        this.canvas.style.width = `${CANVAS_WIDTH * scale}px`;
        this.canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
    }

    setupInput() {
        const backBtn = document.getElementById('back-to-menu-btn');
        if (backBtn) backBtn.onclick = () => this.returnToMenu();

        // 🟢 Menu Navigation Configuration
        this.menuIndex = 0;
        this.menuMapping = {
            'MENU': ['btn-story', 'btn-infinite', 'btn-arcade', 'btn-abl', 'btn-trophies', 'btn-settings', 'btn-shop'],
            'CHAPTER_SELECT': [] // Populated dynamically by UIManager
        };

        // Canvas mousedown only for right-click dash on canvas, 
        // left click is now handled globally for better "click anywhere" feel
        this.canvas.onmousedown = (e) => {
            if (this.state === 'PLAYING' && e.button === 2) this.handleDash();
        };
        this.canvas.oncontextmenu = (e) => e.preventDefault();

        // 🟢 Robust Click Anywhere Input (Fixes "not like before")
        window.onmousedown = (e) => {
            if (this.state === 'PLAYING' && e.button === 0) {
                // Ignore if clicking on any UI element
                if (e.target.closest('.icon-btn, .menu-btn, .menu-btn-small, .glow-button, .back-button, .overlay, .menu-buttons, .menu-sub-buttons, #overlay-container')) return;
                this.frog.jump();
            }
        };

        window.onkeydown = (e) => {
            // Prevent default scrolling for game keys
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }

            if (this.state === 'PLAYING' || this.state === 'COUNTDOWN') {
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.frog.jump();
                if (e.code === 'ShiftLeft' || e.code === 'KeyD' || e.code === 'ArrowRight') this.handleDash();
            }
            else if (this.state === 'MENU' || this.state === 'CHAPTER_SELECT') {
                this.handleMenuInput(e);
            }
            else if (['GAMEOVER', 'VICTORY'].includes(this.state)) {
                if (e.code === 'Space' || e.code === 'Enter') {
                    this.retry();
                }
            }
        };
        // ... touch and mouse events follow ...

        window.addEventListener('touchstart', (e) => {
            if (this.state !== 'PLAYING') return;
            // Ignore UI buttons
            if (e.target.closest('.icon-btn, .menu-btn, .glow-button')) return;

            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const x = t.clientX - rect.left;
                // If it's a touch on the right half, dash. Left half or just touching anywhere, jump?
                // Standard mobile behavior: Left Jump, Right Dash
                if (x < rect.width / 2) this.frog.jump();
                else this.handleDash();
            }
        }, { passive: false });

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.menuMouse.x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
            this.menuMouse.y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
        });

        const overlay = document.getElementById('overlay-container');
        if (overlay) {
            overlay.addEventListener('mouseover', (e) => {
                if (e.target.closest('.chapter-card, .shop-item, .glow-button, .reward-row, .hotspot, .ch-tile')) this.synth.playBtnHover();
            });
            overlay.addEventListener('click', (e) => {
                if (e.target.closest('.chapter-card, .shop-item, .glow-button, .hotspot, .ch-tile')) this.synth.playBtnClick();
            });
        }
    }

    handleMenuInput(e) {
        const options = this.menuMapping[this.state];
        if (!options) return;

        const updateSelection = (dir) => {
            // Remove highlight from current
            const currEl = document.getElementById(options[this.menuIndex]);
            if (currEl) currEl.classList.remove('nav-highlight');

            if (dir === 'next') {
                this.menuIndex = (this.menuIndex + 1) % options.length;
            } else if (dir === 'prev') {
                this.menuIndex = (this.menuIndex - 1 + options.length) % options.length;
            }

            // Add highlight to new
            const newEl = document.getElementById(options[this.menuIndex]);
            if (newEl) {
                newEl.focus();
                newEl.classList.add('nav-highlight');
                if (this.synth) this.synth.playBtnHover();
            }
        };

        if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'ArrowRight') {
            updateSelection('next');
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'ArrowLeft') {
            updateSelection('prev');
        } else if (e.code === 'Enter' || e.code === 'Space') {
            const btnId = options[this.menuIndex];
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.click();
                if (this.synth) this.synth.playBtnClick();
            }
        }
    }

    handleDash() {
        if (this.frog.dash()) {
            this.shake(6, 200);
            this.particles.spawn(this.frog.x, this.frog.y + this.frog.h / 2, '#18EED8', 10);
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
        if (!this.stateManager?.isCampaignMode?.()) return;
        const config = CHAPTER_REGISTRY[chapter] || CHAPTER_REGISTRY[1];
        if (config.musicMode === 'procedural') return;
        const dir = config.assetsDir || '1-selva-tropical';

        const candidates = [
            `assets/${dir}/audios/${dir}.mp3`,
            `assets/${dir}/audios/${dir}.ogg`,
            `assets/${dir}/audios/${dir}.wav`
        ];

        const audio = new Audio();

        return new Promise((resolve) => {
            const tryLoad = (idx) => {
                const musicPath = candidates[idx];
                audio.src = musicPath;
                audio.preload = 'auto';

                audio.oncanplaythrough = () => {
                    console.log(`ASSETS: Chapter music fully loaded: ${musicPath}`);
                    if (this.assetLoader) {
                        this.assetLoader.sounds[`bg${chapter}`] = audio;
                    }
                    resolve();
                };

                audio.onerror = () => {
                    if (idx + 1 < candidates.length) {
                        tryLoad(idx + 1);
                    } else {
                        console.warn(`ASSETS: Failed to load chapter music for chapter ${chapter}`);
                        resolve();
                    }
                };

                audio.load();
            };

            tryLoad(0);
        });
    }

    _updateLoadingProgress(percent, text, details = {}) {
        const bar = document.getElementById('loading-bar-fill');
        const textEl = document.querySelector('.loading-status');
        if (bar) bar.style.width = percent + '%';
        if (textEl) textEl.textContent = text;

        // Update status details // Not present in index.html, but keep logic in case
        if (details.assetsLoaded !== undefined) {
            const assetsEl = document.querySelector('#status-assets .status-value');
            if (assetsEl) assetsEl.textContent = `${details.assetsLoaded}/${details.assetsTotal}`;
        }
        if (details.soundsLoaded !== undefined) {
            const soundsEl = document.querySelector('#status-sounds .status-value');
            if (soundsEl) soundsEl.textContent = `${details.soundsLoaded}/${details.soundsTotal}`;
        }
        if (details.memory) {
            const memEl = document.querySelector('#status-memory .status-value');
            if (memEl) memEl.textContent = details.memory;
        }
    }

    _showLoadingScreen(chapterName = '') {
        const overlay = document.getElementById('loading-overlay');
        const chapterEl = document.querySelector('.lo-game-title'); // Was looking for 'loading-chapter-name'
        if (overlay) {
            overlay.classList.add('active');
        }
        if (chapterEl) chapterEl.textContent = chapterName;
        this._updateLoadingProgress(0, 'Inicializando...');
        document.body.classList.remove('in-menu');
    }

    _hideLoadingScreen() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
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

    async start(chapter = 1) {
        // Fallback for invalid chapter
        if (!chapter || isNaN(chapter)) chapter = 1;

        if (!this.isChapterUnlocked(chapter)) {
            console.warn(`Attempted to start locked chapter: ${chapter}`);
            this.achievements.showToast({ title: "Locked!", desc: `Reach higher levels to unlock!`, icon: "🔒" });
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
        if (!this.stateManager?.isCampaignMode?.()) {
            this.lastPlayedChapter = chapter;
            this._saveAdaptiveProgress();
        }

        const chapterCfg = this.getActiveChapterConfig(this.chapter);
        this.characterFactory.applyTheme(this, chapterCfg);

        // Track max chapter reached
        if (chapter > this.maxChapter) {
            this.maxChapter = chapter;
            localStorage.setItem('mx_max_chapter', chapter);
        }

        this.inTransition = true;
        this.ui.hideAllOverlays();

        // Show loading screen with chapter name
        const chapterName = this.getChapterName ? this.getChapterName(chapter) : `Capítulo ${chapter}`;
        this._showLoadingScreen(chapterName);

        // Force a delay to ensure loading screen renders
        await new Promise(r => setTimeout(r, 200));

        // Calculate total assets to load for accurate progress
        const totalAssets = this._calculateAssetCount(chapter);

        // ===== FASE 1: INICIALIZACIÓN (0-5%) =====
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

        this._updateLoadingProgress(5, 'Cargando configuración del capítulo...', {
            assetsLoaded: 2,
            assetsTotal: totalAssets,
            soundsLoaded: 0,
            soundsTotal: 1
        });

        // ===== FASE 2: MÚSICA (5-15%) =====
        this._updateLoadingProgress(6, 'Cargando música del capítulo...', {
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
        await new Promise(r => setTimeout(r, 200));

        this._updateLoadingProgress(12, 'Configurando efectos de audio...', {
            assetsLoaded: 4,
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 200));

        // ===== FASE 3: CARGAR ASSETS VISUALES (15-40%) =====
        this._updateLoadingProgress(15, 'Cargando recursos visuales...', {
            assetsLoaded: 5,
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });

        // Load all chapter assets (this is the main loading)
        const assetPromise = (this.assetLoader && typeof this.assetLoader.loadChapterAssets === 'function')
            ? this.assetLoader.loadChapterAssets(this.chapter)
            : Promise.resolve();

        // Show intermediate progress while assets load
        await new Promise(r => setTimeout(r, 500));

        this._updateLoadingProgress(20, 'Cargando sprites del personaje...', {
            assetsLoaded: Math.floor(totalAssets * 0.15),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 500));

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
        await new Promise(r => setTimeout(r, 300));

        // ===== FASE 4: PROCESAR FONDOS (40-60%) =====
        this._updateLoadingProgress(40, 'Procesando fondos parallax...', {
            assetsLoaded: Math.floor(totalAssets * 0.4),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });

        // Pre-cache backgrounds - render them to ensure they're in GPU
        await this._preloadBackgrounds(chapter);

        this._updateLoadingProgress(45, 'Cargando capas de profundidad...', {
            assetsLoaded: Math.floor(totalAssets * 0.45),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 300));

        this._updateLoadingProgress(50, 'Procesando efectos de atmósfera...', {
            assetsLoaded: Math.floor(totalAssets * 0.5),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 300));

        // ===== FASE 5: OBSTÁCULOS Y OBJETOS (60-75%) =====
        this._updateLoadingProgress(55, 'Cargando obstáculos...', {
            assetsLoaded: Math.floor(totalAssets * 0.55),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 300));

        this._updateLoadingProgress(60, 'Cargando objetos colecionables...', {
            assetsLoaded: Math.floor(totalAssets * 0.6),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 300));

        this._updateLoadingProgress(65, 'Cargando power-ups...', {
            assetsLoaded: Math.floor(totalAssets * 0.65),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 300));

        this._updateLoadingProgress(70, 'Cargando gemas y recompensas...', {
            assetsLoaded: Math.floor(totalAssets * 0.7),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 300));

        // ===== FASE 6: ENTIDADES Y POOLS (75-85%) =====
        this._updateLoadingProgress(75, 'Inicializando entidades del juego...', {
            assetsLoaded: Math.floor(totalAssets * 0.75),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });

        // Pre-create all entity pools and render all sprites to GPU
        await this._preloadEntityPools();

        this._updateLoadingProgress(80, 'Preparando pool de objetos...', {
            assetsLoaded: Math.floor(totalAssets * 0.8),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 300));

        // ===== FASE 7: RENDERIZADO (85-92%) =====
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
        await new Promise(r => setTimeout(r, 300));

        // ===== FASE 8: ÚLTIMOS PREPARATIVOS (92-100%) =====
        this._updateLoadingProgress(92, 'Configurando nivel...', {
            assetsLoaded: Math.floor(totalAssets * 0.92),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 200));

        this._updateLoadingProgress(95, 'Inicializando spawn manager...', {
            assetsLoaded: Math.floor(totalAssets * 0.95),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 200));

        this._updateLoadingProgress(98, 'Preparando efectos de partículas...', {
            assetsLoaded: Math.floor(totalAssets * 0.98),
            assetsTotal: totalAssets,
            soundsLoaded: 1,
            soundsTotal: 1
        });
        await new Promise(r => setTimeout(r, 200));

        // Now start the game
        try {
            console.log("GAME: Chapter start sequence completed - ALL ASSETS LOADED");
            Obstacle.clearCache();

            // Pre-initialize all entities that will be needed
            this._initializeGameEntities();

            this.state = 'COUNTDOWN';
            this.countdown = { val: 3, timer: 60 };

            this.chapterTransition = { active: true, timer: 120, name: this.getChapterName(chapter) };
            this.score = 0;
            this.level = 1;
            this.entities = [];
            this.floatingTexts = [];
            this.mult = 1;
            this.multT = 0;
            this.frog.reset();
            this.iceT = 0;
            this.bananaStreak = 0;
            this.lives = 1;
            this.plus50Count = 0;
            this.candyStreak = 0;
            this.flashT = 0;
            this.collectionStreak = 0;
            if (this.elephant) this.elephant.active = false;

            if (this.weather) this.weather.setChapter(this.chapter);

            if (this.isMusicOn) {
                this.synth.stopAll();
                const currentCfg = this.getActiveChapterConfig(this.chapter);
                this.synth.resumeContext().then(() => {
                    if (!this.stateManager?.isCampaignMode?.() || currentCfg.musicMode === 'procedural') {
                        this.proceduralMusic.startChapter(currentCfg, this.level);
                    } else {
                        const chapterSounds = this.assetLoader ? this.assetLoader.sounds : this.sounds;
                        const track = chapterSounds[`bg${this.chapter}`];
                        if (track) {
                            track.loop = true;
                            track.volume = 0.3;
                            track.play().catch(() => { console.warn("Could not play chapter music"); });
                            this.synth.currentMusicSource = track;
                        } else {
                            this.synth.start(this.chapter);
                        }
                    }
                }).catch(() => {
                    this.synth.start(this.chapter);
                });
            }

            // Complete loading - play music immediately
            const totalAssets = this._calculateAssetCount(this.chapter);
            this._updateLoadingProgress(100, '¡Listo!', {
                assetsLoaded: totalAssets,
                assetsTotal: totalAssets,
                soundsLoaded: 1,
                soundsTotal: 1,
                memory: 'OK'
            });
            await new Promise(r => setTimeout(r, 300));

            // Play chapter music immediately (music is already loaded)
            if (this.isMusicOn) {
                this.synth.stopAll();
                const currentCfg = this.getActiveChapterConfig(this.chapter);
                if (!this.stateManager?.isCampaignMode?.() || currentCfg.musicMode === 'procedural') {
                    this.proceduralMusic.startChapter(currentCfg, this.level);
                } else {
                    const chapterSounds = this.assetLoader ? this.assetLoader.sounds : this.sounds;
                    const track = chapterSounds[`bg${this.chapter}`];
                    if (track) {
                        track.loop = true;
                        track.volume = 0.3;
                        track.currentTime = 0;
                        track.play().then(() => {
                            console.log("Audio: Chapter music playing from second 1");
                            this.synth.currentMusicSource = track;
                        }).catch(() => {
                            this.synth.start(this.chapter);
                        });
                    } else {
                        this.synth.start(this.chapter);
                    }
                }
            }

            this._hideLoadingScreen();
            this.ui.updateHUD();

            // 🎬 ACTIVAR MODO CINEMATOGRÁFICO AL EMPEZAR
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

    returnToMenu() {
        console.log("GAME: Returning to Menu");

        // 🎬 DESACTIVAR MODO CINEMATOGRÁFICO
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
        this.stateManager.setMode('CAMPAIGN');
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

        this.spawnT = { obs: 0, fly: 0, power: 0 };
        this.mult = 1;
        this.multT = 0;
        this.plus50Count = 0;

        this.particles.clear();

        this.state = 'PLAYING';
        this.ui.hideAllOverlays();
        this.ui.updateHUD();

        // 🎬 ACTIVAR MODO CINEMATOGRÁFICO EN REINTENTO
        this.ui.toggleCinematicMode(true);

        this.lastT = 0;

        console.log('GAME: Soft retry complete');
    }

    goToStory() {
        this.stateManager.setMode('CAMPAIGN');
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
                : this.unlockSystem.getUnlockedChapters(progress?.scoreGlobal || 0),
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
        if (this.stateManager.isCampaignMode()) return CHAPTER_REGISTRY;
        if (this.stateManager.isABLMode()) return ABL_CHAPTER_REGISTRY;
        return ARCADE_CHAPTER_REGISTRY;
    }

    getActiveChapterConfig(ch) {
        const reg = this.getActiveRegistry();
        return reg[ch] || reg[1] || CHAPTER_REGISTRY[1];
    }

    getActiveUnlockedChapters() {
        const campaignMode = this.stateManager?.isCampaignMode?.() === true;
        return campaignMode
            ? (this.unlockedCampaignChapters || Object.keys(CHAPTER_REGISTRY).map(Number))
            : (this.unlockedChapters || [1]);
    }

    isChapterUnlocked(chapter) {
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

    _getCampaignDifficultyParams(level) {
        const lvl = Math.max(1, Math.floor(level || 1));

        // New campaign curve:
        // Level 30 should match the old "Level 6" intensity.
        // We map 1..30 -> legacy equivalent 1..6 with a smooth early-friendly easing.
        const maxLevel = 30;
        const legacyMaxRef = 6;
        const t = Math.max(0, Math.min(1, (lvl - 1) / (maxLevel - 1)));
        const eased = Math.pow(t, 1.35); // Softer start, stronger late ramp

        const legacyEquivalent = 1 + ((legacyMaxRef - 1) * eased);
        const speedMult = 1 + ((legacyEquivalent - 1) * 0.1);

        // Spawn pacing follows the same smooth ramp.
        // At L1 spawn pressure is lower; at L30 it reaches reference intensity.
        const spawnEase = 0.72 + (0.28 * eased);

        return { speedMult, spawnEase, legacyEquivalent };
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
        if (this.stateManager?.isCampaignMode?.()) return;

        const isArcade = this.stateManager?.isArcadeMode?.();
        const oldUnlocked = new Set(this.unlockedChapters || [1]);

        let nextUnlocked;
        if (isArcade) {
            // Lógica Secuencial Arcade: Comprobamos el capítulo actual contra el siguiente
            nextUnlocked = this.unlockSystem.getArcadeUnlocks(
                this.unlockedChapters || [1],
                this.chapter,
                this.score
            );
        } else {
            // Lógica Global (ABL/Legacy): Basada en puntuación total acumulada
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
                icon: chapterCfg?.icon || '🔓',
            });
            this.proceduralMusic?.playUnlockEvent?.();
        }
        if (newlyUnlocked.length) this.ui?.updateChaptersUI?.();
    }

    loop(t) {
        if (!this.lastT) this.lastT = t;
        let dt = (Math.min(t - this.lastT, 60) / 16.67) || 1.0;
        this.lastT = t;

        if (this.nearMissT > 0) { dt *= 0.2; this.nearMissT--; if (this.nearMissT <= 0) this.inNearMiss = false; }

        // Final safety guard for dt
        const finalDt = (Number.isFinite(dt) && dt > 0) ? dt : 1.0;

        try {
            if (this.state === 'MENU') this.updateMenuParticles(finalDt);
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
        const isCampaignMode = this.stateManager?.isCampaignMode?.() === true;
        let speedMult = this.levelManager.getSpeedMultiplier(activeCfg, this.level);
        let spawnEase = 1.0;
        if (isCampaignMode) {
            const campaignParams = this._getCampaignDifficultyParams(this.level);
            speedMult = campaignParams.speedMult;
            spawnEase = campaignParams.spawnEase;
        }
        const bgSpeedFactor = (this.state === 'PLAYING' && this.frog.slowT > 0) ? 0.5 : 1.0;
        this.bgX = (this.bgX - 2.5 * safeDt * bgSpeedFactor * speedMult);

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

        if (this.state === 'MENU' && Math.random() > 0.92) this.particles.spawn(CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, Math.random() > 0.5 ? '#A6F616' : '#18EED8', 1);

        if (this.state === 'PLAYING') {
            this.totalTimePlayed++;
            if (this.totalTimePlayed % 600 === 0) localStorage.setItem('mx_total_time', this.totalTimePlayed);



            // Heartbeat on low health
            if (this.lives === 1 && Math.random() > 0.985) {
                if (this.synth) this.synth.playTone(60, this.synth.ctx.currentTime, { type: 'sine', dur: 0.1, vol: 0.3 });
            }

            if (this.chapter === 4 && Math.random() > 0.85) this.particles.spawn(Math.random() * CANVAS_WIDTH, CANVAS_HEIGHT, '#88CCFF', 1);
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
                    if (!e.dodged) { e.dodged = true; this.score += 100; this.floatingTexts.push(new FloatingText(e.x, e.y - 20, "PERFECT DODGE +100", "#0FF")); this.synth.playCollect(2); }
                }
            }
        });

        const effDt = dt * bgSpeedFactor * timeScale;
        const effMs = ms * bgSpeedFactor * timeScale;
        this.frog.update(effDt);

        const baseSpeed = 5.8 * speedMult * bgSpeedFactor * timeScale;
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

        const fBounds = this.frog.getBounds();
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const e = this.entities[i];
            if (!(this.iceT > 0 && e instanceof Obstacle)) { if (e instanceof Fly) e.update(effDt, this.frog); else e.update(effDt); }
            if (this.collide(fBounds, e.getBounds())) this.handleCollision(e, i);
            else if (e instanceof Obstacle && Math.sqrt(Math.pow(this.frog.x - e.x, 2) + Math.pow(this.frog.y - e.y, 2)) < 80) this.triggerNearMiss();
            if (e.x + e.w < 0) this.entities.splice(i, 1);
        }
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) { this.floatingTexts[i].update(effDt); if (this.floatingTexts[i].dead) this.floatingTexts.splice(i, 1); }

        if (this.camTrauma > 0) { this.camTrauma = Math.max(0, this.camTrauma - 0.02 * dt); }
        if (this.feverT > 0) {
            this.feverT -= dt;
            if (this.particles && Math.random() > 0.7) {
                const feverColor = ['#FF00FF', '#00FFFF', '#FFFF00', '#FF1493'][Math.floor(Math.random() * 4)];
                this.particles.spawn(Math.random() * CANVAS_WIDTH, -20, feverColor, 1, 'star');
            }
        }
        if (!this.stateManager?.isCampaignMode?.()) {
            this._refreshProjectedUnlocks(this.scoreSystem.getProjectedTotal(this.score), false);
        }
        if (this.score >= this.getLevelTarget(this.level)) this.levelUp();
    }

    handleCollision(e, i) {
        if (e instanceof Obstacle) {
            if (this.frog.dashT > 0) {
                this.score += 50 * this.mult;
                this.floatingTexts.push(new FloatingText(e.x, e.y, "SMASH!", "#FF4500", 35, 'shake'));
                this.shake(15, 300);
                this.playSound('hit');

                // Art Director Phase 3: Thematic Burst Expansion
                const config = CHAPTER_REGISTRY[this.chapter] || CHAPTER_REGISTRY[1];
                this.particles.createThematicBurst(
                    e.x + e.w / 2,
                    e.y + e.h / 2,
                    config.colors || ['#FFF', '#444'],
                    config.ambient || 'default'
                );

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
                    this.frog.shieldHitT = 120; // 2 seconds of invincibility
                    this.triggerDamage();
                    this.playSound('hit');
                    this.shake(25, 500);
                    this.triggerFlash('#FF0000', 10);
                    this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 20, "LIFE LOST!", "#FF4444", 40, 'shake'));
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
                    this.candyStreak = 0;
                    this.stats.combosInCurrentLife.cowboy = true;
                    this.elephant.activate(300);
                    this.triggerFlash('#32CD32');
                    this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 50, "CANDY FRENZY!", "#32CD32", 40, 'pop'));
                    if (this.synth) this.synth.playCombo(10);
                }
            }
            col = '#32CD32';
        } else if (e instanceof Fly) {
            if (e.type === 'bomb') {
                this.bombCombo++;
                if (this.bombCombo >= 5) {
                    this.triggerBombExplosion();
                }
                col = '#FF4500';
                animType = 'shake';
            } else if (e.type === 'heart') {
                this.extraLifeHearts++;
                if (this.extraLifeHearts >= 10) {
                    this.lives++;
                    this.triggerFlash('#00FF00');
                    this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 50, "¡VIDA EXTRA!", "#00FF00", 42, 'pop'));
                    if (this.synth) this.synth.playAchievementFanfare();
                }
                col = '#FF4444';
            } else if (e.type === 'banana' || e.type === 'gold') {
                this.bananaCombo++;
                if (this.bananaCombo >= 5) {
                    // TODO: Implementar nueva acción para combo de 5 bananas
                }
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

        this.floatingTexts.push(new FloatingText(e.x, e.y, floatString, col, textSize, animType));
        this.particles.spawn(e.x, e.y, col, 15);
        this.entities.splice(i, 1);

        // Actualizar HUD antes de resetear combos para que se vea el estado "lleno"
        this.ui.updateHUD(finalPts);

        // Reseteo diferido de combos tras actualización visual
        if (this.bananaCombo >= 5) this.bananaCombo = 0;
        if (this.bombCombo >= 5) this.bombCombo = 0;
        if (this.extraLifeHearts >= 10) this.extraLifeHearts = 0;

        this.collectionStreak++;

        // Intensity update
        if (this.synth) this.synth.updateIntensity(this.collectionStreak);

        if (this.collectionStreak === 30) this.triggerFever();
    }

    handlePowerUp(p) {
        const cx = p.x + 45;
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
                this.triggerFlash('#FFD700');
                this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 50, "+1 VIDA!", "#FFD700", 40, 'pop'));
                if (this.synth) this.synth.playUnlock();
            } else {
                this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 50, "¡MAX!", "#FFD700", 35, 'pop'));
            }
        }
        // ===== CHAPTER 8 SPECIAL POWER-UPS =====
        else if (p.type === 'firework') {
            // Pirotecnia caliente - Massive score burst + screen clear
            this.shake(30, 800);
            this.clearObs();
            this.score += 500;
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "🎆 +500!", "#FFD700", 40, 'pop'));
            // Firework particles
            for (let i = 0; i < 30; i++) {
                this.particles.spawn(this.frog.x, this.frog.y, ['#FF4500', '#FFD700', '#FF6347', '#FFA500'][Math.floor(Math.random() * 4)], 5, 'spark');
            }
        }
        else if (p.type === 'winter_sun') {
            // Sol de invierno - Warmth clears ice, gives speed + invincibility
            this.frog.shieldActive = true;
            this.frog.shieldT = 600;
            this.iceT = 0; // Clear ice
            this.frog.speedBoostT = 300;
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "☀️ SOL!", "#FFD700", 35, 'pop'));
        }
        else if (p.type === 'ski') {
            // Esquís - Massive speed boost
            this.frog.speedBoostT = 480;
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "⛷️ VELOCIDAD!", "#00BFFF", 35, 'pop'));
        }
        else if (p.type === 'thermal_suit') {
            // Traje térmico - Full invulnerability + bonus points over time
            this.frog.shieldActive = true;
            this.frog.shieldT = 600;
            this.frog.thermalT = 600;
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "🧥 CALOR!", "#FF6347", 35, 'pop'));
        }
        else if (p.type === 'ice_warm') {
            // Warmth counter - clear ice, get points
            this.iceT = 0;
            this.score += 200;
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "🔥 +200", "#FF4500", 35, 'pop'));
        }
        else if (p.type === 'aurora') {
            // Aurora borealis - Bonus points + temporary score multiplier
            this.score += 300;
            if (this.mult < 3) {
                this.mult = 3;
                this.multT = 300;
            }
            this.floatingTexts.push(new FloatingText(this.frog.x, this.frog.y - 60, "🌌 +300 x3", "#9400D3", 40, 'pop'));
        }
        this.ui.updateHUD();
    }

    clearObs() { this.entities = this.entities.filter(e => !(e instanceof Obstacle)); }
    triggerEvent(type) {
        this.activeEvent = type;
        this.eventT = 600; // 10 seconds
        this.achievements.showToast({ title: "EVENT START!", desc: type, icon: "🔥" });
    }

    levelUp() {
        const oldChapter = this.chapter;
        const chapterCfg = this.getActiveChapterConfig(this.chapter);
        const maxLevel = this.levelManager.getMaxLevel(chapterCfg);
        const oldSubLevel = ((this.level - 1) % maxLevel) + 1;
        this.level++;

        // Limite absoluto de niveles por capítulo (30) para todos los modos de capítulos
        if (this.level > maxLevel) {
            this.chapterVictory();
            return;
        }

        // Track max level reached
        if (this.level > this.maxLevel) {
            this.maxLevel = this.level;
            localStorage.setItem('mx_max_level', this.level);
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
        this.floatingTexts.push(new FloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50, `LEVEL ${this.level}`, "#A6F616", 60, 'pop'));
        this.particles.spawn(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#A6F616', 50, 'spark');
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
            localStorage.setItem('mx_high_score', this.highScore);
        }

        if (this.chapter) {
            const chBestKey = `mx_ch${this.chapter}_best_score`;
            const chBest = parseInt(localStorage.getItem(chBestKey)) || 0;
            if (finalScore > chBest) localStorage.setItem(chBestKey, finalScore);

            const chMaxLevelKey = `mx_ch${this.chapter}_max_level`;
            const chMaxLevel = parseInt(localStorage.getItem(chMaxLevelKey)) || 0;
            if (this.level > chMaxLevel) localStorage.setItem(chMaxLevelKey, this.level);

            const chBestMultKey = `mx_ch${this.chapter}_best_mult`;
            const chBestMult = parseInt(localStorage.getItem(chBestMultKey)) || 1;
            if (this.maxMult > chBestMult) localStorage.setItem(chBestMultKey, this.maxMult);
        }

        if (!this.stateManager?.isCampaignMode?.()) {
            this.scoreGlobal = this.scoreSystem.commitRunScore(finalScore);
            this._refreshProjectedUnlocks(this.scoreGlobal, notifyUnlocks);
            this._saveAdaptiveProgress();
        }

        // 🐸 GANANCIA DE XANEZUS (1 por cada 1000 puntos)
        const xanezusEarned = Math.floor(finalScore / 1000);
        if (xanezusEarned > 0) {
            this.totalCoins += xanezusEarned;
            localStorage.setItem('mx_total_coins', this.totalCoins);

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
                icon: '🐸',
                title: 'RECOMPENSA',
                desc: `¡Obtienes ${xanezusEarned} FROG COINS 🐸!`
            });
        }
    }

    chapterVictory() {
        // 🎬 DESACTIVAR MODO CINEMATOGRÁFICO
        this.ui.toggleCinematicMode(false);

        this.state = 'VICTORY';
        this.ui.showOverlay('congratulations');
        this.synth.stopAll();
        const finalScore = Math.floor(this.score);
        this._finalizeRunScores(finalScore, true);
        if (this.ui.updateCongratulationsUI) this.ui.updateCongratulationsUI(finalScore);
    }

    gameOver() {
        // 🎬 DESACTIVAR MODO CINEMATOGRÁFICO
        this.ui.toggleCinematicMode(false);

        this.state = 'GAMEOVER';
        this.ui.showOverlay('gameover');
        this.synth.stopAll();
        this.totalDeaths++;
        localStorage.setItem('mx_total_deaths', this.totalDeaths);

        const finalScore = Math.floor(this.score);
        this._finalizeRunScores(finalScore, true);
        this.ui.vals.final.innerText = finalScore;
    }

    draw() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.filter = 'none';
        this.ctx.globalAlpha = 1.0;
        if (['MENU', 'CHAPTER_SELECT', 'SHOP', 'TROPHIES', 'LOADING'].includes(this.state)) this.renderMenu();
        else this.renderGame();
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

        // Draw Main Menu Background Image
        if (this.assets && this.assets.menuBG) {
            this.ctx.drawImage(this.assets.menuBG, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        this.ctx.save();
        this.menuParticles.forEach(p => {
            this.ctx.globalAlpha = 0.1 + Math.sin(Date.now() / 1000 + p.life * 10) * 0.05;
            this.ctx.fillStyle = '#A6F616';
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

        // ═══ PASS 1: Background (6 parallax layers) ═══
        if (this.biomeRenderer) this.biomeRenderer.drawBackground(this.ctx);



        // ═══ PASS 2: Action Layer (entities, player) ═══
        if (this.entities) this.entities.forEach(e => e.draw(this.ctx));
        if (this.frog) this.frog.draw(this.ctx);
        if (this.elephant?.active) this.elephant.draw(this.ctx);

        // ═══ PASS 3: Foreground + Atmosphere ═══
        if (this.biomeRenderer) this.biomeRenderer.drawForeground(this.ctx);



        if (this.particles) this.particles.draw(this.ctx);
        if (this.floatingTexts) this.floatingTexts.forEach(ft => ft.draw(this.ctx));
        if (this.weather) this.weather.draw(this.ctx);

        if (this.state === 'COUNTDOWN') this.drawCountdown();
        if (this.flashT > 0) { this.ctx.save(); this.ctx.globalAlpha = this.flashT / 10; this.ctx.fillStyle = this.flashColor; this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); this.ctx.restore(); this.flashT--; }

        this.ctx.restore();

        // ═══ PASS 4: Post-Processing (Vignette, Color Grade, Bloom) ═══
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
    }
    playSound(k) {
        if (!this.isSoundOn) return;
        this.sounds[k]?.play().catch(() => { });
    }
    collide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
    triggerFever() {
        this.feverT = 600;
        this.triggerFlash('#FF00FF', 15);
        this.floatingTexts.push(new FloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, "FEVER MODE!", "#FF00FF", 80, 'pop'));
        if (this.synth) this.synth.playBtnClick(); // Fallback sound
    }
    triggerNearMiss() {
        if (this.nearMissT > 0) return; // Cooldown for performance
        this.inNearMiss = true;
        this.nearMissT = 45;
        this.score += 100 * this.mult; // Reward for risky play
        this.ui.showNearMiss();
        this.floatingTexts.push(new FloatingText(this.frog.x + this.frog.w / 2, this.frog.y, "CLOSE! +100", "#FFF", 24, 'float'));
        this.shake(8, 200); // Subtle camera shake for 'near collision' impact
        if (this.synth) this.synth.playNearMiss();
    }
    updateDailyChallenge() { }
    buySkill(id, price) { if (this.totalCoins >= price) { this.totalCoins -= price; this.skills[id]++; this.ui.updateShopUI(); } }
    buyItem(id) { if (this.totalCoins >= 500) { this.totalCoins -= 500; this.ui.updateShopUI(); } }

    toggleMusic() {
        this.isMusicOn = !this.isMusicOn;
        localStorage.setItem('mx_music_on', this.isMusicOn ? '1' : '0');
        if (!this.isMusicOn) {
            this.synth.stopMusic();
            this.synth.stopProcedural();
            this.synth.stopMenuMusic();
            this.synth.stopArcadeSelectMusic?.();
        } else {
            if (this.state === 'MENU') this.synth.playMenuMusic();
            else if (this.state === 'CHAPTER_SELECT') {
                if (this.stateManager?.isArcadeMode?.()) this.synth.startArcadeSelectMusic?.();
                else this.synth.playMenuMusic();
            }
            else if (this.state === 'PLAYING') {
                const chapterSounds = this.assetLoader ? this.assetLoader.sounds : this.sounds;
                const track = chapterSounds[`bg${this.chapter}`];
                if (track) track.play().catch(() => { });
                this.synth.start(this.chapter);
            }
        }
        this.ui.updateSettingsUI();
        this.ui.updateAudioStatus();
    }

    toggleSound() {
        this.isSoundOn = !this.isSoundOn;
        localStorage.setItem('mx_sound_on', this.isSoundOn ? '1' : '0');
        this.ui.updateSettingsUI();
        this.ui.updateAudioStatus();
    }



    triggerBombExplosion() {
        this.shake(40, 1000);
        this.triggerFlash('#FF4500', 15);
        this.floatingTexts.push(new FloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, "BOOM!", "#FF4500", 65, 'shake'));

        if (this.synth) this.synth.playExplosion?.() || this.synth.playUnlock();

        const obstaclesToDestroy = this.entities.filter(e => e instanceof Obstacle && !e.dead);
        obstaclesToDestroy.forEach(e => this.destroyObstacle(e, false));
    }

    destroyObstacle(obs) {
        obs.dead = true;
        this.score += 75 * this.mult;

        const config = CHAPTER_REGISTRY[this.chapter] || CHAPTER_REGISTRY[1];
        this.particles.createThematicBurst(
            obs.x + obs.w / 2,
            obs.y + obs.h / 2,
            config.colors || ['#FFF', '#444'],
            config.ambient || 'default'
        );

        const idx = this.entities.indexOf(obs);
        if (idx > -1) this.entities.splice(idx, 1);
    }
}
