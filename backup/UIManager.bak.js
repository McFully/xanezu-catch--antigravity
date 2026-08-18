import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

console.log("📦 [UIManager] Versión 0.2.1-FIX Cargada.");
import { CHAPTER_REGISTRY } from './ChapterRegistry.js';
import { ARCADE_CHAPTER_REGISTRY } from './ArcadeChapterRegistry.js';
import { ABL_CHAPTER_REGISTRY } from './ABLChapterRegistry.js';

/**
 * UIManager: Motor de Renderizado de Interfaz 100% basado en Canvas.
 * Elimina toda dependencia del DOM y utiliza primitivas gráficas para menús y HUD.
 */
export class UIManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.activeButtons = [];
        this.hoveredButton = null;
        this.animations = {
            menuTransition: 0,
            showHUD: 1,
            fadeOverlay: 0,
            lastFrameTime: performance.now()
        };

        this.colors = {
            primary: '#00f2ff',
            secondary: '#ff00ff',
            accent: '#00ff00',
            bg: 'rgba(10, 14, 20, 0.85)',
            text: '#ffffff',
            glass: 'rgba(255, 255, 255, 0.1)',
            shadow: 'rgba(0, 0, 0, 0.5)'
        };

        // Estado selección de capítulos
        this.chapterPage = 0;
        this._csAnim = { 
            t: 0, 
            phase: 'idle',
            speed: 0.045
        };
        this._csPrevState = null;

        // Estado World Map
        this.mapView = {
            offsetX: 0,
            offsetY: 0,
            targetOffsetX: 0,
            targetOffsetY: 0,
            zoom: 1,
            isDragging: false,
            hoverChapter: null
        };

        // Juice state
        this.hudJuice = {
            banana: 0,
            bomb: 0,
            score: 0
        };

        // Notificaciones (Toasts)
        this.toastState = {
            ach: null,
            timer: 0,
            y: -120,
            alpha: 0,
            phase: 'hidden'
        };

        this._setupInput();
    }

    _setupInput() {
        if (!this.game.canvas) return;

        // Listener para traducir clics de pantalla a coordenadas del canvas
        this.game.canvas.addEventListener('mousemove', (e) => {
            const rect = this.game.canvas.getBoundingClientRect();
            const sx = this.game.canvas.width / rect.width;
            const sy = this.game.canvas.height / rect.height;
            this.game.mouse.x = (e.clientX - rect.left) * sx;
            this.game.mouse.y = (e.clientY - rect.top) * sy;
            this._checkHover();
        });

        this.game.canvas.addEventListener('mousedown', (e) => {
            // Reanudar el contexto de audio si ha estado bloqueado por el navegador
            if (this.game.synth && this.game.synth.ctx.state === 'suspended') {
                this.game.synth.ctx.resume().then(() => {
                    console.log("Audio: Context resumed via user gesture");
                    // Iniciar música si estamos en el menú
                    if (this.game.stateManager.state === 'main_menu' || this.game.stateManager.state === 'mode_select') {
                        this.game.synth.playMenuMusic();
                    }
                });
            }

            if (e.button === 0) {
                this.game.mouse.down = true;
                this._checkClick();
            }
        });

        this.game.canvas.addEventListener('mouseup', () => {
            this.game.mouse.down = false;
        });

        // Soporte táctil básico
        this.game.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                const rect = this.game.canvas.getBoundingClientRect();
                const sx = this.game.canvas.width / rect.width;
                const sy = this.game.canvas.height / rect.height;
                this.game.mouse.x = (e.touches[0].clientX - rect.left) * sx;
                this.game.mouse.y = (e.touches[0].clientY - rect.top) * sy;
                this.game.mouse.down = true;
                this._checkClick();
            }
        }, { passive: false });

        this.game.canvas.addEventListener('touchend', () => {
            this.game.mouse.down = false;
        });
    }

    _checkHover() {
        this.hoveredButton = this.activeButtons.find(btn => 
            this.game.mouse.x >= btn.x && this.game.mouse.x <= btn.x + btn.w &&
            this.game.mouse.y >= btn.y && this.game.mouse.y <= btn.y + btn.h
        );
        
        if (this.hoveredButton && !this.hoveredButton.wasHovered) {
             if (this.game.synth) this.game.synth.playBtnHover();
             this.hoveredButton.wasHovered = true;
        }
        
        this.activeButtons.forEach(btn => {
            if (btn !== this.hoveredButton) btn.wasHovered = false;
        });
    }

    _checkClick() {
        if (this.hoveredButton && this.hoveredButton.onClick) {
            if (this.game.synth) this.game.synth.playBtnClick();
            this.hoveredButton.onClick();
        }
    }

    _csEaseOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    _csRestartAnim() {
        this._csAnim.t = 0;
        this._csAnim.phase = 'enter';
        if (this.game.synth) this.game.synth.playBtnClick();
    }

    _csIsChapterCompleted(id) {
        return (this.game.completedChapters && this.game.completedChapters.includes(id)) || false;
    }

    _csPathRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    _isMouseOver(x, y, w, h) {
        return this.game.mouse.x >= x && this.game.mouse.x <= x + w &&
               this.game.mouse.y >= y && this.game.mouse.y <= y + h;
    }

    render(ctx) {
        if (!ctx) return;
        this.ctx = ctx;
        const state = this.game.stateManager.state;

        // Detectar entrada a cualquier pantalla de selección de capítulos para disparar animación de entrada
        const isChapterScreen = ['chapter_select_story', 'chapter_select_arcade', 'chapter_select_ablia'].includes(state);
        const wasChapterScreen = ['chapter_select_story', 'chapter_select_arcade', 'chapter_select_ablia'].includes(this._csPrevState);

        if (isChapterScreen && !wasChapterScreen) {
            this._csAnim.phase = 'enter';
            this._csAnim.t = 0;
            this.chapterPage = 0; // Resetear página al entrar de nuevo
        }
        this._csPrevState = state;

        // Avanzar animación de entrada
        if (this._csAnim.phase === 'enter') {
            this._csAnim.t = Math.min(1, this._csAnim.t + this._csAnim.speed);
            if (this._csAnim.t >= 1) this._csAnim.phase = 'idle';
        }
        
        // Reset de estado interactivo del frame
        this.activeButtons = [];
        this.game.canvas.style.cursor = 'default';

        // Despacho de renderizado según el estado
        switch (state) {
            case 'loading_screen':
                this._renderLoadingScreen();
                break;
            case 'main_menu':
                if (this.game.synth) this.game.synth.stopZenAtmosphere();
                this.game.renderMenu();
                this._renderMainMenu();
                break;
            case 'mode_select':
                if (this.game.synth) this.game.synth.stopZenAtmosphere();
                this.game.renderMenu();
                this._renderModeSelect();
                break;
            case 'settings_menu':
                this.game.renderMenu();
                this._renderSettingsMenu();
                break;
            case 'load_game_flow':
                this.game.renderMenu();
                this._renderLoadGameFlow();
                break;
            case 'chapter_select_story':
            case 'chapter_select_arcade':
            case 'chapter_select_ablia':
                this.game.renderMenu();
                this._renderChapterSelect(state);
                break;
            case 'trophies_screen':
                this.game.renderMenu();
                this._renderTrophiesScreen();
                break;
            case 'shop_screen':
                this.game.renderMenu();
                this._renderShopScreen();
                break;
            case 'skin_selector':
                this.game.renderMenu();
                this._renderSkinSelector();
                break;
            case 'PLAYING':
            case 'COUNTDOWN':
            case 'gameplay':
                this.game.renderGame();
                this._renderHUD();
                break;
            case 'GAMEOVER':
                this.game.renderGame();
                this._renderGameOver();
                break;
            case 'VICTORY':
                this.game.renderGame();
                this._renderVictoryScreen();
                break;
            default:
                this.game.renderMenu();
                this._renderMainMenu();
        }

        // --- CAPA FINAL: AVISO DE ORIENTACIÓN (100% Canvas) ---
        this._renderOrientationWarning();

        // Dibujar ID de pantalla en la esquina superior derecha para referencia (Debug)
        this._drawDebugStateID(ctx, state);

        // • • • •  CAPA FINAL: NOTIFICACIONES SUPERIORES • • • • 
        this._renderToasts();
    }

    /**
     * Dibuja el identificador de la pantalla actual en una esquina.
     * Útil para referencia rápida durante el desarrollo.
     */
    _drawDebugStateID(ctx, state) {
        ctx.save();
        ctx.font = 'bold 12px monospace';
        const text = `ID: ${state.toUpperCase()}`;
        const paddingH = 12;
        const paddingV = 6;
        const metrics = ctx.measureText(text);
        const w = metrics.width + paddingH * 2;
        const h = 24;
        
        // Posición: Esquina superior derecha con margen
        const x = CANVAS_WIDTH - w - 20;
        const y = 20;
        
        // Fondo estilizado
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, 4);
        } else {
            ctx.rect(x, y, w, h);
        }
        ctx.fill();
        
        // Borde neón
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Texto
        ctx.fillStyle = '#00f2ff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + paddingH, y + h / 2 + 1);
        
        ctx.restore();
    }

    // --- RENDERERS DE PANTALLAS ---

    /**
     * RENDERER: PANTALLA DE CARGA AVANZADA (AAA PREMIUM)
     * Basada en el diseño de 3 columnas: 25% Guía | 50% Hub Central | 25% Stats
     */
    _renderLoadingScreen() {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;
        const progress = this.game.loadingProgress || 0;

        // ━━ 1. FONDO ANIMADO (BACKDROP) ━━
        this._drawLoadingBackdrop(ctx, W, H);

        // ━━ 2. GRID DE 3 COLUMNAS (25% | 50% | 25%) ━━
        const colW1 = W * 0.25;
        const colW2 = W * 0.50;
        const colW3 = W * 0.25;

        // Columna Izquierda: Guía de Objetos
        this._drawLoadingGuide(ctx, 20, 40, colW1 - 40, H - 80);

        // Columna Central: Hub Principal (Logo + Barra)
        this._drawLoadingHub(ctx, colW1, 0, colW2, H, progress);

        // Columna Derecha: Estadísticas de Sesión
        this._drawLoadingStats(ctx, colW1 + colW2 + 20, 40, colW3 - 40, H - 80);
    }

    _drawLoadingBackdrop(ctx, W, H) {
        const t = performance.now() / 1000;
        
        // Fondo base profundo
        ctx.fillStyle = '#060818';
        ctx.fillRect(0, 0, W, H);

        // Gradientes radiales animados (simulando el CSS backdrop-pulse)
        const pulse = Math.sin(t * 0.5) * 0.05;
        
        // Glow inferior (Primary)
        const grad1 = ctx.createRadialGradient(W/2, H*1.1, 0, W/2, H*1.1, W*0.8);
        grad1.addColorStop(0, `rgba(166, 246, 22, ${0.06 + pulse})`);
        grad1.addColorStop(1, 'transparent');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, W, H);

        // Glow superior izquierda (Secondary)
        const grad2 = ctx.createRadialGradient(W*0.2, H*0.2, 0, W*0.2, H*0.2, W*0.5);
        grad2.addColorStop(0, `rgba(24, 238, 216, ${0.05 + pulse})`);
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, W, H);

        // Partículas flotantes (simulando lo-starfield)
        // Partículas flotantes (simulando lo-starfield)
        ctx.save();
        for (let i = 0; i < 20; i++) {
            const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * W;
            const y = ((Math.cos(i * 678.90) * 0.5 + 0.5) * H - (t * 20 + i * 10) % H + H) % H;
            const size = (Math.sin(i) * 0.5 + 1);
            ctx.globalAlpha = 0.3 + Math.sin(t + i) * 0.2;
            ctx.fillStyle = i % 3 === 0 ? '#A6F616' : (i % 3 === 1 ? '#18EED8' : '#FFD700');
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    _drawLoadingGuide(ctx, x, y, w, h) {
        // Panel Glassmorphism
        this._drawGlassPanel(ctx, x, y, w, h, 'GUÍA DE JUEGO', '📒');

        const items = [
            { icon: '💰', name: 'Moneda', val: '200', color: '#FFD700' },
            { icon: '🔴', name: 'Rubí', val: '500', color: '#FF2975' },
            { icon: '🐸', name: 'Esmeralda', val: '800', color: '#A6F616' },
            { icon: '👑', name: 'Corona', val: '1000', color: '#FFD700' },
            { icon: '🍌', name: 'Banana', val: 'Combo+', color: '#FFD700' },
            { icon: '❤️', name: 'Vida', val: '+1 ❤️', color: '#FF2975' },
            { icon: '🧲', name: 'Imán', val: 'Atrae', color: '#9c5fff' },
            { icon: '🛡️', name: 'Escudo', val: 'Protege', color: '#3d7aed' }
        ];

        let currentY = y + 60;
        ctx.font = 'bold 10px Outfit';
        ctx.fillStyle = '#18EED8';
        ctx.fillText('TESOROS Y POWER-UPS', x + 20, currentY);
        currentY += 25;

        items.forEach(item => {
            // Fondo item
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            this._drawRoundedRect(x + 15, currentY - 15, w - 30, 28, 6);
            
            ctx.font = '14px Inter';
            ctx.fillText(item.icon, x + 25, currentY + 5);
            
            ctx.font = '600 11px Outfit';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(item.name.toUpperCase(), x + 55, currentY + 4);
            
            ctx.font = 'bold 12px Outfit';
            ctx.fillStyle = item.color;
            ctx.textAlign = 'right';
            ctx.fillText(item.val, x + w - 25, currentY + 5);
            ctx.textAlign = 'left';
            
            currentY += 34;
        });
    }

    _drawLoadingHub(ctx, x, y, w, h, progress) {
        const centerX = x + w / 2;
        const centerY = y + h / 2;

        // Logo Hero
        ctx.save();
        ctx.font = 'bold 80px Outfit';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(166, 246, 22, 0.5)';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🐸', centerX, centerY - 80);
        
        ctx.font = 'bold 42px Outfit';
        ctx.letterSpacing = '4px';
        ctx.fillText('XANEZU CATCH', centerX, centerY - 20);
        ctx.restore();

        ctx.font = '800 12px Outfit';
        ctx.fillStyle = 'rgba(180, 210, 255, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('PREPARANDO AVENTURA...', centerX, centerY + 20);

        // Barra de progreso premium
        const barW = 360;
        const barH = 12;
        const barX = centerX - barW / 2;
        const barY = centerY + 50;

        // Fondo barra
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this._drawRoundedRect(barX, barY, barW, barH, barH / 2);
        
        // Relleno barra con gradiente
        if (progress > 0) {
            const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            grad.addColorStop(0, '#A6F616');
            grad.addColorStop(1, '#18EED8');
            ctx.fillStyle = grad;
            this._drawRoundedRect(barX, barY, barW * progress, barH, barH / 2);
            
            // Glow de la barra
            ctx.shadowColor = '#A6F616';
            ctx.shadowBlur = 15;
            ctx.fillRect(barX, barY + barH/2 - 1, barW * progress, 2);
        }

        // Tip de carga
        ctx.font = 'bold 9px Outfit';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('CONSEJO PRO', centerX, centerY + 110);
        
        ctx.font = 'italic 13px Outfit';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('"Usa el Dash en el aire para alcanzar objetos lejanos"', centerX, centerY + 135);
    }

    _drawLoadingStats(ctx, x, y, w, h) {
        this._drawGlassPanel(ctx, x, y, w, h, 'MI SESIÓN', '🎯');

        const stats = [
            { label: 'MUERTES', val: this.game.totalDeaths || 0, icon: '💀', color: '#FF2975' },
            { label: 'DASHES', val: this.game.totalDashes || 0, icon: '⚡', color: '#9c5fff' }
        ];

        let currentY = y + 80;
        stats.forEach(stat => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            this._drawRoundedRect(x + 15, currentY - 20, w - 30, 45, 10);
            
            ctx.font = '18px Inter';
            ctx.fillText(stat.icon, x + 30, currentY + 8);
            
            ctx.font = 'bold 9px Outfit';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(stat.label, x + 65, currentY - 2);
            
            ctx.font = 'bold 18px Outfit';
            ctx.fillStyle = stat.color;
            ctx.fillText(stat.val.toLocaleString(), x + 65, currentY + 18);
            
            currentY += 65;
        });
    }

    _drawGlassPanel(ctx, x, y, w, h, title, icon) {
        ctx.save();
        // Fondo panel
        ctx.fillStyle = 'rgba(8, 12, 28, 0.75)';
        this._drawRoundedRect(x, y, w, h, 18);
        
        // Borde con gradiente sutil
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Header del panel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        this._drawRoundedRect(x, y, w, 45, {tl: 18, tr: 18, bl: 0, br: 0});
        
        ctx.font = 'bold 11px Outfit';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.letterSpacing = '2px';
        ctx.fillText(`${icon}  ${title}`, x + 20, y + 28);
        ctx.restore();
    }

    _renderMainMenu() {
        // Botones reposicionados: 4 botones centrales
        const btnW = 300;
        const btnH = 60;
        const centerX = CANVAS_WIDTH / 2 - btnW / 2;
        const centerY = CANVAS_HEIGHT / 2 - 100;
        
        // 1. NUEVA PARTIDA
        this._drawPremiumButton("NUEVA PARTIDA", centerX, centerY, btnW, btnH, () => {
             this.game.stateManager.navigate('mode_select');
        }, 'gold');

        // 2. CARGAR PARTIDA
        this._drawPremiumButton("CARGAR PARTIDA", centerX, centerY + 80, btnW, 50, () => {
             this.game.stateManager.navigate('load_game_flow');
        }, 'silver');

        // 3. SONIDO (Mute / Unmute)
        const audioIcon = this.game.isMusicOn ? "🔊 SONIDO: ON" : "🔇 SONIDO: OFF";
        this._drawPremiumButton(audioIcon, centerX, centerY + 150, (btnW / 2) - 10, 50, () => {
             this.game.toggleMusic();
        }, 'silver');
        
        // 4. AJUSTES
        this._drawPremiumButton("AJUSTES", centerX + (btnW / 2) + 10, centerY + 150, (btnW / 2) - 10, 50, () => {
             this.game.stateManager.navigate('settings_menu');
        }, 'silver');
    }

    _renderSettingsMenu() {
        const centerX = CANVAS_WIDTH / 2;
        this._drawText("AJUSTES", centerX, 100, "bold 42px Outfit", "center", this.colors.primary);

        const btnsY = 180;
        this._drawMenuButton("EXPORTAR PARTIDA", centerX - 150, btnsY, 300, 50, () => {
             if (this.game.saveSystem) this.game.saveSystem.exportSave();
        }, true);

        this._drawMenuButton("IMPORTAR PARTIDA", centerX - 150, btnsY + 70, 300, 50, () => {
             if (this.game.saveSystem) this.game.saveSystem.importSave();
        }, true);

        this._drawMenuButton("VOLVER", centerX - 150, 380, 300, 50, () => {
             this.game.stateManager.back();
        });
    }

    _renderModeSelect() {
        const centerX = CANVAS_WIDTH / 2;
        this._drawText("SELECCIÓN DE MODO", centerX, 80, "bold 60px Outfit", "center", "#fff");
        this._drawText("Escoge una disciplina para desplegar el motor", centerX, 130, "18px Inter", "center", "rgba(255,255,255,0.4)");

        // BOTÓN PREMIUM: PERSONALIZAR PERSONAJE
        const custBtnW = 400;
        const custBtnH = 50;
        this._drawPremiumButton("🎭 PERSONALIZAR PERSONAJE", centerX - custBtnW / 2, 145, custBtnW, custBtnH, () => {
            this.game.stateManager.navigate('skin_selector');
        }, 'silver');

        // --- Layout de 5 Cartas (Fase 5) ---
        // Fila 1: Modos Principales (Historia, Arcade, ABLIA)
        const gap = 40;
        const btnW = 420;
        const btnH = 440;
        const totalW3 = (btnW * 3) + (gap * 2);
        let startX3 = centerX - totalW3 / 2;
        const startY1 = 210;

        // 1. MODO HISTORIA
        this._drawModeCard(
            "MODO HISTORIA", 
            "Progresión narrativa a través de biomas dinámicos.", 
            "🗺️", 
            startX3, startY1, btnW, btnH, 
            () => {
                this.game.stateManager.setMode('STORY');
                this.game.stateManager.navigate('chapter_select_story');
            }, 
            '#00f2ff',
            false
        );

        // 2. MODO ARCADE
        startX3 += btnW + gap;
        this._drawModeCard(
            "MODO ARCADE", 
            "Desafíos infinitos con dificultad creciente por oleadas.", 
            "🎯", 
            startX3, startY1, btnW, btnH, 
            () => {
                this.game.stateManager.setMode('ARCADE');
                this.game.stateManager.navigate('chapter_select_arcade');
            }, 
            '#ff00ff',
            false
        );

        // 3. MODO ABL / IA
        startX3 += btnW + gap;
        this._drawModeCard(
            "MODO ABL / IA", 
            "Adaptación en tiempo real basada en tu nivel de habilidad.", 
            "🧠", 
            startX3, startY1, btnW, btnH, 
            () => {
                this.game.stateManager.setMode('ABL');
                this.game.stateManager.navigate('chapter_select_ablia');
            }, 
            '#00ff00',
            false
        );

        // Fila 2: Extras (Trofeos, Tienda) - Cartas más pequeñas
        const subBtnW = 650;
        const subBtnH = 260;
        const subGap = 40;
        const totalW2 = (subBtnW * 2) + subGap;
        let startX2 = centerX - totalW2 / 2;
        const startY2 = startY1 + btnH + gap;

        // 4. TROFEOS
        this._drawModeCard(
            "MIS TROFEOS", 
            "Revisa tus logros y medallas recolectadas.", 
            "🏆", 
            startX2, startY2, subBtnW, subBtnH, 
            () => {
                this.game.stateManager.navigate('trophies_screen');
            }, 
            '#FFD700',
            true // Modo compacto
        );

        // 5. TIENDA XANEZU
        startX2 += subBtnW + subGap;
        this._drawModeCard(
            "TIENDA XANEZU", 
            "Personaliza tu rana con skins exclusivas y mejoras.", 
            "🛒", 
            startX2, startY2, subBtnW, subBtnH, 
            () => {
                this.game.stateManager.navigate('shop_screen');
            }, 
            '#FF2EF7',
            true // Modo compacto
        );

        // Botón VOLVER centrado abajo
        this._drawMenuButton("VOLVER", centerX - 100, CANVAS_HEIGHT - 60, 200, 45, () => {
            this.game.stateManager.back();
        });
    }

    _renderLoadGameFlow() {
        // ... (Se mantiene igual pero verificado)
        const centerX = CANVAS_WIDTH / 2;
        this._drawText("CARGAR PARTIDA", centerX, 100, "bold 42px Outfit", "center", this.colors.secondary);
        this._drawText("Buscando partidas guardadas...", centerX, 200, "18px Inter", "center", "#aaa");
        
        this._drawMenuButton("REINTENTAR", centerX - 100, 280, 200, 50, () => {}, true);
        this._drawMenuButton("VOLVER", centerX - 100, 350, 200, 50, () => {
             this.game.stateManager.back();
        });
    }

    /**
     * Pantalla de selección de capítulos del Modo Historia.
     * Diseño completamente independiente: fondo propio, grid de cards con
     * thumbnails reales, estados visuales (desbloqueado / bloqueado / completado),
     * animación de entrada y hover con glow de color del bioma.
     */
    _renderChapterSelect(state) {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;
        const anim = this._csAnim;
        const isArcade = state === 'chapter_select_arcade';

        this._drawStoryBackground(ctx, W, H, isArcade);

        const headerAlpha = this._csEaseOut(anim.t);
        const headerOffsetY = (1 - headerAlpha) * -30;

        ctx.save();
        ctx.globalAlpha = headerAlpha;
        ctx.translate(0, headerOffsetY);

        // Banda semitransparente superior
        const headerGrad = ctx.createLinearGradient(0, 0, 0, 95);
        headerGrad.addColorStop(0, 'rgba(5, 8, 15, 0.95)');
        headerGrad.addColorStop(1, 'rgba(5, 8, 15, 0)');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(0, 0, W, 95);

        // Línea decorativa inferior del header
        const accentColor = isArcade ? '#ff00ff' : '#00f2ff';
        const lineGrad = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, 0);
        lineGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        lineGrad.addColorStop(0.3, accentColor + '99');
        lineGrad.addColorStop(0.7, accentColor + '99');
        lineGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = lineGrad;
        ctx.fillRect(0, 78, W, 1);

        // Título principal
        ctx.font = 'bold 34px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 20;
        ctx.fillText(isArcade ? 'MODO ARCADE' : 'MODO HISTORIA', W / 2, 44);

        // Subtítulo
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(180, 210, 255, 0.7)';
        ctx.shadowBlur = 0;
        ctx.fillText(isArcade ? 'Desafía tus límites en niveles infinitos' : 'Selecciona un capítulo para comenzar tu aventura', W / 2, 66);

        ctx.restore();

        const registry = isArcade ? ARCADE_CHAPTER_REGISTRY : CHAPTER_REGISTRY;
        const chaptersFull = Object.values(registry);
        const PAGE_SIZE = 8;
        const totalPages = Math.ceil(chaptersFull.length / PAGE_SIZE);
        
        // Mantener la página en rango
        if (this.chapterPage >= totalPages) this.chapterPage = totalPages - 1;
        if (this.chapterPage < 0) this.chapterPage = 0;

        const chapters = chaptersFull.slice(this.chapterPage * PAGE_SIZE, (this.chapterPage + 1) * PAGE_SIZE);

        // Configuración del grid: 4 columnas x 2 filas (Escalado para 1920x1080)
        const COLS = 4;
        const CARD_W = 440;
        const CARD_H = 320;
        const GAP_X = 40;
        const GAP_Y = 50; 
        const ROWS = 2; 
        const GRID_W = COLS * CARD_W + (COLS - 1) * GAP_X;
        const GRID_H = ROWS * CARD_H + (ROWS - 1) * GAP_Y;
        const GRID_X = (W - GRID_W) / 2;
        const GRID_Y = 110 + (H - 110 - 120 - GRID_H) / 2; // Centrado entre header y controles

        chapters.forEach((ch, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);

            // Animación de entrada escalonada por card
            const delay = i * 0.048;
            const rawT = Math.max(0, anim.t - delay);
            const cardT = Math.min(1, rawT / Math.max(0.01, 1 - Math.min(delay, 0.85)));
            const cardAlpha = this._csEaseOut(cardT);
            const cardOffsetY = (1 - this._csEaseOut(cardT)) * 30;

            const x = GRID_X + col * (CARD_W + GAP_X);
            const y = GRID_Y + row * (CARD_H + GAP_Y) + cardOffsetY;
            const realY = GRID_Y + row * (CARD_H + GAP_Y);

            ctx.save();
            ctx.globalAlpha = cardAlpha;

            const isLocked = false; // DESBLOQUEO TOTAL solicitada por el usuario
            const isCompleted = this._csIsChapterCompleted(ch.id);
            const isHover = this._csIsHovered(x, realY, CARD_W, CARD_H);

            this._drawStoryChapterCard(ctx, ch, x, y, CARD_W, CARD_H, isLocked, isCompleted, isHover);

            ctx.restore();

            // Registrar botón con coordenadas reales (sin offset de animación)
            this.activeButtons.push({
                x, y: realY, w: CARD_W, h: CARD_H,
                onClick: () => {
                    if (!isLocked) {
                        this.game.stateManager.navigate('loading_screen');
                        this.game.start(ch.id);
                    } else {
                        this.game.achievements?.showToast({
                            title: '¡Bloqueado!',
                            desc: 'Completa el capítulo anterior para desbloquear este.',
                            icon: '🔄'
                        });
                    }
                }
            });

            if (isHover) this.game.canvas.style.cursor = 'pointer';
        });

        const ctrlY = H - 85;
        const btnW = 160;
        const btnH = 40;
        const center = W / 2;

        // Indicador de página
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText(`PÁGINA ${this.chapterPage + 1} / ${totalPages}`, center, ctrlY - 20);

        // Botón Anterior
        if (this.chapterPage > 0) {
            this._drawMenuButton("ANTERIOR", center - btnW - 20, ctrlY, btnW, btnH, () => {
                this.chapterPage--;
                this._csAnim.t = 0.35; // Reset parcial para feedback visual
                this._csAnim.phase = 'enter';
                if (this.game.synth) this.game.synth.playBtnClick();
            });
        }

        // Botón Siguiente
        if (this.chapterPage < totalPages - 1) {
            this._drawMenuButton("SIGUIENTE", center + 20, ctrlY, btnW, btnH, () => {
                this.chapterPage++;
                this._csAnim.t = 0.35; // Reset parcial para feedback visual
                this._csAnim.phase = 'enter';
                if (this.game.synth) this.game.synth.playBtnClick();
            });
        }

        // Botón Atrás (Estilo Story)
        this._drawStoryBackButton(30, H - 54, 148, 42, () => {
            this._csAnim.phase = 'idle';
            this._csAnim.t = 1;
            this.game.stateManager.back();
            this.chapterPage = 0;
        });
    }

    /**
     * Dibuja el fondo exclusivo de la pantalla de selección de capítulos.
     */
    _drawStoryBackground(ctx, W, H, isArcade = false) {
        // Fondo base oscuro
        ctx.fillStyle = isArcade ? '#0a0614' : '#060c14';
        ctx.fillRect(0, 0, W, H);

        // Imagen de fondo (charper-menu-image o fallback a menuBG)
        const bgImg = this.game.assets?.chapterSelectBG || this.game.assets?.menuBG;
        if (bgImg && bgImg.width > 0) {
            ctx.save();
            ctx.globalAlpha = isArcade ? 0.4 : 0.52;
            ctx.drawImage(bgImg, 0, 0, W, H);
            ctx.restore();
        }

        // Overlay degradado oscuro para dar protagonismo a las cards
        const overlay = ctx.createLinearGradient(0, 0, 0, H);
        if (isArcade) {
            overlay.addColorStop(0, 'rgba(18, 4, 28, 0.85)');
            overlay.addColorStop(0.35, 'rgba(10, 4, 18, 0.62)');
            overlay.addColorStop(1, 'rgba(18, 4, 28, 0.92)');
        } else {
            overlay.addColorStop(0, 'rgba(4, 8, 18, 0.75)');
            overlay.addColorStop(0.35, 'rgba(4, 8, 18, 0.52)');
            overlay.addColorStop(1, 'rgba(4, 8, 18, 0.82)');
        }
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, W, H);

        // Partículas ambientales sutiles
        this._drawStoryAmbientParticles(ctx, W, H);
    }

    /**
     * Partículas ambientales sutiles para dar vida al fondo.
     */
    _drawStoryAmbientParticles(ctx, W, H) {
        const t = performance.now() / 1000;
        ctx.save();
        for (let i = 0; i < 30; i++) {
            const seed = i * 137.508;
            const px = ((seed * 7.3 + t * (0.3 + (i % 5) * 0.07)) % W + W) % W;
            const py = ((seed * 3.7 + t * (0.14 + (i % 3) * 0.05)) % H + H) % H;
            const size = 0.8 + (i % 3) * 0.7;
            const alpha = 0.06 + Math.sin(t * 0.6 + i) * 0.035;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = i % 5 === 0 ? '#00f2ff' : (i % 7 === 0 ? '#ffcc00' : '#ffffff');
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Dibuja una card de capítulo con thumbnail, nombre, estado y efectos hover.
     */
    _drawStoryChapterCard(ctx, ch, x, y, w, h, isLocked, isCompleted, isHover) {
        const RADIUS = 14;

        ctx.save();

        // Escala en hover (zoom sutil)
        if (isHover && !isLocked) {
            const cx = x + w / 2;
            const cy = y + h / 2;
            ctx.translate(cx, cy);
            ctx.scale(1.032, 1.032);
            ctx.translate(-cx, -cy);
        }

        // Sombra de la card
        ctx.shadowColor = isLocked
            ? 'rgba(0,0,0,0.5)'
            : (isHover ? (ch.colors?.[0] || '#00f2ff') : 'rgba(0,0,0,0.45)');
        ctx.shadowBlur = isHover && !isLocked ? 26 : 10;
        ctx.shadowOffsetY = isHover && !isLocked ? 6 : 3;

        // Clip para thumbnail
        ctx.beginPath();
        this._csPathRoundedRect(ctx, x, y, w, h, RADIUS);
        ctx.clip();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Thumbnail del bioma
        const thumbKey = `thumb_story_${ch.id}`;
        const thumb = this.game.assetLoader?.cache?.thumbs?.[thumbKey];

        if (thumb && thumb.width > 0 && !isLocked) {
            ctx.globalAlpha = isHover ? 1.0 : 0.88;
            ctx.drawImage(thumb, x, y, w, h);
        } else if (!isLocked) {
            // Fallback: gradiente con colores del bioma
            const [c1, c2] = ch.colors || ['#1a2a3a', '#0a1020'];
            const grad = ctx.createLinearGradient(x, y, x + w, y + h);
            grad.addColorStop(0, c1);
            grad.addColorStop(1, c2);
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, w, h);
        } else {
            // Bloqueado: fondo oscuro
            ctx.fillStyle = '#0c1018';
            ctx.fillRect(x, y, w, h);
            // Patrón de puntos sutiles
            ctx.fillStyle = 'rgba(255,255,255,0.02)';
            for (let px = x + 10; px < x + w; px += 18) {
                for (let py = y + 10; py < y + h; py += 18) {
                    ctx.beginPath();
                    ctx.arc(px, py, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Overlay inferior para texto
        const textGrad = ctx.createLinearGradient(x, y + h * 0.42, x, y + h);
        if (isLocked) {
            textGrad.addColorStop(0, 'rgba(5, 8, 14, 0.5)');
            textGrad.addColorStop(1, 'rgba(5, 8, 14, 0.94)');
        } else {
            textGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            textGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.42)');
            textGrad.addColorStop(1, 'rgba(0, 0, 0, 0.90)');
        }
        ctx.fillStyle = textGrad;
        ctx.fillRect(x, y, w, h);

        ctx.restore(); // Fin del clip

        // Borde de la card
        ctx.save();
        ctx.beginPath();
        this._csPathRoundedRect(ctx, x, y, w, h, RADIUS);
        if (isLocked) {
            ctx.strokeStyle = 'rgba(70, 75, 100, 0.4)';
            ctx.lineWidth = 1.5;
        } else if (isCompleted) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.55)';
            ctx.shadowBlur = 10;
        } else if (isHover) {
            ctx.strokeStyle = ch.colors?.[0] || '#00f2ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = ch.colors?.[0] || '#00f2ff';
            ctx.shadowBlur = 14;
        } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
            ctx.lineWidth = 1.5;
        }
        ctx.stroke();
        ctx.restore();

        // Contenido textual
        ctx.save();
        ctx.shadowBlur = 0;

        if (isLocked) {
            // Icono de candado centrado
            ctx.font = '26px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(130, 135, 160, 0.55)';
            ctx.fillText('🔒', x + w / 2, y + h / 2 - 6);

            ctx.font = 'bold 10px Outfit, sans-serif';
            ctx.fillStyle = 'rgba(120, 125, 150, 0.65)';
            ctx.fillText('BLOQUEADO', x + w / 2, y + h / 2 + 16);

            ctx.font = '10px Inter, sans-serif';
            ctx.fillStyle = 'rgba(90, 95, 120, 0.5)';
            ctx.fillText(`CAP. ${ch.id}`, x + w / 2, y + h - 12);
        } else {
            // Badge de número de capítulo (esquina superior izquierda)
            const bx = x + 9;
            const by = y + 9;
            const bw = 54;
            const bh = 20;
            const [bc] = ch.colors || ['#00f2ff'];
            ctx.fillStyle = bc + 'cc';
            ctx.beginPath();
            this._csPathRoundedRect(ctx, bx, by, bw, bh, 5);
            ctx.fill();
            ctx.font = 'bold 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 4;
            ctx.fillText(`CAP. ${ch.id}`, bx + bw / 2, by + 14);
            ctx.shadowBlur = 0;

            // Icono del bioma
            ctx.font = '22px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(ch.icon || '🗺️', x + w / 2, y + h - 46);

            // Nombre del capítulo
            ctx.font = `bold ${isHover ? '13px' : '12px'} Outfit, sans-serif`;
            ctx.fillStyle = isHover ? '#ffffff' : 'rgba(235, 240, 255, 0.92)';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 7;
            ctx.fillText(ch.name.toUpperCase(), x + w / 2, y + h - 28);
            ctx.shadowBlur = 0;

            // Puntos de dificultad
            if (ch.difficulty) {
                this._drawStoryDifficultyDots(ctx, x + w / 2, y + h - 13, ch.difficulty, ch.colors?.[0] || '#00f2ff');
            }

            // Check de completado (esquina superior derecha)
            if (isCompleted) {
                ctx.font = 'bold 14px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
                ctx.shadowBlur = 12;
                ctx.fillText('✔', x + w - 14, y + 22);
                ctx.shadowBlur = 0;
            }
        }

        ctx.restore();

        // Efecto de brillo en hover
        if (isHover && !isLocked) {
            ctx.save();
            ctx.beginPath();
            this._csPathRoundedRect(ctx, x, y, w, h, RADIUS);
            ctx.clip();
            const shineGrad = ctx.createLinearGradient(x, y, x + w, y + h);
            shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
            shineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
            shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = shineGrad;
            ctx.fillRect(x, y, w, h);
            ctx.restore();
        }
    }

    /**
     * Dibuja puntos de dificultad (1-5 puntos de color).
     */
    _drawStoryDifficultyDots(ctx, cx, y, level, color) {
        const MAX = 5;
        const DOT_R = 2.8;
        const DOT_GAP = 8;
        const totalW = (MAX - 1) * DOT_GAP;
        const startX = cx - totalW / 2;

        for (let i = 0; i < MAX; i++) {
            const dotX = startX + i * DOT_GAP;
            ctx.beginPath();
            ctx.arc(dotX, y, DOT_R, 0, Math.PI * 2);
            if (i < level) {
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 5;
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.18)';
                ctx.shadowBlur = 0;
            }
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    /**
     * Dibuja el botón ATRÁS de la pantalla de historia.
     */
    _drawStoryBackButton(x, y, w, h, onClick) {
        const ctx = this.ctx;
        const isHover = this._csIsHovered(x, y, w, h);

        this.activeButtons.push({ x, y, w, h, onClick });
        if (isHover) this.game.canvas.style.cursor = 'pointer';

        ctx.save();

        const grad = ctx.createLinearGradient(x, y, x, y + h);
        if (isHover) {
            grad.addColorStop(0, 'rgba(0, 242, 255, 0.30)');
            grad.addColorStop(1, 'rgba(0, 242, 255, 0.12)');
            ctx.shadowColor = '#00f2ff';
            ctx.shadowBlur = 18;
        } else {
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.13)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
            ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        this._csPathRoundedRect(ctx, x, y, w, h, 10);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = isHover ? '#00f2ff' : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = `bold ${Math.floor(h * 0.4)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isHover ? '#00f2ff' : 'rgba(215, 230, 255, 0.88)';
        ctx.shadowColor = isHover ? '#00f2ff' : 'transparent';
        ctx.shadowBlur = isHover ? 8 : 0;
        ctx.fillText('← ATRÁS', x + w / 2, y + h / 2 + 6);

        ctx.restore();
    }

    _renderChapterSelect(state) {
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;
        const anim = this._csAnim;
        const isArcade = state === 'chapter_select_arcade';
        const isABLIA = state === 'chapter_select_ablia';

        // 1. FONDO E INDUCCIÓN VISUAL
        this._drawStoryBackground(this.ctx, W, H, isArcade || isABLIA);

        // 2. HEADER CON ANIMACIÓN
        const headerAlpha = this._csEaseOut(anim.t);
        const headerOffsetY = (1 - headerAlpha) * -20;
        this.ctx.save();
        this.ctx.globalAlpha = headerAlpha;
        this.ctx.translate(0, headerOffsetY);
        
        const registry = isArcade ? ARCADE_CHAPTER_REGISTRY : (isABLIA ? ABL_CHAPTER_REGISTRY : CHAPTER_REGISTRY);
        const accentColor = isArcade ? '#ff00ff' : (isABLIA ? '#00ff00' : '#00f2ff');
        const titleText = isArcade ? 'DESAFÍOS ARCADE' : (isABLIA ? 'SISTEMA ABL / IA' : 'EXPEDICIÓN HISTORIA');

        this._drawText(titleText, W / 2, 50, "bold 38px Outfit", "center", accentColor, true);
        this._drawText("Selección de coordenadas para despliegue táctico", W / 2, 85, "16px Inter", "center", "rgba(255,255,255,0.4)");
        this.ctx.restore();

        // 3. GRID DE CAPÍTULOS (8 por página - Layout 4x2)
        const chaptersFull = Object.values(registry);
        const PAGE_SIZE = 8;
        const totalPages = Math.ceil(chaptersFull.length / PAGE_SIZE) || 1;
        
        if (this.chapterPage >= totalPages) this.chapterPage = totalPages - 1;
        if (this.chapterPage < 0) this.chapterPage = 0;
        
        const chapters = chaptersFull.slice(this.chapterPage * PAGE_SIZE, (this.chapterPage + 1) * PAGE_SIZE);

        const COLS = 4;
        const ROWS = 2;
        const CARD_W = 440;
        const CARD_H = 320;
        const GAP_X = 40;
        const GAP_Y = 50;

        const GRID_W = COLS * CARD_W + (COLS - 1) * GAP_X;
        const GRID_H = ROWS * CARD_H + (ROWS - 1) * GAP_Y;
        const GRID_X = (W - GRID_W) / 2;
        const GRID_Y = 160 + (H - 160 - 120 - GRID_H) / 2; // Centrado inteligente

        chapters.forEach((ch, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = GRID_X + col * (CARD_W + GAP_X);
            
            // Animación de entrada escalonada
            const delay = i * 0.05;
            const rawT = Math.max(0, anim.t - delay);
            const cardT = Math.min(1, rawT / 0.85);
            const cardAlpha = this._csEaseOut(cardT);
            const cardOffsetY = (1 - cardAlpha) * 30;
            const y = GRID_Y + row * (CARD_H + GAP_Y) + cardOffsetY;
            const realY = GRID_Y + row * (CARD_H + GAP_Y);

            this.ctx.save();
            this.ctx.globalAlpha = cardAlpha;

            const isLocked = !this.game.isChapterUnlocked(ch.id);
            const isCompleted = this._csIsChapterCompleted(ch.id);
            const isHover = this._isMouseOver(x, realY, CARD_W, CARD_H);

            this._drawStoryChapterCard(this.ctx, ch, x, y, CARD_W, CARD_H, isLocked, isCompleted, isHover);

            this.ctx.restore();

            this.activeButtons.push({
                x, y: realY, w: CARD_W, h: CARD_H,
                onClick: () => {
                    if (!isLocked) {
                        this.game.stateManager.navigate('loading_screen');
                        this.game.start(ch.id);
                    } else {
                        if (this.game.achievements) {
                            this.game.achievements.showToast({ 
                                title: "¡Despliegue Bloqueado!", 
                                desc: "Completa el capítulo anterior para continuar.", 
                                icon: "🔒" 
                            });
                        }
                    }
                }
            });
            if (isHover) this.game.canvas.style.cursor = 'pointer';
        });

        // 4. PAGINACIÓN Y CONTROLES
        const ctrlY = H - 85;
        this._drawText(`PÁGINA ${this.chapterPage + 1} / ${totalPages}`, W / 2, ctrlY - 20, "bold 14px Inter", "center", "rgba(255,255,255,0.4)");

        if (totalPages > 1) {
            // Botón Anterior
            if (this.chapterPage > 0) {
                this._drawMenuButton("ANTERIOR", W / 2 - 200, ctrlY, 180, 45, () => { 
                    this.chapterPage--;
                    this._csRestartAnim();
                });
            }
            // Botón Siguiente
            if (this.chapterPage < totalPages - 1) {
                this._drawMenuButton("SIGUIENTE", W / 2 + 20, ctrlY, 180, 45, () => { 
                    this.chapterPage++;
                    this._csRestartAnim();
                });
            }
        }

        this._drawStoryBackButton(40, H - 75, 160, 45, () => { 
            this.game.stateManager.back();
            this.chapterPage = 0;
            this._csRestartAnim();
        });
    }

    _csRestartAnim() {
        this._csAnim.t = 0;
        this._csAnim.phase = 'enter';
        if (this.game.synth) this.game.synth.playBtnClick();
    }

    _renderChapterSelectLegacy(type) {
        const centerX = CANVAS_WIDTH / 2;
        const H = CANVAS_HEIGHT;
        let registry, title, color;

        if (type === 'chapter_select_arcade') {
            registry = ARCADE_CHAPTER_REGISTRY;
            title = "DESAFÍO: ARCADE";
            color = this.colors.secondary;
        } else {
            registry = ABL_CHAPTER_REGISTRY;
            title = "MODO: ABL e IA";
            color = this.colors.accent;
        }

        this._drawText(title, centerX, 70, "bold 42px Outfit", "center", color, true);
        this._drawText("Selecciona una expedición para comenzar", centerX, 110, "18px Inter", "center", "#aaa");

        const chaptersFull = Object.values(registry);
        const PAGE_SIZE = 8;
        const totalPages = Math.ceil(chaptersFull.length / PAGE_SIZE);

        if (this.chapterPage >= totalPages) this.chapterPage = totalPages - 1;
        if (this.chapterPage < 0) this.chapterPage = 0;

        const chapters = chaptersFull.slice(this.chapterPage * PAGE_SIZE, (this.chapterPage + 1) * PAGE_SIZE);

        const tileW = 440;
        const tileH = 320;
        const gapX = 40;
        const gapY = 50;
        const cols = 4;
        const startX = centerX - ((tileW * cols) + (gapX * (cols - 1))) / 2;
        const startY = 160;

        chapters.forEach((ch, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (tileW + gapX);
            const y = startY + row * (tileH + gapY);

            const isLocked = !this.game.isChapterUnlocked(ch.id);
            
            this._drawChapterTile(ch, x, y, tileW, tileH, isLocked, () => {
                if (!isLocked) {
                    this.game.stateManager.navigate('loading_screen');
                    this.game.start(ch.id);
                } else {
                    this.game.achievements?.showToast({ 
                        title: "¡Bloqueado!", 
                        desc: "Completa niveles anteriores para jugar.", 
                        icon: "🔄" 
                    });
                }
            });
        });

        const ctrlY = H - 80;
        const btnPW = 160;
        const btnPH = 45;

        // Indicador de página (Reposicionado para evitar solapamiento con tarjetas)
        ctx.font = '14px Inter';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'center';
        ctx.fillText(`PÁGINA ${this.chapterPage + 1} / ${totalPages}`, centerX, ctrlY - 25);

        // Botón Anterior
        if (this.chapterPage > 0) {
            this._drawMenuButton("ANTERIOR", centerX - btnPW - 10, ctrlY, btnPW, btnPH, () => {
                this.chapterPage--;
                if (this.game.synth) this.game.synth.playBtnClick();
            });
        }

        // Botón Siguiente
        if (this.chapterPage < totalPages - 1) {
            const nextX = (this.chapterPage > 0) ? centerX + 10 : centerX - btnPW/2;
            this._drawMenuButton("SIGUIENTE", nextX, ctrlY, btnPW, btnPH, () => {
                this.chapterPage++;
                if (this.game.synth) this.game.synth.playBtnClick();
            });
        }

        // Botón Volver (Posicionado en la esquina inferior izquierda de forma segura)
        this._drawMenuButton("VOLVER", 40, H - 80, 140, 45, () => {
             this.game.stateManager.back();
             this.chapterPage = 0;
        });
    }

     _drawChapterCard(ch, x, y, w, h, isLocked, onClick) {
        const ctx = this.ctx;
        const isHover = this._isMouseOver(x, y, w, h);
        const isCompleted = this.game.chapterManager?.isChapterCompleted(ch.id);
        
        ctx.save();
        if (isHover && !isLocked) {
             ctx.translate(0, -5);
             ctx.shadowBlur = 20;
             ctx.shadowColor = ch.colors ? ch.colors[0] : '#f0f';
        }

        // Panel Base
        ctx.fillStyle = isLocked ? 'rgba(30, 30, 40, 0.8)' : 'rgba(20, 25, 45, 0.9)';
        ctx.strokeStyle = isHover && !isLocked ? '#fff' : 'rgba(255,255,255,0.1)';
        this._drawRoundedRect(x, y, w, h, 20, true, true);

        if (isLocked) {
             this._drawText("🔒", x + w/2, y + h/2 + 10, "48px Inter", "center", "rgba(255,255,255,0.2)");
             this._drawText("BLOQUEADO", x + w/2, y + h/2 + 50, "bold 12px Outfit", "center", "rgba(255,255,255,0.3)");
        } else {
             // Icono y Título
             ctx.font = "44px Inter";
             ctx.textAlign = "center";
             ctx.fillText(ch.icon || '📍', x + w/2, y + 60);
             
             this._drawText(ch.name.toUpperCase(), x + w/2, y + 100, "bold 16px Outfit", "center", "#fff");
             
             // Dificultad (Estrellas)
             const stars = "★".repeat(ch.difficulty || 1) + "☆".repeat(5 - (ch.difficulty || 1));
             this._drawText(stars, x + w/2, y + 125, "14px Inter", "center", "#FFD700");

             // Badge de Completado
             if (isCompleted) {
                 ctx.fillStyle = "#18EED8";
                 ctx.beginPath();
                 ctx.arc(x + w - 25, y + 25, 12, 0, Math.PI * 2);
                 ctx.fill();
                 this._drawText("✔", x + w - 25, y + 30, "bold 12px Inter", "center", "#000");
             }
             
             if (isHover) {
                 this._drawText("CLIC PARA ENTRAR", x + w/2, y + h - 25, "bold 10px Inter", "center", ch.colors ? ch.colors[0] : '#fff');
             }
        }

        if (isHover && !isLocked && this.game.mouse.justDown) {
            this.game.synth?.playBtnClick();
            onClick();
        }

        ctx.restore();
    }

    _drawChapterTile(ch, x, y, w, h, isLocked, onClick) {
        const ctx = this.ctx;
        const isHover = this._checkHover(x, y, w, h);
        
        // Efecto Glow
        if (isHover && !isLocked) {
            this._drawGlowRect(x, y, w, h, this.colors.primary, 15);
        }

        // Fondo
        ctx.fillStyle = isLocked ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = isLocked ? '#444' : (isHover ? this.colors.primary : 'rgba(255, 255, 255, 0.2)');
        ctx.lineWidth = 2;
        
        this._drawRoundedRect(x, y, w, h, 12, true, true);

        if (isLocked) {
             this._drawText("🔒", x + w/2, y + h/2 + 10, "32px Inter", "center", "#666");
        } else {
             this._drawText(ch.icon || '🗺️', x + w/2, y + 50, "32px Inter", "center", "#fff");
             this._drawText(ch.name.toUpperCase(), x + w/2, y + 80, "bold 14px Outfit", "center", "#fff");
             this._drawText(`Lv. ${ch.id}`, x + w/2, y + 100, "12px Inter", "center", this.colors.secondary);
        }

        // Registrar tile como botón interactivo
        this.activeButtons.push({ x, y, w, h, onClick });
        
        if (isHover) {
            this.game.canvas.style.cursor = 'pointer';
        }
    }
    
    _renderSkinSelector() {
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;
        const ctx = this.ctx;
        const activeId = this.game.activeSkinId;
        
        ctx.fillStyle = 'rgba(6, 8, 24, 0.98)';
        ctx.fillRect(0, 0, W, H);
        
        this._drawText("PERSONALIZAR PERSONAJE", W / 2, 70, "bold 46px Outfit", "center", "#18EED8", true);
        this._drawText("Selecciona una skin desbloqueada en tu aventura", W / 2, 110, "16px Inter", "center", "rgba(255,255,255,0.4)");

        // Lista de Skins desde el Registro
        const skinEntries = Object.entries(SKINS);
        const CARD_W = 280;
        const CARD_H = 340;
        const GAP = 30;
        const totalW = (skinEntries.length * CARD_W + (skinEntries.length - 1) * GAP);
        let startX = (W - totalW) / 2;
        const startY = 180;

        skinEntries.forEach(([id, skin], i) => {
            const x = startX + i * (CARD_W + GAP);
            const y = startY;
            const isSelected = activeId === id;
            const isHover = this._isMouseOver(x, y, CARD_W, CARD_H);
            
            // Lógica de desbloqueo (Simple para demo, extensible)
            const isUnlocked = (skin.reqLevel || 0) <= (this.game.ranks?.getRankInfo(this.game.totalXP).level || 1);
            
            ctx.save();
            ctx.fillStyle = isSelected ? 'rgba(24, 238, 216, 0.1)' : 'rgba(255, 255, 255, 0.03)';
            ctx.strokeStyle = isSelected ? '#18EED8' : (isHover ? '#fff' : 'rgba(255, 255, 255, 0.1)');
            ctx.lineWidth = isSelected ? 3 : 1;
            this._drawRoundedRect(x, y, CARD_W, CARD_H, 20, true, true);
            
            // Preview de la Skin
            ctx.font = "80px Inter";
            ctx.textAlign = "center";
            ctx.globalAlpha = isUnlocked ? 1 : 0.2;
            ctx.fillText(skin.icon || '🐸', x + CARD_W / 2, y + 100);
            
            if (!isUnlocked) {
                ctx.globalAlpha = 1;
                this._drawText("BLOQUEADO", x + CARD_W / 2, y + 100, "bold 14px Outfit", "center", "#FF2975");
                this._drawText(`Nivel ${skin.reqLevel}+ Requerido`, x + CARD_W / 2, y + 260, "12px Inter", "center", "rgba(255,255,255,0.3)");
            } else {
                ctx.globalAlpha = 1;
                this._drawText(skin.name, x + CARD_W / 2, y + 180, "bold 20px Outfit", "center", "#fff");
                this._drawText(skin.description, x + 20, y + 210, "13px Inter", "left", "rgba(255,255,255,0.5)", false, CARD_W - 40);
                
                if (isSelected) {
                    this._drawText("SELECCIONADO", x + CARD_W / 2, y + 300, "bold 14px Outfit", "center", "#18EED8");
                } else {
                    const btnY = y + CARD_H - 60;
                    this._drawPremiumButton("EQUIPAR", x + 60, btnY, CARD_W - 120, 40, () => {
                        this.game.setSkin(id);
                    }, 'silver');
                }
            }
            
            ctx.restore();
        });

        this._drawMenuButton("VOLVER", W / 2 - 150, H - 90, 300, 55, () => {
            this.game.stateManager.back();
        });
    }
    
    _renderHUD() {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const game = this.game;
        
        // ━━ 1. GLASS HEADER FULL WIDTH ━━
        ctx.save();
        const headerH = 85;
        const marginY = 10;
        const paddingX = 20;
        
        // Fondo de cristal que ocupa casi todo el ancho con márgenes elegantes
        ctx.fillStyle = 'rgba(10, 10, 25, 0.85)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        this._drawRoundedRect(paddingX, marginY, W - (paddingX * 2), headerH, 16, true, false);
        
        // Borde neón sutil
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        this._drawRoundedRect(paddingX, marginY, W - (paddingX * 2), headerH, 16, false, true);
        ctx.restore();

        // ━━ DISTRIBUCIÓN DINÁMICA DE ELEMENTOS (MAXIMIZADO PARA 1920) ━━
        const availableW = W - paddingX * 2.5; // Reducido margen lateral interno
        const startX = paddingX * 1.25;
        const boxY = marginY + 12;
        const boxH = 62; // Ligeramente más alto
        const gap = 14; // Un poco más de espacio entre bloques

        // Ajuste de pesos para mayor equilibrio
        const weights = {
            score: 14,       // +Score
            banana: 12,      
            bomb: 12,        
            level: 8,
            progress: 22,    // +Progreso
            extraLife: 12,
            lives: 10,
            multiplier: 10
        };

        const getWidth = (p) => (availableW * p / 100) - gap;
        let curX = startX;

        // Items
        const scoreW = getWidth(weights.score);
        this._drawHUDStatBox("PUNTUACIÓN", Math.floor(game.score).toLocaleString(), curX, boxY, scoreW, boxH);
        curX += scoreW + gap;

        const bComboW = getWidth(weights.banana);
        this._drawHUDComboLinear("BANANA COMBO", game.bananaCombo, 5, '🍌', curX, boxY, bComboW, boxH, '#FFE135');
        curX += bComboW + gap;

        const bombComboW = getWidth(weights.bomb);
        this._drawHUDComboLinear("BOMB COMBO", game.bombCombo, 5, '💣', curX, boxY, bombComboW, boxH, '#FF4500');
        curX += bombComboW + gap;

        const levelW = getWidth(weights.level);
        this._drawHUDStatBox("LEVEL", game.level, curX, boxY, levelW, boxH);
        curX += levelW + gap;
        
        const progW = getWidth(weights.progress);
        const currentGoal = game.getLevelTarget(game.level);
        const prevGoal = game.level === 1 ? 0 : game.getLevelTarget(game.level - 1);
        const progress = (game.score - prevGoal) / (currentGoal - prevGoal);
        this._drawHUDProgressGroup("PROGRESO", progress, curX, boxY, progW, boxH);
        curX += progW + gap;

        const exLifeW = getWidth(weights.extraLife);
        this._drawHUDExtraLifeGrid(game.extraLifeHearts || 0, curX, boxY, exLifeW, boxH);
        curX += exLifeW + gap;
        
        const livesW = getWidth(weights.lives);
        this._drawHUDStatBox("VIDAS", "", curX, boxY, livesW, boxH);
        this._drawHUDMainHearts(game.lives, curX + livesW / 2, boxY + 35);
        curX += livesW + gap;

        const multW = getWidth(weights.multiplier);
        this._drawHUDStatBox("MULTIPLICADOR", `x${game.mult}`, curX, boxY, multW, boxH, game.mult > 1 ? this.colors.secondary : '#fff');
        
        // ━━ 3. RANK BADGE (Progresión Fase 8) ━━
        const rankInfo = game.rankManager.getRankInfo(game.totalXP);
        this._drawRankBadge(W - paddingX - 120, marginY + 12, 100, 62, rankInfo);

        // Countdown
        if (game.state === 'COUNTDOWN' && game.countdown) {
            const val = game.countdown.val;
            const label = val > 0 ? val : "Â¡GO!";
            const scale = 1 + (game.countdown.timer / 60) * 0.4;
            const alpha = Math.min(1, game.countdown.timer / 40);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = this.colors.primary;
            ctx.shadowBlur = 30;
            this._drawText(label, W / 2, CANVAS_HEIGHT / 2 + 40, `bold ${Math.floor(140 * scale)}px Outfit`, "center", "#fff", true);
            ctx.restore();
        }
    }

    // ━━ HELPERS PARA EL HUD IDÉNTICO AL ORIGINAL ━━

    _drawHUDStatBox(label, value, x, y, w, h, valColor = '#fff') {
        const ctx = this.ctx;
        ctx.save();
        
        // --- Glassmorphism Effect ---
        // 1. Fondo semi-transparente con gradiente sutil
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
        ctx.fillStyle = grad;
        
        // 2. Borde blanco sutil (Stroke)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        
        this._drawRoundedRect(x, y, w, h, 14, true, true);
        
        // 3. Brillo superior (Glare)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, w - 4, h/2, [12, 12, 0, 0]);
        ctx.fill();

        // Label
        this._drawText(label, x + w/2, y + 18, "bold 10px Outfit", "center", this.colors.primary);
        
        // Value con sombra de texto para legibilidad premium
        if (value !== "") {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            this._drawText(value, x + w/2, y + 44, "bold 24px Outfit", "center", valColor);
        }
        ctx.restore();
    }

    _drawHUDComboLinear(label, current, max, icon, x, y, w, h, activeColor) {
        const ctx = this.ctx;
        const juice = label.includes("BANANA") ? this.hudJuice.banana : this.hudJuice.bomb;
        const scale = 1 + juice * 0.15;
        
        ctx.save();
        ctx.translate(x + w/2, y + h/2);
        ctx.scale(scale, scale);
        ctx.translate(-(x + w/2), -(y + h/2));

        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = activeColor + '44';
        this._drawRoundedRect(x, y, w, h, 12, true, true);
        
        this._drawText(label, x + w/2, y + 18, "bold 9px Outfit", "center", this.colors.primary);
        
        const slotW = 24;
        const totalW = max * slotW + (max - 1) * 4;
        const startX = x + (w - totalW) / 2;
        
        for (let i = 0; i < max; i++) {
            const active = i < current;
            ctx.save();
            ctx.font = "18px Inter";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.globalAlpha = active ? 1 : 0.15;
            
            // Si es el ítem recién ganado, hacemos que brille más
            const isLatest = active && (i === current - 1) && juice > 0.5;

            if (active) {
                ctx.shadowColor = activeColor;
                ctx.shadowBlur = isLatest ? 20 : 10;
            }
            
            const itemScale = isLatest ? 1.5 : 1;
            ctx.translate(startX + i * (slotW + 4) + slotW/2, y + 38);
            ctx.scale(itemScale, itemScale);
            ctx.fillText(icon, 0, 0);
            ctx.restore();
        }
        ctx.restore();
    }

    _drawHUDProgressGroup(label, progress, x, y, w, h) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this._drawRoundedRect(x, y, w, h, 12, true, true);
        
        const percent = Math.floor(progress * 100);
        this._drawText(`${label} ${percent}%`, x + w/2, y + 18, "bold 9px Outfit", "center", "rgba(255,255,255,0.6)");
        
        const barW = w - 40;
        const barH = 10;
        const barX = x + 20;
        const barY = y + 32;
        
        // Track
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        this._drawRoundedRect(barX, barY, barW, barH, 5, true, false);
        
        // Fill
        if (progress > 0) {
            const fillW = barW * Math.min(1, progress);
            const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
            grad.addColorStop(0, this.colors.primary);
            grad.addColorStop(1, this.colors.secondary);
            ctx.fillStyle = grad;
            ctx.shadowColor = this.colors.primary;
            ctx.shadowBlur = 10;
            this._drawRoundedRect(barX, barY, fillW, barH, 5, true, false);
        }
        ctx.restore();
    }

    _drawHUDExtraLifeGrid(count, x, y, w, h) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this._drawRoundedRect(x, y, w, h, 12, true, true);
        
        this._drawText("VIDA EXTRA", x + w/2, y + 18, "bold 9px Outfit", "center", this.colors.primary);
        
        const rows = 2;
        const cols = 5;
        const iconSize = 14;
        const gap = 4;
        const totalW = cols * iconSize + (cols - 1) * gap;
        const startX = x + (w - totalW) / 2;
        const startY = y + 28;
        
        for (let i = 0; i < 10; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const active = i < count;
            
            ctx.save();
            ctx.font = "12px Inter";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.globalAlpha = active ? 1 : 0.15;
            if (active) {
                ctx.shadowColor = "#ff2975";
                ctx.shadowBlur = 8;
            }
            ctx.fillText('❤️', startX + col * (iconSize + gap) + iconSize/2, startY + row * (iconSize + gap) + iconSize/2);
            ctx.restore();
        }
        ctx.restore();
    }

    _drawHUDMainHearts(lives, centerX, centerY) {
        const ctx = this.ctx;
        const maxLives = 3;
        const spacing = 30;
        const startX = centerX - ((maxLives - 1) * spacing) / 2;
        
        for (let i = 0; i < maxLives; i++) {
            const active = i < lives;
            ctx.save();
            ctx.font = "28px Inter";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.globalAlpha = active ? 1 : 0.15;
            if (active) {
                ctx.shadowColor = "#ff2975";
                ctx.shadowBlur = 15;
                // Efecto de pulso sutil
                const scale = 1 + Math.sin(Date.now() / 500) * 0.05;
                ctx.translate(startX + i * spacing, centerY);
                ctx.scale(scale, scale);
                ctx.fillText('❤️', 0, 0);
            } else {
                ctx.fillText('❤️', startX + i * spacing, centerY);
            }
            ctx.restore();
        }
    }

    _drawRankBadge(x, y, w, h, rankInfo) {
        const ctx = this.ctx;
        ctx.save();
        
        // Fondo del Badge (Glassmorphism circular)
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        const radius = Math.min(w, h) / 2;

        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
        ctx.fillStyle = grad;
        ctx.strokeStyle = this.colors.secondary + '66';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glow
        ctx.shadowColor = this.colors.secondary;
        ctx.shadowBlur = 15;
        
        // Inicial del Rango o Icono
        this._drawText(rankInfo.rank.charAt(0).toUpperCase(), centerX, centerY + 10, "bold 24px Outfit", "center", "#fff");
        
        // Etiqueta de Nivel pequeña
        ctx.shadowBlur = 0;
        this._drawText(`LVL ${rankInfo.level}`, centerX, centerY + 30, "bold 9px Inter", "center", this.colors.primary);
        
        ctx.restore();
    }

    /**
     * RENDERER: PANTALLA DE GAME OVER AVANZADA (AAA PREMIUM)
     * Basada en el diseño de 3 columnas: 25% Guía | 50% Hero Score | 25% Stats
     */
    _renderGameOver() {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;
        const score = Math.floor(this.game.score || 0);

        // ━━ 1. FONDO OSCURECIDO CON GLOW DE PELIGRO ━━
        ctx.fillStyle = 'rgba(6, 8, 24, 0.92)';
        ctx.fillRect(0, 0, W, H);
        
        // Glow rojo de peligro en los bordes
        const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.8);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, 'rgba(255, 41, 11, 0.15)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // ━━ 2. GRID DE 3 COLUMNAS ━━
        const colW1 = W * 0.25;
        const colW2 = W * 0.50;
        const colW3 = W * 0.25;

        // Columna Izquierda: Guía de Objetos (Reutilizada de Loading)
        this._drawLoadingGuide(ctx, 20, 40, colW1 - 40, H - 80);

        // Columna Central: Hero Score y Acciones
        this._drawGameOverHero(ctx, colW1, 0, colW2, H, score);

        // Columna Derecha: Estadísticas Finales
        this._drawGameOverStats(ctx, colW1 + colW2 + 20, 40, colW3 - 40, H - 80);
    }

    _drawGameOverHero(ctx, x, y, w, h, score) {
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        const game = this.game;

        // Player Card Base (Glassmorphism)
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this._drawRoundedRect(x + 50, y + 100, w - 100, h - 300, 30, true, true);
        ctx.restore();

        // Título Game Over
        ctx.save();
        ctx.font = 'bold 52px Outfit';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff290b';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('GAME OVER', centerX, y + 180);
        ctx.restore();

        // --- PLAYER CARD INFO (Fase 9) ---
        const rankInfo = game.rankManager.getRankInfo(game.totalXP);
        
        // Rango y Nivel
        this._drawText(rankInfo.rank.toUpperCase(), centerX, y + 240, "bold 28px Outfit", "center", this.colors.secondary);
        this._drawText(` NIVEL ${rankInfo.level} `, centerX, y + 270, "bold 14px Inter", "center", "#fff");

        // Barra de XP animada en Player Card
        const nextLevelXP = game.rankManager.getXPForLevel(rankInfo.level + 1);
        const currentLevelXP = game.rankManager.getXPForLevel(rankInfo.level);
        const xpInCurrentLevel = game.totalXP - currentLevelXP;
        const xpRatio = xpInCurrentLevel / (nextLevelXP - currentLevelXP);
        
        const barW = w - 240;
        const barX = centerX - barW / 2;
        const barY = y + 310;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this._drawRoundedRect(barX, barY, barW, 12, 6, true);
        
        const fillW = barW * Math.max(0, Math.min(1, xpRatio));
        const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
        grad.addColorStop(0, this.colors.primary);
        grad.addColorStop(1, this.colors.secondary);
        ctx.fillStyle = grad;
        ctx.shadowColor = this.colors.primary;
        ctx.shadowBlur = 15;
        this._drawRoundedRect(barX, barY, fillW, 12, 6, true);
        ctx.shadowBlur = 0;

        this._drawText(`${Math.floor(xpInCurrentLevel)} / ${nextLevelXP - currentLevelXP} XP`, centerX, barY + 30, "12px Inter", "center", "rgba(255,255,255,0.5)");

        // Caja de Puntuación Final
        ctx.font = 'bold 12px Outfit';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '3px';
        ctx.fillText('PUNTUACIÓN FINAL', centerX, y + 430);

        ctx.font = 'bold 72px Outfit';
        ctx.fillStyle = '#A6F616';
        ctx.shadowColor = 'rgba(166, 246, 22, 0.4)';
        ctx.shadowBlur = 20;
        ctx.fillText(score.toLocaleString(), centerX, y + 510);
        ctx.shadowBlur = 0;

        // Botones de Acción
        const btnW = 340;
        const btnH = 55;
        const btnX = centerX - btnW / 2;
        const startBtnsY = y + 580;

        this._drawMenuButton("REINTENTAR", btnX, startBtnsY, btnW, btnH, () => {
            game.softRetry();
        }, true);

        this._drawMenuButton("MENÚ PRINCIPAL", btnX, startBtnsY + 70, btnW, btnH, () => {
            location.reload();
        });
    }

    _drawGameOverStats(ctx, x, y, w, h) {
        this._drawGlassPanel(ctx, x, y, w, h, 'ESTADÍSTICAS', '📊');

        const stats = [
            { label: 'ITEMS CAPTURADOS', val: this.game.score || 0, icon: '🎯', color: '#18EED8' },
            { label: 'NIVEL ALCANZADO', val: this.game.level || 1, icon: '⭐', color: '#FFD700' },
            { label: 'MEJOR RÉCORD', val: localStorage.getItem('mx_high_score') || 0, icon: '🏆', color: '#A6F616' },
            { label: 'BONUS TIEMPO', val: '+500', icon: '⌛', color: '#9c5fff' }
        ];

        let currentY = y + 80;
        stats.forEach(stat => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            this._drawRoundedRect(x + 15, currentY - 20, w - 30, 45, 10);
            
            ctx.font = '18px Inter';
            ctx.fillText(stat.icon, x + 30, currentY + 8);
            
            ctx.font = 'bold 9px Outfit';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(stat.label, x + 65, currentY - 2);
            
            ctx.font = 'bold 18px Outfit';
            ctx.fillStyle = stat.color;
            ctx.fillText(stat.val.toLocaleString(), x + 65, currentY + 18);
            
            currentY += 65;
        });
    }

    _renderShopScreen() {
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;
        const ctx = this.ctx;
        const shop = this.game.shopManager;
        
        ctx.fillStyle = 'rgba(6, 8, 24, 0.95)';
        ctx.fillRect(0, 0, W, H);
        
        // Header
        this._drawText("TIENDA PREMIUM XANEZU", W / 2, 70, "bold 46px Outfit", "center", "#FF2EF7", true);
        this._drawText(`FROG COINS: 🐸 ${this.game.totalCoins}`, W / 2, 110, "bold 22px Outfit", "center", "#FFD700");

        // Categorías de la Tienda (Consumibles por ahora)
        const items = Object.entries(shop.catalog.consumables);
        const CARD_W = 320;
        const CARD_H = 380;
        const GAP = 40;
        const startX = (W - (items.length * CARD_W + (items.length - 1) * GAP)) / 2;
        const startY = 180;

        items.forEach(([id, item], i) => {
            const x = startX + i * (CARD_W + GAP);
            const y = startY;
            const isHover = this._isMouseOver(x, y, CARD_W, CARD_H);
            
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.strokeStyle = isHover ? '#FF2EF7' : 'rgba(255, 255, 255, 0.1)';
            this._drawRoundedRect(x, y, CARD_W, CARD_H, 20, true, true);
            
            // Icono
            ctx.font = "80px Inter";
            ctx.textAlign = "center";
            ctx.fillText(item.icon, x + CARD_W / 2, y + 100);
            
            // Info
            this._drawText(item.name.toUpperCase(), x + CARD_W / 2, y + 180, "bold 22px Outfit", "center", "#fff");
            this._drawText(item.desc, x + CARD_W / 2, y + 215, "14px Inter", "center", "rgba(255,255,255,0.5)");
            
            const owned = this.game.unlocks[id] || 0;
            this._drawText(`POSEES: ${owned}`, x + CARD_W / 2, y + 250, "bold 12px Inter", "center", "#18EED8");

            // Botón de Compra
            const btnH = 50;
            const btnY = y + CARD_H - 70;
            const canAfford = this.game.totalCoins >= item.price;
            this._drawPremiumButton(`COMPRAR [🐸${item.price}]`, x + 30, btnY, CARD_W - 60, btnH, () => {
                if (shop.buyConsumable(id)) {
                    this.game.achievements?.showToast({ title: "COMPRA ÉXITOSA", desc: `Has adquirido: ${item.name}`, icon: item.icon });
                } else {
                    this.game.achievements?.showToast({ title: "SALDO INSUFICIENTE", desc: "Necesitas más Frog Coins.", icon: "❌" });
                }
            }, canAfford ? 'gold' : 'silver');
            
            ctx.restore();
        });

        this._drawMenuButton("VOLVER", W / 2 - 150, H - 90, 300, 55, () => {
            this.game.stateManager.back();
        });
    }

    _renderTrophiesScreen() {
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;
        const ctx = this.ctx;
        const achs = this.game.achievements?.achievements || [];
        const unlocked = this.game.achievements?.unlocked || [];

        ctx.fillStyle = 'rgba(6, 8, 24, 0.95)';
        ctx.fillRect(0, 0, W, H);
        
        this._drawText("GALERÍA DE TROFEOS", W / 2, 70, "bold 46px Outfit", "center", "#FFD700", true);
        this._drawText(`${unlocked.length} / ${achs.length} DESBLOQUEADOS`, W / 2, 110, "bold 16px Inter", "center", "rgba(255,255,255,0.4)");

        const COLS = 4;
        const CARD_W = 380;
        const CARD_H = 140;
        const GAP_X = 30;
        const GAP_Y = 25;
        const startX = (W - (COLS * CARD_W + (COLS - 1) * GAP_X)) / 2;
        const startY = 160;

        achs.forEach((ach, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = startX + col * (CARD_W + GAP_X);
            const y = startY + row * (CARD_H + GAP_Y);
            const isUnlocked = unlocked.includes(ach.id);

            ctx.save();
            ctx.fillStyle = isUnlocked ? 'rgba(255, 215, 0, 0.05)' : 'rgba(255, 255, 255, 0.02)';
            ctx.strokeStyle = isUnlocked ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
            this._drawRoundedRect(x, y, CARD_W, CARD_H, 15, true, true);

            ctx.font = "40px Inter";
            ctx.globalAlpha = isUnlocked ? 1 : 0.2;
            ctx.fillText(isUnlocked ? ach.icon : '🔒', x + 50, y + CARD_H / 2 + 10);
            
            ctx.globalAlpha = isUnlocked ? 1 : 0.5;
            this._drawText(ach.title.toUpperCase(), x + 100, y + 55, "bold 16px Outfit", "left", "#fff");
            this._drawText(ach.desc, x + 100, y + 85, "12px Inter", "left", isUnlocked ? "#18EED8" : "rgba(255,255,255,0.3)");
            
            ctx.restore();
        });

        this._drawMenuButton("VOLVER", W / 2 - 150, H - 90, 300, 55, () => {
            this.game.stateManager.back();
        });
    }

    _renderLoadGameFlow() {
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(6, 8, 24, 0.98)';
        ctx.fillRect(0, 0, W, H);

        this._drawText("RESUMEN DE PROGRESO", W / 2, 100, "bold 46px Outfit", "center", "#18EED8", true);
        
        // Panel Central de Estadísticas
        const panelW = 800;
        const panelH = 400;
        const px = (W - panelW) / 2;
        const py = 200;
        
        this._drawGlassPanel(ctx, px, py, panelW, panelH, 'ESTADO DEL ARCHIVO', '💾');
        
        const rankInfo = this.game.rankManager?.getRankInfo(this.game.totalXP) || { rank: 'Novice', level: 1 };
        const stats = [
            { k: 'RANGO', v: rankInfo.rank.toUpperCase(), c: this.colors.secondary },
            { k: 'NIVEL', v: rankInfo.level, c: '#fff' },
            { k: 'MONEDAS', v: `🐸 ${this.game.totalCoins}`, c: '#FFD700' },
            { k: 'CAP. MÁX', v: this.game.maxChapter || 1, c: '#FF2EF7' }
        ];

        stats.forEach((s, i) => {
            const sy = py + 100 + i * 70;
            this._drawText(s.k, px + 100, sy, "bold 14px Outfit", "left", "rgba(255,255,255,0.4)");
            this._drawText(s.v, px + panelW - 100, sy, "bold 28px Outfit", "right", s.c);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.moveTo(px + 100, sy + 15);
            ctx.lineTo(px + panelW - 100, sy + 15);
            ctx.stroke();
        });

        this._drawPremiumButton("CONTINUAR AVENTURA", (W - 400) / 2, py + panelH + 50, 400, 70, () => {
            this.game.stateManager.navigate('mode_select');
        }, 'gold');
        
        this._drawMenuButton("VOLVER", W / 2 - 150, H - 80, 300, 50, () => {
            this.game.stateManager.back();
        });
    }

    _renderVictoryScreen() {
        this._drawOverlayBG();
        const centerX = CANVAS_WIDTH / 2;
        this._drawText("VICTOIRE!", centerX, 180, "bold 92px Outfit", "center", this.colors.accent, true);
        this._drawText(`SCORE FINAL: ${Math.floor(this.game.score)}`, centerX, 240, "32px Outfit", "center", "#fff");

        this._drawMenuButton("VOLVER AL MENÚ", centerX - 150, 350, 300, 60, () => {
            location.reload();
        });
    }

    /**
     * Dibuja un botón de retroceso estilizado para las pantallas de capítulos de Historia.
     */
    _drawStoryBackButton(x, y, w, h, onClick) {
        const ctx = this.ctx;
        const isHover = this.hoveredButton && this.hoveredButton.x === x && this.hoveredButton.y === y;
        this.activeButtons.push({ x, y, w, h, onClick });

        ctx.save();
        
        // Efecto glow de fondo en hover
        if (isHover) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
            ctx.shadowBlur = 20;
        }

        // Cuerpo del botón (Glassmorphism sutil)
        ctx.fillStyle = isHover ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = isHover ? '#fff' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        this._drawRoundedRect(x, y, w, h, h / 2, true, true);

        // Icono y Texto
        ctx.font = "bold 13px Outfit";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isHover ? "#fff" : "rgba(255, 255, 255, 0.8)";
        ctx.fillText("← VOLVER", x + w / 2, y + h / 2 + 6);

        ctx.restore();
    }

    // ━━ PRIMITIVAS GRÁFICAS Y COMPONENTES ━━

    _drawMenuButton(text, x, y, w, h, onClick, secondary = false) {
        const ctx = this.ctx;
        const isHover = this.hoveredButton && this.hoveredButton.x === x && this.hoveredButton.y === y && this.hoveredButton.w === w;
        
        // Registrar para interacción en el siguiente frame/evento
        this.activeButtons.push({ x, y, w, h, onClick });

        ctx.save();
        
        // Sombra
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = isHover ? 20 : 10;
        ctx.shadowOffsetY = 5;

        // Fondo del botón
        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        if (isHover) {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        }
        
        this._drawRoundedRect(x, y, w, h, 12, gradient, isHover ? this.colors.primary : 'rgba(255,255,255,0.3)');
        
        // Texto
        this._drawText(text, x + w / 2, y + h / 2 + 8, `bold ${h * 0.4}px Outfit`, "center", isHover ? this.colors.primary : "#fff");
        
        ctx.restore();
    }

    _drawModeCard(title, desc, icon, x, y, w, h, onClick, color, compact = false) {
        if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h)) {
            console.error("Invalid coordinates in _drawModeCard:", {title, x, y, w, h});
            return;
        }

        const ctx = this.ctx;
        const isHover = this.hoveredButton && this.activeButtons.some(b => b.x === x && b.y === y);
        this.activeButtons.push({ x, y, w, h, onClick });

        ctx.save();
        
        // Efecto Elevación (Shadow)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = isHover ? 40 : 20;
        ctx.shadowOffsetY = isHover ? 15 : 10;

        // Gradiente de Fondo (Vidrio Oscuro Premium)
        const bgGradient = ctx.createLinearGradient(x, y, x, y + h);
        bgGradient.addColorStop(0, 'rgba(30, 30, 35, 0.95)');
        bgGradient.addColorStop(1, 'rgba(15, 15, 20, 0.98)');
        
        // Gradiente de Borde Dinámico
        const borderGradient = ctx.createLinearGradient(x, y, x + w, y + h);
        if (isHover) {
            borderGradient.addColorStop(0, color || '#fff');
            borderGradient.addColorStop(0.5, '#fff');
            borderGradient.addColorStop(1, color || '#fff');
        } else {
            borderGradient.addColorStop(0, 'rgba(255,255,255,0.1)');
            borderGradient.addColorStop(1, 'rgba(255,255,255,0.05)');
        }
        
        // Dibujar tarjeta
        this._drawRoundedRect(x, y, w, h, 24, bgGradient, borderGradient);
        
        // Overlay de Brillo sutil (Glassmorphism)
        if (isHover) {
            const glow = ctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, w);
            glow.addColorStop(0, `${color}22` || 'rgba(255,255,255,0.1)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fill();
        }

        // --- Contenido ---
        const padding = compact ? 20 : 40;
        
        // 1. Icono (Emoji Grande)
        ctx.shadowBlur = 0; // Desactivar sombra para texto
        ctx.shadowOffsetY = 0;
        ctx.font = compact ? "60px Inter" : "100px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icon, x + w / 2, y + (compact ? h * 0.35 : h * 0.3));

        // 2. Título
        this._drawText(title, x + w / 2, y + (compact ? h * 0.65 : h * 0.6), "bold " + (compact ? "24px" : "32px") + " Outfit", "center", "#fff");
        
        // 3. Descripción (Ocultar si es muy pequeño/específico, o ajustar)
        if (!compact) {
            ctx.font = "16px Inter";
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            this._wrapText(desc, x + w / 2, y + h * 0.72, w - 80, 22);
        }

        // 4. Botón SELECT (Aparece o resalta en hover)
        const btnY = y + h - (compact ? 70 : 100);
        const btnH = compact ? 40 : 50;
        this._drawPremiumButton("ACCEDER", x + padding, btnY, w - (padding * 2), btnH, onClick, isHover ? color : 'silver');
        
        ctx.restore();
    }

    _drawRoundedRect(x, y, w, h, r, fill, stroke) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        
        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        if (stroke) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = stroke;
            ctx.stroke();
        }
    }

    _drawGlowRect(x, y, w, h, color, blur = 10) {
        const ctx = this.ctx;
        ctx.save();
        if (blur > 0) {
            ctx.shadowColor = color;
            ctx.shadowBlur = blur;
        }
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
    }

    _drawText(text, x, y, font, align, color, glow = false, maxW = 9999) {
        const ctx = this.ctx;
        const isGlow = (typeof glow !== 'undefined') ? glow : false;
        
        ctx.save();
        ctx.font = font;
        ctx.textAlign = align;
        ctx.fillStyle = color;
        
        if (isGlow) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
        }
        
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    _drawProgressBar(label, progress, x, y, w, h, color, showLabel = true) {
        const ctx = this.ctx;
        if (showLabel) {
            this._drawText(label, x - 10, y + h / 2 + 5, "bold 12px Inter", "right", color);
        }
        
        // Fondo
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this._drawRoundedRect(x, y, w, h, h / 2);
        
        // Relleno
        const fillW = Math.max(h, w * progress);
        if (progress > 0) {
            ctx.fillStyle = color;
            this._drawRoundedRect(x, y, fillW, h, h / 2);
            this._drawGlowRect(x, y, fillW, h, color, 5);
        }
    }

    _drawBadge(text, x, y, w, h, color) {
        this._drawRoundedRect(x, y, w, h, h / 2, color);
        this._drawText(text, x + w / 2, y + h / 2 + 6, "bold 18px Outfit", "center", "#fff");
    }

    _drawIcon(x, y, icon, opacity = 1) {
        this.ctx.globalAlpha = opacity;
        this._drawText(icon, x, y + 20, "24px Inter", "center", "#fff");
        this.ctx.globalAlpha = 1;
    }

    _drawOverlayBG() {
        this.ctx.fillStyle = 'rgba(10, 14, 20, 0.85)';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    _drawPremiumButton(text, x, y, w, h, onClick, style = 'gold') {
        const ctx = this.ctx;
        const isHover = this.hoveredButton && this.hoveredButton.x === x && this.hoveredButton.y === y && this.hoveredButton.w === w;
        
        // Registrar para interacción
        this.activeButtons.push({ x, y, w, h, onClick });

        ctx.save();
        
        // Definir colores según el estilo
        let mainColor, accentColor, textColor;
        if (style === 'gold') {
            mainColor = '#FFD700';
            accentColor = '#FFED4E';
            textColor = '#1a1a1a';
        } else {
            mainColor = '#C0C0C0';
            accentColor = '#E8E8E8';
            textColor = '#1a1a1a';
        }
        
        // Gradiente de fondo
        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, mainColor);
        gradient.addColorStop(0.5, accentColor);
        gradient.addColorStop(1, mainColor);
        
        // Sombra
        ctx.shadowColor = `rgba(255, 215, 0, ${isHover ? 0.8 : 0.5})`;
        ctx.shadowBlur = isHover ? 30 : 15;
        ctx.shadowOffsetY = isHover ? 6 : 4;
        
        // Dibujar botón
        this._drawRoundedRect(x, y, w, h, 12, gradient, accentColor);
        
        // Efecto de brillo en hover
        if (isHover) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 40;
            ctx.strokeStyle = '#FFFF99';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Texto
        this._drawText(text, x + w / 2, y + h / 2 + 6, isHover ? "bold 16px Outfit" : "bold 14px Outfit", "center", textColor);
        
        ctx.restore();
    }

    /**
     * Sistema de Notificaciones 100% Canvas (Toasts).
     * Gestiona la animación y el renderizado de logros desbloqueados.
     */
    _renderToasts() {
        const ctx = this.ctx;
        const ts = this.toastState;
        const achManager = this.game.achievements;

        // 1. Sincronizar con AchievementManager (Lógica de encolado)
        if (ts.phase === 'hidden' && achManager?.currentAchievement) {
            ts.ach = achManager.currentAchievement;
            ts.phase = 'entering';
            ts.timer = 0;
            ts.y = -120;
            ts.alpha = 0;
        }

        if (ts.phase === 'hidden') return;

        // 2. Lógica de Animación / Transición
        const dt = 1; // Basado en frames (~60fps)
        const speed = 0.08;

        switch (ts.phase) {
            case 'entering':
                ts.alpha = Math.min(1, ts.alpha + speed);
                ts.y = this._lerp(ts.y, 30, speed * 1.5);
                if (ts.alpha >= 1 && Math.abs(ts.y - 30) < 1) {
                    ts.phase = 'showing';
                    ts.timer = 0;
                }
                break;
            case 'showing':
                ts.timer += dt;
                if (ts.timer > 300) { // ~5 segundos
                    ts.phase = 'exiting';
                }
                break;
            case 'exiting':
                ts.alpha = Math.max(0, ts.alpha - speed);
                ts.y = this._lerp(ts.y, -120, speed * 1.5);
                if (ts.alpha <= 0) {
                    ts.phase = 'hidden';
                    ts.ach = null;
                    if (achManager) achManager.currentAchievement = null;
                }
                break;
        }

        if (!ts.ach) return;
        const W = 500, H = 70, X = (CANVAS_WIDTH - W) / 2, Y = ts.y;
        ctx.save();
        ctx.globalAlpha = ts.alpha;
        this._drawRoundedRect(X, Y, W, H, 15, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.3)");
        ctx.font = "32px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🏆", X + 45, Y + H/2 + 3);
        this._drawText("LOGRO DESBLOQUEADO!", X + 85, Y + 25, "bold 10px Outfit", "left", this.colors.primary);
        this._drawText(ts.ach.title.toUpperCase(), X + 85, Y + 48, "bold 20px Outfit", "left", "#fff");
        ctx.restore();
    }

    _wrapText(text, x, y, maxWidth, lineHeight) {
        if (!text) return;
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (this.ctx.measureText(testLine).width > maxWidth) {
                this.ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, x, y);
    }

    _lerp(a, b, t) { return a + (b - a) * t; }


    _renderOrientationWarning() {
        if (window.innerHeight > window.innerWidth) {
            const ctx = this.ctx;
            const W = CANVAS_WIDTH;
            const H = CANVAS_HEIGHT;
            ctx.save();
            ctx.fillStyle = "rgba(6, 8, 18, 0.98)";
            ctx.fillRect(0, 0, W, H);
            const t = performance.now() / 1000;
            const rot = Math.sin(t * 3) * 0.45;
            ctx.translate(W / 2, H / 2 - 80);
            ctx.rotate(rot);
            ctx.font = "120px Inter";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#fff";
            ctx.fillText("📱", 0, 0);
            ctx.restore();
            this._drawText("GIRA TU DISPOSITIVO", W / 2, H / 2 + 50, "bold 60px Outfit", "center", this.colors.primary, true);
            this._drawText("XANEZU CATCH requiere orientación horizontal", W / 2, H / 2 + 110, "24px Inter", "center", "rgba(255,255,255,0.6)");
            ctx.restore();
        }
    }

    updateHUD(pts) {}
    showOverlay(k) {}
    hideAllOverlays() {}
    updateAudioStatus() {}
    showNearMiss() {}
    showDamageVignette() {}
    toggleCinematicMode(active) {}
    formatCurrency(val) { return "🐸 " + val; }
    _csEaseOut(t) { return 1 - Math.pow(1 - t, 3); }

    _csIsChapterCompleted(id) { 
        return this.game.chapterManager?.isChapterCompleted(id) || false; 
    }

    _csIsHovered(x, y, w, h) {
        return this._isMouseOver(x, y, w, h);
    }

    _drawStoryBackground(ctx, w, h, isSpecial = false) {
        const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
        grad.addColorStop(0, isSpecial ? '#1a0d24' : '#0a1420');
        grad.addColorStop(1, '#060812');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        
        ctx.strokeStyle = isSpecial ? 'rgba(255,0,255,0.03)' : 'rgba(0,242,255,0.03)';
        ctx.lineWidth = 1;
        const spacing = 60;
        for(let x=0; x<w; x+=spacing) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for(let y=0; y<h; y+=spacing) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
    }

    _drawStoryChapterCard(ctx, ch, x, y, w, h, isLocked, isCompleted, isHover) {
        ctx.save();
        
        const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
        bgGrad.addColorStop(0, isHover ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)');
        bgGrad.addColorStop(1, 'rgba(255,255,255,0.01)');
        
        ctx.shadowColor = isHover ? this.colors.primary : 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = isHover ? 25 : 15;
        
        this._drawRoundedRect(x, y, w, h, 20, bgGrad, isHover ? '#fff' : 'rgba(255,255,255,0.1)');
        ctx.shadowBlur = 0;

        ctx.font = "80px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = isLocked ? 0.3 : 1;
        ctx.fillText(ch.icon || '📍', x + w/2, y + h*0.35);

        ctx.font = "bold 24px Outfit";
        ctx.fillStyle = isHover ? this.colors.primary : "#fff";
        ctx.fillText(ch.name.toUpperCase(), x + w/2, y + h*0.65);
        
        ctx.font = "14px Inter";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(`DIFICULTAD: ${'★'.repeat(ch.difficulty || 1)}`, x + w/2, y + h*0.75);

        if (isCompleted) {
            this._drawBadge("COMPLETADO", x + w - 110, y + 20, 90, 24, this.colors.accent);
        }

        ctx.restore();
    }

    _drawDebugStateID(ctx, state) {
        if (!ctx) return;
        ctx.save();
        ctx.font = 'bold 12px monospace';
        const text = `ID: ${state.toUpperCase()}`;
        const paddingH = 12;
        const paddingV = 6;
        const metrics = ctx.measureText(text);
        const w = metrics.width + paddingH * 2;
        const h = 24;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(CANVAS_WIDTH - w - 20, 20, w, h);
        ctx.fillStyle = '#A6F616';
        ctx.textAlign = 'center';
        ctx.fillText(text, CANVAS_WIDTH - w/2 - 20, 36);
        ctx.restore();
    }
}
