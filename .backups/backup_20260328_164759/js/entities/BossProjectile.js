import { Entity } from './BaseEntity.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

export class BossProjectile extends Entity {
    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} speed 
     * @param {boolean} isCatchable 
     * @param {string} type 
     */
    constructor(x, y, speed, isCatchable, type) {
        super(x, y, 64, 64, speed);
        this.isCatchable = isCatchable;
        this.type = type; // 'plasma', 'glitch', 'shadow'
        this.aura = 0;
        this.h = 42;
        this.w = 42;
        
        // El proyectil se mueve de derecha a izquierda
        // Si no es capturable, actua como obstaculo mortal
        // Si es capturable, actua como item beneficioso cuando golpea al jugador
    }

    update(dt) {
        // Movimiento a la izquierda
        this.x -= this.speed * dt;
        this.aura += dt * 0.01;
        
        // Muerte si sale de pantalla
        if (this.x + this.w < -100) this.dead = true;
    }

    draw(ctx) {
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;
        
        ctx.save();
        
        // Efecto visual según capturabilidad
        if (this.isCatchable) {
            // Proyectil Atrapable (Aura verde/cian brillante)
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#00ffcc';
            ctx.fillStyle = '#00ffcc';
            
            // Núcleo giratorio
            ctx.translate(cx, cy);
            ctx.rotate(this.aura);
            ctx.fillRect(-this.w/3, -this.h/3, this.w/1.5, this.h/1.5);
            ctx.restore();
            
            // Destello exterior pulsante
            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.strokeStyle = `rgba(0, 255, 204, ${0.3 + Math.sin(this.aura * 2) * 0.2})`;
            ctx.arc(cx, cy, 30 + Math.sin(this.aura) * 5, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Proyectil Letal (Rojo sangre / Glitch púrpura)
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff3300';
            ctx.fillStyle = '#ff3300';
            
            ctx.beginPath();
            ctx.arc(cx, cy, 20 + Math.sin(this.aura * 4) * 4, 0, Math.PI * 2);
            ctx.fill();
            
            // "Cola" de plasma
            const trailLen = 80;
            const grad = ctx.createLinearGradient(cx, cy, cx + trailLen, cy);
            grad.addColorStop(0, '#ff3300');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(cx, cy - 10, trailLen, 20);
        }
        
        ctx.restore();
    }
}
