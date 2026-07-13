import { CHAPTER_REGISTRY } from './ChapterRegistry.js';

export class AssetLoader {
    constructor() {
        this.cache = {}; // Renamed from this.assets to avoid ANY confusion with game.assets
        this.sounds = {};
        this.globalObjects = {}; // Cache for universal "default skin" objects
        
        // Píxel transparente en Base64 para evitar errores críticos y pantallas negras
        this.TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }

    async load(images, audio) {
        const promises = [];

        // Enhanced image loader with silent fallback and transparent pixel
        const loadImg = (key, src, fallback = null) => new Promise(res => {
            const img = new Image();
            let timer = setTimeout(() => {
                res();
            }, 5000); 

            const tryLoad = (url, isFallback = false) => {
                img.src = url;
                img.onload = () => { 
                    clearTimeout(timer);
                    this.cache[key] = img; 
                    res(); 
                };
                img.onerror = () => {
                    if (fallback && url !== fallback) {
                        tryLoad(fallback, true);
                    } else if (!isFallback && url === src && fallback) {
                         tryLoad(fallback, true);
                    } else {
                        clearTimeout(timer);
                        img.onload = () => {
                            this.cache[key] = img;
                            res();
                        };
                        img.src = this.TRANSPARENT_PIXEL;
                    }
                };
            };
            tryLoad(src);
        });

        for (const [key, src] of Object.entries(images)) {
            // RESTAURACIÓN: Intentamos cargar el asset como .webp primero (como estaba antes)
            // pero lo hacemos de forma que no detenga el motor si falla
            const webpSrc = src.replace(/\.(svg|png|jpg)$/i, '.webp');
            if (webpSrc !== src) {
                promises.push(loadImg(key, webpSrc, src)); // Guess webp, fallback to original
            } else {
                promises.push(loadImg(key, src, null));
            }
        }
        if (audio) {
            for (const [key, src] of Object.entries(audio)) {
                // Try OGG first, then MP3 fallback
                const oggSrc = src.replace(/\.mp3$/i, '.ogg');
                promises.push(new Promise(res => {
                    const a = new Audio();
                    let timer = setTimeout(() => {
                        // Silencioso por defecto como antes de la limpieza extrema
                        res();
                    }, 6000); 

                    const tryLoad = (url) => {
                        a.src = url;
                        a.oncanplay = () => { 
                            clearTimeout(timer);
                            this.sounds[key] = a; 
                            res(); 
                        };
                        a.onerror = () => {
                            const mp3Src = url.replace(/\.ogg$/i, '.mp3');
                            if (url !== mp3Src) {
                                tryLoad(mp3Src);
                            } else {
                                clearTimeout(timer);
                                res();
                            }
                        };
                    };
                    tryLoad(oggSrc);
                }));
            }
        }

        await Promise.all(promises);
        return { assets: this.cache, sounds: this.sounds };
    }

    async _loadImageSilent(key, src, cache, fallback = null) {
        return new Promise(res => {
            const img = new Image();
            const tryLoad = (url, isFallback = false) => {
                img.src = url;
                img.onload = () => {
                    cache[key] = img;
                    res();
                };
                img.onerror = () => {
                    if (fallback && !isFallback) {
                        tryLoad(fallback, true);
                    } else {
                        img.src = this.TRANSPARENT_PIXEL;
                        img.onload = () => {
                            cache[key] = img;
                            res();
                        };
                    }
                };
            };
            tryLoad(src);
        });
    }

    async loadChapterAssets(chapter) {
        console.log(`ASSETS: Starting load for Chapter ${chapter}`);
        const promises = [];
        const chKey = `ch${chapter}`;
        const activeRegistry = window.game?.getActiveRegistry ? window.game.getActiveRegistry() : CHAPTER_REGISTRY;
        const config = activeRegistry[chapter] || CHAPTER_REGISTRY[chapter];
        const isABLMode = window.game?.stateManager?.isABLMode?.() === true;
        const dir = config ? config.assetsDir : `capitulo_${chapter}`;
        const audioBaseName = dir ? dir.split('/').pop() : null;

        // Free previous chapter cache to save memory
        for (const key of Object.keys(this.cache)) {
            if (key.startsWith('ch') && key !== chKey) delete this.cache[key];
        }

        if (!this.cache[chKey]) this.cache[chKey] = {};
        const chCache = this.cache[chKey];

        // 🟢 Personaje + Companion (ABL mode renders character procedurally)
        // 🟢 Personaje + Companion (ABL mode renders character procedurally)
        if (!isABLMode) {
            const charPaths = [
                { key: 'frog', path: `assets/${dir}/personaje/frog.svg`, fallback: `assets/${dir}/personaje/frog.png` },
                { key: 'frog_up', path: `assets/${dir}/personaje/frog_up.svg`, fallback: `assets/${dir}/personaje/frog_up.png` },
                { key: 'frog_dn', path: `assets/${dir}/personaje/frog_dn.svg`, fallback: `assets/${dir}/personaje/frog_dn.png` },
                { key: 'frog_c', path: `assets/${dir}/personaje/frog_c.svg`, fallback: `assets/${dir}/personaje/frog_c.png` },
                { key: 'comp', path: `assets/${dir}/personaje/comp.svg`, fallback: `assets/${dir}/personaje/comp.png` }
            ];
            for (const file of charPaths) {
                promises.push(this._loadImageSilent(file.key, file.path, chCache, file.fallback));
            }
        }

        // 🖼️ Fondos por nivel - OPTIMIZED: Prioridad nivel actual
        const currentLevel = window.game ? window.game.level : 1;
        const normalizedLevel = ((currentLevel - 1) % 30) + 1;
        
        const priorityLevels = [normalizedLevel];
        const secondaryLevels = Array.from({length: 30}, (_, i) => i + 1);
        const secondaryPromises = [];

        if (!isABLMode) {
            // Prioridad para fondos - ONLY current level
            // Cargamos siempre todas las capas para evitar pantallas negras y permitir transiciones fluidas
            const bgLayers = ['fondo_lejano', 'fondo_intermedio', 'fondo_proximo', 'decoraciones'];
            for (const lvl of priorityLevels) {
                const levelDir = `assets/${dir}/fondos/nivel_${lvl}`;
                for (const layerId of bgLayers) {
                    promises.push(this._loadImageSilent(
                        `new_bg_ch${chapter}_l${lvl}_${layerId}`,
                        `${levelDir}/${layerId}.webp`,
                        chCache,
                        `${levelDir}/${layerId}.png`
                    ));
                }
            }
            
            // Niveles secundarios en background - non-blocking
            for (const lvl of secondaryLevels) {
                if (lvl === normalizedLevel) continue; // Skip current level
                const levelDir = `assets/${dir}/fondos/nivel_${lvl}`;
                const bgLayers = ['fondo_lejano', 'fondo_intermedio', 'fondo_proximo', 'decoraciones'];
                for (const layerId of bgLayers) {
                    secondaryPromises.push(this._loadImageSilent(
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
            // RESTAURACIÓN: Intentar webp como prioridad, luego svg original
            const itemPath = `assets/${dir}/objetos/${item}`;
            promises.push(this._loadImageSilent(item, `${itemPath}.webp`, chCache, `${itemPath}.svg`));
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
                `assets/${dir}/audios/${audioBaseName}.ogg`,
                `assets/${dir}/audios/${audioBaseName}.mp3`,
                `assets/${dir}/audios/${audioBaseName}.wav`
            ];

            promises.push(new Promise(res => {
                const a = new Audio();
                let timer = setTimeout(() => {
                    console.warn(`ASSETS: Music timeout for Chapter ${chapter}`);
                    res();
                }, 8000); // 8s safety for music

                const tryLoad = (idx) => {
                    const src = musicCandidates[idx];
                    a.src = src;
                    // Switch to oncanplay for speed
                    a.oncanplay = () => { 
                        clearTimeout(timer);
                        this.sounds[`bg${chapter}`] = a; 
                        console.log(`ASSETS: Chapter ${chapter} music ready (${src})`); 
                        res(); 
                    };
                    a.onerror = () => {
                        if (idx + 1 < musicCandidates.length) tryLoad(idx + 1);
                        else { 
                            clearTimeout(timer);
                            console.warn(`ASSETS: Music missing`); 
                            res(); 
                        }
                    };
                };
                tryLoad(0);
            }));
        }

        await Promise.all(promises);
        console.log(`ASSETS: Chapter ${chapter} (Priority) loaded`);

        // Start background loading of secondary assets
        if (secondaryPromises && secondaryPromises.length > 0) {
            Promise.all(secondaryPromises).then(() => {
                console.log(`[AssetLoader] Success: Background levels 6-10 for Chapter ${chapter} loaded.`);
            }).catch(err => {
                console.error(`[AssetLoader] Background loading failed:`, err);
            });
        }
    }

    async preloadChapterThumbnails() {
        console.log("ASSETS: Preloading Chapter Thumbnails...");
        const registries = [
            { reg: CHAPTER_REGISTRY, prefix: 'story' },
            { reg: window.game?.arcadeRegistry || {}, prefix: 'arcade' },
            { reg: window.game?.ablRegistry || {}, prefix: 'abl' }
        ];

        const promises = [];
        this.cache['thumbs'] = this.cache['thumbs'] || {};
        const thumbCache = this.cache['thumbs'];

        for (const { reg, prefix } of registries) {
            for (const [id, config] of Object.entries(reg)) {
                if (config.assetsDir) {
                    // Candidatos comunes de miniaturas en el sistema de archivos del usuario
                    const thumbCandidates = [
                        `assets/${config.assetsDir}/fondos/nivel_1/fondo_proximo.webp`,
                        `assets/${config.assetsDir}/fondos/nivel_1/fondo_intermedio.webp`,
                        `assets/${config.assetsDir}/fondos/nivel_1/fondo_lejano.webp`,
                        `assets/${config.assetsDir}/fondos/nivel_1/fondo_proximo.png`,
                        `assets/${config.assetsDir}/fondos/nivel_1/fondo_intermedio.png`,
                        `assets/${config.assetsDir}/fondos/nivel_1/fondo_lejano.png`,
                        `assets/${config.assetsDir}/fondos/bg_l01.svg`,
                        `assets/${config.assetsDir}/personaje/frog.svg`
                    ];
                    
                    const recursiveTry = (index, key) => {
                        if (index >= thumbCandidates.length) {
                            // Si todos fallan, se creará el placeholder silencioso
                            return this._loadImageSilent(key, thumbCandidates[0], thumbCache);
                        }
                        
                        return new Promise(res => {
                            const img = new Image();
                            img.src = thumbCandidates[index];
                            img.onload = () => {
                                thumbCache[key] = img;
                                res(true);
                            };
                            img.onerror = () => {
                                recursiveTry(index + 1, key).then(res);
                            };
                        });
                    };

                    promises.push(recursiveTry(0, `thumb_${prefix}_${id}`));
                }
            }
        }

        await Promise.all(promises);
        console.log("ASSETS: Chapter Thumbnails Preloaded Successfully");
    }

    async preloadChapter1Full(id = 1) {
        const config = CHAPTER_REGISTRY[id];
        const base = `assets/${config.assetsDir}`;
        const chKey = `ch${id}`;
        if (!this.cache[chKey]) this.cache[chKey] = {};
        const chCache = this.cache[chKey];

        // 1. Personaje (Skins)
        const skins = ['frog', 'frog_up', 'frog_dn', 'frog_c'];
        for (const s of skins) {
            await this._loadImageSilent(s, `${base}/personaje/${s}.svg`, chCache);
        }

        // 2. Obstáculos (Top & Bot)
        const tops = ['liana', 'serpiente'];
        const bots = ['totem', 'tronco', 'ruina'];
        for (const t of tops) {
            await this._loadImageSilent(`obs_top_${t}`, `${base}/obstaculos/obs_top_${t}.svg`, chCache);
        }
        for (const b of bots) {
            await this._loadImageSilent(`obs_bot_${b}`, `${base}/obstaculos/obs_bot_${b}.svg`, chCache);
        }

        // 3. Fondo Intermedio
        await this._loadImageSilent('bg_intermedio', `${base}/fondos/nivel_1/fondo_intermedio.webp`, chCache);
        
        // 4. Música
        const audioPath = `${base}/audios/1-selva-tropical.ogg`;
        if (window.game && window.game.audio) {
            window.game.audio.loadChapterMusic(id, audioPath);
        }
    }

    async preloadAllChapters() {
        const total = Object.keys(CHAPTER_REGISTRY).length;
        // First load global defaults as requested by user
        await this.loadGlobalObjects();
        // Preload thumbnails for smooth UI
        await this.preloadChapterThumbnails();

        // OPTIMIZED: Only preload first 3 chapters on startup to avoid bottleneck
        // Remaining chapters will load on-demand when selected
        const preloadLimit = Math.min(3, total);
        console.log(`[AssetLoader] Preloading first ${preloadLimit} chapters (out of ${total})...`);
        
        for (let c = 1; c <= preloadLimit; c++) {
            try {
                await this.loadChapterAssets(c);
            } catch (e) {
                console.warn("[AssetLoader] Preload chapter", c, "failed:", e);
            }
        }
        
        // Background load remaining chapters without blocking
        if (preloadLimit < total) {
            console.log(`[AssetLoader] Background loading chapters ${preloadLimit + 1}-${total}...`);
            for (let c = preloadLimit + 1; c <= total; c++) {
                // Non-blocking background load
                this.loadChapterAssets(c).catch(e => 
                    console.warn("[AssetLoader] Background preload chapter", c, "failed:", e)
                );
            }
        }
        
        console.log("ASSETS: Priority preloading complete");
    }

    /**
     * Loads high-quality assets from Chapter 1's objects folder to be used as global defaults.
     * This ensures all levels and chapters have the premium skins defined by the user.
     */
    async loadGlobalObjects() {
        console.log("ASSETS: Loading Global Default Skins (from Chapter 1)...");
        this.cache['global'] = this.cache['global'] || {};
        this.globalObjects = this.cache['global'];
        const promises = [];
        const dir = 'story/1-selva-tropical';
        const items = [
            'coin', 'banana', 'fly_gold',
            'hourglass', 'magnet', 'shield', 'star', 'clock', 'ghost', 'bolt', 'bomb',
            'ice', 'clover', 'rainbow', 'heart',
            'ruby', 'crown', 'emerald', 'pearl', 'diamond',
            'feather', 'gift', 'mini'
        ];
        const candies = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'grey'];
        candies.forEach(c => items.push(`candy_${c}`));

        for (const item of items) {
            // Prioridad RESTAURADA: webp -> svg -> png
            const itemBase = `assets/${dir}/objetos/${item}`;
            promises.push(this._loadImageSilent(
                item,
                `${itemBase}.webp`,
                this.cache['global'],
                `${itemBase}.svg` // fallback 1
            ));
        }

        await Promise.all(promises);
        this.globalObjects = this.cache['global'];
        console.log("ASSETS: Global Default Skins Loaded Successfully");
    }

    _loadImageSilent(key, path, cache, fallbackPath = null) {
        return new Promise(res => {
            const img = new Image();
            let timer = setTimeout(() => { res(); }, 5000);

            const tryLoad = (src, isFallback = false) => {
                img.src = src;
                img.onload = () => { 
                    clearTimeout(timer);
                    cache[key] = img; 
                    res(); 
                };
                img.onerror = () => {
                    if (fallbackPath && src !== fallbackPath) {
                        tryLoad(fallbackPath, true);
                    } else {
                        clearTimeout(timer);
                        // Fallback final silencioso con píxel transparente
                        const ph = new Image();
                        ph.src = this.TRANSPARENT_PIXEL;
                        ph.onload = () => {
                            cache[key] = ph;
                            res();
                        };
                    }
                };
            };
            tryLoad(path);
        });
    }

}
