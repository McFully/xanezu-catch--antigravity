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
        this.active = true;
    }

    /**
     * Re-inicializa el obstáculo para su uso desde un pool.
     */
    init(x, y, w, h, speed, vy, type, thematicAssetKey) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.speed = speed;
        this.vy = vy || 0;
        this.type = type || 'spike';
        this.thematicImg = thematicAssetKey || null;
        this.dead = false;
        this.active = true;
        this.t = Math.random() * Math.PI * 2;
        this.rot = 0;
        this.scale = 1.0;
        this.baseX = x;
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
            const ambient = String(config.ambient || config.weather || '').toLowerCase();
            const biome = String(config.biome || config.bg || '').toLowerCase();
            let particleType = 'circle';
            if (/digital|glitch|neon|scanlines/.test(ambient) || /arcade|retro|space/.test(biome)) particleType = 'square';
            else if (/embers|sparks|glitter|glints|magic/.test(ambient) || /lava|crystal|enchanted/.test(biome)) particleType = 'spark';
            window.game.particles.spawn(
                this.x + Math.random() * this.w,
                this.y + Math.random() * this.h,
                config.colors[0],
                1,
                particleType
            );
        }

    }
    draw(ctx) {
        if (!window.game) return;
        const chapter = window.game.chapter;
        const loader = window.game.assetLoader;
        const config = window.game?.getActiveChapterConfig
            ? (window.game.getActiveChapterConfig(chapter) || CHAPTER_REGISTRY[1])
            : (CHAPTER_REGISTRY[chapter] || CHAPTER_REGISTRY[1]);

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
                const biome = String(config.biome || config.bg || '').toLowerCase();
                if ([1, 4, 5].includes(chapter) || isArcade || /lava|arcade|retro|space|enchanted|crystal/.test(biome)) {
                    ctx.shadowBlur = isArcade ? 20 : 12;
                    ctx.shadowColor = config.colors?.[0] || 'rgba(255, 0, 0, 0.2)';
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

    _drawAblBiomeFallback(offCtx, config, lvl) {
        const c1 = (config.colors && config.colors[0]) || '#ff4d6d';
        const c2 = (config.colors && config.colors[1]) || '#22d3ee';
        const c3 = (config.colors && config.colors[2]) || '#fde047';
        const biome = String(config.biome || config.bg || config.theme || '').toLowerCase();

        const grad = offCtx.createLinearGradient(0, 0, this.w, this.h);
        grad.addColorStop(0, c1);
        grad.addColorStop(0.55, c2);
        grad.addColorStop(1, c3);
        offCtx.fillStyle = grad;
        offCtx.fillRect(0, 0, this.w, this.h);

        offCtx.strokeStyle = 'rgba(255,255,255,0.35)';
        offCtx.lineWidth = 2;
        offCtx.strokeRect(1, 1, this.w - 2, this.h - 2);

        if (biome.includes('jungle') || biome.includes('swamp')) {
            this._drawAblVines(offCtx, c2, c3, lvl);
        } else if (biome.includes('desert') || biome.includes('moon')) {
            this._drawAblChevronBands(offCtx, c2, c3, lvl);
        } else if (biome.includes('japan') || biome.includes('enchanted')) {
            this._drawAblSigils(offCtx, c2, c3, lvl);
        } else if (biome.includes('toyfactory') || biome.includes('arcade') || biome.includes('retro')) {
            this._drawAblPanels(offCtx, c2, c3, lvl);
        } else if (biome.includes('space') || biome.includes('underwater') || biome.includes('rain')) {
            this._drawAblOrbitalNodes(offCtx, c2, c3, lvl);
        } else if (biome.includes('lava')) {
            this._drawAblLavaCracks(offCtx, c2, c3, lvl);
        } else if (biome.includes('ice') || biome.includes('crystal')) {
            this._drawAblCrystalCuts(offCtx, c2, c3, lvl);
        } else {
            this._drawAblPanels(offCtx, c2, c3, lvl);
        }

        const notchCount = Math.min(8, 2 + Math.floor(lvl / 2));
        offCtx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        for (let i = 0; i < notchCount; i++) {
            const nx = (i / notchCount) * this.w;
            offCtx.fillRect(nx, 0, 6, this.h);
        }
    }

    _drawAblVines(offCtx, c2, c3, lvl) {
        offCtx.strokeStyle = 'rgba(255,255,255,0.18)';
        offCtx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
            const x = (i + 0.5) * (this.w / 4);
            offCtx.beginPath();
            offCtx.moveTo(x, 0);
            offCtx.quadraticCurveTo(x + Math.sin(i + lvl) * 16, this.h * 0.45, x + Math.cos(i + lvl) * 20, this.h);
            offCtx.stroke();
        }
        offCtx.fillStyle = `${c3}55`;
        for (let i = 0; i < 10; i++) {
            const x = (i * 19 + lvl * 7) % this.w;
            const y = (i * 23 + lvl * 5) % this.h;
            offCtx.beginPath();
            offCtx.ellipse(x, y, 12, 6, Math.PI / 4, 0, Math.PI * 2);
            offCtx.fill();
        }
    }

    _drawAblChevronBands(offCtx, c2, c3, lvl) {
        offCtx.fillStyle = `${c2}55`;
        const step = Math.max(24, 56 - lvl);
        for (let y = 0; y < this.h + step; y += step) {
            offCtx.beginPath();
            offCtx.moveTo(0, y);
            offCtx.lineTo(this.w * 0.5, y + step * 0.5);
            offCtx.lineTo(this.w, y);
            offCtx.lineTo(this.w, y + 12);
            offCtx.lineTo(this.w * 0.5, y + step * 0.5 + 12);
            offCtx.lineTo(0, y + 12);
            offCtx.closePath();
            offCtx.fill();
        }
        offCtx.fillStyle = `${c3}33`;
        offCtx.fillRect(0, this.h * 0.5 - 5, this.w, 10);
    }

    _drawAblSigils(offCtx, c2, c3, lvl) {
        offCtx.strokeStyle = `${c2}88`;
        offCtx.lineWidth = 2;
        const cx = this.w / 2;
        const cy = this.h / 2;
        const rings = 2 + Math.floor(lvl / 4);
        for (let i = 1; i <= rings; i++) {
            offCtx.beginPath();
            offCtx.arc(cx, cy, i * 10, 0, Math.PI * 2);
            offCtx.stroke();
        }
        offCtx.fillStyle = `${c3}88`;
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6;
            offCtx.beginPath();
            offCtx.arc(cx + Math.cos(a) * 36, cy + Math.sin(a) * 36, 6, 0, Math.PI * 2);
            offCtx.fill();
        }
    }

    _drawAblPanels(offCtx, c2, c3, lvl) {
        const cols = 3;
        const rows = 4;
        const gap = 4;
        const cellW = (this.w - gap * (cols + 1)) / cols;
        const cellH = (this.h - gap * (rows + 1)) / rows;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                offCtx.fillStyle = (x + y + lvl) % 2 === 0 ? `${c2}66` : `${c3}40`;
                offCtx.fillRect(gap + x * (cellW + gap), gap + y * (cellH + gap), cellW, cellH);
            }
        }
        offCtx.strokeStyle = 'rgba(255,255,255,0.18)';
        offCtx.strokeRect(6, 6, this.w - 12, this.h - 12);
    }

    _drawAblOrbitalNodes(offCtx, c2, c3, lvl) {
        offCtx.strokeStyle = `${c2}66`;
        offCtx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const y = ((i + 1) / 4) * this.h;
            offCtx.beginPath();
            offCtx.moveTo(0, y);
            offCtx.bezierCurveTo(this.w * 0.25, y - 10, this.w * 0.75, y + 10, this.w, y);
            offCtx.stroke();
        }
        offCtx.fillStyle = `${c3}aa`;
        for (let i = 0; i < 7; i++) {
            const x = (i * 17 + lvl * 5) % this.w;
            const y = (i * 29 + lvl * 3) % this.h;
            offCtx.beginPath();
            offCtx.arc(x, y, 6 + (i % 4), 0, Math.PI * 2);
            offCtx.fill();
        }
    }

    _drawAblLavaCracks(offCtx, c2, c3, lvl) {
        offCtx.strokeStyle = `${c3}aa`;
        offCtx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
            const startX = (i / 3) * this.w;
            offCtx.beginPath();
            offCtx.moveTo(startX, 0);
            offCtx.lineTo(startX + 8, this.h * 0.25);
            offCtx.lineTo(startX - 10, this.h * 0.55);
            offCtx.lineTo(startX + 6, this.h);
            offCtx.stroke();
        }
        offCtx.fillStyle = `${c2}44`;
        offCtx.fillRect(0, this.h * 0.68, this.w, this.h * 0.12);
    }

    _drawAblCrystalCuts(offCtx, c2, c3, lvl) {
        offCtx.fillStyle = `${c2}55`;
        for (let i = 0; i < 5; i++) {
            const x = (i / 4) * this.w;
            offCtx.beginPath();
            offCtx.moveTo(x, this.h);
            offCtx.lineTo(x + 10, this.h * 0.55);
            offCtx.lineTo(x + 18, this.h);
            offCtx.closePath();
            offCtx.fill();
        }
        offCtx.strokeStyle = `${c3}99`;
        offCtx.lineWidth = 2;
        offCtx.beginPath();
        offCtx.moveTo(this.w * 0.2, 0);
        offCtx.lineTo(this.w * 0.8, this.h);
        offCtx.moveTo(this.w * 0.8, 0);
        offCtx.lineTo(this.w * 0.2, this.h);
        offCtx.stroke();
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
            const lvl = window.game ? (((window.game.level - 1) % 10) + 1) : 1;
            this._drawAblBiomeFallback(offCtx, config, lvl);
        }

        Obstacle.cache[cacheKey] = offCanvas;

        Obstacle.cache[cacheKey] = offCanvas;
    }

    static clearCache() {
        Obstacle.cache = {};
    }

    getBounds() {
        // Replicando Hitbox exacta del diseño original (XANEZU CATCH)
        let marginX = this.w * 0.15;
        let imgName = 'default';
        if (this.thematicImg && this.thematicImg.src) {
            imgName = this.thematicImg.src.toLowerCase();
        }

        // Ajustes específicos del Capítulo 1 original
        if (imgName.includes('liana') || imgName.includes('serpiente')) {
            marginX = this.w * 0.35; // Más estrecho para lianas/serpientes
        } else if (imgName.includes('totem') || imgName.includes('estatua')) {
            marginX = this.w * 0.10; // Más ancho para pilares sólidos
        }

        let myY = this.y;
        let myH = this.h;

        // Lógica vertical basada en posición (Escalado para 1080p)
        if (this.y < 100) {
            myH = this.h * 0.75;
        } else if (this.y + this.h > 900) {
            myH = this.h * 0.85;
            myY = this.y + (this.h * 0.15);
        } else {
            myH = this.h * 0.70;
            myY = this.y + (this.h * 0.15);
        }

        return { x: this.x + marginX, y: myY, w: this.w - marginX * 2, h: myH };
    }
}
