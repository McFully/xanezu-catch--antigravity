import { LOGICAL_WIDTH, LOGICAL_HEIGHT, LOGICAL_GROUND_Y } from '../engine/engine.constants';

export class LoadingRenderer {
    private progress: number = 0;
    private targetProgress: number = 0;
    private palms: { x: number, phase: number }[] = [];
    private clouds: { x: number, y: number, speed: number }[] = [];
    private tip: string = "CARGANDO AVENTURA...";

    constructor() {
        // Inicializar elementos decorativos
        for (let i = 0; i < 4; i++) {
            this.palms.push({ x: 100 + i * 400, phase: Math.random() * Math.PI * 2 });
        }
        for (let j = 0; j < 6; j++) {
            this.clouds.push({ 
                x: Math.random() * LOGICAL_WIDTH, 
                y: 50 + Math.random() * 200, 
                speed: 0.2 + Math.random() * 0.5 
            });
        }
    }

    public update(dt: number, currentProgress: number, tip?: string): void {
        this.targetProgress = currentProgress;
        // Suavizado de la barra
        if (this.progress < this.targetProgress) {
            this.progress += (this.targetProgress - this.progress) * 0.1 * dt;
        }

        // Animación de nubes
        for (const cloud of this.clouds) {
            cloud.x += cloud.speed * dt;
            if (cloud.x > LOGICAL_WIDTH + 100) cloud.x = -100;
        }

        if (tip) this.tip = tip;
    }

    public draw(ctx: CanvasRenderingContext2D, time: number): void {
        // 1. Fondo: Degradado Tropical Ocaso
        const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
        grad.addColorStop(0, '#0a1020'); // Espacio profundo
        grad.addColorStop(0.5, '#1a2a50'); // Cielo superior
        grad.addColorStop(0.8, '#ff3366'); // Horizonte neón
        grad.addColorStop(1, '#ff9933'); // Brillo solar
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

        // 2. Dibujar Nubes (Símbolos minimalistas)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (const cloud of this.clouds) {
            this.drawCloud(ctx, cloud.x, cloud.y);
        }

        // 3. Horizonte: Siluetas de Palmeras
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        for (const palm of this.palms) {
            const sway = Math.sin(time * 0.002 + palm.phase) * 5;
            this.drawPalm(ctx, palm.x + sway, LOGICAL_HEIGHT - 100);
        }

        // 4. Mar Retro (Líneas de perspectiva)
        this.drawRetroSea(ctx, time);

        // 5. Contenedor de Carga Central
        this.drawLoadingUI(ctx);
    }

    private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
        ctx.arc(x + 55, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawPalm(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        ctx.save();
        ctx.translate(x, y);
        // Tronco
        ctx.fillRect(-5, 0, 10, 100);
        // Hojas
        for (let i = 0; i < 5; i++) {
            ctx.rotate((Math.PI * 2) / 5);
            ctx.beginPath();
            ctx.ellipse(30, 0, 40, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    private drawRetroSea(ctx: CanvasRenderingContext2D, time: number): void {
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.2)';
        ctx.lineWidth = 2;
        const horizonY = LOGICAL_HEIGHT - 100;
        for (let i = 0; i < 10; i++) {
            const y = horizonY + i * i * 2 + (time * 0.05 % 20);
            if (y > LOGICAL_HEIGHT) continue;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(LOGICAL_WIDTH, y);
            ctx.stroke();
        }
    }

    private drawLoadingUI(ctx: CanvasRenderingContext2D): void {
        const centerX = LOGICAL_WIDTH / 2;
        const centerY = LOGICAL_HEIGHT / 2 + 50;
        const barW = 600;
        const barH = 12;

        // Texto Cargo principal
        ctx.fillStyle = '#FFF';
        ctx.font = '900 64px Outfit';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00f2ff';
        ctx.fillText('CARGANDO', centerX, centerY - 80);
        ctx.shadowBlur = 0;

        // Tip de juego
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '500 18px Outfit';
        ctx.fillText(this.tip.toUpperCase(), centerX, centerY - 30);

        // Fondo barra
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.roundRect(centerX - barW / 2, centerY, barW, barH, 6);
        ctx.fill();

        // Relleno barra neón
        const fillW = (this.progress / 100) * barW;
        if (fillW > 0) {
            const grad = ctx.createLinearGradient(centerX - barW / 2, 0, centerX - barW / 2 + fillW, 0);
            grad.addColorStop(0, '#00f2ff');
            grad.addColorStop(1, '#ff00ff');
            ctx.fillStyle = grad;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00f2ff';
            ctx.beginPath();
            ctx.roundRect(centerX - barW / 2, centerY, fillW, barH, 6);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Porcentaje
        ctx.fillStyle = '#FFF';
        ctx.font = '700 20px Outfit';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.floor(this.progress)}%`, centerX + barW / 2, centerY + 40);
    }
}
