import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { CHAPTER_REGISTRY } from '../core/ChapterRegistry.js';

export class Player {
    constructor(assets, game) {
        this.assets = assets;
        this.game = game;
        this.reset();
    }
    reset() {
        this.w = 150; this.h = 150;
        this.baseX = CANVAS_WIDTH / 6;
        this.x = this.baseX;
        this.y = CANVAS_HEIGHT / 2;
        this.vy = 0; this.canJump = true; this.canDash = true; this.dashCd = 0; this.dashT = 0;
        this.onGround = false;

        if (this.game) this.game.stats.tempAirDashes = 0;
        if (this.game) {
            const spawnColor = this.game.characterTheme?.particleSecondary || this.game.characterTheme?.particlePrimary || '#8B4513';
            this.game.particles.spawn(this.x + this.w / 2, this.y + this.h, spawnColor, 3);
        }

        this.magnetT = 0; this.shieldActive = false; this.shieldHitT = 0; this.shieldT = 0;
        this.slowT = 0; this.ghostT = 0; this.infiniteDashT = 0;
        this.featherT = 0; this.springT = 0; this.miniT = 0;
        this.rainbowT = 0; this.cloverT = 0;
        this.thermalT = 0; this.speedBoostT = 0;
        this.trail = [];
        this.prevVy = 0;
        this.landSquash = 0;
        this.rot = 0;
        this.animTime = 0;
        this.breatheScale = 1;
        this.windSkew = 0;

        // Art Director: Gekko Expression System
        this.blinkT = 0;
        this.eyeX = 0; this.eyeY = 0;
        this.eyeTarget = { x: 0, y: 0 };
        this.isBlinking = false;
        this.jSpd = -22;
        
        // --- Combate de Jefe (Fase 14) ---
        this.hasBossProjectile = false;
        this.projectilePulse = 0;
    }
    getSpeedMultiplier() {
        let mult = 1;
        if (this.speedBoostT > 0) mult *= 1.5; // 50% speed boost
        const activeCfg = this.game?.getActiveChapterConfig?.(this.game?.chapter || 1);
        const biome = String(activeCfg?.biome || activeCfg?.bg || '').toLowerCase();
        if (this.thermalT > 0 && /ice|crystal|winter|snow/.test(biome)) mult *= 1.3;
        return mult;
    }
    jump() {
        // --- Lógica Definitiva: Doble Salto + Salto Infinito ---
        this.vy = this.jSpd * this.getSpeedMultiplier();
        this.onGround = false;
        this.isJumping = true;
        this.jumpCount = (this.jumpCount || 0) + 1;
        
        if (this.game.synth) this.game.synth.playJumpWhoosh();
        if (this.game.particles) {
            // Prioridad: Skin Activa > Tema Personaje > Color Base
            let jumpColor = this.game.activeSkin?.primaryColor || this.game.characterTheme?.particlePrimary || '#A6F616';
            
            if (this.jumpCount === 2) {
                jumpColor = '#fbbf24'; // Segundo salto (Doble): Dorado
                if (this.game) this.game.shake(5, 100);
            } else if (this.jumpCount > 2) {
                // Saltos Infinitos: Colores neón aleatorios
                const neonColors = ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#00BFFF'];
                jumpColor = neonColors[Math.floor(Math.random() * neonColors.length)];
            }
            
            this.game.particles.spawn(this.x + this.w / 2, this.y + this.h, jumpColor, 10);
        }
        return true;
    }
    dash() {
        // En batalla de jefe, el dash sirve como ATAQUE si tenemos un proyectil
        if (this.hasBossProjectile) {
            this.shootBack();
            return true;
        }

        if (this.dashCd <= 0 || this.infiniteDashT > 0) {
            this.dashT = 20; this.dashCd = 120;
            if (this.game.synth) this.game.synth.playDashWhoosh();
            return true;
        }
        return false;
    }

    shootBack() {
        if (!this.hasBossProjectile) return;
        
        // Disparar proyectil hacia la derecha
        if (this.game) {
            this.game.shootPlayerProjectile(this.x + this.w, this.y + this.h / 2);
            if (this.game.synth) this.game.synth.playBtnClick(); // Feedback sonoro temporal
            this.game.addTrauma(0.3); // Sacudida al disparar
        }
        
        this.hasBossProjectile = false;
        // Pequeño impulso hacia adelante al disparar
        this.dashT = 5; 
    }
    update(dt) {
        const activeCfg = this.game?.getActiveChapterConfig?.(this.game?.chapter || 1);
        const biome = String(activeCfg?.biome || activeCfg?.bg || '').toLowerCase();
        const isIceBiome = /ice|crystal|winter|snow/.test(biome);

        if (this.dashT > 0) {
            this.x += 21 * dt * (isIceBiome ? 1.15 : 1.0); // Dash más largo en hielo
            this.dashT -= dt;
            this.vy = 0;
            if (this.onGround && this.game && Math.random() < 0.4) {
                const dashDust = isIceBiome ? '#E0F7FF' : (this.game.characterTheme?.particleSecondary || '#F5F5DC');
                this.game.particles.spawn(this.x, this.y + this.h, dashDust, 3, 'circle');
            }
        }
        else {
            // Físicas de retorno y gravedad dinámicas por bioma
            let targetX = this.baseX;
            let lerpFactor = 0.15;
            let grav = 0.64;

            // --- Biome Specific Logics ---
            if (isIceBiome) {
                lerpFactor = this.onGround ? 0.08 : 0.05;
                grav *= 0.85;
            } 
            else if (/enchanted|crystal|moon/.test(biome)) {
                grav *= 0.6; // Low gravity / Floatiness
                lerpFactor = 0.12;
            }
            else if (/swamp|lava|factory/.test(biome)) {
                grav *= 1.25; // Heavy gravity / Danger
                lerpFactor = 0.18;
            }
            else if (/desert|sand/.test(biome)) {
                // Viento del desierto: empuja ligeramente hacia la izquierda
                targetX -= 50; 
                lerpFactor = 0.1;
            }

            this.x += (targetX - this.x) * lerpFactor * dt;
            if (this.featherT > 0) grav *= 0.5;

            this.vy += grav * dt; 
            this.y += this.vy * dt;

            // Volcano random tremors
            if (biome === 'lava_arcade' && Math.random() > 0.99) {
                this.game.addTrauma(0.15);
            }
        }

        // landSquash animation handled below with prevVy check


        if (this.onGround && Math.random() > 0.7 && this.game) {
            const groundColor = this.game.activeSkin?.secondaryColor || this.game.characterTheme?.particleSecondary || '#8B4513';
            this.game.particles.spawn(this.x, this.y + this.h, groundColor, 1);
        }

        if (this.dashCd > 0) this.dashCd -= dt;
        if (this.magnetT > 0) this.magnetT -= dt;
        if (this.shieldT > 0) {
            this.shieldT -= dt;
            if (this.shieldT <= 0) this.shieldActive = false;
        }
        if (this.shieldHitT > 0) this.shieldHitT -= dt;
        if (this.slowT > 0) this.slowT -= dt;
        if (this.ghostT > 0) this.ghostT -= dt;
        if (this.infiniteDashT > 0) this.infiniteDashT -= dt;
        if (this.featherT > 0) this.featherT -= dt;
        if (this.springT > 0) this.springT -= dt;
        if (this.miniT > 0) this.miniT -= dt;
        if (this.hasBossProjectile) {
            this.projectilePulse += dt * 0.01;
        }

        if (this.rainbowT > 0) this.rainbowT -= dt;
        if (this.cloverT > 0) this.cloverT -= dt;
        if (this.thermalT > 0) this.thermalT -= dt;
        if (this.speedBoostT > 0) this.speedBoostT -= dt;

        if (this.y + this.h > CANVAS_HEIGHT - 30) {
            this.y = CANVAS_HEIGHT - 30 - this.h;
            this.vy = 0;
            this.onGround = true;
            this.isJumping = false;
            this.jumpCount = 0; // Reiniciar contador de saltos
            this.canDash = true;
            if (this.game?.stats) {
                this.game.stats.tempAirDashes = 0;
                this.game.stats.maxAirDashes = 0;
            }
        } else {
            this.onGround = false;
        }

        this.animTime = (this.animTime || 0) + 0.05 * dt;
        this.breatheScale = 1 + Math.sin(this.animTime) * 0.03;
        this.windSkew = Math.sin(this.animTime * 0.5) * 0.05;

        // Gekko Eyes Logic
        this._updateGekkoEyes(dt);

        if (this.y < 0) { this.y = 0; this.vy = 0; }

        if (this.onGround && this.prevVy > 3) {
            this.landSquash = 12;
            if (this.game) {
                // Art Director Phase 2: White dust pulse
                const landColor = this.game.activeSkin?.primaryColor || this.game.characterTheme?.particlePrimary || '#F0F0F0';
                this.game.particles.spawn(this.x + this.w / 2, this.y + this.h, landColor, 10, 'circle');
                this.game.shake(8, 150);
            }
        }
        this.prevVy = this.vy;
        if (this.landSquash > 0) this.landSquash -= dt;

        if (!this.trail) this.trail = [];
        // Guardar posición actual con rotación y escala para el efecto de estela
        this.trail.push({ x: this.x, y: this.y, life: 1.0, rot: this.rot, scale: (this.miniT > 0 ? 0.5 : 1.0) });
        
        // Aumentar longitud para un efecto más dramático en Dash o Fever
        const maxTrail = (this.dashT > 0 || (this.game && this.game.mult > 1)) ? 30 : 15;
        if (this.trail.length > maxTrail) this.trail.shift();
        
        for (let i = this.trail.length - 1; i >= 0; i--) {
            // Desvanecimiento dinámico basado en la velocidad/estado (Fase 6: Advanced FX)
            const decay = (this.dashT > 0) ? 0.04 : 0.08;
            this.trail[i].life -= decay * dt;
            if (this.trail[i].life <= 0) this.trail.splice(i, 1);
        }

        this.rot = Math.max(-0.25, Math.min(0.25, this.vy * 0.06));
        if (this.isCatching) { this.catchT -= dt; if (this.catchT <= 0) this.isCatching = false; }

        if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
            console.warn("Character Physics Corrupted! Rescuing...");
            this.x = this.baseX || CANVAS_WIDTH / 6;
            this.y = CANVAS_HEIGHT / 2;
            this.vy = 0;
        }
    }

    // Flags for enhanced HD styles (128-bit) - Disabled by default
    static chapter2Enhanced = false;
    static chapter8Enhanced = false;

    draw(ctx) {
        const img = this.getCurrentImage();
        const chapter = this.game ? this.game.chapter : 1;
        const config = this.game?.getActiveChapterConfig
            ? (this.game.getActiveChapterConfig(chapter) || { colors: ['#32CD32'] })
            : (CHAPTER_REGISTRY ? (CHAPTER_REGISTRY[chapter] || CHAPTER_REGISTRY[1]) : { colors: ['#32CD32'] });

        const isPremium = this.game?.characterTheme?.isPremium;

        // 🚨 FALLBACK: Draw procedural frog if no sprite loaded
        if (!img || !img.width || img.isPlaceholder) {
            this._drawBasicFrog(ctx, config);
            return;
        }

        let scale = (this.miniT > 0) ? 0.5 : 1.0;
        this._drawTrail(ctx, img, scale);

        ctx.save();

        // EFECHOS PREMIUM AAA
        if (isPremium) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.game.characterTheme.particlePrimary;

            // Halo de energía sutil
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = this.game.characterTheme.particlePrimary;
            ctx.beginPath();
            ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        this._applyStatusEffects(ctx, scale);

        let sx = scale, sy = scale;
        [sx, sy] = this._calculateTransformation(scale);

        // ⚓ PIVOT FIX: Trasladar a la base (pies) para evitar que flote al escalar
        ctx.translate(this.x + this.w / 2, this.y + this.h);
        ctx.rotate(this.rot || 0);
        ctx.scale(sx, sy);
        ctx.transform(1, 0, this.windSkew || 0, 1, 0, 0);

        // Dibujar desde la base (-w/2, -h)
        ctx.drawImage(img, -this.w / 2, -this.h, this.w, this.h);

        // Brillo Premium HD
        if (isPremium) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.15 + Math.sin(this.animTime * 2) * 0.05;
            ctx.drawImage(img, -this.w / 2, -this.h, this.w, this.h);
        }

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.restore();

        this._drawDashCooldown(ctx, scale);
    }

    _drawBasicFrog(ctx, config) {
        const isABLMode = this.game?.stateManager?.isABLMode?.() === true;
        const isArcadeMode = this.game?.stateManager?.isArcadeMode?.() === true;

        if (isArcadeMode) {
            this._draw8BitFrog(ctx, config);
            return;
        }

        const ablLvl = this.game ? (((this.game.level - 1) % 10) + 1) : 1;
        if (isABLMode) {
            this._drawAblSynthFrog(ctx, config, ablLvl);
            return;
        }

        ctx.save();
        ctx.fillStyle = config.colors ? config.colors[0] : '#32CD32';
        ctx.beginPath();
        ctx.ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.x + this.w * 0.35, this.y + this.h * 0.35, 8, 0, Math.PI * 2);
        ctx.arc(this.x + this.w * 0.65, this.y + this.h * 0.35, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.w * 0.35, this.y + this.h * 0.35, 4, 0, Math.PI * 2);
        ctx.arc(this.x + this.w * 0.65, this.y + this.h * 0.35, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawAblSynthFrog(ctx, config, ablLvl) {
        const primary = (config.colors && config.colors[0]) || '#32CD32';
        const secondary = this.game?.characterTheme?.particleSecondary || (config.colors && config.colors[1]) || '#22d3ee';
        const accent = this.game?.characterTheme?.glowColor || (config.colors && config.colors[2]) || '#fde047';
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;
        const pulse = 1 + Math.sin(this.animTime * 4) * 0.04;
        const isDashing = this.dashT > 0;
        const isAirborne = !this.onGround;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(isDashing ? pulse * 1.08 : pulse, isAirborne ? pulse * 0.96 : pulse);

        ctx.shadowColor = secondary;
        ctx.shadowBlur = isDashing ? 26 : 18;
        const shell = ctx.createLinearGradient(-this.w / 2, -this.h / 2, this.w / 2, this.h / 2);
        shell.addColorStop(0, primary);
        shell.addColorStop(1, secondary);
        ctx.fillStyle = shell;
        ctx.beginPath();
        ctx.roundRect(-this.w * 0.34, -this.h * 0.24, this.w * 0.68, this.h * 0.62, 20);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.stroke();

        ctx.fillStyle = 'rgba(5, 10, 20, 0.72)';
        ctx.beginPath();
        ctx.roundRect(-this.w * 0.2, -this.h * 0.1, this.w * 0.4, this.h * 0.18, 10);
        ctx.fill();

        ctx.fillStyle = `${accent}55`;
        ctx.beginPath();
        ctx.roundRect(-this.w * 0.22, -this.h * 0.12, this.w * 0.44, this.h * 0.05, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-this.w * 0.12, -this.h * 0.02, 7, 0, Math.PI * 2);
        ctx.arc(this.w * 0.12, -this.h * 0.02, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-this.w * 0.12 + (this.eyeX || 0), -this.h * 0.02 + (this.eyeY || 0), 3.5, 0, Math.PI * 2);
        ctx.arc(this.w * 0.12 + (this.eyeX || 0), -this.h * 0.02 + (this.eyeY || 0), 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.85;
        const bars = 3 + Math.floor(ablLvl / 2);
        for (let i = 0; i < bars; i++) {
            const bw = 5;
            const bx = -this.w * 0.24 + i * 9;
            const bh = 6 + (i % 3) * 4 + Math.floor(ablLvl / 3);
            ctx.fillRect(bx, this.h * 0.08 - bh, bw, bh);
        }

        if (ablLvl >= 4) {
            ctx.globalAlpha = 0.75;
            ctx.strokeStyle = accent;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-this.w * 0.12, -this.h * 0.3);
            ctx.lineTo(-this.w * 0.2, -this.h * 0.42);
            ctx.moveTo(this.w * 0.12, -this.h * 0.3);
            ctx.lineTo(this.w * 0.2, -this.h * 0.42);
            ctx.stroke();
        }

        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = accent;
        ctx.beginPath();
        ctx.arc(0, 0, this.w * (0.38 + ablLvl * 0.012), 0, Math.PI * 2);
        ctx.stroke();

        if (isDashing) {
            ctx.globalAlpha = 0.28;
            ctx.fillStyle = accent;
            ctx.fillRect(-this.w * 0.42, -this.h * 0.08, this.w * 0.12, this.h * 0.16);
            ctx.fillRect(this.w * 0.3, -this.h * 0.08, this.w * 0.12, this.h * 0.16);
        }
        ctx.restore();
    }

    _draw8BitFrog(ctx, config) {
        // Renderizado Procedural 8-bit (Píxel Art Dinámico)
        ctx.save();
        const pxSize = Math.floor(this.w / 8);
        const skin = this.game.activeSkin;
        const primaryColor = skin.primaryColor || this.game?.characterTheme?.particlePrimary || '#00FF66';
        const darkColor = skin.secondaryColor || this.game?.characterTheme?.particleSecondary || '#006400';
        const accentColor = skin.primaryColor || this.game?.characterTheme?.glowColor || '#FFFF00';
        const isDashing = this.dashT > 0;
        const isAirborne = !this.onGround;
        const eyeColor = isDashing ? accentColor : '#FFF';

        // Matriz de píxeles simplificada para una rana (8x8)
        // 0: vacío, 1: primario, 2: oscuro, 3: ojos/accent
        const frogMap = [
            [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 3, 1, 1, 3, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 1, 1, 1, 1, 2, 1],
            [0, 1, 2, 2, 2, 2, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 0, 0, 0, 0, 1, 1]
        ];

        // Animación de "saltito" visual
        const hover = Math.sin(this.animTime * 10) * 2 + (isAirborne ? -2 : 0);

        ctx.translate(this.x, this.y + hover);
        if (isDashing) {
            ctx.transform(1, 0, -0.18, 1, 0, 0);
        }

        // Dibujar cada píxel con efecto de volumen 8-bit
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const type = frogMap[y][x];
                if (type === 0) continue;

                let color = primaryColor;
                if (type === 2) color = darkColor;
                if (type === 3) color = eyeColor; // Ojos por defecto en blanco

                ctx.fillStyle = color;
                ctx.fillRect(x * pxSize, y * pxSize, pxSize, pxSize);

                // Brillo superior (Efecto AAA en 8-bit)
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(x * pxSize, y * pxSize, pxSize, pxSize * 0.3);
            }
        }

        // Overlay de color ambiental para cohesión
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(0, 0, this.w, this.h);

        if (isAirborne) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = accentColor;
            ctx.fillRect(pxSize * 1, pxSize * 7, pxSize * 6, Math.max(2, pxSize * 0.45));
        }

        if (isDashing) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = accentColor;
            ctx.fillRect(-pxSize * 2, pxSize * 2, pxSize * 2, pxSize * 4);
        }

        ctx.restore();
    }

    _drawEnhancedIceFrog(ctx) {
        // 128-bit HD Ice Frog - Chapter 8 Enhanced Style
        ctx.save();
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        // Main body gradient (icy blue)
        const bodyGrad = ctx.createRadialGradient(cx - 10, cy - 10, 0, cx, cy, 40);
        bodyGrad.addColorStop(0, '#E0F7FF');
        bodyGrad.addColorStop(0.3, '#7DD3FC');
        bodyGrad.addColorStop(0.7, '#0284C7');
        bodyGrad.addColorStop(1, '#0369A1');

        // Body glow
        ctx.shadowColor = '#22D3EE';
        ctx.shadowBlur = 25;

        // Main body (128-bit style - detailed)
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 35, 32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Highlight lines (128-bit retro detail)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx - 15, cy - 5, 8, 15, -0.3, 0, Math.PI * 2);
        ctx.stroke();

        // Ice crystal accents
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.moveTo(cx + 20, cy - 25);
        ctx.lineTo(cx + 25, cy - 15);
        ctx.lineTo(cx + 30, cy - 25);
        ctx.lineTo(cx + 25, cy - 20);
        ctx.closePath();
        ctx.fill();

        // Eyes - Big and expressive
        const eyeY = cy - 20;

        // Eye whites with gradient
        const eyeGrad = ctx.createRadialGradient(cx - 12, eyeY, 0, cx - 12, eyeY, 14);
        eyeGrad.addColorStop(0, '#FFFFFF');
        eyeGrad.addColorStop(0.8, '#E0E7FF');
        eyeGrad.addColorStop(1, '#A5B4FC');

        ctx.fillStyle = eyeGrad;
        ctx.beginPath();
        ctx.ellipse(cx - 12, eyeY, 12, 14, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 12, eyeY, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        const lookY = this.eyeY || 0;
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.arc(cx - 12, eyeY + lookY, 6, 0, Math.PI * 2);
        ctx.arc(cx + 12, eyeY + lookY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx - 14, eyeY - 3, 3, 0, Math.PI * 2);
        ctx.arc(cx + 10, eyeY - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Blush (cute detail)
        ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx - 25, cy + 5, 8, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 25, cy + 5, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mouth - smile
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 5, 12, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Crown/Antler details (ice king style)
        ctx.strokeStyle = '#67E8F9';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Left antler
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy - 30);
        ctx.lineTo(cx - 25, cy - 45);
        ctx.lineTo(cx - 30, cy - 50);
        ctx.stroke();

        // Right antler  
        ctx.beginPath();
        ctx.moveTo(cx + 20, cy - 30);
        ctx.lineTo(cx + 25, cy - 45);
        ctx.lineTo(cx + 30, cy - 50);
        ctx.stroke();

        // Antler gems
        ctx.fillStyle = '#22D3EE';
        ctx.beginPath();
        ctx.arc(cx - 30, cy - 50, 4, 0, Math.PI * 2);
        ctx.arc(cx + 30, cy - 50, 4, 0, Math.PI * 2);
        ctx.fill();

        // Snowflake on head
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 40);
            ctx.lineTo(cx + Math.cos(angle) * 8, cy - 40 + Math.sin(angle) * 8);
            ctx.stroke();
        }

        // Legs (sitting position)
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(cx - 28, cy + 28, 10, 8, -0.5, 0, Math.PI * 2);
        ctx.ellipse(cx + 28, cy + 28, 10, 8, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Feet
        ctx.fillStyle = '#7DD3FC';
        ctx.beginPath();
        ctx.ellipse(cx - 32, cy + 32, 8, 5, -0.3, 0, Math.PI * 2);
        ctx.ellipse(cx + 32, cy + 32, 8, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Toe pads
        ctx.fillStyle = '#0369A1';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(cx - 32 + i * 5, cy + 34, 2, 0, Math.PI * 2);
            ctx.arc(cx + 32 + i * 5, cy + 34, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    _drawIceEnhancements(ctx) {
        // Add 128-bit style enhancements on top of the existing frog image
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        ctx.save();

        // Ice crown glow
        ctx.shadowColor = '#22D3EE';
        ctx.shadowBlur = 15;

        // Sparkle effects around the frog
        ctx.fillStyle = '#FFFFFF';
        const time = Date.now() / 200;
        for (let i = 0; i < 5; i++) {
            const angle = time + (i / 5) * Math.PI * 2;
            const dist = 45 + Math.sin(time * 2 + i) * 5;
            const sx = cx + Math.cos(angle) * dist;
            const sy = cy - 25 + Math.sin(angle) * dist;
            const size = 2 + Math.sin(time * 3 + i) * 1;

            ctx.beginPath();
            ctx.arc(sx, sy, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    _drawDesertEnhancements(ctx) {
        // Add 128-bit style enhancements for desert theme
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        ctx.save();

        // Golden sparkle effects
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 12;

        // Floating scarab particles
        ctx.fillStyle = '#FFD700';
        const time = Date.now() / 200;
        for (let i = 0; i < 4; i++) {
            const angle = time + (i / 4) * Math.PI * 2;
            const dist = 42 + Math.sin(time * 1.5 + i) * 8;
            const sx = cx + Math.cos(angle) * dist;
            const sy = cy - 20 + Math.sin(angle) * dist;

            // Scarab shape
            ctx.beginPath();
            ctx.ellipse(sx, sy, 3, 2, angle, 0, Math.PI * 2);
            ctx.fill();
        }

        // Sun ray effects from crown
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(cx + i * 8, cy - 45);
            ctx.lineTo(cx + i * 12, cy - 55);
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    _drawEnhancedDesertFrog(ctx) {
        // 128-bit HD Desert Frog - Chapter 2 (Egypt/Pyramid theme)
        ctx.save();
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        // Main body gradient (golden sand)
        const bodyGrad = ctx.createRadialGradient(cx - 10, cy - 10, 0, cx, cy, 40);
        bodyGrad.addColorStop(0, '#FFF8DC');
        bodyGrad.addColorStop(0.3, '#DAA520');
        bodyGrad.addColorStop(0.7, '#B8860B');
        bodyGrad.addColorStop(1, '#8B4513');

        // Golden glow
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 25;

        // Main body (128-bit style - detailed)
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 35, 32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Hieroglyphic-style pattern on body
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy - 5);
        ctx.lineTo(cx - 5, cy - 15);
        ctx.lineTo(cx + 5, cy - 5);
        ctx.lineTo(cx + 15, cy - 15);
        ctx.stroke();

        // Eye makeup (Egyptian style)
        ctx.fillStyle = 'rgba(139, 69, 19, 0.6)';
        ctx.beginPath();
        ctx.ellipse(cx - 18, cy - 15, 14, 6, -0.3, 0, Math.PI * 2);
        ctx.ellipse(cx + 18, cy - 15, 14, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes - Big and expressive
        const eyeY = cy - 18;

        // Eye whites with golden gradient
        const eyeGrad = ctx.createRadialGradient(cx - 12, eyeY, 0, cx - 12, eyeY, 14);
        eyeGrad.addColorStop(0, '#FFFFFF');
        eyeGrad.addColorStop(0.8, '#FFFACD');
        eyeGrad.addColorStop(1, '#FFD700');

        ctx.fillStyle = eyeGrad;
        ctx.beginPath();
        ctx.ellipse(cx - 12, eyeY, 12, 14, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 12, eyeY, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye liner (Egyptian)
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 24, eyeY - 2);
        ctx.lineTo(cx - 4, eyeY - 4);
        ctx.moveTo(cx - 24, eyeY + 2);
        ctx.lineTo(cx - 4, eyeY + 4);
        ctx.moveTo(cx + 4, eyeY - 4);
        ctx.lineTo(cx + 24, eyeY - 2);
        ctx.moveTo(cx + 4, eyeY + 4);
        ctx.lineTo(cx + 24, eyeY + 2);
        ctx.stroke();

        // Pupils - golden
        const lookY = this.eyeY || 0;
        ctx.fillStyle = '#1a0f00';
        ctx.beginPath();
        ctx.arc(cx - 12, eyeY + lookY, 5, 0, Math.PI * 2);
        ctx.arc(cx + 12, eyeY + lookY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx - 14, eyeY - 3, 3, 0, Math.PI * 2);
        ctx.arc(cx + 10, eyeY - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Uraeus (cobra) on forehead
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;

        // Cobra hood
        ctx.beginPath();
        ctx.moveTo(cx, cy - 42);
        ctx.quadraticCurveTo(cx - 8, cy - 52, cx, cy - 58);
        ctx.quadraticCurveTo(cx + 8, cy - 52, cx, cy - 42);
        ctx.fill();
        ctx.stroke();

        // Cobra eyes
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 48, 1.5, 0, Math.PI * 2);
        ctx.arc(cx + 2, cy - 48, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Egyptian Crown (Nemes)
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;

        // Crown base
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 30);
        ctx.lineTo(cx - 25, cy - 50);
        ctx.lineTo(cx, cy - 55);
        ctx.lineTo(cx + 25, cy - 50);
        ctx.lineTo(cx + 30, cy - 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crown stripes
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(cx + i * 6, cy - 32);
            ctx.lineTo(cx + i * 5, cy - 48);
            ctx.stroke();
        }

        // Red headband
        ctx.strokeStyle = '#DC143C';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 28, cy - 32);
        ctx.lineTo(cx + 28, cy - 32);
        ctx.stroke();

        // Scarab emblem (center of crown)
        ctx.fillStyle = '#1E90FF';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 40, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Nose ring (golden)
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 2, 5, 0, Math.PI * 2);
        ctx.stroke();

        // Gold earrings
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(cx - 28, cy - 5, 4, 0, Math.PI * 2);
        ctx.arc(cx + 28, cy - 5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Earring gems
        ctx.fillStyle = '#1E90FF';
        ctx.beginPath();
        ctx.arc(cx - 28, cy - 5, 2, 0, Math.PI * 2);
        ctx.arc(cx + 28, cy - 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Gold collar/necklace
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy + 12, 20, 0.3, Math.PI - 0.3);
        ctx.stroke();

        // Collar gems
        const gemColors = ['#FF0000', '#00FF00', '#0000FF', '#FFD700'];
        for (let i = 0; i < 4; i++) {
            const angle = 0.4 + (i / 3) * (Math.PI - 0.8);
            const gx = cx + Math.cos(angle) * 20;
            const gy = cy + 12 + Math.sin(angle) * 8;
            ctx.fillStyle = gemColors[i];
            ctx.beginPath();
            ctx.arc(gx, gy, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Scarab markings on body
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs with golden bands
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(cx - 28, cy + 28, 10, 8, -0.5, 0, Math.PI * 2);
        ctx.ellipse(cx + 28, cy + 28, 10, 8, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Gold leg bands
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 32, cy + 25);
        ctx.lineTo(cx - 24, cy + 25);
        ctx.moveTo(cx + 24, cy + 25);
        ctx.lineTo(cx + 32, cy + 25);
        ctx.stroke();

        // Sandals
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.ellipse(cx - 32, cy + 33, 8, 5, -0.3, 0, Math.PI * 2);
        ctx.ellipse(cx + 32, cy + 33, 8, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _drawTrail(ctx, img, scale) {
        if (!this.trail || this.trail.length === 0) return;

        const isDashing = this.dashT > 0;
        const isFever = this.game && this.game.mult > 1;

        if (isDashing || isFever || Math.abs(this.vy) > 5) {
            ctx.save();
            if (isDashing || isFever) ctx.globalCompositeOperation = 'lighter';

            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                ctx.save();
                ctx.globalAlpha = t.life * (isDashing ? 0.35 : 0.15);
                ctx.translate(t.x + this.w / 2, t.y + this.h / 2);
                ctx.rotate(t.rot || 0);
                const tScale = scale * (0.4 + t.life * 0.6);
                ctx.scale(tScale, tScale);
                ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
                ctx.restore();
            }
            ctx.restore();
        }
    }

    _applyStatusEffects(ctx, scale) {
        if (this.rainbowT > 0) { const ref = Math.floor(Date.now() / 100) % 360; ctx.filter = `hue-rotate(${ref}deg) brightness(1.5)`; }
        if (this.cloverT > 0 && Math.random() > 0.8) { ctx.fillStyle = "#32CD32"; ctx.fillRect(this.x + Math.random() * this.w, this.y, 4, 4); }
        if (this.slowT > 0) { ctx.beginPath(); ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 50 * scale, 0, 6.28); ctx.fillStyle = "rgba(0,0,255,0.2)"; ctx.fill(); }
        if (this.infiniteDashT > 0) { ctx.shadowBlur = 20; ctx.shadowColor = "#9370DB"; }
        if (this.magnetT > 0) { ctx.beginPath(); ctx.arc(this.x + this.w / 2, this.y + this.h / 2, (60 + Math.sin(Date.now() / 100) * 10) * scale, 0, 6.28); ctx.strokeStyle = "rgba(24, 238, 216, 0.5)"; ctx.lineWidth = 3; ctx.stroke(); }
        if (this.shieldActive) { ctx.beginPath(); ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 55 * scale, 0, 6.28); ctx.fillStyle = "rgba(0, 191, 255, 0.3)"; ctx.fill(); ctx.strokeStyle = "#00BFFF"; ctx.lineWidth = 2; ctx.stroke(); }
        if (this.dashT > 0 || this.ghostT > 0 || (this.shieldHitT > 0 && Math.floor(Date.now() / 50) % 2 === 0)) { ctx.globalAlpha = 0.4; }
    }

    _calculateTransformation(scale) {
        let sx = scale, sy = scale;

        if (this.jumpChargeT > 0) {
            sx = scale * 1.35; sy = scale * 0.65;
        } else if (this.landSquash > 0) {
            const ts = this.landSquash / 8;
            sx = scale * (1 + ts * 0.45); sy = scale * (1 - ts * 0.35);
        } else if (this.vy < -1) {
            const ts = Math.min(1, Math.abs(this.vy) / 12);
            sx = scale * (1 - ts * 0.25); sy = scale * (1 + ts * 0.4);
        } else if (this.vy > 1) {
            const ts = Math.min(1, Math.abs(this.vy) / 12);
            sx = scale * (1 - ts * 0.15); sy = scale * (1 + ts * 0.25);
        } else if (this.dashT > 0) {
            sx = scale * 1.5; sy = scale * 0.65;
        }
        sx *= this.breatheScale || 1;
        sy *= (2 - (this.breatheScale || 1));
        return [sx, sy];
    }

    _drawDashCooldown(ctx, scale) {
        if (this.dashCd > 0) {
            ctx.save();
            const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
            const radius = 45 * scale;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (1 - this.dashCd / 120)));
            ctx.strokeStyle = "rgba(24, 238, 216, 0.4)";
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        }
    }

    _updateGekkoEyes(dt) {
        this.blinkT -= dt;
        if (this.blinkT <= 0) {
            if (this.isBlinking) {
                this.isBlinking = false;
                this.blinkT = 120 + Math.random() * 200;
            } else {
                this.isBlinking = true;
                this.blinkT = 8;
            }
        }
        if (this.game && this.game.entities) {
            const fly = this.game.entities.find(e => e.type === 'banana' || e.type === 'gold');
            if (fly) {
                const dx = fly.x - this.x, dy = fly.y - this.y, dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 500) { this.eyeTarget.x = (dx / dist) * 4; this.eyeTarget.y = (dy / dist) * 4; }
            } else { this.eyeTarget.x = 0; this.eyeTarget.y = 0; }
        }
        this.eyeX += (this.eyeTarget.x - this.eyeX) * 0.2;
        this.eyeY += (this.eyeTarget.y - this.eyeY) * 0.2;
    }

    _drawGekkoEyes(ctx, config) {
        if (this.isBlinking) return;
        const eyeColor = config.eyeColor || '#FFF';
        ctx.save();
        ctx.translate(12, -7);
        ctx.fillStyle = eyeColor;
        ctx.beginPath(); ctx.arc(-8, 0, 6, 0, Math.PI * 2); ctx.arc(8, 0, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(-8 + this.eyeX, this.eyeY, 3, 0, Math.PI * 2); ctx.arc(8 + this.eyeX, this.eyeY, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    /**
     * Returns the collision bounds of the player.
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    getBounds() {
        let scale = (this.miniT > 0) ? 0.5 : 1.0;
        // Replicando Hitbox exacta del diseño original (XANEZU CATCH)
        // El diseño original no usaba padding porcentual dinámico, sino una caja más centrada
        const paddingW = this.w * 0.20;
        const paddingH = this.h * 0.20;
        return { 
            x: this.x + paddingW + (this.w * (1 - scale) / 2), 
            y: this.y + paddingH + (this.h * (1 - scale) / 2), 
            w: (this.w - paddingW * 2) * scale, 
            h: (this.h - paddingH * 2) * scale 
        };
    }

    /**
     * Determines the correct texture to show based on game state and chapter.
     * @returns {HTMLImageElement}
     */
    getCurrentImage() {
        // ABL mode uses fully procedural character rendering (no shared story sprites)
        if (this.game?.stateManager?.isABLMode?.() === true) {
            return null;
        }

        // 1. Dynamic Chapter Skin (Prioridad Máxima)
        const chapter = this.game ? this.game.chapter : 1;
        const chKey = `ch${chapter}`;
        const chCache = this.game && this.game.assetLoader ? this.game.assetLoader.cache[chKey] : null;

        const isRenderableSprite = (candidate) => candidate && candidate.width > 0 && !candidate.isPlaceholder;

        if (chCache && isRenderableSprite(chCache.frog)) {
            let img = chCache.frog;
            if (this.isCatching) img = chCache.frog_c || img;
            else if (this.vy < -1) img = chCache.frog_up || img;
            else if (this.vy > 1) img = chCache.frog_dn || img;
            return isRenderableSprite(img) ? img : chCache.frog;
        }

        // 2. Fallback a skin base
        let img = this.assets.frog;
        if (this.isCatching) img = this.assets.frogCatch || img;
        else if (this.vy < -1) img = this.assets.frogUp || img;
        else if (this.vy > 1) img = this.assets.frogDown || img;
        return isRenderableSprite(img) ? img : null;
    }
}
