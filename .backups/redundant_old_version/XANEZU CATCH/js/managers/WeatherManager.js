import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { CHAPTER_REGISTRY } from '../core/ChapterRegistry.js';

/**
 * AAA Volumetric Weather & Ambient Particle System
 * Per-biome particle effects with player reactivity and depth layers.
 */
export class WeatherManager {
    constructor(game) {
        this.game = game;
        this.particles = [];
        this.type = 'none';
        this.intensity = 0.5;
        this.biome = 'jungle';
        this.maxParticles = 400;
    }

    setChapter(chapter) {
        const config = CHAPTER_REGISTRY[chapter] || CHAPTER_REGISTRY[1];
        this.type = config.weather || 'none';
        this.biome = config.biome || 'jungle';
        this.intensity = config.intensity || 0.5;
        this.particles = [];
    }

    update(dt) {
        const spawnRate = this.intensity * 1.2;

        // Spawn biome-specific particles
        if (this.type !== 'none' && Math.random() < spawnRate) {
            if (this.particles.length < this.maxParticles) {
                this.particles.push(this._createParticle());
            }
        }

        // Ambient dust motes (universal)
        if (Math.random() < 0.1 && this.particles.length < this.maxParticles) {
            this.particles.push(this._createParticle('dust_mote'));
        }

        // Art Director Phase 3: Fever UI Flashes (Sequins)
        if (this.game && this.game.mult && this.game.mult > 1 && Math.random() < 0.6) {
            this.particles.push(this._createParticle('fever_sequin'));
        }

        // Player reactivity — particles near player get turbulence
        const frog = this.game.frog;
        const playerX = frog ? frog.x + frog.w / 2 : -999;
        const playerY = frog ? frog.y + frog.h / 2 : -999;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= p.decay * dt;
            p.age += dt;

            // Physics: gravity for some types
            if (p.gravity) p.vy += p.gravity * dt;

            // Physics: wind oscillation
            if (p.osc) {
                p.x += Math.sin(p.age * p.oscSpeed + p.oscPhase) * p.osc * dt;
            }

            // Player turbulence
            if (frog) {
                const dx = p.x - playerX;
                const dy = p.y - playerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 80 && dist > 1) {
                    const force = (80 - dist) / 80 * 0.3;
                    p.vx += (dx / dist) * force * dt;
                    p.vy += (dy / dist) * force * dt;
                }
            }

            // Remove dead particles
            if (p.life <= 0 || p.x < -60 || p.x > CANVAS_WIDTH + 60 || p.y < -60 || p.y > CANVAS_HEIGHT + 60) {
                this.particles.splice(i, 1);
            }
        }
    }

    _createParticle(forcedType = null) {
        const type = forcedType || this.type;
        const p = {
            x: 0, y: 0, vx: 0, vy: 0, size: 2, color: '#FFF',
            life: 1.0, decay: 0.008, age: 0, type: type,
            osc: 0, oscSpeed: 1, oscPhase: Math.random() * 6.28,
            gravity: 0, rot: 0, rotSpeed: 0, depth: 0
        };

        switch (type) {
            case 'dust_mote':
                p.x = Math.random() * CANVAS_WIDTH;
                p.y = Math.random() * CANVAS_HEIGHT;
                p.vx = (Math.random() - 0.5) * 0.3;
                p.vy = (Math.random() - 0.5) * 0.3;
                p.size = 1 + Math.random() * 2;
                p.color = 'rgba(255,255,255,0.3)';
                p.decay = 0.004;
                p.depth = Math.random();
                break;

            case 'fever_sequin':
                p.x = Math.random() * CANVAS_WIDTH;
                p.y = -20;
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = 4 + Math.random() * 4;
                p.size = 3 + Math.random() * 5;
                p.color = ['#FFD700', '#FF4500', '#00FFFF', '#FF1493', '#32CD32'][Math.floor(Math.random() * 5)];
                p.decay = 0.01;
                p.osc = 2;
                p.oscSpeed = 3;
                p.rotSpeed = (Math.random() - 0.5) * 0.4;
                p.gravity = 0.05;
                break;

            // ═══ JUNGLE ═══
            case 'rain':
                p.x = Math.random() * CANVAS_WIDTH;
                p.y = -20;
                p.vx = -3;
                p.vy = 16 + Math.random() * 6;
                p.size = 2;
                p.color = '#88CCFF';
                p.decay = 0.003;
                break;

            // ═══ DESERT ═══
            case 'sand':
                p.x = CANVAS_WIDTH + 20;
                p.y = Math.random() * CANVAS_HEIGHT;
                p.vx = -6 - Math.random() * 4;
                p.vy = 1 + Math.random() * 2;
                p.size = 1 + Math.random() * 3;
                p.color = Math.random() > 0.5 ? '#FFCC66' : '#DDB050';
                p.decay = 0.005;
                p.osc = 1;
                p.oscSpeed = 2;
                break;

            // ═══ JAPAN ═══
            case 'sakura':
                p.x = CANVAS_WIDTH + 20;
                p.y = -20 + Math.random() * CANVAS_HEIGHT * 0.3;
                p.vx = -1.5 - Math.random() * 1.5;
                p.vy = 1 + Math.random() * 1.5;
                p.size = 4 + Math.random() * 5;
                p.color = Math.random() > 0.3 ? '#FFB7C5' : '#FFC8D6';
                p.decay = 0.003;
                p.osc = 2;
                p.oscSpeed = 1.5;
                p.rotSpeed = (Math.random() - 0.5) * 0.1;
                p.gravity = 0.02;
                break;

            // ═══ ENCHANTED FOREST ═══
            case 'magic_dust':
                p.x = Math.random() * CANVAS_WIDTH;
                p.y = Math.random() * CANVAS_HEIGHT;
                p.vx = (Math.random() - 0.5) * 0.5;
                p.vy = -0.3 - Math.random() * 0.5;
                p.size = 2 + Math.random() * 3;
                p.color = ['#a855f7', '#22d3ee', '#4ade80', '#facc15'][Math.floor(Math.random() * 4)];
                p.decay = 0.004;
                p.osc = 1.5;
                p.oscSpeed = 1;
                p.depth = Math.random();
                break;

            // ═══ SWAMP ═══
            case 'swamp_gas':
                p.x = Math.random() * CANVAS_WIDTH;
                p.y = CANVAS_HEIGHT * 0.7 + Math.random() * CANVAS_HEIGHT * 0.3;
                p.vx = (Math.random() - 0.5) * 0.5;
                p.vy = -0.5 - Math.random() * 1;
                p.size = 3 + Math.random() * 6;
                p.color = Math.random() > 0.6 ? 'rgba(100,200,100,0.3)' : 'rgba(80,180,80,0.2)';
                p.decay = 0.005;
                p.osc = 0.8;
                p.oscSpeed = 0.5;
                break;

            // ═══ TOY FACTORY ═══
            case 'sparks':
                p.x = Math.random() * CANVAS_WIDTH;
                p.y = Math.random() * CANVAS_HEIGHT * 0.5;
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = 1 + Math.random() * 3;
                p.size = 1 + Math.random() * 2;
                p.color = Math.random() > 0.5 ? '#ffaa33' : '#ffcc66';
                p.decay = 0.02;
                p.gravity = 0.1;
                break;

            // ═══ MEXICO ═══
            case 'confetti':
                p.x = Math.random() * CANVAS_WIDTH;
                p.y = -10;
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = 1 + Math.random() * 2;
                p.size = 3 + Math.random() * 4;
                p.color = ['#ff4444', '#44ff44', '#ffff44', '#ff44ff', '#44ffff', '#ff8844'][Math.floor(Math.random() * 6)];
                p.decay = 0.004;
                p.rotSpeed = (Math.random() - 0.5) * 0.2;
                p.osc = 2;
                p.oscSpeed = 1.5;
                p.gravity = 0.02;
                break;

            // ═══ ICE ═══
            case 'snow':
                p.x = Math.random() * CANVAS_WIDTH;
                p.y = -10;
                p.vx = -1 + Math.random() * 0.5;
                p.vy = 1.5 + Math.random() * 2;
                p.size = 2 + Math.random() * 4;
                p.color = '#fff';
                p.decay = 0.003;
                p.osc = 1;
                p.oscSpeed = 1;
                break;

            default:
                p.x = Math.random() * CANVAS_WIDTH;
                p.y = -10;
                p.vy = 1;
                break;
        }
        return p;
    }

    draw(ctx) {
        if (this.particles.length === 0) return;
        ctx.save();

        // Rain — batch as lines for performance
        if (this.type === 'rain') {
            ctx.strokeStyle = '#88CCFF';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            for (const p of this.particles) {
                if (p.type === 'rain') {
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.vx * 0.3, p.y + p.vy * 0.3);
                }
            }
            ctx.stroke();
        }

        // All other particle types — batch by color
        const groups = {};
        for (const p of this.particles) {
            if (p.type === 'rain') continue;
            const key = p.color + '|' + (p.type === 'sakura' || p.type === 'confetti' || p.type === 'fever_sequin' ? 'rect' : 'circle');
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        }

        for (const key in groups) {
            const [color, shape] = key.split('|');
            ctx.fillStyle = color;

            for (const p of groups[key]) {
                ctx.save();
                ctx.globalAlpha = Math.min(1, p.life * 1.5);
                ctx.translate(p.x, p.y);
                p.rot += p.rotSpeed;
                ctx.rotate(p.rot);

                if (shape === 'rect') {
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        ctx.restore();
    }
}
