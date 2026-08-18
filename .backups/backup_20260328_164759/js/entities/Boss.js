import { Entity } from './BaseEntity.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

export class Boss extends Entity {
    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} hp 
     * @param {string} type 
     * @param {Image} img 
     * @param {number} chapter 
     */
    constructor(x, y, hp, type, img, chapter) {
        super(x, y, 280, 280, 0); // No tiene velocidad de scroll lateral fija
        this.maxHp = hp;
        this.hp = hp;
        this.type = type;
        this.img = img;
        this.chapter = chapter;
        
        this.phase = 'INTRO'; // INTRO, ATTACK, STUNNED, DEFEATED
        this.introTimer = 0;
        this.attackTimer = 0;
        this.targetX = CANVAS_WIDTH - 350;
        this.targetY = CANVAS_HEIGHT / 2 - this.h / 2;
        
        this.oscillation = 0;
        this.lastShotTime = 0;
        this.isInvulnerable = true;
        
        // Efectos Visuales
        this.pulse = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeTimer = 0;
    }

    update(dt, game) {
        this.pulse += dt * 0.005;
        
        if (this.shakeTimer > 0) {
            this.fakeShake(dt);
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }

        switch (this.phase) {
            case 'INTRO':
                this._updateIntro(dt);
                break;
            case 'ATTACK':
                this._updateAttack(dt, game);
                break;
            case 'STUNNED':
                this._updateStunned(dt);
                break;
            case 'DEFEATED':
                this._updateDefeated(dt, game);
                break;
        }
    }

    _updateIntro(dt) {
        // El jefe entra planeando desde la derecha
        const dx = this.targetX - this.x;
        this.x += dx * 0.05 * dt;

        if (Math.abs(dx) < 5) {
            this.x = this.targetX;
            this.phase = 'ATTACK';
            this.isInvulnerable = false;
        }
    }

    _updateAttack(dt, game) {
        // Movimiento oscilante suave
        this.oscillation += dt * 0.002;
        this.y = (CANVAS_HEIGHT / 2 - this.h / 2) + Math.sin(this.oscillation) * 200;

        // Disparo de proyectiles
        this.attackTimer += dt;
        const interval = 2500 - (this.chapter * 50); // Más rápido en capítulos altos
        
        if (this.attackTimer > interval) {
            this.attackTimer = 0;
            this.shoot(game);
        }
    }

    _updateStunned(dt) {
        this.shakeTimer = 500;
        // Lógica de recuperación tras ser golpeado
    }

    _updateDefeated(dt, game) {
        this.y += 2 * dt; // Cae lentamente
        this.shakeTimer = 1000;
        if (this.y > CANVAS_HEIGHT) this.dead = true;
    }

    shoot(game) {
        // 30% de probabilidad de disparar un proyectil "CATCHABLE" (brillante)
        // 70% de probabilidad de proyectil "DEADLY" (normal)
        const isCatchable = Math.random() < 0.35;
        game.spawnBossProjectile(this.x, this.y + this.h / 2, isCatchable);
    }

    takeDamage(amount) {
        if (this.isInvulnerable || this.phase === 'DEFEATED') return;
        
        this.hp -= amount;
        this.shakeTimer = 300; // Sacudida al recibir impacto
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.phase = 'DEFEATED';
            this.isInvulnerable = true;
        }
    }

    fakeShake(dt) {
        this.shakeTimer -= dt;
        this.shakeX = (Math.random() - 0.5) * 15;
        this.shakeY = (Math.random() - 0.5) * 15;
    }

    draw(ctx) {
        const drawX = this.x + this.shakeX;
        const drawY = this.y + this.shakeY;

        ctx.save();
        
        // Sombra / Glow
        ctx.shadowBlur = 30 + Math.sin(this.pulse) * 10;
        ctx.shadowColor = this.phase === 'DEFEATED' ? 'rgba(255,0,0,0.5)' : 'rgba(0,255,255,0.4)';
        
        if (this.img && !this.img.isPlaceholder) {
            ctx.drawImage(this.img, drawX, drawY, this.w, this.h);
        } else {
            // Placeholder Premium para el Jefe
            const gradient = ctx.createRadialGradient(
                drawX + this.w / 2, drawY + this.h / 2, 0,
                drawX + this.w / 2, drawY + this.h / 2, this.w / 2
            );
            gradient.addColorStop(0, '#00f2fe');
            gradient.addColorStop(1, '#4facfe');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(drawX + this.w / 2, drawY + this.h / 2, this.w / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // "Ojo" del jefe (Cybernetic core)
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(drawX + this.w / 2, drawY + this.h / 2, 40 + Math.sin(this.pulse * 2) * 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
