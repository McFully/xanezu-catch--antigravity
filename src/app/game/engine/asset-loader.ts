import { CHAPTER_REGISTRY, ChapterConfig } from './chapter-registry';

export class AssetLoader {
    public cache: { [key: string]: any } = {};
    public sounds: { [key: string]: HTMLAudioElement } = {};
    public globalObjects: { [key: string]: HTMLImageElement } = {};
    
    private readonly TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    
    public onProgress: ((progress: number) => void) | null = null;
    public onAssetLoaded: ((name: string) => void) | null = null;

    constructor() {}

    async load(images: { [key: string]: string }, audio?: { [key: string]: string }) {
        const promises: Promise<void>[] = [];

        const loadImg = (key: string, src: string, fallback: string | null = null) => new Promise<void>(res => {
            const img = new Image();
            let timer = setTimeout(() => {
                res();
            }, 5000); 

            const tryLoad = (url: string, isFallback = false) => {
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
            const webpSrc = src.replace(/\.(svg|png|jpg)$/i, '.webp');
            if (webpSrc !== src) {
                promises.push(loadImg(key, src, webpSrc));
            } else {
                promises.push(loadImg(key, src, null));
            }
        }

        if (audio) {
            for (const [key, src] of Object.entries(audio)) {
                const oggSrc = src.replace(/\.mp3$/i, '.ogg');
                promises.push(new Promise<void>(res => {
                    const a = new Audio();
                    let timer = setTimeout(() => {
                        res();
                    }, 6000); 

                    const tryLoad = (url: string) => {
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

    private async _loadImageSilent(key: string, src: string, cache: any, fallback: string | null = null): Promise<void> {
        if (this.onAssetLoaded) this.onAssetLoaded(src.split('/').pop() || '');
        return new Promise(res => {
            const img = new Image();
            const tryLoad = (url: string, isFallback = false) => {
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

    async loadChapterAssets(chapter: number, gameRef?: any) {
        console.log(`ASSETS: Starting load for Chapter ${chapter}`);
        const promises: Promise<void>[] = [];
        const chKey = `ch${chapter}`;
        
        // Use provided gameRef or fallback to CHAPTER_REGISTRY
        const config = CHAPTER_REGISTRY[chapter];
        const isABLMode = gameRef?.stateManager?.isABLMode?.() === true;
        const dir = config ? config.assetsDir : `capitulo_${chapter}`;
        const audioBaseName = dir ? dir.split('/').pop() : null;

        // Free previous chapter cache
        for (const key of Object.keys(this.cache)) {
            if (key.startsWith('ch') && key !== chKey) delete this.cache[key];
        }

        if (!this.cache[chKey]) this.cache[chKey] = {};
        const chCache = this.cache[chKey];

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

        const currentLevel = gameRef ? gameRef.level : 1;
        const normalizedLevel = ((currentLevel - 1) % 30) + 1;
        
        const priorityLevels = [normalizedLevel];
        const secondaryLevels = Array.from({length: 30}, (_, i) => i + 1);

        if (!isABLMode) {
            const isStory = gameRef?.stateManager?.isStoryMode?.() === true;
            const bgLayers = isStory ? ['fondo_intermedio'] : ['fondo_lejano', 'fondo_intermedio', 'fondo_proximo', 'decoraciones'];

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
            
            const backgroundLevels = secondaryLevels.filter(l => l !== normalizedLevel);
            this._startBackgroundLevelLoading(chapter, backgroundLevels, chCache, dir, gameRef);
        }

        if (!isABLMode) {
            for (let i = 1; i <= 6; i++) {
                if (chapter <= 16) {
                    promises.push(this._loadImageSilent(`new_obs_ch${chapter}_l${normalizedLevel}_obs_l0${i}`, `assets/${dir}/obstaculos/nivel_${normalizedLevel}/obs_l0${i}.webp`, chCache, `assets/${dir}/obstaculos/nivel_${normalizedLevel}/obs_l0${i}.png`));
                }
                promises.push(this._loadImageSilent(`new_obs_ch${chapter}_l${normalizedLevel}_obs_l0${i}_svg`, `assets/${dir}/obstaculos/nivel_${normalizedLevel}/obs_l0${i}.svg`, chCache));
            }
        }

        const items = [
            'coin', 'banana', 'fly_gold',
            'hourglass', 'magnet', 'shield', 'star', 'clock', 'ghost', 'bolt', 'bomb',
            'ice', 'clover', 'rainbow', 'heart',
            'ruby', 'crown', 'emerald', 'pearl', 'diamond'
        ];
        const candies = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'grey'];
        candies.forEach(c => items.push(`candy_${c}`));

        for (const item of items) {
            const itemPath = `assets/${dir}/objetos/${item}`;
            promises.push(this._loadImageSilent(item, `${itemPath}.svg`, chCache, `${itemPath}.webp`));
        }

        if (!isABLMode) {
            const genericObs = ['obs_l01', 'obs_bot_l01', 'obs_top_l01']; 
            for (const obs of genericObs) {
                promises.push(this._loadImageSilent(obs, `assets/${dir}/obstaculos/${obs}.svg`, chCache));
            }
        }

        const chapterSpecificObs: { [key: number]: any } = {
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
        if (obsConfig) {
            if (obsConfig.bot) obsConfig.bot.forEach((n: string) => promises.push(this._loadImageSilent(`obs_bot_${n}`, `assets/${dir}/obstaculos/obs_bot_${n}.svg`, chCache)));
            if (obsConfig.top) obsConfig.top.forEach((n: string) => promises.push(this._loadImageSilent(`obs_top_${n}`, `assets/${dir}/obstaculos/obs_top_${n}.svg`, chCache)));
            if (obsConfig.single) obsConfig.single.forEach((n: string) => {
                promises.push(this._loadImageSilent(n, `assets/${dir}/obstaculos/${n}.svg`, chCache, `assets/${dir}/obstaculos/${n}.png`));
            });
        }

        if (config?.musicMode !== 'procedural') {
            const musicCandidates = [
                `assets/${dir}/audios/${audioBaseName}.ogg`,
                `assets/${dir}/audios/${audioBaseName}.mp3`,
                `assets/${dir}/audios/${audioBaseName}.wav`
            ];

            // Cargar música en segundo plano para evitar retrasar la pantalla de carga
            const a = new Audio();
            a.preload = 'auto';
            const tryLoad = (idx: number) => {
                if (idx >= musicCandidates.length) return;
                const src = musicCandidates[idx];
                a.src = src;
                a.oncanplay = () => { 
                    this.sounds[`bg${chapter}`] = a; 
                    console.log(`[AssetLoader] Chapter ${chapter} music buffered in background.`);
                    // Si el juego ya empezó y no hay música reproduciéndose, arrancar
                    if (gameRef?.musicSynth && !gameRef.musicSynth.currentMusicSource) {
                        gameRef.musicSynth.playChapterMusic(chapter, gameRef);
                    }
                };
                a.onerror = () => {
                    tryLoad(idx + 1);
                };
            };
            tryLoad(0);
        }

        const total = promises.length;
        let loadedCount = 0;
        const trackedPromises = promises.map(p => p.then(() => {
            loadedCount++;
            if (this.onProgress) this.onProgress(Math.floor((loadedCount / total) * 100));
        }));

        await Promise.all(trackedPromises);
        console.log(`ASSETS: Chapter ${chapter} (Priority) loaded`);
    }

    private async _startBackgroundLevelLoading(chapter: number, levels: number[], cache: any, dir: string, gameRef?: any) {
        const isStory = gameRef?.stateManager?.isStoryMode?.() === true;
        const bgLayers = isStory ? ['fondo_intermedio'] : ['fondo_lejano', 'fondo_intermedio', 'fondo_proximo', 'decoraciones'];
        
        for (const lvl of levels) {
            const levelPromises: Promise<void>[] = [];
            const levelDir = `assets/${dir}/fondos/nivel_${lvl}`;
            
            for (const layerId of bgLayers) {
                levelPromises.push(this._loadImageSilent(
                    `new_bg_ch${chapter}_l${lvl}_${layerId}`,
                    `${levelDir}/${layerId}.webp`,
                    cache,
                    `${levelDir}/${layerId}.png`
                ));
            }
            
            try {
                await Promise.all(levelPromises);
                if ((window as any).requestIdleCallback) {
                    await new Promise(res => (window as any).requestIdleCallback(res, { timeout: 200 }));
                }
            } catch (e) {
                console.warn(`[AssetLoader] Background load failed for level ${lvl}:`, e);
            }
        }
        console.log(`[AssetLoader] Success: All background levels for Chapter ${chapter} loaded.`);
    }

    async preloadAllChapters(gameRef?: any) {
        await this.loadGlobalObjects();
        const total = Object.keys(CHAPTER_REGISTRY).length;
        const preloadLimit = Math.min(3, total);
        
        for (let c = 1; c <= preloadLimit; c++) {
            this.loadChapterAssets(c, gameRef).catch(e => 
                console.warn(`[AssetLoader] Preload chapter ${c} failed:`, e)
            );
        }
        
        if (preloadLimit < total) {
            for (let c = preloadLimit + 1; c <= total; c++) {
                this.loadChapterAssets(c, gameRef).catch(e => 
                    console.warn("[AssetLoader] Background preload chapter", c, "failed:", e)
                );
            }
        }
    }

    async loadGlobalObjects() {
        console.log("ASSETS: Loading Global Default Skins (from Chapter 1)...");
        this.cache['global'] = this.cache['global'] || {};
        const promises: Promise<void>[] = [];
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
            const itemBase = `assets/${dir}/objetos/${item}`;
            promises.push(this._loadImageSilent(
                item,
                `${itemBase}.svg`,
                this.cache['global'],
                `${itemBase}.webp`
            ));
        }

        await Promise.all(promises);
        this.globalObjects = this.cache['global'];
        console.log("ASSETS: Global Default Skins Loaded Successfully");
    }

    clearAll() {
        console.log("ASSETS: Disposing all loaded textures and audios...");
        // Parar audios cargados para evitar fugas
        for (const sound of Object.values(this.sounds)) {
            sound.pause();
            sound.src = '';
        }
        this.cache = {};
        this.sounds = {};
        this.globalObjects = {};
    }
}
