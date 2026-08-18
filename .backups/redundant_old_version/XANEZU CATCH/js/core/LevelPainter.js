import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { CHAPTER_REGISTRY } from './ChapterRegistry.js';

export class LevelPainter {
    constructor(game) {
        this.game = game;
        this._cache = {
            gradients: new Map(),
            lastChapter: null
        };
    }

    draw(ctx) {
        const chapter = this.game.chapter;
        const config = CHAPTER_REGISTRY[chapter] || CHAPTER_REGISTRY[1];

        // Layer 1: Background (Procedural + Thematic Silhouette)
        this._drawProceduralBG(ctx, config);
        this._drawThematicBackground(ctx, chapter);
        this._drawThematicAmbient(ctx, config);

        // Automated God Rays for specific themes (REMOVED: User requested removal)
        // const godRayThemes = ['desert', 'valley', 'sky', 'olympus', 'heaven', 'zen', 'genesis'];
        // if (godRayThemes.includes(config.bg)) {
        //     this.drawGodRays(ctx);
        // }

        // Layer 2: Action - (Draws externally in Game.renderGame: Entities, Player, Obstacles)
    }

    _drawThematicBackground(ctx, chapter) {
        const loader = this.game.assetLoader;
        if (!loader || !loader.cache[`ch${chapter}`]) return;
        const assets = loader.cache[`ch${chapter}`];

        // Single Background Layer (Layer 2 is traditionally the most descriptive)
        const img = assets['bg_2'] || assets['bg_1'];
        if (!img) return;

        ctx.save();
        const scrollX = this.game.bgX || 0;
        const parallax = 0.1;
        const x = (scrollX * parallax) % CANVAS_WIDTH;

        ctx.drawImage(img, -x, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(img, -x + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(img, -x - CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.restore();
    }

    _drawProceduralBG(ctx, config) {
        const type = config.bg;
        switch (type) {
            case 'ocean': case 'atlantis': case 'lake': case 'glowfish':
                this.drawOceanBackground(ctx); break;
            case 'neon': case 'retro': case 'data': case 'quantum': case 'gamma': case 'neural': case 'tv': case 'pico8': case 'core': case 'omega':
                this.drawNeonBackground(ctx); break;
            case 'volcano': case 'dragons': case 'embers': case 'sun': case 'uranium': case 'phoenix':
                this.drawVolcanoBackground(ctx); break;
            case 'sky': case 'mountains': case 'olympus': case 'heaven': case 'genesis': case 'isles':
                this.drawSkyBackground(ctx); break;
            case 'space': case 'orbit': case 'blackhole': case 'astral': case 'infinity':
                this.drawSpaceBackground(ctx); break;
            case 'forest': case 'jungle': case 'mushroom': case 'magic_wood': case 'swamp': case 'sakura': case 'biome': case 'minimal': case 'autumn': case 'lavender': case 'wheat':
                this.drawForestBackground(ctx, config); break;
            case 'desert': case 'egypt': case 'canyon': case 'west': case 'aztec': case 'time':
                this.drawDesertBackground(ctx, config); break;
            case 'cave': case 'crystals': case 'gothic': case 'uranium': case 'abyss':
                this.drawCaveBackground(ctx, config); break;
            case 'candy': case 'toys': case 'circus': case 'alice': case 'paper':
                this.drawCandyBackground(ctx, config); break;
            case 'steampunk': case 'clockwork': case 'chrome': case 'factory': case 'train':
                this.drawSteampunkBackground(ctx, config); break;
            case 'zen': case 'castle': case 'library': case 'dream': case 'emerald': case 'frozen':
            case 'pirate': case 'rome': case 'maya': case 'viking': case 'nostalgia': case 'museum':
            case 'sketch': case 'ink': case 'watercolor': case 'chalk': case 'velvet':
                this.drawMysticBackground(ctx, config); break;
            default:
                this._drawNaturalVibe(ctx, config);
        }
    }

    _drawThematicAmbient(ctx, config) {
        const type = config.ambient || 'dust';
        const color = config.colors[0];
        const intensity = config.intensity || 0.5;
        const t = Date.now() * 0.001;

        ctx.save();
        ctx.globalAlpha = intensity * 0.2;
        ctx.fillStyle = color;

        if (type === 'spores' || type === 'fireflies') {
            for (let i = 0; i < 15; i++) {
                const x = (i * 200 + this.game.bgX * 0.5) % CANVAS_WIDTH;
                const y = (i * 100 + Math.sin(t + i) * 100 + CANVAS_HEIGHT / 2) % CANVAS_HEIGHT;
                ctx.beginPath(); ctx.arc(x, y, 2 + Math.sin(t * 2 + i) * 1, 0, Math.PI * 2); ctx.fill();
            }
        } else if (type === 'digital' || type === 'glitch') {
            ctx.font = '10px monospace';
            for (let i = 0; i < 10; i++) {
                const x = (i * 150 + this.game.bgX) % CANVAS_WIDTH;
                const y = (i * 80 + t * 200) % CANVAS_HEIGHT;
                ctx.fillText(Math.random() > 0.5 ? '0' : '1', x, y);
            }
        } else if (type === 'stars' || type === 'glints') {
            ctx.shadowBlur = 10; ctx.shadowColor = color;
            for (let i = 0; i < 20; i++) {
                const x = (i * 100 + this.game.bgX * 0.1) % CANVAS_WIDTH;
                const y = (i * 90) % CANVAS_HEIGHT;
                const size = Math.random() < 0.1 ? 2 : 1;
                if (Math.sin(t * 3 + i) > 0.5) ctx.fillRect(x, y, size, size);
            }
        } else {
            // Dust/Wind/Mist
            for (let i = 0; i < 5; i++) {
                const x = (i * 400 + this.game.bgX * 0.3) % (CANVAS_WIDTH + 400) - 200;
                const y = (i * 150 + Math.sin(t + i) * 50) % CANVAS_HEIGHT;
                ctx.beginPath(); ctx.arc(x, y, 150 * intensity, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.restore();
    }

    _drawNaturalVibe(ctx, config) {
        // Subtle moving gradient for nature levels
        const t = Date.now() * 0.0005;
        const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, config.colors[0] + '11');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.save();
        ctx.translate(Math.sin(t) * 50, 0);
        ctx.fillRect(-100, 0, CANVAS_WIDTH + 200, CANVAS_HEIGHT);
        ctx.restore();
    }




    drawPostEffects(ctx) {
        ctx.save();
        const config = CHAPTER_REGISTRY[this.game.chapter] || CHAPTER_REGISTRY[1];

        // 1. Dynamic Vignette & Tone
        const center = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
        const grad = ctx.createRadialGradient(center.x, center.y, CANVAS_WIDTH * 0.2, center.x, center.y, CANVAS_WIDTH * 0.9);
        grad.addColorStop(0, config.colors[0] + '00');
        grad.addColorStop(1, config.colors[1] + (config.bg === 'space' ? '99' : '44'));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 2. High Multiplier "Heat" Effect
        if (this.game.mult > 4) {
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(Date.now() / 100)) * 0.1})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        ctx.restore();
    }

    drawForestBackground(ctx, config) {
        ctx.save();
        const t = Date.now() * 0.0005;
        const scrollX = this.game.bgX * 0.2;

        // Deep canopy layers
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = config.colors[1] + (33 + i * 22).toString(16);
            ctx.beginPath();
            const yBase = 100 + i * 150;
            for (let x = -100; x < CANVAS_WIDTH + 200; x += 150) {
                const ox = (x + scrollX * (0.5 + i * 0.2)) % (CANVAS_WIDTH + 300) - 150;
                const oy = yBase + Math.sin(t + x) * 20;
                ctx.arc(ox, oy, 120 + i * 40, 0, Math.PI * 2);
            }
            ctx.fill();
        }

        // Procedural Trunks
        ctx.fillStyle = config.colors[1] + '88';
        for (let i = 0; i < 8; i++) {
            const tx = (i * 250 + scrollX * 0.4) % (CANVAS_WIDTH + 400) - 200;
            ctx.fillRect(tx, 0, 40, CANVAS_HEIGHT);
            // Some branches
            ctx.beginPath();
            ctx.moveTo(tx + 20, 200);
            ctx.lineTo(tx + 120, 100);
            ctx.lineWidth = 10;
            ctx.strokeStyle = config.colors[1] + '44';
            ctx.stroke();
        }
        ctx.restore();
    }

    drawDesertBackground(ctx, config) {
        ctx.save();
        const t = Date.now() * 0.0008;
        const scrollX = this.game.bgX * 0.15;

        // Rolling dunes
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = config.colors[0];
            ctx.globalAlpha = 0.3 + i * 0.2;
            ctx.beginPath();
            const yBase = CANVAS_HEIGHT * 0.6 + i * 80;
            ctx.moveTo(-100, CANVAS_HEIGHT);
            for (let x = -100; x < CANVAS_WIDTH + 200; x += 100) {
                const dx = (x + scrollX * (0.3 + i * 0.3)) % (CANVAS_WIDTH + 400) - 200;
                const dy = yBase + Math.sin(x * 0.005 + t + i) * 60;
                ctx.lineTo(dx, dy);
            }
            ctx.lineTo(CANVAS_WIDTH + 100, CANVAS_HEIGHT);
            ctx.fill();
        }

        // Heat haze effect
        if (Math.random() > 0.5) {
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#FFF';
            ctx.fillRect(0, CANVAS_HEIGHT * 0.5, CANVAS_WIDTH, CANVAS_HEIGHT * 0.5);
        }
        ctx.restore();
    }

    drawCaveBackground(ctx, config) {
        ctx.save();
        const scrollX = this.game.bgX * 0.25;
        ctx.fillStyle = config.colors[1] + 'AA';

        // Stalactites (top)
        for (let i = 0; i < 15; i++) {
            const x = (i * 120 + scrollX) % (CANVAS_WIDTH + 200) - 100;
            const h = 100 + (i % 5) * 60;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 40, 0);
            ctx.lineTo(x + 20, h);
            ctx.fill();
        }

        // Stalagmites (bottom)
        for (let i = 0; i < 12; i++) {
            const x = (i * 150 + scrollX * 1.2) % (CANVAS_WIDTH + 200) - 100;
            const h = 80 + (i % 4) * 50;
            ctx.beginPath();
            ctx.moveTo(x, CANVAS_HEIGHT);
            ctx.lineTo(x + 60, CANVAS_HEIGHT);
            ctx.lineTo(x + 30, CANVAS_HEIGHT - h);
            ctx.fill();
        }

        // Crystal glints
        const t = Date.now() * 0.001;
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 10; i++) {
            if (Math.sin(t + i) > 0.8) {
                const x = (i * 200 + scrollX * 0.5) % CANVAS_WIDTH;
                const y = (i * 150) % CANVAS_HEIGHT;
                ctx.globalAlpha = 0.6;
                this.drawStar(ctx, x, y, 5, 10, 5);
            }
        }
        ctx.restore();
    }

    drawCandyBackground(ctx, config) {
        ctx.save();
        const t = Date.now() * 0.0005;
        const scrollX = this.game.bgX * 0.3;

        // Soft clouds/sugar mounds
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = ['#FFB7C5', '#98FB98', '#ADD8E6', '#FFFFE0'][i % 4];
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            const yBase = CANVAS_HEIGHT * 0.7 + Math.sin(t + i) * 30;
            for (let x = -200; x < CANVAS_WIDTH + 200; x += 180) {
                const ox = (x + scrollX * (0.4 + i * 0.1)) % (CANVAS_WIDTH + 400) - 200;
                ctx.arc(ox, yBase, 150, 0, Math.PI * 2);
            }
            ctx.fill();
        }

        // Swirly pops in distance
        ctx.lineWidth = 4;
        for (let i = 0; i < 6; i++) {
            const px = (i * 300 + scrollX * 0.5) % (CANVAS_WIDTH + 200) - 100;
            const py = 200 + (i % 3) * 100;
            ctx.strokeStyle = config.colors[0] + '44';
            ctx.beginPath();
            for (let a = 0; a < 20; a += 0.2) {
                const r = a * 2;
                ctx.lineTo(px + Math.cos(a + t) * r, py + Math.sin(a + t) * r);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    drawSteampunkBackground(ctx, config) {
        ctx.save();
        const t = Date.now() * 0.0008;
        const scrollX = this.game.bgX * 0.4;

        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;

        // Massive slow gears
        for (let i = 0; i < 5; i++) {
            ctx.save();
            const x = (i * 400 + scrollX * 0.2) % (CANVAS_WIDTH + 400) - 200;
            const y = (i * 150) % CANVAS_HEIGHT;
            const rot = t * (i % 2 === 0 ? 1 : -1) * 0.5;
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = config.colors[0];

            // Gear body
            ctx.beginPath();
            ctx.arc(0, 0, 200, 0, Math.PI * 2);
            ctx.fill();

            // Teeth
            for (let j = 0; j < 12; j++) {
                ctx.rotate(Math.PI / 6);
                ctx.fillRect(180, -20, 40, 40);
            }
            ctx.restore();
        }

        // Pipes
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#3E2723';
        for (let i = 0; i < 4; i++) {
            const h = 50 + i * 150;
            ctx.fillRect(0, h, CANVAS_WIDTH, 30);
            // Some steam leaks
            if (Math.random() > 0.95) {
                this.game.particles.spawn(Math.random() * CANVAS_WIDTH, h, '#FFF', 1);
            }
        }
        ctx.restore();
    }

    drawMysticBackground(ctx, config) {
        ctx.save();
        const t = Date.now() * 0.0004;
        const scrollX = this.game.bgX * 0.2;

        // Flowing nebula-like curtains
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
            const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            grad.addColorStop(0, config.colors[0] + '00');
            grad.addColorStop(0.5, config.colors[1] + '44');
            grad.addColorStop(1, config.colors[0] + '00');

            ctx.fillStyle = grad;
            ctx.beginPath();
            const yBase = 100 + i * 200;
            ctx.moveTo(-100, CANVAS_HEIGHT);
            for (let x = -100; x < CANVAS_WIDTH + 200; x += 150) {
                const ox = (x + scrollX * 0.5) % (CANVAS_WIDTH + 300) - 150;
                const oy = yBase + Math.sin(t + x * 0.002 + i) * 150;
                ctx.quadraticCurveTo(ox, oy - 200, ox + 75, oy);
            }
            ctx.lineTo(CANVAS_WIDTH + 100, CANVAS_HEIGHT);
            ctx.fill();
        }

        // Floating magic specs
        for (let i = 0; i < 20; i++) {
            const x = (i * 100 + scrollX * 0.8) % CANVAS_WIDTH;
            const y = (i * 80 + Math.sin(t * 2 + i) * 50) % CANVAS_HEIGHT;
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = config.colors[0];
            ctx.beginPath();
            ctx.arc(x, y, 2 + Math.sin(t + i) * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawStar(ctx, x, y, r, p, m) {
        ctx.save();
        ctx.beginPath();
        ctx.translate(x, y);
        ctx.moveTo(0, 0 - r);
        for (let i = 0; i < p; i++) {
            ctx.rotate(Math.PI / p);
            ctx.lineTo(0, 0 - (r * m));
            ctx.rotate(Math.PI / p);
            ctx.lineTo(0, 0 - r);
        }
        ctx.fill();
        ctx.restore();
    }

    drawOceanBackground(ctx) {
        ctx.save();
        const t = Date.now() * 0.0006;
        const config = CHAPTER_REGISTRY[this.game.chapter] || CHAPTER_REGISTRY[4];
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 5; i++) {
            const x = (i * 300 + Math.sin(t + i) * 80 + this.game.bgX * 0.3) % (CANVAS_WIDTH + 200) - 100;
            const grad = ctx.createLinearGradient(x, 0, x + 50, CANVAS_HEIGHT);
            grad.addColorStop(0, `rgba(0, 255, 255, ${0.06 + Math.sin(t * 0.8 + i) * 0.03})`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x + 100, CANVAS_HEIGHT); ctx.lineTo(x + 150, CANVAS_HEIGHT); ctx.lineTo(x + 50, 0);
            ctx.fill();
        }
        ctx.restore();
    }

    drawNeonBackground(ctx) {
        ctx.save();
        const t = Date.now() * 0.001;
        const horizonY = CANVAS_HEIGHT / 2 + 50;
        ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(t) * 0.1})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const y = horizonY + Math.pow(i / 8, 2) * (CANVAS_HEIGHT - horizonY);
            const scrollY = (y + this.game.bgX * 0.5) % (CANVAS_HEIGHT - horizonY);
            ctx.beginPath(); ctx.moveTo(0, horizonY + scrollY); ctx.lineTo(CANVAS_WIDTH, horizonY + scrollY); ctx.stroke();
        }
        for (let x = -CANVAS_WIDTH; x < CANVAS_WIDTH * 2; x += 150) {
            ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH / 2, horizonY); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
        }
        ctx.restore();
    }

    drawVolcanoBackground(ctx) {
        ctx.save();
        const t = Date.now() * 0.0015;
        const horizonY = CANVAS_HEIGHT / 2 + 100;
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 3; i++) {
            const xBase = (i * 500 + this.game.bgX * 0.4) % (CANVAS_WIDTH + 400) - 200;
            const grad = ctx.createLinearGradient(xBase, horizonY, xBase + 200, CANVAS_HEIGHT);
            grad.addColorStop(0, 'rgba(255, 50, 0, 0.1)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(xBase, horizonY);
            ctx.bezierCurveTo(xBase + 150, horizonY - 40, xBase + 350, horizonY + 40, xBase + 500, horizonY);
            ctx.lineTo(xBase + 500, CANVAS_HEIGHT); ctx.lineTo(xBase, CANVAS_HEIGHT);
            ctx.fill();
        }
        ctx.restore();
    }

    drawSkyBackground(ctx) {
        ctx.save();
        const t = Date.now() * 0.001;
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 6; i++) {
            const cx = (i * 250 + this.game.bgX * 0.6) % (CANVAS_WIDTH + 300) - 150;
            const cy = 100 + Math.sin(t * 0.3 + i) * 60;
            ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.arc(cx + 30, cy - 10, 30, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    drawSpaceBackground(ctx) {
        ctx.save();
        const t = Date.now() * 0.0005;
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 2; i++) {
            const nx = (CANVAS_WIDTH / 2) + Math.cos(t + i) * 300;
            const ny = (CANVAS_HEIGHT / 2) + Math.sin(t * 0.8 + i) * 200;
            const grad = ctx.createRadialGradient(nx, ny, 50, nx, ny, 600);
            grad.addColorStop(0, `hsla(${i * 180}, 70%, 50%, 0.1)`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        ctx.restore();
    }

    drawGodRays(ctx) {
        ctx.save();
        const t = Date.now() * 0.0005;
        const centerX = CANVAS_WIDTH * 0.9, centerY = -100;
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 1000);
        grad.addColorStop(0, 'rgba(255, 255, 200, 0.1)');
        grad.addColorStop(1, 'transparent');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 0.5 + Math.sin(t + i) * 0.1;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, 1200, angle - 0.05, angle + 0.05);
            ctx.fill();
        }
        ctx.restore();
    }

}
