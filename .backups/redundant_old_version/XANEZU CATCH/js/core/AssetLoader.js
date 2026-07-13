import { CHAPTER_REGISTRY } from './ChapterRegistry.js';

export class AssetLoader {
    constructor() {
        this.cache = {}; // Renamed from this.assets to avoid ANY confusion with game.assets
        this.sounds = {};
        this.globalObjects = {}; // Cache for universal "default skin" objects
    }

    async load(images, audio) {
        const promises = [];

        // Enhanced image loader with WebP fallback
        const loadImg = (key, src, fallback = null) => new Promise(res => {
            const img = new Image();
            const tryLoad = (url) => {
                img.src = url;
                img.onload = () => { this.cache[key] = img; res(); };
                img.onerror = () => {
                    if (fallback && url !== fallback) {
                        tryLoad(fallback);
                    } else {
                        console.warn("Missing:", url);
                        res();
                    }
                };
            };
            tryLoad(src);
        });

        const loadAud = (key, src) => new Promise(res => {
            const a = new Audio(src);
            a.oncanplaythrough = () => { this.sounds[key] = a; res(); };
            a.onerror = () => { console.warn("Audio Missing:", src); res(); };
        });

        for (const [key, src] of Object.entries(images)) {
            // Check if there's a WebP version available
            const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
            promises.push(loadImg(key, webpSrc, src));
        }
        if (audio) {
            for (const [key, src] of Object.entries(audio)) {
                // Try OGG first, then MP3 fallback
                const oggSrc = src.replace(/\.mp3$/i, '.ogg');
                promises.push(new Promise(res => {
                    const a = new Audio();
                    const tryLoad = (url) => {
                        a.src = url;
                        a.oncanplaythrough = () => { this.sounds[key] = a; res(); };
                        a.onerror = () => {
                            if (url === oggSrc) tryLoad(src);
                            else { console.warn("Audio Missing:", url); res(); }
                        };
                    };
                    tryLoad(oggSrc);
                }));
            }
        }

        await Promise.all(promises);
        return { assets: this.cache, sounds: this.sounds };
    }

    async loadChapterAssets(chapter) {
        console.log(`ASSETS: Starting load for Chapter ${chapter}`);
        const promises = [];
        const chKey = `ch${chapter}`;
        const activeRegistry = window.game?.getActiveRegistry ? window.game.getActiveRegistry() : CHAPTER_REGISTRY;
        const config = activeRegistry[chapter] || CHAPTER_REGISTRY[chapter];
        const isABLMode = window.game?.stateManager?.isABLMode?.() === true;
        const dir = config ? config.assetsDir : `capitulo_${chapter}`;

        // Free previous chapter cache to save memory
        for (const key of Object.keys(this.cache)) {
            if (key.startsWith('ch') && key !== chKey) delete this.cache[key];
        }

        if (!this.cache[chKey]) this.cache[chKey] = {};
        const chCache = this.cache[chKey];

        // 🟢 Personaje + Companion (ABL mode renders character procedurally)
        if (!isABLMode) {
            const charPaths = [
                { key: 'frog', path: `assets/${dir}/personaje/frog.svg` },
                { key: 'frog_up', path: `assets/${dir}/personaje/frog_up.svg` },
                { key: 'frog_dn', path: `assets/${dir}/personaje/frog_dn.svg` },
                { key: 'frog_c', path: `assets/${dir}/personaje/frog_c.svg` },
                { key: 'comp', path: `assets/${dir}/personaje/comp.svg` }
            ];
            for (const file of charPaths) {
                promises.push(this._loadImageSilent(file.key, file.path, chCache));
            }
        }

        // 🖼️ Fondos por nivel
        const currentLevel = window.game ? window.game.level : 1;
        const normalizedLevel = ((currentLevel - 1) % 30) + 1;

        const levelsToLoad = [];
        const maxLevels = 30;
        for (let i = 1; i <= maxLevels; i++) levelsToLoad.push(i);

        if (!isABLMode) {
            for (const lvl of levelsToLoad) {
                const levelDir = `assets/${dir}/fondos/nivel_${lvl}`;
                const bgLayers = ['fondo_lejano', 'fondo_intermedio', 'fondo_proximo', 'decoraciones'];

                for (const layerId of bgLayers) {
                    promises.push(this._loadImageSilent(
                        `new_bg_ch${chapter}_l${lvl}_${layerId}`,
                        `${levelDir}/${layerId}.webp`,
                        chCache,
                        `${levelDir}/${layerId}.png`
                    ));
                }
            }

            // Carga de fondos institucionales/estáticos heredados (bg_l01 a bg_l06)
            for (let i = 1; i <= 6; i++) {
                promises.push(this._loadImageSilent(`bg_l0${i}`, `assets/${dir}/fondos/bg_l0${i}.svg`, chCache));
            }
        }

        // 🧱 Obstáculos por nivel
        if (!isABLMode && chapter !== 2 && chapter !== 7) {
            for (let i = 1; i <= 6; i++) {
                if (chapter <= 16) {
                    promises.push(this._loadImageSilent(`new_obs_ch${chapter}_l${normalizedLevel}_obs_l0${i}`, `assets/${dir}/obstaculos/nivel_${normalizedLevel}/obs_l0${i}.webp`, chCache, `assets/${dir}/obstaculos/nivel_${normalizedLevel}/obs_l0${i}.png`));
                }
                promises.push(this._loadImageSilent(`new_obs_ch${chapter}_l${normalizedLevel}_obs_l0${i}_svg`, `assets/${dir}/obstaculos/nivel_${normalizedLevel}/obs_l0${i}.svg`, chCache));
            }
        }

        // 🟡 Objetos
        const items = [
            'coin', 'banana', 'fly_gold',
            'hourglass', 'magnet', 'shield', 'star', 'clock', 'ghost', 'bolt', 'bomb',
            'ice', 'clover', 'rainbow', 'heart',
            'ruby', 'crown', 'emerald', 'pearl', 'diamond'
        ];
        const candies = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'grey'];
        candies.forEach(c => items.push(`candy_${c}`));

        for (const item of items) {
            promises.push(this._loadImageSilent(item, `assets/${dir}/objetos/${item}.svg`, chCache));
        }

        // 🧱 Obstáculos genéricos SVG
        if (!isABLMode) {
            for (let i = 1; i <= 6; i++) {
                promises.push(this._loadImageSilent(`obs_l0${i}`, `assets/${dir}/obstaculos/obs_l0${i}.svg`, chCache));
                promises.push(this._loadImageSilent(`obs_bot_l0${i}`, `assets/${dir}/obstaculos/obs_bot_l0${i}.svg`, chCache));
                promises.push(this._loadImageSilent(`obs_top_l0${i}`, `assets/${dir}/obstaculos/obs_top_l0${i}.svg`, chCache));
            }
        }

        // Chapter Specific
        const chapterSpecificObs = {
            1: { bot: ['totem', 'tronco', 'ruina', 'estatua'], top: ['liana', 'serpiente', 'fruta'] },
            2: { bot: ['cactus', 'craneo', 'obelisco', 'rodadora', 'vasija', 'arbusto', 'anubis'], top: ['lampara', 'toldo', 'cornisa', 'liana_seca', 'nido', 'candelabro', 'arana', 'cuerda'], single: ['obs_scorpion', 'obs_scorpion_desert'] },
            3: { single: ['obs_oni_red', 'obs_oni_blue'] },
            4: { single: ['obs_pixie', 'obs_vines', 'obs_crystal'] },
            5: { single: ['obs_mud_ghost', 'obs_mud_roots', 'obs_mud_pit'] },
            6: { single: ['obs_toy_soldier_bot', 'obs_toy_soldier_top', 'obs_toy_robot'] },
            7: { single: ['obs_cactus_hat', 'obs_pinata', 'obs_luchador'] },
            8: { single: ['obs_penguin_sled', 'obs_ice_spike_top', 'obs_ice_spike_bot'] },
            9: { single: ['obs_arcade_neon_top', 'obs_arcade_neon_bot'] },
            10: { single: ['obs_space_sat_top', 'obs_space_sat_bot'] },
            11: { single: ['obs_lava_rock_top', 'obs_lava_rock_bot'] },
            12: { single: ['obs_retro_pylon_top', 'obs_retro_pylon_bot'] },
            13: { single: ['obs_ruin_arch_top', 'obs_ruin_arch_bot'] },
            14: { single: ['obs_moon_drill_top', 'obs_moon_drill_bot'] },
            15: { single: ['obs_crystal_shard_top', 'obs_crystal_shard_bot'] },
            16: { single: ['obs_city_beam_top', 'obs_city_beam_bot'] }
        };

        const obsConfig = isABLMode ? null : chapterSpecificObs[chapter];
        console.log(`[AssetLoader] Chapter: ${chapter}, dir: ${dir}, obsConfig:`, obsConfig);
        if (obsConfig) {
            if (obsConfig.bot) obsConfig.bot.forEach(n => promises.push(this._loadImageSilent(`obs_bot_${n}`, `assets/${dir}/obstaculos/obs_bot_${n}.svg`, chCache)));
            if (obsConfig.top) obsConfig.top.forEach(n => promises.push(this._loadImageSilent(`obs_top_${n}`, `assets/${dir}/obstaculos/obs_top_${n}.svg`, chCache)));
            if (obsConfig.single) obsConfig.single.forEach(n => {
                // Load SVG first and PNG fallback using one key
                promises.push(this._loadImageSilent(n, `assets/${dir}/obstaculos/${n}.svg`, chCache, `assets/${dir}/obstaculos/${n}.png`));
            });
        }

        // 🔊 Audio del Capítulo (skip si el capítulo usa música procedural)
        if (config?.musicMode !== 'procedural') {
            const musicCandidates = [
                `assets/${dir}/audios/${dir}.ogg`,
                `assets/${dir}/audios/${dir}.mp3`,
                `assets/${dir}/audios/${dir}.wav`
            ];

            promises.push(new Promise(res => {
                const a = new Audio();
                const tryLoad = (idx) => {
                    const src = musicCandidates[idx];
                    a.src = src;
                    a.oncanplaythrough = () => { this.sounds[`bg${chapter}`] = a; console.log(`ASSETS: Chapter ${chapter} music loaded (${src})`); res(); };
                    a.onerror = () => {
                        if (idx + 1 < musicCandidates.length) tryLoad(idx + 1);
                        else { console.warn(`ASSETS: Music missing`); res(); }
                    };
                };
                tryLoad(0);
            }));
        }

        await Promise.all(promises);
        console.log(`ASSETS: Chapter ${chapter} loaded`);
    }

    async preloadAllChapters() {
        const total = Object.keys(CHAPTER_REGISTRY).length;
        // First load global defaults as requested by user
        await this.loadGlobalObjects();

        for (let c = 1; c <= total; c++) {
            try {
                await this.loadChapterAssets(c);
            } catch (e) {
                console.warn("[AssetLoader] Preload chapter", c, "failed:", e);
            }
        }
        console.log("ASSETS: Preloading of all chapters complete");
    }

    /**
     * Loads high-quality assets from Chapter 1's objects folder to be used as global defaults.
     * This ensures all levels and chapters have the premium skins defined by the user.
     */
    async loadGlobalObjects() {
        console.log("ASSETS: Loading Global Default Skins (from Chapter 1)...");
        this.cache['global'] = this.cache['global'] || {};
        const promises = [];
        const dir = 'campaign/1-selva-tropical';
        const items = [
            'coin', 'banana', 'fly_gold',
            'hourglass', 'magnet', 'shield', 'star', 'clock', 'ghost', 'bolt', 'bomb',
            'ice', 'clover', 'rainbow', 'heart',
            'ruby', 'crown', 'emerald', 'pearl', 'diamond',
            'cyber_drone', 'feather', 'gift', 'mini', 'spring', 'star_crystal'
        ];
        const candies = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'grey'];
        candies.forEach(c => items.push(`candy_${c}`));

        for (const item of items) {
            // Priority: WebP -> SVG for global defaults
            promises.push(this._loadImageSilent(
                item,
                `assets/${dir}/objetos/${item}.webp`,
                this.cache['global'],
                `assets/${dir}/objetos/${item}.svg`
            ));
        }

        await Promise.all(promises);
        console.log("ASSETS: Global Default Skins Loaded Successfully");
    }

    _loadImageSilent(key, path, cache, fallbackPath = null) {
        return new Promise(res => {
            const img = new Image();

            const tryLoad = (src) => {
                img.src = src;
                img.onload = () => { cache[key] = img; console.log(`[AssetLoader] Loaded: ${key} from ${src}`); res(); };
                img.onerror = () => {
                    if (fallbackPath && src === path) {
                        tryLoad(fallbackPath);
                        return;
                    }
                    // Graceful placeholder so gameplay/rendering never breaks on missing assets
                    const ph = document.createElement('canvas');
                    ph.width = 32;
                    ph.height = 32;
                    const pctx = ph.getContext('2d');
                    pctx.clearRect(0, 0, 32, 32); // Pure transparency for placeholders
                    const placeholder = new Image();
                    placeholder.src = ph.toDataURL('image/png');
                    placeholder.isPlaceholder = true; // Mark as placeholder for fallback detection
                    cache[key] = placeholder;
                    console.warn(`[AssetLoader] Failed: ${key} from ${src} (using placeholder)`);
                    res();
                };
            };

            tryLoad(path);
        });
    }

}
