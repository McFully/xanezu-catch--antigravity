import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { CHAPTER_REGISTRY } from './ChapterRegistry.js';

/**
 * AAA Next-Gen Biome Renderer — Deep Parallax + Procedural Backgrounds + Dynamic Lighting
 */
export class BiomeRenderer {
    constructor(game) {
        this.game = game;
        this.t = 0;
        this._chapterSeeds = {};
        this._gradCache = new Map();
        this._lastChapter = -1;
        this._lastLevel = -1;
        this._lastFrameTime = 0;
        this._frameSkip = 0;
        this._maxFrameSkip = 2; // Skip frames if needed for performance

        // Transition system
        this.transition = {
            active: false,
            progress: 0,
            from: { chapter: 1, subLevel: 1 },
            to: { chapter: 1, subLevel: 1 },
            duration: 1.5 // seconds
        };

        this._currentRenderingChapter = 1;
        this._currentRenderingSubLevel = 1;
    }

    // ═══════════════════════ MAIN PIPELINE ═══════════════════════

    startTransition(from, to) {
        this.transition.active = true;
        this.transition.progress = 0;
        this.transition.from = from;
        this.transition.to = to;
        const toCh = to.chapter || to;
        // Pre-generate seeds for the next chapter
        if (!this._chapterSeeds[toCh]) {
            this._chapterSeeds[toCh] = this._generateSeeds(toCh);
        }
    }

    drawBackground(ctx) {
        this.t = Date.now() * 0.001;
        const scrollX = this.game.bgX || 0;

        // Cache current chapter/level
        const currentChapter = this.game.chapter;
        const currentLevel = ((this.game.level - 1) % 30) + 1;

        if (this.transition.active) {
            this.transition.progress += 0.016 / this.transition.duration;
            if (this.transition.progress >= 1) {
                this.transition.active = false;
            }

            // Draw "From" background
            ctx.save();
            ctx.globalAlpha = 1 - this.transition.progress;
            this._renderChapterBackground(ctx, this.transition.from, scrollX);
            ctx.restore();

            // Draw "To" background
            ctx.save();
            ctx.globalAlpha = this.transition.progress;
            this._renderChapterBackground(ctx, this.transition.to, scrollX);
            ctx.restore();
        } else {
            this._renderChapterBackground(ctx, { chapter: currentChapter, subLevel: currentLevel }, scrollX);
        }
    }

    _renderChapterBackground(ctx, chInput, scrollX) {
        const ch = chInput.chapter || chInput;
        this._currentRenderingChapter = ch;
        this._currentRenderingSubLevel = chInput.subLevel || 1;
        const isABLMode = this.game?.stateManager?.isABLMode?.() === true;
        const isArcade = this.game?.stateManager?.isArcadeMode?.() === true;

        if (isArcade) {
            // MODO ARCADE ULTRA AAA: Motor de renderizado exclusivo de alta fidelidad
            this._drawArcadeUltraBackground(ctx, ch, this._currentRenderingSubLevel, scrollX);
            return;
        }

        const hasLayers = this._hasHighResLayer(ch, this._currentRenderingSubLevel, 'fondo_intermedio') ||
            this._hasHighResLayer(ch, this._currentRenderingSubLevel, 'fondo_lejano');

        if (hasLayers && !isABLMode) {
            // SI existen activos de alta fidelidad, usamos el sistema multicapa.
            this._drawLayeredBackground(ctx, ch, this._currentRenderingSubLevel, scrollX);
        } else {
            // Fallback: Si no hay imagen AAA, usamos el sistema procedural (o modo ABL)
            this._drawProceduralBackground(ctx, ch, this._currentRenderingSubLevel, scrollX);
        }
    }

    _hasHighResLayer(ch, lvl, layerId) {
        const loader = this.game.assetLoader;
        if (!loader || !loader.cache[`ch${ch}`]) return false;
        const normalizedLvl = ((lvl - 1) % 30) + 1;
        const key = `new_bg_ch${ch}_l${normalizedLvl}_${layerId}`;
        const img = loader.cache[`ch${ch}`][key];
        // Solo aceptamos la imagen si no es un placeholder
        return img && img.width > 0 && !img.isPlaceholder;
    }

    // ... (procedural logic stays same for ABL mode fallback)

    _drawLayeredBackground(ctx, ch, lvl, scrollX) {
        const loader = this.game.assetLoader;
        const chKey = `ch${ch}`;
        if (!loader || !loader.cache[chKey]) return false;
        const cache = loader.cache[chKey];

        const normalizedLvl = ((lvl - 1) % 30) + 1;

        // Definición de Capas Dinámicas AAA
        const layers = [
            { id: 'fondo_lejano', speed: 0.01 },
            { id: 'fondo_intermedio', speed: 0.05 },
            { id: 'fondo_proximo', speed: 0.12 },
            { id: 'decoraciones', speed: 0.22 }
        ];

        let drawnAnything = false;

        layers.forEach(layer => {
            const imgKey = `new_bg_ch${ch}_l${normalizedLvl}_${layer.id}`;
            const img = cache[imgKey];

            if (img && img.width > 0 && !img.isPlaceholder) {
                ctx.save();
                this._drawSingleImageLayer(ctx, img, scrollX, layer.speed, normalizedLvl);
                ctx.restore();
                drawnAnything = true;
            }
        });

        // Overlay atmosférico (solo si se ha dibujado algo de fondo)
        if (drawnAnything) {
            const config = CHAPTER_REGISTRY[ch] || CHAPTER_REGISTRY[1];
            this._drawAtmosphericLight(ctx, config);
        }

        return drawnAnything;
    }

    _drawAtmosphericLight(ctx, config) {
        // Subtle bloom/glow over the whole scene based on chapter colors
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const color = config.colors ? config.colors[0] : '#ffffff';
        const grad = ctx.createRadialGradient(CANVAS_WIDTH / 2, -100, 0, CANVAS_WIDTH / 2, -100, CANVAS_HEIGHT * 1.5);
        grad.addColorStop(0, color + '11'); // Very faint
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
    }

    drawPostFX(ctx) {
        const ch = this.game.chapter;
        const config = this.game?.getActiveChapterConfig
            ? this.game.getActiveChapterConfig(ch)
            : (CHAPTER_REGISTRY[ch] || CHAPTER_REGISTRY[1]);

        // Vignette
        ctx.save();
        const vg = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.75);
        vg.addColorStop(0, 'transparent');
        vg.addColorStop(1, `rgba(0,0,0,${config.vignetteAlpha || 0.4})`);
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Color grade tint
        if (config.tint) {
            ctx.globalAlpha = config.tintAlpha || 0.08;
            ctx.fillStyle = config.tint;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // AAA Dynamic Damage/Impact Border
        if (this.game.camTrauma > 0.1) {
            ctx.globalAlpha = 1;
            const dmgGrad = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.8);
            dmgGrad.addColorStop(0, 'transparent');
            dmgGrad.addColorStop(1, `rgba(255, 0, 0, ${Math.min(0.8, this.game.camTrauma)})`);
            ctx.fillStyle = dmgGrad;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // AAA Dash / Speed Lines Glow Effect
        if (this.game.frog && this.game.frog.dashT > 0) {
            ctx.globalCompositeOperation = 'screen';
            const dashGrad = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.9);
            dashGrad.addColorStop(0, 'transparent');
            dashGrad.addColorStop(1, `rgba(24, 238, 216, ${Math.min(0.35, this.game.frog.dashT / 15)})`);
            ctx.fillStyle = dashGrad;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        ctx.restore();
    }

    // ═══════════════════════ HELPERS ═══════════════════════

    _generateSeeds(ch) {
        const s = {};
        const rng = (i) => ((ch * 9301 + i * 49297) % 233280) / 233280;
        s.mountains = Array.from({ length: 20 }, (_, i) => ({ h: 0.3 + rng(i) * 0.5, w: 0.08 + rng(i + 100) * 0.12, x: rng(i + 200) }));
        s.trees = Array.from({ length: 40 }, (_, i) => ({ x: rng(i + 300), h: 0.3 + rng(i + 400) * 0.6, w: 0.02 + rng(i + 500) * 0.04 }));
        s.stars = Array.from({ length: 80 }, (_, i) => ({ x: rng(i + 600), y: rng(i + 700) * 0.6, s: 0.5 + rng(i + 800) * 2, b: 0.3 + rng(i + 900) * 0.7 }));
        s.details = Array.from({ length: 30 }, (_, i) => ({ x: rng(i + 1000), y: rng(i + 1100), s: 0.5 + rng(i + 1200) * 1.5 }));

        // AAA Particles Seeds
        s.particles = Array.from({ length: 40 }, (_, i) => ({
            x: rng(i + 1300),
            y: rng(i + 1400),
            size: 1 + rng(i + 1500) * 3,
            speed: 0.2 + rng(i + 1600) * 0.8,
            alpha: 0.1 + rng(i + 1700) * 0.4
        }));

        return s;
    }

    _parallaxX(scrollX, speed, width = CANVAS_WIDTH) {
        // At start of chapter (scrollX close to 0), don't apply offset
        if (Math.abs(scrollX) < 1) return 0;
        return (Math.abs(scrollX) * speed) % width;
    }

    _drawScrollLayer(ctx, scrollX, parallax, drawFn) {
        ctx.save();
        const x = -this._parallaxX(scrollX, parallax, CANVAS_WIDTH);
        ctx.translate(x, 0);
        drawFn(0);
        ctx.translate(CANVAS_WIDTH, 0);
        drawFn(1);
        ctx.translate(-CANVAS_WIDTH * 2, 0);
        drawFn(2);
        ctx.restore();
    }

    _sky(ctx, colors, sunY) {
        const g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (sunY !== undefined) {
            const sx = CANVAS_WIDTH * 0.75, sy = sunY;
            const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 120);
            sg.addColorStop(0, 'rgba(255,255,200,0.9)');
            sg.addColorStop(0.3, 'rgba(255,200,100,0.3)');
            sg.addColorStop(1, 'transparent');
            ctx.fillStyle = sg;
            ctx.fillRect(sx - 120, sy - 120, 240, 240);
        }
    }

    _drawMountainRange(ctx, scrollX, parallax, color, baseY, seeds, scale) {
        this._drawScrollLayer(ctx, scrollX, parallax, () => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, CANVAS_HEIGHT);
            for (let i = 0; i < seeds.length; i++) {
                const s = seeds[i];
                const px = s.x * CANVAS_WIDTH;
                const py = baseY - s.h * CANVAS_HEIGHT * scale;
                const hw = s.w * CANVAS_WIDTH;
                ctx.lineTo(px - hw, baseY);
                ctx.lineTo(px, py);
                ctx.lineTo(px + hw, baseY);
            }
            ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fill();
        });
    }

    _drawTreeSilhouettes(ctx, scrollX, parallax, color, baseY, count, maxH) {
        this._drawScrollLayer(ctx, scrollX, parallax, () => {
            ctx.fillStyle = color;
            for (let i = 0; i < count; i++) {
                const s = this._currentSeeds.trees[i % this._currentSeeds.trees.length];
                const x = s.x * CANVAS_WIDTH;
                const h = s.h * maxH;
                const w = s.w * CANVAS_WIDTH * 2;
                // Trunk
                ctx.fillRect(x - 3, baseY - h, 6, h);
                // Canopy (triangle)
                ctx.beginPath();
                ctx.moveTo(x - w, baseY - h * 0.4);
                ctx.lineTo(x, baseY - h - 20);
                ctx.lineTo(x + w, baseY - h * 0.4);
                ctx.closePath();
                ctx.fill();
            }
        });
    }

    _drawSVGLayer(ctx, scrollX, parallax) {
        const loader = this.game.assetLoader;
        const ch = this._currentRenderingChapter;
        const levelIdx = this._currentRenderingSubLevel;
        const normalizedLvl = ((levelIdx - 1) % 30) + 1;

        if (!loader || !loader.cache[`ch${ch}`]) return;
        const assets = loader.cache[`ch${ch}`];

        // Draw the specific background image for this level
        const img = assets[`bg_l0${normalizedLvl}`];
        if (img) {
            this._drawSingleImageLayer(ctx, img, scrollX, parallax, normalizedLvl);
        } else {
            // Fallback to generic backgrounds if l0X is missing
            const fallback = assets['bg_2'] || assets['bg_1'];
            if (fallback) {
                this._drawSingleImageLayer(ctx, fallback, scrollX, parallax, normalizedLvl);
            }
        }
    }

    _drawSingleImageLayer(ctx, img, scrollX, speed, lvl = 1) {
        if (!img || img.width === 0 || img.isPlaceholder) return;

        const h = CANVAS_HEIGHT;
        // Obtenemos la proporción real de la imagen cargada
        const aspect = img.naturalWidth / img.naturalHeight;

        // Calculamos el ancho basado en la altura de la pantalla para mantener el aspecto
        // Si la imagen es 30:9, el ancho será mucho mayor que el alto.
        let w = h * aspect;

        // Aseguramos que el ancho sea al menos el del canvas
        if (w < CANVAS_WIDTH) w = CANVAS_WIDTH;

        // Parallax scroll logic
        const xOffset = this._parallaxX(scrollX, speed, w);
        const x = -xOffset;

        ctx.save();
        // Dibujamos el patrón infinito
        let currentX = x;
        let safety = 0;
        const step = w;
        while (currentX < CANVAS_WIDTH && safety < 10) {
            ctx.drawImage(img, currentX, 0, w, h);
            currentX += step;
            safety++;
        }
        // Cubrir huecos a la izquierda
        ctx.drawImage(img, x - w, 0, w, h);
        ctx.restore();
    }

    _drawGodRays(ctx, config) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const rayColor = config.godRayColor || 'rgba(255,255,200,0.06)';
        const count = 5;
        for (let i = 0; i < count; i++) {
            const angle = -0.3 + i * 0.15 + Math.sin(this.t * 0.3 + i) * 0.05;
            const x = CANVAS_WIDTH * (0.2 + i * 0.15);
            ctx.save();
            ctx.translate(x, -50);
            ctx.rotate(angle);
            const w = 60 + Math.sin(this.t * 0.5 + i * 2) * 20;
            ctx.fillStyle = rayColor;
            ctx.beginPath();
            ctx.moveTo(-w / 2, 0);
            ctx.lineTo(-w, CANVAS_HEIGHT * 1.2);
            ctx.lineTo(w, CANVAS_HEIGHT * 1.2);
            ctx.lineTo(w / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    _drawFog(ctx, color, alpha, speed) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        const waveY = CANVAS_HEIGHT * 0.6;
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT);
        for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
            const y = waveY + Math.sin(x * 0.005 + this.t * speed) * 30 + Math.sin(x * 0.01 + this.t * speed * 0.7) * 15;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    _drawWater(ctx, color1, color2, baseY) {
        const g = ctx.createLinearGradient(0, baseY, 0, CANVAS_HEIGHT);
        g.addColorStop(0, color1);
        g.addColorStop(1, color2);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT);
        for (let x = 0; x <= CANVAS_WIDTH; x += 10) {
            ctx.lineTo(x, baseY + Math.sin(x * 0.02 + this.t * 2) * 4 + Math.sin(x * 0.005 + this.t) * 8);
        }
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();
    }

    // ═══════════════════════ BIOME 1: JUNGLE ═══════════════════════

    _draw_jungle(ctx, config, sx) {
        // L0: Sky — filtered green-gold light
        this._sky(ctx, ['#0b2e0b', '#1a5c1a', '#2d8a2d', '#4a9e3a'], 100);

        // L1: Far misty mountains
        ctx.globalAlpha = 0.35;
        this._drawMountainRange(ctx, sx, 0.02, '#0d3d1a', CANVAS_HEIGHT * 0.55, this._currentSeeds.mountains, 0.6);
        ctx.globalAlpha = 1;

        // L2: Dense canopy layer (REMOVED: User requested to remove consecutive circles)
        /*
        this._drawScrollLayer(ctx, sx, 0.06, () => {
            ctx.fillStyle = '#0f2d0f';
            for (let i = 0; i < 12; i++) {
                const s = this._currentSeeds.trees[i];
                const x = s.x * CANVAS_WIDTH;
                const r = 40 + s.h * 60;
                ctx.beginPath();
                ctx.arc(x, CANVAS_HEIGHT * 0.35 + s.w * 100, r, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        */

        // L3: Main SVG
        this._drawSVGLayer(ctx, sx, 0.15);

        // L4: Ground vegetation
        this._drawScrollLayer(ctx, sx, 0.25, () => {
            ctx.fillStyle = '#0a2a0a';
            for (let i = 0; i < 20; i++) {
                const s = this._currentSeeds.details[i % 30];
                const x = s.x * CANVAS_WIDTH;
                const h = 20 + s.s * 30;
                // Fern shapes
                ctx.beginPath();
                ctx.moveTo(x, CANVAS_HEIGHT);
                ctx.quadraticCurveTo(x - 15, CANVAS_HEIGHT - h, x - 5, CANVAS_HEIGHT - h - 10);
                ctx.quadraticCurveTo(x + 5, CANVAS_HEIGHT - h, x + 15, CANVAS_HEIGHT);
                ctx.fill();
            }
        });

        // Deep fog layers
        this._drawFog(ctx, '#1a4a1a', 0.15, 0.3);
        this._drawFog(ctx, '#0d3d1a', 0.1, 0.5);
    }

    _fg_jungle(ctx, config, sx) {
        // Hanging vines with physics
        ctx.save();
        ctx.strokeStyle = '#1a5c1a';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const s = this._currentSeeds.details[i];
            const x = ((s.x * CANVAS_WIDTH * 3 - sx * 0.02) % (CANVAS_WIDTH + 200)) - 100;
            const len = 80 + s.s * 120;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            const sway = Math.sin(this.t * 1.5 + i * 2) * 15;
            ctx.quadraticCurveTo(x + sway, len * 0.5, x + sway * 0.7, len);
            ctx.stroke();
            // Leaves on vine
            ctx.fillStyle = '#2d8a2d';
            for (let j = 0; j < 4; j++) {
                const ly = len * (j + 1) / 5;
                const lx = x + Math.sin(this.t * 1.5 + i * 2 + j) * (15 * j / 4);
                ctx.beginPath();
                ctx.ellipse(lx, ly, 6, 3, Math.sin(this.t + j) * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // ═══════════════════════ BIOME 2: DESERT ═══════════════════════

    _draw_desert(ctx, config, sx) {
        // L0: HDR sky
        this._sky(ctx, ['#1a0a00', '#8B4513', '#E4D00A', '#FFD700', '#87CEEB'], 80);

        // L1: Far pyramids
        ctx.save();
        ctx.globalAlpha = 0.3;
        this._drawScrollLayer(ctx, sx, 0.02, () => {
            ctx.fillStyle = '#c4a248';
            // Pyramid 1
            ctx.beginPath();
            ctx.moveTo(200, CANVAS_HEIGHT * 0.55);
            ctx.lineTo(280, CANVAS_HEIGHT * 0.25);
            ctx.lineTo(360, CANVAS_HEIGHT * 0.55);
            ctx.fill();
            // Pyramid 2
            ctx.beginPath();
            ctx.moveTo(700, CANVAS_HEIGHT * 0.55);
            ctx.lineTo(800, CANVAS_HEIGHT * 0.3);
            ctx.lineTo(900, CANVAS_HEIGHT * 0.55);
            ctx.fill();
        });
        ctx.restore();

        // L2: Mid dunes
        this._drawScrollLayer(ctx, sx, 0.08, () => {
            ctx.fillStyle = '#d4a030';
            ctx.beginPath();
            ctx.moveTo(0, CANVAS_HEIGHT);
            for (let x = 0; x <= CANVAS_WIDTH; x += 5) {
                const y = CANVAS_HEIGHT * 0.55 + Math.sin(x * 0.008 + 1) * 40 + Math.sin(x * 0.003) * 60;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fill();
        });

        // L3: SVG
        this._drawSVGLayer(ctx, sx, 0.15);

        // L4: Near dunes
        this._drawScrollLayer(ctx, sx, 0.3, () => {
            ctx.fillStyle = '#b8860b';
            ctx.beginPath();
            ctx.moveTo(0, CANVAS_HEIGHT);
            for (let x = 0; x <= CANVAS_WIDTH; x += 5) {
                const y = CANVAS_HEIGHT * 0.75 + Math.sin(x * 0.01 + 3) * 25 + Math.sin(x * 0.004 + 1) * 35;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fill();
        });

        // Heat haze shimmer
        ctx.save();
        ctx.globalAlpha = 0.04;
        ctx.fillStyle = '#FFD700';
        for (let x = 0; x < CANVAS_WIDTH; x += 40) {
            const y = CANVAS_HEIGHT * 0.5 + Math.sin(x * 0.05 + this.t * 3) * 8;
            ctx.fillRect(x, y, 30, 3);
        }
        ctx.restore();
    }

    _fg_desert(ctx, config, sx) {
        // Heat distortion + floating dust
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 15; i++) {
            const s = this._currentSeeds.details[i];
            const x = ((s.x * 3000 - sx * 1.1 + this.t * 20) % (CANVAS_WIDTH + 100)) - 50;
            const y = CANVAS_HEIGHT * 0.3 + s.y * CANVAS_HEIGHT * 0.5;
            ctx.beginPath();
            ctx.arc(x, y, 1 + s.s, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // ═══════════════════════ BIOME 3: JAPAN ═══════════════════════

    _draw_japan(ctx, config, sx) {
        // L0: Cherry blossom sunset
        this._sky(ctx, ['#4a1a3a', '#c0392b', '#e67e22', '#f9e79f', '#fadbd8']);

        // L1: Mt Fuji silhouette
        ctx.save();
        ctx.globalAlpha = 0.25;
        this._drawScrollLayer(ctx, sx, 0.02, () => {
            ctx.fillStyle = '#5c2d5c';
            ctx.beginPath();
            ctx.moveTo(500, CANVAS_HEIGHT * 0.6);
            ctx.lineTo(640, CANVAS_HEIGHT * 0.12);
            ctx.lineTo(780, CANVAS_HEIGHT * 0.6);
            ctx.closePath();
            ctx.fill();
            // Snow cap
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.moveTo(600, CANVAS_HEIGHT * 0.2);
            ctx.lineTo(640, CANVAS_HEIGHT * 0.12);
            ctx.lineTo(680, CANVAS_HEIGHT * 0.2);
            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();

        // L2: Torii gates + temples
        this._drawScrollLayer(ctx, sx, 0.08, () => {
            // Torii gate
            ctx.fillStyle = '#c0392b';
            const tx = 400;
            ctx.fillRect(tx - 60, CANVAS_HEIGHT * 0.3, 8, CANVAS_HEIGHT * 0.5);
            ctx.fillRect(tx + 52, CANVAS_HEIGHT * 0.3, 8, CANVAS_HEIGHT * 0.5);
            ctx.fillRect(tx - 70, CANVAS_HEIGHT * 0.3, 140, 8);
            ctx.fillRect(tx - 65, CANVAS_HEIGHT * 0.38, 130, 5);
            // Pagoda silhouette
            ctx.fillStyle = '#3d1a3d';
            const px = 900;
            for (let f = 0; f < 3; f++) {
                const w = 70 - f * 15, y = CANVAS_HEIGHT * 0.4 - f * 35;
                ctx.fillRect(px - w / 2, y, w, 30);
                // Roof
                ctx.beginPath();
                ctx.moveTo(px - w / 2 - 10, y);
                ctx.lineTo(px, y - 15);
                ctx.lineTo(px + w / 2 + 10, y);
                ctx.closePath();
                ctx.fill();
            }
        });

        // L3: SVG
        this._drawSVGLayer(ctx, sx, 0.15);

        // L4: Stone path + lanterns
        this._drawScrollLayer(ctx, sx, 0.25, () => {
            // Ground
            ctx.fillStyle = '#4a3728';
            ctx.fillRect(0, CANVAS_HEIGHT * 0.85, CANVAS_WIDTH, CANVAS_HEIGHT * 0.15);
            // Stone lanterns
            ctx.fillStyle = '#888';
            for (let i = 0; i < 4; i++) {
                const lx = 150 + i * 320;
                ctx.fillRect(lx - 4, CANVAS_HEIGHT * 0.75, 8, CANVAS_HEIGHT * 0.1);
                ctx.fillRect(lx - 10, CANVAS_HEIGHT * 0.72, 20, 8);
                // Warm glow
                ctx.save();
                ctx.globalAlpha = 0.15 + Math.sin(this.t * 3 + i) * 0.05;
                const lg = ctx.createRadialGradient(lx, CANVAS_HEIGHT * 0.73, 0, lx, CANVAS_HEIGHT * 0.73, 40);
                lg.addColorStop(0, '#ffcc66');
                lg.addColorStop(1, 'transparent');
                ctx.fillStyle = lg;
                ctx.fillRect(lx - 40, CANVAS_HEIGHT * 0.69, 80, 80);
                ctx.restore();
            }
        });

        // Mist layers
        this._drawFog(ctx, '#e6c8c8', 0.08, 0.2);
    }

    _fg_japan(ctx, config, sx) {
        // Cherry blossom branches in foreground
        ctx.save();
        ctx.strokeStyle = '#5c3024';
        ctx.lineWidth = 4;
        for (let i = 0; i < 4; i++) {
            const s = this._currentSeeds.details[i + 15];
            const x = ((s.x * CANVAS_WIDTH * 2 - sx * 1.3) % (CANVAS_WIDTH + 300)) - 150;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.quadraticCurveTo(x + 40, 60, x + 80 + Math.sin(this.t + i) * 5, 100);
            ctx.stroke();
            // Blossoms
            ctx.fillStyle = '#FFB7C5';
            for (let j = 0; j < 6; j++) {
                const bx = x + 10 + j * 12 + Math.sin(this.t * 2 + j) * 3;
                const by = 20 + j * 14;
                ctx.beginPath();
                ctx.arc(bx, by, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // ═══════════════════════ BIOME 4: ENCHANTED FOREST ═══════════════════════

    _draw_enchanted(ctx, config, sx) {
        // L0: Deep magical sky
        this._sky(ctx, ['#0a0a2e', '#1a0a3e', '#2d1b69', '#1a3d2a']);
        // Moon
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#e8e0ff';
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH * 0.2, 80, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0a2e';
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH * 0.2 + 10, 75, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // L1: Giant tree silhouettes (REMOVED circle tops: User requested to remove consecutive circles)
        ctx.save();
        ctx.globalAlpha = 0.3;
        this._drawScrollLayer(ctx, sx, 0.03, () => {
            ctx.fillStyle = '#120830';
            for (let i = 0; i < 6; i++) {
                const s = this._currentSeeds.trees[i + 20];
                const x = s.x * CANVAS_WIDTH;
                ctx.fillRect(x - 15, CANVAS_HEIGHT * 0.15, 30, CANVAS_HEIGHT);
                // Circular tops removed
                // ctx.beginPath();
                // ctx.arc(x, CANVAS_HEIGHT * 0.2, 70 + s.h * 40, 0, Math.PI * 2);
                // ctx.fill();
            }
        });
        ctx.restore();

        // L2: Bioluminescent mushrooms
        this._drawScrollLayer(ctx, sx, 0.08, () => {
            for (let i = 0; i < 10; i++) {
                const s = this._currentSeeds.details[i + 10];
                const x = s.x * CANVAS_WIDTH;
                const h = 20 + s.s * 40;
                const baseY = CANVAS_HEIGHT * 0.7 + s.y * CANVAS_HEIGHT * 0.2;
                // Stem
                ctx.fillStyle = '#2a1a4a';
                ctx.fillRect(x - 3, baseY - h, 6, h);
                // Cap
                ctx.fillStyle = `hsl(${260 + i * 20}, 70%, ${40 + Math.sin(this.t * 2 + i) * 10}%)`;
                ctx.beginPath();
                ctx.ellipse(x, baseY - h, 12 + s.s * 8, 8, 0, Math.PI, 0);
                ctx.fill();
                // Glow
                ctx.save();
                ctx.globalAlpha = 0.15 + Math.sin(this.t * 2 + i) * 0.05;
                const mg = ctx.createRadialGradient(x, baseY - h, 0, x, baseY - h, 30);
                mg.addColorStop(0, `hsl(${260 + i * 20}, 80%, 60%)`);
                mg.addColorStop(1, 'transparent');
                ctx.fillStyle = mg;
                ctx.fillRect(x - 30, baseY - h - 30, 60, 60);
                ctx.restore();
            }
        });

        // L3: SVG
        this._drawSVGLayer(ctx, sx, 0.15);

        // L4: Luminous roots
        this._drawScrollLayer(ctx, sx, 0.25, () => {
            ctx.strokeStyle = '#3d1b69';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#9b59b6';
            ctx.shadowBlur = 10;
            for (let i = 0; i < 8; i++) {
                const s = this._currentSeeds.details[i + 20];
                const x = s.x * CANVAS_WIDTH;
                ctx.beginPath();
                ctx.moveTo(x, CANVAS_HEIGHT);
                ctx.quadraticCurveTo(x + 20 * Math.sin(this.t + i), CANVAS_HEIGHT * 0.85, x + 30, CANVAS_HEIGHT * 0.8);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        });

        // Magic fog
        this._drawFog(ctx, '#1a0a3e', 0.12, 0.4);
        this._drawFog(ctx, '#2d1b69', 0.08, 0.6);
    }

    _fg_enchanted(ctx, config, sx) {
        // Floating magic particles in foreground
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 20; i++) {
            const s = this._currentSeeds.stars[i];
            const x = ((s.x * CANVAS_WIDTH * 2 + this.t * 15 * (i % 3 + 1)) % CANVAS_WIDTH);
            const y = s.y * CANVAS_HEIGHT + Math.sin(this.t * 1.5 + i) * 30;
            const r = 1.5 + s.s * 0.8;
            ctx.globalAlpha = 0.3 + Math.sin(this.t * 3 + i * 1.7) * 0.2;
            ctx.fillStyle = i % 3 === 0 ? '#a855f7' : i % 3 === 1 ? '#22d3ee' : '#4ade80';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // ═══════════════════════ BIOME 5: SWAMP ═══════════════════════

    _draw_swamp(ctx, config, sx) {
        // L0: Oppressive sky
        this._sky(ctx, ['#0b1f0b', '#1a3a1a', '#2d4a2d', '#3d5a3d']);
        // Obscured moon
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#aaffaa';
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH * 0.7, 60, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // L1: Dead trees far
        ctx.save();
        ctx.globalAlpha = 0.3;
        this._drawScrollLayer(ctx, sx, 0.02, () => {
            ctx.fillStyle = '#0d1a0d';
            for (let i = 0; i < 8; i++) {
                const s = this._currentSeeds.trees[i + 10];
                const x = s.x * CANVAS_WIDTH;
                const h = 100 + s.h * 150;
                ctx.fillRect(x - 4, CANVAS_HEIGHT * 0.3, 8, h);
                // Bare branches
                ctx.strokeStyle = '#0d1a0d';
                ctx.lineWidth = 3;
                for (let b = 0; b < 3; b++) {
                    ctx.beginPath();
                    ctx.moveTo(x, CANVAS_HEIGHT * 0.3 + b * 30);
                    ctx.lineTo(x + (b % 2 ? 30 : -30), CANVAS_HEIGHT * 0.25 + b * 20);
                    ctx.stroke();
                }
            }
        });
        ctx.restore();

        // L2: Stilted houses
        this._drawScrollLayer(ctx, sx, 0.08, () => {
            ctx.fillStyle = '#2a1a0a';
            for (let i = 0; i < 3; i++) {
                const hx = 200 + i * 400;
                // Stilts
                ctx.fillRect(hx - 20, CANVAS_HEIGHT * 0.5, 5, CANVAS_HEIGHT * 0.3);
                ctx.fillRect(hx + 15, CANVAS_HEIGHT * 0.5, 5, CANVAS_HEIGHT * 0.3);
                // House body
                ctx.fillRect(hx - 25, CANVAS_HEIGHT * 0.45, 50, 30);
                // Roof
                ctx.beginPath();
                ctx.moveTo(hx - 30, CANVAS_HEIGHT * 0.45);
                ctx.lineTo(hx, CANVAS_HEIGHT * 0.38);
                ctx.lineTo(hx + 30, CANVAS_HEIGHT * 0.45);
                ctx.closePath();
                ctx.fill();
                // Window glow
                ctx.save();
                ctx.globalAlpha = 0.3 + Math.sin(this.t * 2 + i) * 0.1;
                ctx.fillStyle = '#ffcc44';
                ctx.fillRect(hx - 5, CANVAS_HEIGHT * 0.46, 10, 8);
                ctx.restore();
            }
        });

        // L3: SVG
        this._drawSVGLayer(ctx, sx, 0.15);

        // L4: Dark water with reflections
        this._drawWater(ctx, 'rgba(10,30,10,0.8)', '#050f05', CANVAS_HEIGHT * 0.7);

        // L5: Twisted roots near
        this._drawScrollLayer(ctx, sx, 0.3, () => {
            ctx.strokeStyle = '#1a0d0a';
            ctx.lineWidth = 5;
            for (let i = 0; i < 6; i++) {
                const s = this._currentSeeds.details[i];
                const x = s.x * CANVAS_WIDTH;
                ctx.beginPath();
                ctx.moveTo(x, CANVAS_HEIGHT);
                ctx.bezierCurveTo(x + 20, CANVAS_HEIGHT * 0.85, x - 15, CANVAS_HEIGHT * 0.75, x + 10, CANVAS_HEIGHT * 0.7);
                ctx.stroke();
            }
        });

        // Toxic fog
        this._drawFog(ctx, '#1a3a0a', 0.2, 0.25);
        this._drawFog(ctx, '#0d2a0d', 0.15, 0.4);
    }

    _fg_swamp(ctx, config, sx) {
        // Will-o-wisps
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) {
            const s = this._currentSeeds.stars[i + 30];
            const x = ((s.x * CANVAS_WIDTH * 2 + Math.sin(this.t * 0.7 + i * 3) * 80) % CANVAS_WIDTH);
            const y = CANVAS_HEIGHT * 0.4 + s.y * CANVAS_HEIGHT * 0.3 + Math.sin(this.t * 1.2 + i) * 20;
            ctx.globalAlpha = 0.2 + Math.sin(this.t * 4 + i * 2) * 0.15;
            const wg = ctx.createRadialGradient(x, y, 0, x, y, 15);
            wg.addColorStop(0, '#88ff88');
            wg.addColorStop(1, 'transparent');
            ctx.fillStyle = wg;
            ctx.fillRect(x - 15, y - 15, 30, 30);
        }
        ctx.restore();
    }

    // ═══════════════════════ BIOME 6: TOY FACTORY ═══════════════════════

    _draw_toyfactory(ctx, config, sx) {
        // L0: Industrial ceiling
        const cg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        cg.addColorStop(0, '#2c3e50');
        cg.addColorStop(0.15, '#34495e');
        cg.addColorStop(1, '#1a252f');
        ctx.fillStyle = cg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Ceiling lights
        for (let i = 0; i < 5; i++) {
            const lx = 130 + i * 260;
            ctx.save();
            ctx.globalAlpha = 0.2 + Math.sin(this.t * 3 + i * 1.5) * 0.05;
            const lg = ctx.createRadialGradient(lx, 20, 0, lx, 20, 200);
            lg.addColorStop(0, '#ffffcc');
            lg.addColorStop(0.5, 'rgba(255,255,150,0.1)');
            lg.addColorStop(1, 'transparent');
            ctx.fillStyle = lg;
            ctx.fillRect(lx - 200, 0, 400, 400);
            ctx.restore();
        }

        // L1: Far shelves with toy silhouettes
        this._drawScrollLayer(ctx, sx, 0.03, () => {
            ctx.fillStyle = '#1a2530';
            for (let i = 0; i < 6; i++) {
                const shx = i * 220;
                ctx.fillRect(shx, CANVAS_HEIGHT * 0.2, 200, 10);
                ctx.fillRect(shx, CANVAS_HEIGHT * 0.45, 200, 10);
                // Toy shapes on shelves
                ctx.fillStyle = '#2a3540';
                ctx.fillRect(shx + 20, CANVAS_HEIGHT * 0.12, 15, 30);
                ctx.beginPath();
                ctx.arc(shx + 80, CANVAS_HEIGHT * 0.15, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(shx + 130, CANVAS_HEIGHT * 0.37, 20, 30);
                ctx.fillStyle = '#1a2530';
            }
        });

        // L2: Massive gears (animated)
        this._drawScrollLayer(ctx, sx, 0.08, () => {
            for (let i = 0; i < 4; i++) {
                const gx = 160 + i * 330;
                const gy = CANVAS_HEIGHT * 0.5;
                const gr = 60 + (i % 2) * 30;
                const rot = this.t * (i % 2 ? 0.5 : -0.5);
                ctx.save();
                ctx.translate(gx, gy);
                ctx.rotate(rot);
                ctx.strokeStyle = '#5c6d7e';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(0, 0, gr, 0, Math.PI * 2);
                ctx.stroke();
                // Teeth
                for (let t = 0; t < 12; t++) {
                    const a = (t / 12) * Math.PI * 2;
                    ctx.fillStyle = '#4a5a6a';
                    ctx.save();
                    ctx.rotate(a);
                    ctx.fillRect(gr - 5, -5, 15, 10);
                    ctx.restore();
                }
                // Center
                ctx.fillStyle = '#3a4a5a';
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });

        // L3: SVG
        this._drawSVGLayer(ctx, sx, 0.15);

        // L4: Conveyor belt floor
        this._drawScrollLayer(ctx, sx, 0.3, () => {
            ctx.fillStyle = '#3a4a5a';
            ctx.fillRect(0, CANVAS_HEIGHT * 0.85, CANVAS_WIDTH, CANVAS_HEIGHT * 0.15);
            // Belt lines
            ctx.strokeStyle = '#2a3a4a';
            ctx.lineWidth = 2;
            const beltOffset = (this.t * 50) % 30;
            for (let x = -30 + beltOffset; x < CANVAS_WIDTH + 30; x += 30) {
                ctx.beginPath();
                ctx.moveTo(x, CANVAS_HEIGHT * 0.85);
                ctx.lineTo(x - 5, CANVAS_HEIGHT);
                ctx.stroke();
            }
        });
    }

    _fg_toyfactory(ctx, config, sx) {
        // Sparks and steam
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 10; i++) {
            const s = this._currentSeeds.stars[i + 40];
            const x = ((s.x * CANVAS_WIDTH * 2 + this.t * 30) % CANVAS_WIDTH);
            const y = CANVAS_HEIGHT * 0.3 + Math.sin(this.t * 5 + i * 3) * 50;
            ctx.globalAlpha = Math.max(0, 0.4 - Math.abs(Math.sin(this.t * 8 + i * 4)) * 0.5);
            ctx.fillStyle = '#ffaa33';
            ctx.fillRect(x, y, 2, 2);
        }
        ctx.restore();
    }

    // ═══════════════════════ BIOME 7: MEXICAN FIESTA ═══════════════════════

    _draw_mexico(ctx, config, sx) {
        // L0: Warm festive night sky
        this._sky(ctx, ['#0a0520', '#1a0a30', '#2a1040', '#3d1a2a', '#1a0a15']);
        // Stars
        ctx.save();
        for (let i = 0; i < 30; i++) {
            const s = this._currentSeeds.stars[i];
            ctx.globalAlpha = 0.3 + Math.sin(this.t * 2 + i) * 0.2;
            ctx.fillStyle = '#fff';
            ctx.fillRect(s.x * CANVAS_WIDTH, s.y * CANVAS_HEIGHT * 0.4, 1.5, 1.5);
        }
        ctx.restore();

        // L1: Distant colorful buildings
        this._drawScrollLayer(ctx, sx, 0.03, () => {
            const bColors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e67e22'];
            for (let i = 0; i < 8; i++) {
                const bx = i * 170;
                const bh = 80 + (i % 3) * 40;
                ctx.fillStyle = bColors[i % bColors.length];
                ctx.globalAlpha = 0.25;
                ctx.fillRect(bx, CANVAS_HEIGHT * 0.5 - bh, 150, bh + CANVAS_HEIGHT * 0.5);
                // Windows
                ctx.fillStyle = '#ffcc44';
                ctx.globalAlpha = 0.15;
                for (let w = 0; w < 3; w++) {
                    for (let h = 0; h < 2; h++) {
                        ctx.fillRect(bx + 20 + w * 40, CANVAS_HEIGHT * 0.5 - bh + 20 + h * 35, 12, 15);
                    }
                }
                ctx.globalAlpha = 1;
            }
        });

        // L2: String lights + papel picado
        this._drawScrollLayer(ctx, sx, 0.1, () => {
            const picadoColors = ['#ff4444', '#44ff44', '#ffff44', '#ff44ff', '#44ffff', '#ff8844'];
            // String
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, CANVAS_HEIGHT * 0.25);
            for (let x = 0; x <= CANVAS_WIDTH; x += 10) {
                ctx.lineTo(x, CANVAS_HEIGHT * 0.25 + Math.sin(x * 0.015) * 15);
            }
            ctx.stroke();
            // Papel picado flags
            for (let i = 0; i < 20; i++) {
                const px = i * 65 + 10;
                const py = CANVAS_HEIGHT * 0.25 + Math.sin(px * 0.015) * 15;
                const sway = Math.sin(this.t * 2 + i * 0.8) * 3;
                ctx.fillStyle = picadoColors[i % picadoColors.length];
                ctx.globalAlpha = 0.7;
                ctx.save();
                ctx.translate(px + sway, py);
                ctx.fillRect(-10, 0, 20, 25);
                // Cut-out pattern
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(0, 12, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-3, 20, 6, 6);
                ctx.globalCompositeOperation = 'source-over';
                ctx.restore();
                ctx.globalAlpha = 1;
            }
        });

        // L3: SVG
        this._drawSVGLayer(ctx, sx, 0.15);

        // L4: Ground with warm lights
        this._drawScrollLayer(ctx, sx, 0.25, () => {
            ctx.fillStyle = '#2a1a10';
            ctx.fillRect(0, CANVAS_HEIGHT * 0.8, CANVAS_WIDTH, CANVAS_HEIGHT * 0.2);
            // Hanging lanterns
            for (let i = 0; i < 6; i++) {
                const lx = 100 + i * 220;
                const ly = CANVAS_HEIGHT * 0.5 + Math.sin(this.t * 1.5 + i) * 5;
                ctx.save();
                ctx.globalAlpha = 0.25 + Math.sin(this.t * 3 + i) * 0.08;
                const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 60);
                lg.addColorStop(0, '#ffaa44');
                lg.addColorStop(1, 'transparent');
                ctx.fillStyle = lg;
                ctx.fillRect(lx - 60, ly - 60, 120, 120);
                ctx.restore();
                // Lantern body
                ctx.fillStyle = '#cc6622';
                ctx.fillRect(lx - 6, ly - 8, 12, 16);
            }
        });
    }

    _fg_mexico(ctx, config, sx) {
        // Floating confetti + sparkles
        ctx.save();
        const cols = ['#ff4444', '#44ff44', '#ffff44', '#ff44ff', '#44ffff'];
        for (let i = 0; i < 15; i++) {
            const s = this._currentSeeds.stars[i + 50];
            const x = ((s.x * CANVAS_WIDTH * 2 + this.t * 20) % CANVAS_WIDTH);
            const y = (s.y * CANVAS_HEIGHT + this.t * 15 * (0.5 + s.b)) % CANVAS_HEIGHT;
            ctx.globalAlpha = 0.5 + Math.sin(this.t * 3 + i) * 0.3;
            ctx.fillStyle = cols[i % cols.length];
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.t * 2 + i);
            ctx.fillRect(-3, -1, 6, 2);
            ctx.restore();
        }
        ctx.restore();
    }

    // ═══════════════════════ BIOME 8: ICE KINGDOM ═══════════════════════

    _draw_ice(ctx, config, sx) {
        // L0: Deep arctic sky with aurora
        this._sky(ctx, ['#0a1628', '#0d2137', '#1a3d5c', '#2a5a7a']);

        // Aurora borealis
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.12;
        for (let band = 0; band < 3; band++) {
            ctx.beginPath();
            const baseY = 60 + band * 40;
            ctx.moveTo(0, baseY);
            for (let x = 0; x <= CANVAS_WIDTH; x += 8) {
                const y = baseY + Math.sin(x * 0.008 + this.t * 0.5 + band) * 25
                    + Math.sin(x * 0.003 + this.t * 0.3) * 15;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(CANVAS_WIDTH, baseY + 60);
            ctx.lineTo(0, baseY + 60);
            ctx.closePath();
            const ag = ctx.createLinearGradient(0, baseY, CANVAS_WIDTH, baseY);
            ag.addColorStop(0, '#22ff88');
            ag.addColorStop(0.3, '#22ddff');
            ag.addColorStop(0.6, '#8855ff');
            ag.addColorStop(1, '#22ff88');
            ctx.fillStyle = ag;
            ctx.fill();
        }
        ctx.restore();

        // Stars (Fixed tiny icons instead of rectangles)
        ctx.save();
        for (let i = 0; i < 40; i++) {
            const s = this._currentSeeds.stars[i];
            ctx.globalAlpha = s.b * 0.5;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(s.x * CANVAS_WIDTH, s.y * CANVAS_HEIGHT * 0.4, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // L1: Far glaciers
        this._drawMountainRange(ctx, sx, 0.02, '#1a3d5c', CANVAS_HEIGHT * 0.5, this._currentSeeds.mountains, 0.5);
        // Snow caps
        ctx.save();
        ctx.globalAlpha = 0.4;
        this._drawMountainRange(ctx, sx, 0.02, '#c8e6f0', CANVAS_HEIGHT * 0.42, this._currentSeeds.mountains, 0.15);
        ctx.restore();

        // L2: Ice formations
        this._drawScrollLayer(ctx, sx, 0.08, () => {
            for (let i = 0; i < 8; i++) {
                const s = this._currentSeeds.details[i];
                const x = s.x * CANVAS_WIDTH;
                const h = 40 + s.s * 80;
                // Ice stalactite
                ctx.fillStyle = 'rgba(180,220,240,0.3)';
                ctx.beginPath();
                ctx.moveTo(x - 12, CANVAS_HEIGHT * 0.55);
                ctx.lineTo(x, CANVAS_HEIGHT * 0.55 - h);
                ctx.lineTo(x + 12, CANVAS_HEIGHT * 0.55);
                ctx.closePath();
                ctx.fill();
                // Shine
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x - 3, CANVAS_HEIGHT * 0.55);
                ctx.lineTo(x, CANVAS_HEIGHT * 0.55 - h);
                ctx.stroke();
            }
        });

        // L3: SVG
        this._drawSVGLayer(ctx, sx, 0.15);

        // L4: Icy ground
        this._drawScrollLayer(ctx, sx, 0.3, () => {
            const ig = ctx.createLinearGradient(0, CANVAS_HEIGHT * 0.8, 0, CANVAS_HEIGHT);
            ig.addColorStop(0, 'rgba(200,230,240,0.5)');
            ig.addColorStop(1, '#1a3d5c');
            ctx.fillStyle = ig;
            ctx.beginPath();
            ctx.moveTo(0, CANVAS_HEIGHT);
            for (let x = 0; x <= CANVAS_WIDTH; x += 8) {
                ctx.lineTo(x, CANVAS_HEIGHT * 0.82 + Math.sin(x * 0.02) * 5);
            }
            ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fill();
            // Ice crystals emerging
            for (let i = 0; i < 6; i++) {
                const cx = 100 + i * 220;
                ctx.fillStyle = 'rgba(180,230,250,0.25)';
                ctx.beginPath();
                ctx.moveTo(cx - 8, CANVAS_HEIGHT * 0.83);
                ctx.lineTo(cx, CANVAS_HEIGHT * 0.72);
                ctx.lineTo(cx + 8, CANVAS_HEIGHT * 0.83);
                ctx.closePath();
                ctx.fill();
            }
        });
    }

    _fg_ice(ctx, config, sx) {
        // Frost tint (Cleaned up)
        // Close snowflakes
        ctx.save();
        for (let i = 0; i < 12; i++) {
            const s = this._currentSeeds.stars[i + 60];
            const x = ((s.x * CANVAS_WIDTH * 3 + this.t * 40 * s.b) % (CANVAS_WIDTH + 100)) - 50;
            const y = (s.y * CANVAS_HEIGHT * 2 + this.t * 20) % CANVAS_HEIGHT;
            ctx.globalAlpha = 0.4 + s.b * 0.3;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x, y, 2 + s.s, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    _draw_arcade(ctx, config, sx) {
        ctx.fillStyle = '#0f051a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    _draw_space_arcade(ctx, config, sx) {
        ctx.fillStyle = '#050110';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Minimal clean stars
        ctx.save();
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 60; i++) {
            const s = this._currentSeeds.stars[i % 100];
            const x = (s.x * CANVAS_WIDTH + (sx * 0.005)) % CANVAS_WIDTH;
            const y = s.y * CANVAS_HEIGHT;
            ctx.globalAlpha = 0.15;
            ctx.beginPath(); ctx.arc(x, y, 0.5, 0, 6.28); ctx.fill();
        }
        ctx.restore();
    }

    _draw_lava_arcade(ctx, config, sx) {
        const colors = config.colors || ['#FF7A00', '#FF2E2E'];
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.save();
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 25; i++) {
            const x = (i * 80 + sx * 0.3) % CANVAS_WIDTH;
            const y = CANVAS_HEIGHT - ((i * 40 + sx * 0.5) % 200);
            ctx.fillStyle = colors[0];
            ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.28); ctx.fill();
        }
        ctx.restore();
    }

    _draw_retro_racer(ctx, config, sx) {
        ctx.fillStyle = '#05071a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#000';
        for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
            ctx.fillRect(0, y, CANVAS_WIDTH, 2);
        }
        const glow = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 400);
        glow.addColorStop(0, 'rgba(255, 0, 168, 0.1)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
    }

    _draw_underwater_ruins(ctx, config, sx) {
        ctx.fillStyle = '#0c2b3f';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#FFF';
        for (let i = 0; i < 20; i++) {
            const x = (i * 100 + sx * 0.05) % CANVAS_WIDTH;
            const y = CANVAS_HEIGHT - ((i * 60 + sx * 0.4) % CANVAS_HEIGHT);
            ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.28); ctx.stroke();
        }
        ctx.restore();
    }

    _draw_moon_valley(ctx, config, sx) {
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#3C3F58';
        for (let i = 0; i < 15; i++) {
            const x = (i * 150 + sx * 0.1) % CANVAS_WIDTH;
            const y = 100 + (i * 50) % (CANVAS_HEIGHT - 200);
            ctx.beginPath(); ctx.ellipse(x, y, 40, 20, 0, 0, 6.28); ctx.fill();
        }
        ctx.restore();
    }

    _draw_crystal_hall(ctx, config, sx) {
        ctx.fillStyle = '#12121f';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.save();
        for (let i = 0; i < 30; i++) {
            const x = (i * 70 + sx * 0.2) % CANVAS_WIDTH;
            const y = (i * 40) % CANVAS_HEIGHT;
            const opacity = Math.abs(Math.sin((sx * 0.05) + i));
            ctx.fillStyle = `rgba(255,255,255,${opacity * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(x, y - 5); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 3, y);
            ctx.fill();
        }
        ctx.restore();
    }

    _draw_rain_city(ctx, config, sx) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.save();
        ctx.strokeStyle = 'rgba(125,211,252,0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 50; i++) {
            const x = (i * 40 + sx * 0.1) % CANVAS_WIDTH;
            const y = (i * 30 + sx * 0.8) % CANVAS_HEIGHT;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 15); ctx.stroke();
        }
        ctx.restore();
    }

    _drawArcadeUltraBackground(ctx, ch, lvl, scrollX) {
        const config = this.game.getActiveChapterConfig(ch);

        // 1. Fondo Base (Skybox)
        this._drawArcadeSkybox(ctx, config);

        // 2. Renderizado por Capas (8-bit Premium)
        switch (ch) {
            case 1: this._renderArcadeJungle(ctx, config, scrollX); break;
            case 2: this._renderArcadeDesert(ctx, config, scrollX); break;
            case 3: this._renderArcadeJapan(ctx, config, scrollX); break;
            case 4: this._renderArcadeCity(ctx, config, scrollX); break;
            case 5: this._renderArcadeSpace(ctx, config, scrollX); break;
            case 6: this._renderArcadeLab(ctx, config, scrollX); break;
            case 7: this._renderArcadeFortress(ctx, config, scrollX); break;
            case 8: this._renderArcadeCave(ctx, config, scrollX); break;
            case 9: this._renderArcadeCarnival(ctx, config, scrollX); break;
            case 10: this._renderArcadeMagic(ctx, config, scrollX); break;
            case 11: this._renderArcadeVolcano(ctx, config, scrollX); break;
            case 12: this._renderArcadeVoid(ctx, config, scrollX); break;
            default: this._renderArcadeJungle(ctx, config, scrollX); break;
        }

        // 3. Iluminación y VFX Ultra
        if (config.godRays) this._drawArcadeVolumetricRays(ctx, config);

        // 4. Sombras y Post-procesado Retro
        this._drawArcadeDynamicShadows(ctx);
        this._drawScanlines(ctx);
        this._drawFog(ctx, '#000', 0.1, 0.3);
    }

    _renderArcadeJungle(ctx, config, scrollX) {
        // Estilo 8-bit Triple-A: Colores vibrantes, siluetas marcadas

        // Capa 1: Cielo 8-bit (Gradiente de bandas)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        skyGrad.addColorStop(0, '#001a1a');
        skyGrad.addColorStop(0.5, '#063a2a');
        skyGrad.addColorStop(1, '#0c5a3a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Capa 2: Montañas Pixeladas (Uso de rectas angulares)
        this._drawPixelMountains(ctx, scrollX, 0.015, (config.colors[1] || '#000') + '66', CANVAS_HEIGHT * 0.65);

        // Capa 3: Vegetación 8-bit (Bloques de color)
        this._drawPixelForest(ctx, scrollX, 0.08, (config.colors[0] || '#0d3d20') + 'DD', CANVAS_HEIGHT * 0.85);

        // Capa 4: Niebla Volumétrica (Texturizada con ruido de píxel)
        this._drawPixelFog(ctx, config.colors[0], 0.15);

        // Capa 5: Vegetación Próxima con volumen
        this._drawPixelForest(ctx, scrollX, 0.25, (config.colors[0] || '#000') + 'FF', CANVAS_HEIGHT);

        // Capa 6: Scanlines Retro (Efectivo TV antigua premium)
        this._drawScanlines(ctx);
    }

    _renderArcadeDesert(ctx, config, scrollX) {
        // Estilo 8-bit Desierto AAA: Atardecer pixelado

        // Capa 1: Cielo (Banding de atardecer)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        skyGrad.addColorStop(0, '#4a1e00');
        skyGrad.addColorStop(0.4, '#b85c00');
        skyGrad.addColorStop(1, '#ff8c00');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Capa 2: Pirámides Pixeladas
        this._drawPixelMountains(ctx, scrollX, 0.015, (config.colors[2] || '#000') + '44', CANVAS_HEIGHT * 0.6);

        // Capa 3: Dunas 8-bit escalonadas
        this._drawPixelDunes(ctx, scrollX, 0.08, (config.colors[1] || '#8B4513') + '99', CANVAS_HEIGHT * 0.8);

        // Capa 4: Partículas de Arena (Píxeles cuadrados)
        this._drawPixelSand(ctx, config.colors[0]);

        // Capa 5: Duna próxima detallada
        this._drawPixelDunes(ctx, scrollX, 0.3, config.colors[0], CANVAS_HEIGHT);

        // Capa 6: Efecto TV
        this._drawScanlines(ctx);
    }

    _renderArcadeJapan(ctx, config, scrollX) {
        // Estilo Zen Neon 8-bit
        this._drawPixelMountains(ctx, scrollX, 0.02, '#1a0510', CANVAS_HEIGHT * 0.7);
        this._drawPixelForest(ctx, scrollX, 0.1, '#330520', CANVAS_HEIGHT * 0.9);
        this._drawSakuraRain(ctx);
        this._drawPixelPagodas(ctx, scrollX, 0.15, config.colors[1]);
    }

    _renderArcadeCity(ctx, config, scrollX) {
        // Estilo Cyber City 8-bit
        this._drawCyberGrid(ctx, scrollX);
        this._drawPixelBuildings(ctx, scrollX, 0.05, '#050510', 0.8);
        this._drawPixelBuildings(ctx, scrollX, 0.2, '#0a0a20', 1.0);
        this._drawNeonFlares(ctx);
    }

    _renderArcadeSpace(ctx, config, scrollX) {
        // Estilo Odisea Espacial 8-bit
        this._drawPixelStars(ctx, scrollX);
        this._drawPixelPlanets(ctx, scrollX);
        this._drawNebulaNoise(ctx, config.colors[0]);
    }

    _renderArcadeLab(ctx, config, scrollX) {
        // Estilo Tech Lab 8-bit
        this._drawLabGrid(ctx);
        this._drawPixelTubes(ctx, scrollX);
        this._drawElectricalArcs(ctx);
    }

    _renderArcadeFortress(ctx, config, scrollX) {
        // Estilo Castillo Neon 8-bit
        this._drawPixelBattlements(ctx, scrollX);
        this._drawNeonTorches(ctx, scrollX);
    }

    _renderArcadeCave(ctx, config, scrollX) {
        // Estilo Mina Cristal 8-bit
        this._drawPixelStalactites(ctx, scrollX);
        this._drawGlowingCrystals(ctx, scrollX);
    }

    _renderArcadeCarnival(ctx, config, scrollX) {
        // Estilo Parque Atracciones 8-bit
        this._drawFerrisWheel(ctx, scrollX);
        this._drawCarnivalLights(ctx);
    }

    _renderArcadeMagic(ctx, config, scrollX) {
        // Estilo Mundo Mágico 8-bit
        this._drawPixelFloatingIslands(ctx, scrollX);
        this._drawMagicSparks(ctx);
    }

    _renderArcadeVolcano(ctx, config, scrollX) {
        // Estilo Volcán Retro 8-bit
        this._drawPixelVolcanoRange(ctx, scrollX);
        this._drawPixelLavaRiver(ctx);
        this._drawAshPixels(ctx);
    }

    _renderArcadeVoid(ctx, config, scrollX) {
        // Estilo Capítulo Final 8-bit (Void)
        this._drawPixelDataStreams(ctx);
        this._drawAbstractPixelGeometry(ctx);
    }

    _drawDesertMonuments(ctx, scrollX, parallax, color, baseY) {
        ctx.fillStyle = color;
        for (let i = 0; i < 3; i++) {
            const x = ((i * 500 - scrollX * parallax) % (CANVAS_WIDTH + 600)) - 300;
            ctx.beginPath();
            ctx.moveTo(x, baseY);
            ctx.lineTo(x + 200, baseY - 250);
            ctx.lineTo(x + 400, baseY);
            ctx.fill();
        }
    }

    _drawArcadeDunes(ctx, scrollX, parallax, color, baseY, complexity) {
        ctx.save();
        const g = ctx.createLinearGradient(0, baseY - 150, 0, baseY);
        g.addColorStop(0, color);
        g.addColorStop(1, '#000');
        ctx.fillStyle = g;

        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT);
        for (let x = 0; x <= CANVAS_WIDTH; x += 15) {
            const worldX = x + scrollX * parallax;
            const y = baseY - Math.abs(Math.sin(worldX * 0.0015 * complexity) * 100 + Math.cos(worldX * 0.004) * 40);
            ctx.lineTo(x, y);
        }
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fill();
        ctx.restore();
    }

    _drawSandParticles(ctx, color) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = color;
        for (let i = 0; i < 60; i++) {
            const x = (i * 37 + this.t * 220) % CANVAS_WIDTH;
            const y = (i * 23 + Math.sin(this.t * 0.8 + i) * 80) % CANVAS_HEIGHT;
            ctx.fillRect(x, y, 2, 2);
        }
        ctx.restore();
    }

    _drawArcadeSkybox(ctx, config) {
        const g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        const colors = config.colors || ['#000', '#222'];
        g.addColorStop(0, colors[1]);
        g.addColorStop(0.5, colors[0]);
        g.addColorStop(1, '#000');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Estrellas/Partículas de fondo HD
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 60; i++) {
            const s = this._currentSeeds.stars[i % this._currentSeeds.stars.length];
            const pulse = 0.5 + Math.sin(this.t * 2 + i) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${s.b * pulse * 0.4})`;
            ctx.beginPath();
            ctx.arc(s.x * CANVAS_WIDTH, s.y * CANVAS_HEIGHT, s.s * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    _drawArcadeVolumetricRays(ctx, config) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const rayColor = config.godRayColor || 'rgba(255,255,255,0.15)';
        for (let i = 0; i < 8; i++) {
            const angle = -0.4 + i * 0.12 + Math.sin(this.t * 0.2 + i) * 0.08;
            const x = CANVAS_WIDTH * (0.1 + i * 0.15);
            ctx.save();
            ctx.translate(x, -100);
            ctx.rotate(angle);
            const w = 80 + Math.sin(this.t * 0.4 + i) * 40;
            const g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
            g.addColorStop(0, rayColor);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(-w / 2, 0); ctx.lineTo(-w * 2, CANVAS_HEIGHT); ctx.lineTo(w * 2, CANVAS_HEIGHT); ctx.lineTo(w / 2, 0);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    _drawArcadeDynamicShadows(ctx) {
        if (!this.game.frog) return;
        const f = this.game.frog;

        ctx.save();
        ctx.translate(f.x + f.w / 2, CANVAS_HEIGHT - 20);
        ctx.scale(1.5, 0.4);
        const opacity = Math.max(0, 0.4 - (CANVAS_HEIGHT - f.y - f.h) / 400);
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.beginPath();
        ctx.arc(0, 0, f.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _getCachedGrad(ctx, x1, y1, x2, y2, stops) {
        const key = `${x1},${y1},${x2},${y2},${stops.map(s => s.col).join('|')}`;
        if (this._gradCache.has(key)) return this._gradCache.get(key);
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        stops.forEach(s => grad.addColorStop(s.pos, s.col));
        this._gradCache.set(key, grad);
        return grad;
    }

    _generateSeeds(ch) {
        return {
            stars: Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random(), b: Math.random() })),
            details: Array.from({ length: 30 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() })),
            mountains: Array.from({ length: 15 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() })),
        };
    }

    _drawPixelMountains(ctx, scrollX, speed, color, baseHeight) {
        const seed = this._currentSeeds.mountains;
        const spacing = 400;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT);
        for (let i = -2; i < (CANVAS_WIDTH / spacing) + 2; i++) {
            const x = (i * spacing - (scrollX * speed) % spacing);
            const h = baseHeight - (seed[Math.abs(i) % seed.length].s * 150);
            // Picos angulares 8-bit
            ctx.lineTo(x, h);
            ctx.lineTo(x + spacing * 0.5, h - 40);
        }
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fill();
    }

    _drawPixelForest(ctx, scrollX, speed, color, baseHeight) {
        const spacing = 120;
        ctx.fillStyle = color;
        for (let i = -5; i < (CANVAS_WIDTH / spacing) + 5; i++) {
            const bx = (i * spacing - (scrollX * speed) % spacing);
            const h = 180 + Math.sin(i * 1.5) * 40;
            // Árboles de bloques 8-bit
            ctx.fillRect(bx, baseHeight - h, 30, h); // Tronco
            ctx.fillRect(bx - 30, baseHeight - h - 40, 90, 60); // Copa pixelada
        }
    }

    _drawPixelFog(ctx, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        const step = 8;
        for (let y = CANVAS_HEIGHT * 0.6; y < CANVAS_HEIGHT; y += step) {
            if (Math.random() > 0.3) {
                ctx.globalAlpha = alpha * (y / CANVAS_HEIGHT);
                ctx.fillRect(0, y, CANVAS_WIDTH, step / 2);
            }
        }
        ctx.restore();
    }

    _drawScanlines(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#000';
        for (let i = 0; i < CANVAS_HEIGHT; i += 4) {
            ctx.fillRect(0, i, CANVAS_WIDTH, 1);
        }
        // Viñeta retro
        const grad = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.8);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
    }

    _drawPixelDunes(ctx, scrollX, speed, color, baseHeight) {
        ctx.fillStyle = color;
        const spacing = 600;
        for (let i = -2; i < (CANVAS_WIDTH / spacing) + 2; i++) {
            const x = (i * spacing - (scrollX * speed) % spacing);
            // Dunas con "escalones" pixelados
            ctx.beginPath();
            ctx.moveTo(x, baseHeight);
            for (let step = 0; step <= 20; step++) {
                const sx = x + (step / 20) * spacing;
                const sy = baseHeight - Math.sin((step / 20) * Math.PI) * 100;
                // Cuantización de coordenadas para efecto 8-bit
                ctx.lineTo(Math.floor(sx / 8) * 8, Math.floor(sy / 8) * 8);
            }
            ctx.lineTo(x + spacing, baseHeight);
            ctx.fill();
        }
    }

    _drawPixelSand(ctx, color) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4;
        const count = 50;
        for (let i = 0; i < count; i++) {
            const x = (Math.random() * CANVAS_WIDTH + this.t * 200) % CANVAS_WIDTH;
            const y = Math.random() * CANVAS_HEIGHT;
            ctx.fillRect(x, y, 4, 4); // Píxeles de arena
        }
        ctx.globalAlpha = 1.0;
    }

    _drawSakuraRain(ctx) {
        ctx.fillStyle = '#ffb7c5';
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() * CANVAS_WIDTH + this.t * 100) % CANVAS_WIDTH;
            const y = (Math.random() * CANVAS_HEIGHT + this.t * 150) % CANVAS_HEIGHT;
            ctx.fillRect(x, y, 6, 6);
        }
    }

    _drawPixelPagodas(ctx, scrollX, speed, color) {
        const spacing = 800;
        ctx.fillStyle = color;
        for (let i = -1; i < (CANVAS_WIDTH / spacing) + 1; i++) {
            const x = (i * spacing - (scrollX * speed) % spacing);
            const cx = x + 400;
            // Pagoda simplificada 8-bit
            for (let layer = 0; layer < 4; layer++) {
                const w = 120 - layer * 20;
                const h = 30;
                const y = CANVAS_HEIGHT - 100 - layer * 40;
                ctx.fillRect(cx - w / 2, y, w, h);
            }
        }
    }

    _drawCyberGrid(ctx, scrollX) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        const spacing = 100;
        const offset = (scrollX * 0.1) % spacing;
        for (let x = -offset; x < CANVAS_WIDTH; x += spacing) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += spacing) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
        }
        ctx.restore();
    }

    _drawPixelBuildings(ctx, scrollX, speed, color, heightMul) {
        const spacing = 200;
        ctx.fillStyle = color;
        for (let i = -2; i < (CANVAS_WIDTH / spacing) + 2; i++) {
            const x = (i * spacing - (scrollX * speed) % spacing);
            const h = (200 + Math.sin(i * 2) * 100) * heightMul;
            ctx.fillRect(x, CANVAS_HEIGHT - h, 180, h);
            // Ventanas pixeladas
            ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
            for (let w = 0; w < 3; w++) {
                ctx.fillRect(x + 20 + w * 50, CANVAS_HEIGHT - h + 30, 20, 20);
            }
            ctx.fillStyle = color;
        }
    }

    _drawNeonFlares(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * CANVAS_WIDTH;
            const y = Math.random() * CANVAS_HEIGHT;
            const size = 50 + Math.sin(this.t * 5 + i) * 20;
            const g = ctx.createRadialGradient(x, y, 0, x, y, size);
            g.addColorStop(0, 'rgba(255, 0, 255, 0.2)');
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.fillRect(x - size, y - size, size * 2, size * 2);
        }
        ctx.restore();
    }

    _drawPixelStars(ctx, scrollX) {
        const seed = this._currentSeeds.stars || [];
        ctx.fillStyle = '#fff';
        seed.forEach(s => {
            const x = (s.x * CANVAS_WIDTH - scrollX * 0.05) % CANVAS_WIDTH;
            const y = s.y * CANVAS_HEIGHT;
            const size = s.s * 4;
            ctx.fillRect(x, y, size, size);
        });
    }

    _drawPixelPlanets(ctx, scrollX) {
        const spacing = 1200;
        ctx.fillStyle = '#444';
        for (let i = 0; i < 2; i++) {
            const x = (i * spacing - (scrollX * 0.1) % spacing) + 200;
            const y = 200 + i * 200;
            // Planeta pixelado
            ctx.beginPath();
            ctx.arc(Math.floor(x / 8) * 8, Math.floor(y / 8) * 8, 60, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawNebulaNoise(ctx, color) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = color;
        for (let i = 0; i < 100; i++) {
            ctx.fillRect(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, 16, 16);
        }
        ctx.restore();
    }

    _drawLabGrid(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.1)';
        for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
        }
        ctx.restore();
    }

    _drawPixelTubes(ctx, scrollX) {
        const spacing = 400;
        ctx.fillStyle = '#222';
        for (let i = -1; i < (CANVAS_WIDTH / spacing) + 1; i++) {
            const x = (i * spacing - (scrollX * 0.2) % spacing);
            ctx.fillRect(x, 0, 40, CANVAS_HEIGHT);
            // Líquido brillante
            ctx.fillStyle = '#0f0';
            ctx.fillRect(x + 10, 0, 20, CANVAS_HEIGHT);
            ctx.fillStyle = '#222';
        }
    }

    _drawElectricalArcs(ctx) {
        if (Math.random() > 0.9) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const x = Math.random() * CANVAS_WIDTH;
            ctx.moveTo(x, 0);
            for (let i = 0; i < 10; i++) {
                ctx.lineTo(x + (Math.random() - 0.5) * 100, i * (CANVAS_HEIGHT / 10));
            }
            ctx.stroke();
        }
    }

    _drawPixelBattlements(ctx, scrollX) {
        const spacing = 300;
        ctx.fillStyle = '#111';
        for (let i = -1; i < (CANVAS_WIDTH / spacing) + 1; i++) {
            const x = (i * spacing - (scrollX * 0.1) % spacing);
            ctx.fillRect(x, CANVAS_HEIGHT - 200, spacing, 200);
            // Almenas
            for (let b = 0; b < 3; b++) {
                ctx.fillRect(x + b * 100, CANVAS_HEIGHT - 240, 40, 40);
            }
        }
    }

    _drawNeonTorches(ctx, scrollX) {
        const spacing = 300;
        for (let i = -1; i < (CANVAS_WIDTH / spacing) + 1; i++) {
            const x = (i * spacing - (scrollX * 0.1) % spacing) + 50;
            const y = CANVAS_HEIGHT - 300;
            ctx.fillStyle = 'magenta';
            ctx.fillRect(x, y, 10, 40);
            // Brillo
            const g = ctx.createRadialGradient(x + 5, y, 0, x + 5, y, 30);
            g.addColorStop(0, 'rgba(255, 0, 255, 0.4)');
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.fillRect(x - 20, y - 20, 60, 60);
        }
    }

    _drawPixelStalactites(ctx, scrollX) {
        const spacing = 200;
        ctx.fillStyle = '#051b24';
        for (let i = -1; i < (CANVAS_WIDTH / spacing) + 1; i++) {
            const x = (i * spacing - (scrollX * 0.05) % spacing);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 40, 0);
            ctx.lineTo(x + 20, 100 + Math.sin(i) * 50);
            ctx.fill();
        }
    }

    _drawGlowingCrystals(ctx, scrollX) {
        const spacing = 400;
        for (let i = -1; i < (CANVAS_WIDTH / spacing) + 1; i++) {
            const x = (i * spacing - (scrollX * 0.1) % spacing) + 100;
            const y = CANVAS_HEIGHT - 100;
            ctx.fillStyle = 'cyan';
            ctx.beginPath();
            ctx.moveTo(x, y); ctx.lineTo(x + 30, y - 60); ctx.lineTo(x + 60, y);
            ctx.fill();
        }
    }

    _drawFerrisWheel(ctx, scrollX) {
        const x = (CANVAS_WIDTH - scrollX * 0.1) % (CANVAS_WIDTH + 400) - 200;
        const cy = CANVAS_HEIGHT / 2;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, cy, 150, 0, Math.PI * 2);
        ctx.stroke();
        // Luces rotatorias
        for (let i = 0; i < 8; i++) {
            const angle = this.t * 2 + i * (Math.PI / 4);
            const lx = x + Math.cos(angle) * 150;
            const ly = cy + Math.sin(angle) * 150;
            ctx.fillStyle = (i % 2 === 0) ? 'cyan' : 'magenta';
            ctx.fillRect(lx - 10, ly - 10, 20, 20);
        }
    }

    _drawCarnivalLights(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
            ctx.fillRect(Math.random() * CANVAS_WIDTH, Math.random() * 100, 8, 8);
        }
        ctx.restore();
    }

    _drawPixelFloatingIslands(ctx, scrollX) {
        const spacing = 500;
        ctx.fillStyle = '#2d142c';
        for (let i = -1; i < (CANVAS_WIDTH / spacing) + 1; i++) {
            const x = (i * spacing - (scrollX * 0.05) % spacing) + 200;
            const y = 300 + Math.sin(this.t + i) * 50;
            ctx.beginPath();
            ctx.moveTo(x, y); ctx.lineTo(x + 100, y - 40); ctx.lineTo(x + 200, y); ctx.lineTo(x + 100, y + 60);
            ctx.fill();
        }
    }

    _drawMagicSparks(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * CANVAS_WIDTH;
            const y = Math.random() * CANVAS_HEIGHT;
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, 4, 4);
        }
        ctx.restore();
    }

    _drawPixelVolcanoRange(ctx, scrollX) {
        const spacing = 400;
        ctx.fillStyle = '#2a0505';
        for (let i = -1; i < (CANVAS_WIDTH / spacing) + 1; i++) {
            const x = (i * spacing - (scrollX * 0.05) % spacing);
            ctx.beginPath();
            ctx.moveTo(x, CANVAS_HEIGHT);
            ctx.lineTo(x + 200, CANVAS_HEIGHT - 300);
            ctx.lineTo(x + 400, CANVAS_HEIGHT);
            ctx.fill();
            // Lava en la cima
            ctx.fillStyle = '#ff4500';
            ctx.fillRect(x + 180, CANVAS_HEIGHT - 310, 40, 20);
            ctx.fillStyle = '#2a0505';
        }
    }

    _drawPixelLavaRiver(ctx) {
        ctx.fillStyle = '#ff4500';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
        ctx.globalAlpha = 1.0;
    }

    _drawAshPixels(ctx) {
        ctx.fillStyle = '#666';
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * CANVAS_WIDTH;
            const y = (Math.random() * CANVAS_HEIGHT + this.t * 50) % CANVAS_HEIGHT;
            ctx.fillRect(x, y, 4, 4);
        }
    }

    _drawPixelDataStreams(ctx) {
        ctx.fillStyle = 'gold';
        for (let i = 0; i < 20; i++) {
            const x = (i * 64 + this.t * 100) % CANVAS_WIDTH;
            ctx.fillRect(x, 0, 2, CANVAS_HEIGHT);
        }
    }

    _drawAbstractPixelGeometry(ctx) {
        ctx.save();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 10;
        ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.rotate(this.t);
        ctx.strokeRect(-200, -200, 400, 400);
        ctx.restore();
    }
}
