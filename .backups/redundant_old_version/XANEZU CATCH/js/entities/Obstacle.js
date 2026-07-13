import { Entity } from './BaseEntity.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { CHAPTER_REGISTRY } from '../core/ChapterRegistry.js';

export class Obstacle extends Entity {
    constructor(x, y, w, h, speed, vy, type, thematicAssetKey) {
        super(x, y, w, h, speed);
        this.vy = vy || 0;
        this.type = type || 'spike';
        this.thematicImg = null;

        // AAA Animation Properties
        this.t = Math.random() * Math.PI * 2;
        this.rot = 0;
        this.scale = 1.0;
        this.baseX = x; // Keep track for advanced patterns
    }
    update(dt) {
        super.update(dt);
        this.t += 0.05 * dt;
        this.y += this.vy * dt;

        // AAA organic movement: subtle breathing and vibration
        this.scale = 1.0 + Math.sin(this.t) * 0.03;

        // Pendulum effect for top obstacles
        if (this.y < 100) {
            this.rot = Math.sin(this.t * 0.5) * 0.1;
        }

        if (this.y < 0 || this.y + this.h > CANVAS_HEIGHT) this.vy *= -1;

        // Ambient Threat Particles (Jungle spores, lava sparks, etc)
        if (window.game && window.game.particles && Math.random() > 0.95) {
            const config = window.game?.getActiveChapterConfig
                ? (window.game.getActiveChapterConfig(window.game.chapter) || CHAPTER_REGISTRY[1])
                : (CHAPTER_REGISTRY[window.game.chapter] || CHAPTER_REGISTRY[1]);
            window.game.particles.spawn(
                this.x + Math.random() * this.w,
                this.y + Math.random() * this.h,
                config.colors[0], 1, 'circle'
            );
        }

    }
    draw(ctx) {
        if (!window.game) return;
        const chapter = window.game.chapter;
        const loader = window.game.assetLoader;

        // Priority: Direct Thematic -> New 4K PNG -> Level-Specific SVG -> Registry -> Fallback
        let img = this.thematicImg;

        if (!img) {
            const levelIdx = ((window.game.level - 1) % 100) + 1; // Unbounded fallback or cycle? Better to use current subLevel index.
            const realLvl = ((window.game.level - 1) % 30) + 1; // Supports 30 levels per chapter

            const chCache = loader.cache[`ch${chapter}`];
            if (chCache) {
                // Try 4K PNG first
                const pngKey = `new_obs_ch${chapter}_l${realLvl}_obs_l0${levelIdx % 6 === 0 ? 6 : levelIdx % 6}`;
                const svgKey = `new_obs_ch${chapter}_l${realLvl}_obs_l0${levelIdx % 6 === 0 ? 6 : levelIdx % 6}_svg`;

                if (chCache[pngKey]) {
                    img = chCache[pngKey];
                } else if (chCache[svgKey]) {
                    img = chCache[svgKey];
                } else if (chCache[`obs_l0${levelIdx % 6 === 0 ? 6 : levelIdx % 6}`]) {
                    // Fallback to legacy SVG logic
                    img = chCache[`obs_l0${levelIdx % 6 === 0 ? 6 : levelIdx % 6}`];
                }
            }
        }

        if (!img) {
            const config = window.game?.getActiveChapterConfig
                ? (window.game.getActiveChapterConfig(chapter) || CHAPTER_REGISTRY[1])
                : (CHAPTER_REGISTRY[chapter] || CHAPTER_REGISTRY[1]);
            img = window.game.assets[config.obstacle];
        }

        // Removed early return so that the fallback logic actually gets executed.

        // Initialize cache if needed
        if (!Obstacle.cache) Obstacle.cache = {};

        // Use image src or custom ID for caching unique props safely
        let imgId = 'missing_asset';
        if (this.thematicImg && this.thematicImg.src) {
            imgId = this.thematicImg.src.split('/').pop();
        } else if (img && img.src) {
            imgId = img.src.split('/').pop();
        }

        const ablLevelBucket = window.game?.stateManager?.isABLMode?.() === true
            ? `_${((window.game.level - 1) % 10) + 1}`
            : '';
        const cacheKey = `${chapter}_${imgId}_${this.w}_${this.h}${ablLevelBucket}`;

        if (!Obstacle.cache[cacheKey]) {
            this._preRender(cacheKey, img, chapter);
        }

        const renderImg = Obstacle.cache[cacheKey];
        if (renderImg && (renderImg instanceof HTMLImageElement || renderImg instanceof HTMLCanvasElement)) {
            if (renderImg.width > 0 && renderImg.height > 0) {
                ctx.save();
                // AAA Center-based transformation
                ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
                ctx.rotate(this.rot);
                ctx.scale(this.scale, this.scale);

                const isArcade = window.game?.stateManager?.isArcadeMode?.();

                // Add a subtle threat glow for organic biomes
                if ([1, 4, 5].includes(chapter) || isArcade) {
                    ctx.shadowBlur = isArcade ? 20 : 10;
                    ctx.shadowColor = isArcade ? (config.colors[0] || 'red') : 'rgba(255, 0, 0, 0.2)';
                }

                if (isArcade) {
                    ctx.imageSmoothingEnabled = false;
                    // Efecto de pulso extra para Arcade Triple-A
                    ctx.save();
                    ctx.globalAlpha = 0.3 + Math.sin(this.t * 3) * 0.2;
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.drawImage(renderImg, -this.w / 2 - 2, -this.h / 2 - 2, this.w + 4, this.h + 4);
                    ctx.restore();
                }

                ctx.drawImage(renderImg, -this.w / 2, -this.h / 2, this.w, this.h);
                ctx.restore();
            }
        }
    }

    _preRenderArcade8bit(ctx, config) {
        const c1 = config.colors ? config.colors[0] : '#f00';
        const c2 = config.colors ? config.colors[1] : '#800';
        const px = Math.floor(this.w / 6);

        ctx.fillStyle = c2;
        ctx.fillRect(0, 0, this.w, this.h);

        // Patrón de advertencia 8-bit (rayas diagonales pixeladas)
        ctx.fillStyle = c1;
        for (let i = 0; i < this.w + this.h; i += px * 2) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + px, 0);
            ctx.lineTo(i - this.h + px, this.h);
            ctx.lineTo(i - this.h, this.h);
            ctx.fill();
        }

        // Borde de volumen 8-bit
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, this.w - 4, this.h - 4);
    }
    _preRender(cacheKey, img, chapter) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.w;
        offCanvas.height = this.h;
        const offCtx = offCanvas.getContext('2d');

        // Draw Content based on chapter style
        const config = window.game?.getActiveChapterConfig
            ? (window.game.getActiveChapterConfig(chapter) || CHAPTER_REGISTRY[1])
            : (CHAPTER_REGISTRY[chapter] || CHAPTER_REGISTRY[1]);

        const isArcade = window.game?.stateManager?.isArcadeMode?.() === true;
        const isStructural = config.isStructural || false;

        // Estilo procedural 8-bit para Arcade (Pinchos retro)
        if (isArcade) {
            this._preRenderArcade8bit(offCtx, config);
            Obstacle.cache[cacheKey] = offCanvas;
            return;
        }

        if (img && img.width > 0) {
            if (isStructural) {
                const pattern = offCtx.createPattern(img, 'repeat-y');
                offCtx.fillStyle = pattern;
                offCtx.fillRect(0, 0, this.w, this.h);
            } else {
                offCtx.drawImage(img, 0, 0, this.w, this.h);
            }
        } else {
            // Procedural obstacle fallback (used heavily in ABL mode)
            const c1 = (config.colors && config.colors[0]) || '#ff4d6d';
            const c2 = (config.colors && config.colors[1]) || '#22d3ee';
            const c3 = (config.colors && config.colors[2]) || '#fde047';
            const lvl = window.game ? (((window.game.level - 1) % 10) + 1) : 1;

            const grad = offCtx.createLinearGradient(0, 0, this.w, this.h);
            grad.addColorStop(0, c1);
            grad.addColorStop(0.6, c2);
            grad.addColorStop(1, c3);
            offCtx.fillStyle = grad;
            offCtx.fillRect(0, 0, this.w, this.h);

            offCtx.strokeStyle = 'rgba(255,255,255,0.35)';
            offCtx.lineWidth = 2;
            offCtx.strokeRect(1, 1, this.w - 2, this.h - 2);

            const step = Math.max(6, 16 - lvl);
            for (let y = 6; y < this.h; y += step) {
                offCtx.fillStyle = 'rgba(255,255,255,0.14)';
                const wave = Math.sin((y * 0.12) + lvl) * (lvl * 0.45);
                offCtx.fillRect(wave, y, this.w, 3);
            }

            // Level signature notch count
            const notchCount = Math.min(8, 2 + Math.floor(lvl / 2));
            offCtx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            for (let i = 0; i < notchCount; i++) {
                const nx = (i / notchCount) * this.w;
                offCtx.fillRect(nx, 0, 3, this.h);
            }
        }

        Obstacle.cache[cacheKey] = offCanvas;

        Obstacle.cache[cacheKey] = offCanvas;
    }

    static clearCache() {
        Obstacle.cache = {};
    }

    getBounds() {
        // AAA Hitbox System: Custom margins per asset type to match painted art
        let marginX = this.w * 0.15;
        let marginT = 0, marginB = 0;

        let imgName = 'default';
        if (this.thematicImg && this.thematicImg.src) {
            imgName = this.thematicImg.src.toLowerCase();
        }

        // Specific adjustments for Chapter 1 Assets
        if (imgName.includes('liana') || imgName.includes('serpiente')) {
            marginX = this.w * 0.35; // Very narrow for vines/snakes
        } else if (imgName.includes('totem') || imgName.includes('estatua')) {
            marginX = this.w * 0.10; // Wider for solid pillars
        }

        let myY = this.y;
        let myH = this.h;

        // Position-based vertical logic
        if (this.y < 50) {
            // Top obstacles: allow head to partially overlap with the "anchor" point
            myH = this.h * 0.75;
        } else if (this.y + this.h > 450) {
            // Bottom obstacles: allow feet to overlap slightly with the base
            myH = this.h * 0.85;
            myY = this.y + (this.h * 0.15);
        } else {
            // Floating obstacles
            myH = this.h * 0.70;
            myY = this.y + (this.h * 0.15);
        }

        return { x: this.x + marginX, y: myY, w: this.w - marginX * 2, h: myH };
    }
}
