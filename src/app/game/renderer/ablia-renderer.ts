import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../engine/engine.constants';

export class AbliaRenderer {
    private t: number = 0;
    private seeds: any = {};
    private currentCivilization: string = 'maya';
    private ambientParticles: any[] = [];
    private weatherParticles: any[] = [];
    private backgroundEntities: any[] = [];
    private currentWeather: string = 'clear';
    private abIntensity: number = 0; // Aberración Cromática

    constructor() {
        this.generateSeeds();
    }

    public setCivilization(folder: string): void {
        this.currentCivilization = folder.toLowerCase();
        this.generateSeeds(); 
        this.generateWeather(); 
        this.generateBackgroundEntities();
    }

    private generateSeeds(): void {
        const rng = (i: number) => (Math.sin(i * 9301 + 49297) + 1) / 2;
        
        // Estructuras de fondo (Pirámides, Templos, Columnas)
        this.seeds.structures = Array.from({ length: 8 }, (_, i) => ({
            x: rng(i + 100),
            w: 200 + rng(i + 200) * 300,
            h: 150 + rng(i + 300) * 250,
            type: Math.floor(rng(i + 400) * 3)
        }));

        // Decoraciones (Glyphs, Símbolos, Antorchas)
        this.seeds.decos = Array.from({ length: 15 }, (_, i) => ({
            x: rng(i + 500),
            y: 0.2 + rng(i + 600) * 0.6,
            size: 20 + rng(i + 700) * 40,
            rot: rng(i + 800) * Math.PI * 2
        }));

        this.seeds.foreground = Array.from({ length: 3 }, (_, i) => ({
            x: rng(i + 900),
            w: 400 + rng(i + 1000) * 200,
            h: LOGICAL_HEIGHT * 1.5,
            type: Math.floor(rng(i + 1100) * 2)
        }));

        this.generateAmbientParticles();
    }

    public update(dt: number): void {
        this.t += 0.016 * dt;
        this.updateAmbientParticles(dt);
        this.updateWeatherParticles(dt);
        this.updateBackgroundEntities(dt);
        if (this.abIntensity > 0) this.abIntensity -= 0.05 * dt;
    }

    public triggerAB(): void {
        this.abIntensity = 1.0;
    }

    public drawBackground(ctx: CanvasRenderingContext2D, scrollX: number): void {
        const theme = this.getThemeColors();
        
        // 1. Cielo Procedural
        this.drawSky(ctx, theme.sky);

        // 1.2 Aurora (Nordico)
        if (this.currentCivilization === 'nordico') this.drawAurora(ctx);

        // 1.3 Entidades de fondo (Dragones, Aves)
        this.drawBackgroundEntities(ctx);

        // 1.5 Siluetas de fondo extremo (Neblina)
        this.drawStructures(ctx, scrollX, 0.02, theme.structureFar + '44', true);

        // 2. Partículas Ambientales Lejanas
        this.drawAmbientGroup(ctx, 0, 10);

        // 3. Estructuras Continentales (Lejanas)
        this.drawStructures(ctx, scrollX, 0.05, theme.structureFar, true);

        // 4. Estructuras Principales (Medias)
        this.drawStructures(ctx, scrollX, 0.1, theme.structureMid, false);

        // 4.5 Clima Lejano
        this.drawWeather(ctx, true);
    }

    public drawForeground(ctx: CanvasRenderingContext2D, scrollX: number): void {
        const theme = this.getThemeColors();
        
        // Decoraciones flotantes / Símbolos
        ctx.save();
        const parallax = 0.2;
        for (let i = 0; i < this.seeds.decos.length; i++) {
            const d = this.seeds.decos[i];
            const x = (d.x * ctx.canvas.width - scrollX * parallax) % ctx.canvas.width;
            if (x < -100) continue;

            ctx.save();
            ctx.translate(x, d.y * ctx.canvas.height + Math.sin(this.t * 0.5 + i) * 20);
            ctx.rotate(d.rot + this.t * 0.2);
            
            this.drawCartoonGlyph(ctx, d.size, theme.accent);
            ctx.restore();
        }
        ctx.restore();

        // 4. Partículas Ambientales Cercanas
        this.drawAmbientGroup(ctx, 10, 20);

        // 5. Primer Plano Extremo (Parallax Masivo)
        this.drawExtremeForeground(ctx, scrollX);

        // 6. Clima Cercano
        this.drawWeather(ctx, false);

        // 7. Filtros Post-Procesado
        this.drawVignette(ctx);
        this.drawScanlines(ctx);
        if (this.abIntensity > 0) this.drawChromaticAberration(ctx);
    }

    private drawExtremeForeground(ctx: CanvasRenderingContext2D, scrollX: number): void {
        const theme = this.getThemeColors();
        const parallax = 0.5;
        const xOffset = (scrollX * parallax) % (ctx.canvas.width * 2);
        
        ctx.save();
        ctx.fillStyle = theme.structureFar;
        ctx.globalAlpha = 0.8;
        ctx.translate(-xOffset, 0);
        
        for (let i = 0; i < 2; i++) {
            ctx.save();
            ctx.translate(i * ctx.canvas.width * 2, 0);
            for (const f of this.seeds.foreground) {
                const x = f.x * ctx.canvas.width * 2;
                ctx.fillRect(x, -100, f.w, f.h);
                // Detalle de columna cartoon
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 10;
                ctx.strokeRect(x, -100, f.w, f.h);
            }
            ctx.restore();
        }
        ctx.restore();
    }

    private generateAmbientParticles(): void {
        this.ambientParticles = Array.from({ length: 20 }, (_, i) => ({
            x: Math.random() * LOGICAL_WIDTH,
            y: Math.random() * LOGICAL_HEIGHT,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.5 + 0.2
        }));
    }

    private updateAmbientParticles(dt: number): void {
        for (const p of this.ambientParticles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            if (p.x < 0) p.x = LOGICAL_WIDTH;
            if (p.x > LOGICAL_WIDTH) p.x = 0;
            if (p.y < 0) p.y = LOGICAL_HEIGHT;
            if (p.y > LOGICAL_HEIGHT) p.y = 0;
        }
    }

    private drawAmbientGroup(ctx: CanvasRenderingContext2D, start: number, end: number): void {
        const theme = this.getThemeColors();
        ctx.fillStyle = theme.accent;
        for (let i = start; i < end; i++) {
            const p = this.ambientParticles[i];
            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    private drawVignette(ctx: CanvasRenderingContext2D): void {
        const grad = ctx.createRadialGradient(
            ctx.canvas.width / 2, ctx.canvas.height / 2, 0,
            ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width * 0.8
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    private drawScanlines(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        for (let i = 0; i < ctx.canvas.height; i += 4) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(ctx.canvas.width, i);
            ctx.stroke();
        }
        ctx.restore();
    }

    private drawChromaticAberration(ctx: CanvasRenderingContext2D): void {
        const offset = 10 * this.abIntensity;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.3 * this.abIntensity;
        
        ctx.drawImage(ctx.canvas, -offset, 0);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(-offset, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.drawImage(ctx.canvas, offset, 0);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(offset, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.restore();
    }

    private generateBackgroundEntities(): void {
        this.backgroundEntities = [];
        if (this.currentCivilization === 'china' || this.currentCivilization === 'japonesa') {
            const count = this.currentCivilization === 'china' ? 1 : 10;
            this.backgroundEntities = Array.from({ length: count }, () => ({
                x: Math.random() * LOGICAL_WIDTH,
                y: 50 + Math.random() * 200,
                v: 0.5 + Math.random() * 1,
                size: this.currentCivilization === 'china' ? 100 : 10,
                type: this.currentCivilization === 'china' ? 'dragon' : 'bird'
            }));
        }
    }

    private updateBackgroundEntities(dt: number): void {
        for (const e of this.backgroundEntities) {
            e.x -= e.v * dt;
            if (e.x < -200) e.x = LOGICAL_WIDTH + 200;
        }
    }

    private drawBackgroundEntities(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = 0.4;
        for (const e of this.backgroundEntities) {
            if (e.type === 'dragon') {
                this.drawDragon(ctx, e.x, e.y, e.size);
            } else {
                this.drawBird(ctx, e.x, e.y, e.size);
            }
        }
        ctx.restore();
    }

    private drawDragon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = this.getThemeColors().accent;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let i = 0; i < size; i += 10) {
            ctx.lineTo(i, Math.sin(this.t + i * 0.05) * 20);
        }
        ctx.stroke();
        ctx.restore();
    }

    private drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        const wing = Math.sin(this.t * 10 + x * 0.1) * 5;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - size, y + wing);
        ctx.lineTo(x, y);
        ctx.lineTo(x + size, y + wing);
        ctx.stroke();
    }

    private drawAurora(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
            const grad = ctx.createLinearGradient(0, 0, 0, 300);
            grad.addColorStop(0, 'rgba(0, 255, 150, 0)');
            grad.addColorStop(0.5, 'rgba(0, 255, 150, 0.2)');
            grad.addColorStop(1, 'rgba(0, 255, 150, 0)');
            
            ctx.fillStyle = grad;
            const y = 50 + Math.sin(this.t * 0.2 + i) * 30;
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x < LOGICAL_WIDTH; x += 50) {
                ctx.lineTo(x, y + Math.sin(x * 0.01 + this.t * 0.5 + i) * 60);
            }
            ctx.lineTo(LOGICAL_WIDTH, 400);
            ctx.lineTo(0, 400);
            ctx.fill();
        }
        ctx.restore();
    }

    private generateWeather(): void {
        const themeToWeather: any = {
            nordica: 'snow',
            japonesa: 'sakura',
            egipto: 'sand',
            grecia: 'rain',
            sumeria: 'sand',
            azteca: 'rain',
            maya: 'rain',
            celtica: 'snow',
            atlante: 'clear',
            default: 'clear'
        };
        this.currentWeather = themeToWeather[this.currentCivilization] || 'clear';
        
        this.weatherParticles = Array.from({ length: 100 }, () => ({
            x: Math.random() * LOGICAL_WIDTH,
            y: Math.random() * LOGICAL_HEIGHT,
            v: 5 + Math.random() * 10,
            size: 2 + Math.random() * 4,
            rot: Math.random() * Math.PI * 2
        }));
    }

    private updateWeatherParticles(dt: number): void {
        for (const p of this.weatherParticles) {
            switch (this.currentWeather) {
                case 'snow':
                    p.y += p.v * 0.2 * dt;
                    p.x += Math.sin(this.t + p.y * 0.01) * dt;
                    break;
                case 'rain':
                    p.y += p.v * 1.5 * dt;
                    p.x -= p.v * 0.5 * dt;
                    break;
                case 'sand':
                    p.x -= p.v * 2 * dt;
                    p.y += (Math.random() - 0.5) * dt;
                    break;
                case 'sakura':
                    p.y += p.v * 0.3 * dt;
                    p.x += Math.sin(this.t * 0.5 + p.y * 0.01) * 2 * dt;
                    p.rot += 0.05 * dt;
                    break;
            }
            if (p.y > LOGICAL_HEIGHT) p.y = -20;
            if (p.x < 0) p.x = LOGICAL_WIDTH;
            if (p.x > LOGICAL_WIDTH) p.x = 0;
        }
    }

    private drawWeather(ctx: CanvasRenderingContext2D, far: boolean): void {
        if (this.currentWeather === 'clear') return;
        
        ctx.save();
        ctx.globalAlpha = far ? 0.3 : 0.8;
        
        for (const p of this.weatherParticles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            
            switch (this.currentWeather) {
                case 'snow':
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'rain':
                    ctx.strokeStyle = '#AAF';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-5, 15);
                    ctx.stroke();
                    break;
                case 'sand':
                    ctx.fillStyle = 'rgba(200, 150, 50, 0.5)';
                    ctx.fillRect(0, 0, p.size * 2, p.size);
                    break;
                case 'sakura':
                    ctx.fillStyle = '#FFB7C5';
                    ctx.rotate(p.rot);
                    ctx.beginPath();
                    ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            ctx.restore();
        }
        ctx.restore();
    }

    private drawSky(ctx: CanvasRenderingContext2D, colors: string[]): void {
        const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Sol/Luna Procedural Cartoon
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(ctx.canvas.width * 0.8, 150, 80, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawStructures(ctx: CanvasRenderingContext2D, scrollX: number, parallax: number, color: string, far: boolean): void {
        const xOffset = (scrollX * parallax) % ctx.canvas.width;
        
        ctx.save();
        ctx.translate(-xOffset, 0);
        this.renderStructureBatch(ctx, color, far);
        ctx.translate(ctx.canvas.width, 0);
        this.renderStructureBatch(ctx, color, far);
        ctx.restore();
    }

    private renderStructureBatch(ctx: CanvasRenderingContext2D, color: string, far: boolean): void {
        ctx.fillStyle = color;
        ctx.strokeStyle = this.getThemeColors().stroke;
        ctx.lineWidth = far ? 2 : 4;

        const baseY = ctx.canvas.height;
        
        for (const s of this.seeds.structures) {
            const x = s.x * ctx.canvas.width;
            
            ctx.save();
            ctx.translate(x, baseY);
            
            switch (this.currentCivilization) {
                case 'maya':
                case 'azteca':
                case 'inca':
                    this.drawPyramid(ctx, s.w, s.h);
                    break;
                case 'egipto':
                case 'sumeria':
                case 'fenicia':
                    this.drawObelisk(ctx, s.w * 0.4, s.h * 1.2);
                    break;
                case 'grecia':
                case 'roma':
                case 'persa':
                    this.drawParthenon(ctx, s.w, s.h);
                    break;
                case 'nordica':
                    this.drawLonghouse(ctx, s.w, s.h * 0.7);
                    break;
                case 'japonesa':
                case 'hindu':
                    this.drawPagoda(ctx, s.w * 0.8, s.h);
                    break;
                case 'babilonia':
                    this.drawZiggurat(ctx, s.w, s.h);
                    break;
                case 'china':
                    this.drawGreatWall(ctx, s.w, s.h * 0.5);
                    break;
                case 'celtica':
                case 'atlante':
                    this.drawMonolith(ctx, s.w, s.h);
                    break;
                default:
                    this.drawMonolith(ctx, s.w, s.h);
                    break;
            }
            ctx.restore();
        }
    }

    // --- PRIMITIVAS CARTOON ---

    private drawPyramid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.beginPath();
        ctx.moveTo(-w / 2, 0);
        ctx.lineTo(0, -h);
        ctx.lineTo(w / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Escalones Cartoon
        ctx.beginPath();
        for (let i = 1; i < 5; i++) {
            const stepY = -h * (i / 5);
            const stepW = w * (1 - i / 5);
            ctx.moveTo(-stepW / 2, stepY);
            ctx.lineTo(stepW / 2, stepY);
        }
        ctx.stroke();
    }

    private drawObelisk(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.beginPath();
        ctx.moveTo(-w / 2, 0);
        ctx.lineTo(-w / 2, -h + w);
        ctx.lineTo(0, -h);
        ctx.lineTo(w / 2, -h + w);
        ctx.lineTo(w / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    private drawParthenon(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        // Base
        ctx.fillRect(-w / 2, -20, w, 20);
        ctx.strokeRect(-w / 2, -20, w, 20);
        
        // Columnas
        const colW = w / 8;
        for (let i = 0; i < 4; i++) {
            const cx = -w / 2 + (i + 1) * (w / 5);
            ctx.fillRect(cx - colW / 2, -h, colW, h - 20);
            ctx.strokeRect(cx - colW / 2, -h, colW, h - 20);
        }
        
        // Techo Triangular
        ctx.beginPath();
        ctx.moveTo(-w / 2 - 10, -h);
        ctx.lineTo(w / 2 + 10, -h);
        ctx.lineTo(0, -h - 40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    private drawMonolith(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h, w, h, 20);
        ctx.fill();
        ctx.stroke();
    }

    private drawLonghouse(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.beginPath();
        ctx.moveTo(-w / 2, 0);
        ctx.lineTo(-w / 2, -h * 0.4);
        ctx.lineTo(0, -h);
        ctx.lineTo(w / 2, -h * 0.4);
        ctx.lineTo(w / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Vigas vikingas cruzadas
        ctx.beginPath();
        ctx.moveTo(-w / 2 - 10, -h * 0.4); ctx.lineTo(10, -h - 10);
        ctx.moveTo(w / 2 + 10, -h * 0.4); ctx.lineTo(-10, -h - 10);
        ctx.stroke();
    }

    private drawPagoda(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const stories = 3;
        for (let i = 0; i < stories; i++) {
            const sw = w * (1 - i * 0.2);
            const sh = -h * (i / stories);
            ctx.fillRect(-sw / 2, sh - h / stories, sw, h / stories);
            ctx.strokeRect(-sw / 2, sh - h / stories, sw, h / stories);
            // Techo curvo
            ctx.beginPath();
            ctx.moveTo(-sw / 2 - 20, sh - h / stories);
            ctx.quadraticCurveTo(0, sh - h / stories - 20, sw / 2 + 20, sh - h / stories);
            ctx.stroke();
        }
    }

    private drawZiggurat(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const steps = 4;
        for (let i = 0; i < steps; i++) {
            const sw = w * (1 - i * 0.2);
            const sy = -h * (i / steps);
            ctx.fillRect(-sw / 2, sy - h / steps, sw, h / steps);
            ctx.strokeRect(-sw / 2, sy - h / steps, sw, h / steps);
        }
    }

    private drawGreatWall(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.fillRect(-w / 2, -h, w, h);
        ctx.strokeRect(-w / 2, -h, w, h);
        // Almenas
        const count = 5;
        for (let i = 0; i < count; i++) {
            ctx.fillRect(-w / 2 + (i * w / count), -h - 20, w / (count * 2), 20);
            ctx.strokeRect(-w / 2 + (i * w / count), -h - 20, w / (count * 2), 20);
        }
    }

    private drawCartoonGlyph(ctx: CanvasRenderingContext2D, size: number, color: string): void {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.moveTo(-size / 3, 0);
        ctx.lineTo(size / 3, 0);
        ctx.moveTo(0, -size / 3);
        ctx.lineTo(0, size / 3);
        ctx.stroke();
        
        // Glow sutil
        ctx.globalAlpha = 0.3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.stroke();
    }

    private getThemeColors(): any {
        const themes: any = {
            maya: { sky: ['#0a2f0a', '#1a4d1a', '#2a6b2a'], structureFar: '#051a05', structureMid: '#0d3d1a', accent: '#A6F616', stroke: '#000' },
            azteca: { sky: ['#1a2f0a', '#2a4d0a', '#3a6b0a'], structureFar: '#0d1a05', structureMid: '#1a3d0d', accent: '#FFD700', stroke: '#000' },
            egipto: { sky: ['#2f1a0a', '#4d2a1a', '#6b3d2a'], structureFar: '#1a0d05', structureMid: '#3d1a0d', accent: '#FFD700', stroke: '#2b1000' },
            sumeria: { sky: ['#3d2a1a', '#5a3d2a', '#7a4d3a'], structureFar: '#1d1a0d', structureMid: '#3d2a1a', accent: '#FF8C00', stroke: '#2b1000' },
            grecia: { sky: ['#0a1a2f', '#1a2a4d', '#2a4d6b'], structureFar: '#050a1a', structureMid: '#0d1a3d', accent: '#00f2ff', stroke: '#001a33' },
            roma: { sky: ['#2a0a0a', '#4d1a1a', '#6b2a2a'], structureFar: '#1a0505', structureMid: '#3d0d0d', accent: '#ff0000', stroke: '#2b0000' },
            china: { sky: ['#2f2f0a', '#4d4d1a', '#6b6b2a'], structureFar: '#1a1a05', structureMid: '#3d3d0d', accent: '#FF4500', stroke: '#330000' },
            nordica: { sky: ['#050510', '#101020', '#1a1a30'], structureFar: '#000005', structureMid: '#05051a', accent: '#00ffff', stroke: '#000' },
            inca: { sky: ['#1a1a0a', '#2a2a0a', '#3a3a0a'], structureFar: '#0d0d05', structureMid: '#1a1a0d', accent: '#FFFF00', stroke: '#000' },
            persa: { sky: ['#2a0a2f', '#4d1a4d', '#6b2a6b'], structureFar: '#1a051a', structureMid: '#3d0d3d', accent: '#FF00FF', stroke: '#2b002b' },
            hindu: { sky: ['#2f1a2f', '#4d2a4d', '#6b3d6b'], structureFar: '#1a0d1a', structureMid: '#3d1a3d', accent: '#FFA500', stroke: '#2b102b' },
            japonesa: { sky: ['#2f0a0a', '#4d1a1a', '#6b2a2a'], structureFar: '#1a0505', structureMid: '#3d0d0d', accent: '#ff4d4d', stroke: '#2b0000' },
            celtica: { sky: ['#0a2f2f', '#1a4d4d', '#2a6b6b'], structureFar: '#051a1a', structureMid: '#0d3d3d', accent: '#00FF7F', stroke: '#002b2b' },
            fenicia: { sky: ['#0a0a2f', '#1a1a4d', '#2a2a6b'], structureFar: '#05051a', structureMid: '#0d0d3d', accent: '#9370DB', stroke: '#1a0033' },
            babilonia: { sky: ['#0a0a2f', '#1a1a4d', '#2a2a6b'], structureFar: '#05051a', structureMid: '#0d0d3d', accent: '#87CEEB', stroke: '#000033' },
            atlante: { sky: ['#000033', '#000066', '#000099'], structureFar: '#00001a', structureMid: '#000033', accent: '#00FFFF', stroke: '#00001a' },
            default: { sky: ['#111', '#222', '#333'], structureFar: '#000', structureMid: '#111', accent: '#FFF', stroke: '#000' }
        };
        return themes[this.currentCivilization] || themes.default;
    }
}
