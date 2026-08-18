import { LOGICAL_WIDTH, LOGICAL_HEIGHT, LOGICAL_GROUND_Y } from '../engine/engine.constants';
import { AssetLoader } from '../engine/asset-loader';
import { CHAPTER_REGISTRY } from '../engine/chapter-registry';
import { ARCADE_CHAPTER_REGISTRY } from '../engine/arcade-registry';
import { ABLIA_CHAPTER_REGISTRY } from '../engine/ablia-registry';

export interface BiomeConfig {
    name: string;
    skyColors: string[];
    sunY?: number;
    layers: ParallaxLayer[];
}

export interface ParallaxLayer {
    id: string;
    speed: number;
    image?: HTMLImageElement;
}

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

    /**
     * Prepara el fondo del nivel actual y precarga el siguiente de forma asíncrona
     */
    public async prepareLevel(level: number, mode: string, folder: string): Promise<void> {
        const modeFolder = mode.toLowerCase();
        
        // 1. Si el nivel solicitado ya es el que tenemos en 'next', hacemos SWAP
        if (level === this.nextBGLevel && this.nextBackground) {
            this.currentBackground = this.nextBackground;
            this.currentBGLevel = this.nextBGLevel;
            console.log(`[BiomeRenderer] 🔄 Background SWAP: Now at lvl ${level}`);
        } else if (level !== this.currentBGLevel) {
            const url = `assets/${modeFolder}/${folder}/fondos/nivel_${level}/fondo_intermedio.webp`;
            console.log(`[BiomeRenderer] 🖼️ Loading level background: ${url}`);
            const img = await this.loadImage(url);
            if (img) {
                this.currentBackground = img;
                this.currentBGLevel = level;
            } else {
                console.warn(`[BiomeRenderer] ⚠️ FAILED to load background: ${url}`);
            }
        }

        // 2. Precarga del SIGUIENTE nivel
        const nextLevel = level + 1;
        if (nextLevel <= 30 && nextLevel !== this.nextBGLevel) {
            const nextUrl = `assets/${modeFolder}/${folder}/fondos/nivel_${nextLevel}/fondo_intermedio.webp`;
            this.nextBGLevel = nextLevel;
            this.loadImage(nextUrl).then(img => {
                if (img) {
                    this.nextBackground = img;
                    console.log(`[BiomeRenderer] 🛰️ Next background preloaded: Lvl ${nextLevel} (${nextUrl})`);
                }
            });
        }
    }

    /**
     * Carga inicial de assets temáticos (Jugador, Obstáculos, Items)
     */
    public async loadChapterAssets(mode: string, folder: string, level: number = 1, onAssetLoad?: (name: string) => void): Promise<void> {
        console.log(`[BiomeRenderer] 📦 LOADING THEMED ASSETS: ${mode}/${folder}...`);
        const promises: Promise<void>[] = [];

        // Asegurar fondo inicial y precarga
        promises.push(this.prepareLevel(level, mode, folder));

        // 2. Personaje (Frog Skin)
        this.playerSprites.clear();
        const pFiles = ['frog.svg', 'frog_up.svg', 'frog_dn.svg', 'frog_c.svg'];
        pFiles.forEach(f => {
            const url = `assets/${mode.toLowerCase()}/${folder}/personaje/${f}`;
            const name = f.split('.')[0];
            promises.push(this.loadImage(url).then(img => { 
                if (img) this.playerSprites.set(name, img); 
                if (onAssetLoad) onAssetLoad(`SPRITE: ${f}`);
            }));
        });

        // 3. Objetos Temáticos (Frutas, Monedas, Gemas, Powerups - 33 objetos)
        this.itemSprites.clear();
        const items = [
            'coin.svg', 'ruby.svg', 'diamond.svg', 'banana.svg', 'candy_red.svg', 'magnet.svg', 'shield.svg', 'star.svg',
            'bolt.svg', 'bomb.svg', 'candy_blue.svg', 'candy_brown.svg', 'candy_cyan.svg', 'candy_green.svg',
            'candy_grey.svg', 'candy_orange.svg', 'candy_pink.svg', 'candy_purple.svg', 'candy_yellow.svg',
            'clock.svg', 'clover.svg', 'crown.svg', 'emerald.svg', 'feather.svg', 'fly_gold.svg', 'ghost.svg',
            'gift.svg', 'heart.svg', 'hourglass.svg', 'ice.svg', 'mini.svg', 'pearl.svg', 'rainbow.svg'
        ];
        items.forEach(it => {
            const url = `assets/${mode.toLowerCase()}/${folder}/objetos/${it}`;
            const name = it.split('.')[0];
            promises.push(this.loadImage(url).then(img => { 
                if (img) this.itemSprites.set(name, img); 
                if (onAssetLoad) onAssetLoad(`OBJETO: ${it}`);
            }));
        });

        // 4. Obstáculos Temáticos (Pool Dinámico)
        this.obstacleSprites.clear();
        
        // Determinar obstáculos adicionales según el bioma
        let flavorObs: string[] = [];
        if (folder.includes('mexicana')) {
            flavorObs = ['obs_cactus_hat.svg', 'obs_pinata.svg', 'obs_luchador.svg'];
        } else if (folder.includes('selva')) {
            flavorObs = ['obs_bot_tronco.svg', 'obs_bot_totem.svg', 'obs_bot_estatua.svg', 'obs_bot_ruina.svg', 'obs_top_liana.svg'];
        } else if (folder.includes('desierto')) {
            flavorObs = ['obs_bot_cactus.svg', 'obs_bot_craneo.svg', 'obs_bot_obelisco.svg', 'obs_top_lampara.svg', 'obs_top_toldo.svg', 'obs_scorpion.svg'];
        }

        const obstacles = [
            ...flavorObs,
            `obs_l${String(level).padStart(2, '0')}.svg`,
            `obs_bot_l${String(level).padStart(2, '0')}.svg`,
            `obs_top_l${String(level).padStart(2, '0')}.svg`
        ];

        obstacles.forEach(f => {
            const url = `assets/${mode.toLowerCase()}/${folder}/obstaculos/${f}`;
            promises.push(this.loadImage(url).then(img => { 
                if (img) {
                    this.obstacleSprites.set(f, img);
                    if (onAssetLoad) onAssetLoad(`OBSTÁCULO: ${f}`);
                } else {
                    // Fallback universal a Selva para no mostrar cajas vacías en Story
                    const fallbackUrl = f.startsWith('obs_top') ? 
                        `assets/story/1-selva-tropical/obstaculos/obs_top_liana.svg` : 
                        `assets/story/1-selva-tropical/obstaculos/obs_bot_tronco.svg`;
                    
                    this.loadImage(fallbackUrl).then(fImg => { 
                        if (fImg) {
                            this.obstacleSprites.set(f, fImg);
                            if (onAssetLoad) onAssetLoad(`OBSTÁCULO (FALLBACK): ${f}`);
                        }
                    });
                }
            }));
        });

        await Promise.all(promises);
        console.log(`[BiomeRenderer] ✅ THEMED ASSETS LOADED: BG-Ready:${!!this.currentBackground}, Player:${this.playerSprites.size}, ItemPool:${this.itemSprites.size}, ObsPool:${this.obstacleSprites.size}`);
    }

    private loadImage(url: string): Promise<HTMLImageElement | null> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null); // Fallback silencioso
            img.src = url;
        });
    }

    // Getters para que el motor acceda a los sprites
    public getPlayerSprite(name: string): HTMLImageElement | undefined { return this.playerSprites.get(name); }
    public getItemSprite(name: string): HTMLImageElement | undefined { return this.itemSprites.get(name); }
    public getObstacleSprite(key: string): HTMLImageElement | undefined { return this.obstacleSprites.get(key); }
    
    /**
     * Retorna una clave aleatoria del pool actual de obstáculos terrestres
     */
    public getRandomBotKey(): string {
        const keys = Array.from(this.obstacleSprites.keys()).filter(k => k.includes('bot') || k.includes('cactus') || k.includes('pinata') || k.includes('tronco'));
        return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : 'obs_bot_tronco.svg';
    }

    /**
     * Retorna una clave aleatoria del pool actual de obstáculos aéreos
     */
    public getRandomTopKey(): string {
        const keys = Array.from(this.obstacleSprites.keys()).filter(k => k.includes('top') || k.includes('liana') || k.includes('serpiente'));
        return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : 'obs_top_liana.svg';
    }

    public drawAbliaObstacle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, level: number): void {
        const theme = this.getAbliaThemeColors();
        ctx.save();
        
        // Glow exterior
        ctx.shadowBlur = 20;
        ctx.shadowColor = theme.accent;
        
        // Estructura principal
        ctx.fillStyle = theme.primary;
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 12);
        ctx.fill();
        ctx.stroke();
        
        // Detalles internos (Circuitos / Runas según civilización)
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        for(let i=0; i<3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + Math.random()*w, y);
            ctx.lineTo(x + Math.random()*w, y + h);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    private getAbliaThemeColors(): { primary: string, accent: string } {
        // En un futuro esto puede depender de la civilización cargada
        return { primary: '#1a1a2e', accent: '#FFD700' };
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
        // 1. Cielo (Procedural) - DESACTIVADO EN HISTORIA (REGLA ESTRICTA)
        if (modeLower !== 'story') {
            this.drawSky(ctx, ['#051a05', '#0d3d1a', '#1a5c1a']);
        }

        // 2. Capa Lejana (Procedural) - DESACTIVADO EN HISTORIA (REGLA ESTRICTA)
        if (modeLower !== 'story') {
            this.drawFarTrees(ctx, scrollX, 0.05, 'rgba(5, 50, 20, 0.3)');
        }

        // 3. Capa Intermedia (Asset principal)
        // 3. Fondo principal (Double Buffer)
        if (this.currentBackground) {
            this.drawParallaxImage(ctx, this.currentBackground, scrollX, 0.1);
        } else if (modeLower !== 'story') {
            // Fallback solo fuera de historia
            this.drawFarTrees(ctx, scrollX, 0.1, 'rgba(10, 60, 30, 0.5)');
        }

        // 4. Luces Atmosféricas (God Rays) - DESACTIVADO POR PETICIÓN DEL USUARIO
        // No se aplican en Story tampoco (Regla Estricta)
    }

    private drawParallaxImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, scrollX: number, parallax: number): void {
        const xOffset = (scrollX * parallax) % LOGICAL_WIDTH;
        
        // Dibujamos dos veces para el bucle infinito asegurando que cubra el LOGICAL_HEIGHT
        // Esto previene márgenes negros si el canvas físico no es exacto
        ctx.drawImage(img, -xOffset, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        ctx.drawImage(img, -xOffset + LOGICAL_WIDTH, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        if (xOffset < 0) {
            ctx.drawImage(img, -xOffset - LOGICAL_WIDTH, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        }
    }

    private drawSky(ctx: CanvasRenderingContext2D, colors: string[]): void {
        const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
        const baseY = ctx.canvas.height - 50;
        for (let i = 0; i < this.seeds.trees.length; i++) {
            const s = this.seeds.trees[i];
            const x = s.x * ctx.canvas.width;
            const h = s.h * 400;
            const w = 40 + s.w * 60;
            
            // Tronco
            ctx.fillRect(x - 5, baseY - h, 10, h);

            // Follaje orgánico (bolas de hojas superpuestas)
            ctx.beginPath();
            ctx.arc(x, baseY - h, w, 0, Math.PI * 2);
            ctx.arc(x - w * 0.5, baseY - h + w * 0.3, w * 0.7, 0, Math.PI * 2);
            ctx.arc(x + w * 0.5, baseY - h + w * 0.3, w * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Sutil resplandor interno
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.arc(x, baseY - h - 10, w * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = color;
        }
    }

    private drawGodRays(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const color = 'rgba(166, 246, 22, 0.05)';
        for (let i = 0; i < 4; i++) {
            const angle = -0.2 + i * 0.1 + Math.sin(this.t * 0.2 + i) * 0.05;
            const x = ctx.canvas.width * (0.2 + i * 0.2);
            ctx.save();
            ctx.translate(x, -50);
            ctx.rotate(angle);
            const w = 80 + Math.sin(this.t * 0.4 + i) * 20;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-w / 2, 0);
            ctx.lineTo(-w, ctx.canvas.height);
            ctx.lineTo(w, ctx.canvas.height);
            ctx.lineTo(w / 2, 0);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    public drawForeground(ctx: CanvasRenderingContext2D, scrollX: number, mode: string = 'arcade'): void {
        // REGLA ESTRICTA STORY: No superponer capas adicionales ni partículas
        if (mode === 'story') return;

        // 1. Decoraciones Frontales (Asset si existe)
        // NOTE: Ad-hoc decorations layer removed to fix build. 
        // Background assets are now managed via currentBackground/nextBackground.

        // 2. Partículas de ambiente (Luciérnagas)
        ctx.save();
        for (let i = 0; i < this.seeds.particles.length; i++) {
            const p = this.seeds.particles[i];
            const x = (p.x * ctx.canvas.width + this.t * 20 * p.speed) % ctx.canvas.width;
            const y = (p.y * ctx.canvas.height + Math.sin(this.t * 0.5 + i) * 30) % ctx.canvas.height;
            
            ctx.globalAlpha = p.alpha * (0.5 + Math.sin(this.t * 1 + i) * 0.5);
            ctx.fillStyle = '#A6F616';
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
