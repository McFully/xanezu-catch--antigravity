import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { CHAPTER_REGISTRY } from './ChapterRegistry.js';
import { ARCADE_CHAPTER_REGISTRY } from './ArcadeChapterRegistry.js';
import { ABL_CHAPTER_REGISTRY } from './ABLChapterRegistry.js';

/**
 * UIManager: Motor de Renderizado de Interface 100% basado en Canvas.
 * Elimina toda dependencia del DOM y utiliza primitivas grÃƒÂ¡ficas para menÃƒÂºs y HUD.
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

        // Ã¢â€â‚¬Ã¢â€â‚¬ ESTADO DE ANIMACIÃƒâ€œN PARA CHAPTER SELECT STORY Ã¢â€â‚¬Ã¢â€â‚¬
        this._csAnim = {
            phase: 'idle',   // 'enter' | 'idle'
            t: 0,            // 0..1 progreso de la animaciÃƒÂ³n de entrada
            speed: 0.045,    // velocidad de avance por frame (~22 frames para completar)
        };
        this._csPrevState = null;
        this.chapterPage = 0; // Control de paginaciÃƒÂ³n

        // --- ESTADO DEL WORLD MAP (Fase 11) ---
        this.mapView = {
            offsetX: 0,
            offsetY: 0,
            targetOffsetX: 0,
            targetOffsetY: 0,
            zoom: 1,
            isDragging: false,
            hoverChapter: null
        };

        // --- JUICE STATE (Fase 7) ---
        this.hudJuice = {
            banana: 0,
            bomb: 0,
            score: 0
        };

        // --- SISTEMA DE NOTIFICACIONES SUPERIOR (TOASTS) ---
        this.toastState = {
            ach: null,
            timer: 0,
            y: -120,    // Iniciamos fuera de pantalla (superior)
            alpha: 0,
            phase: 'hidden' // 'hidden' | 'entering' | 'showing' | 'exiting'
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
            if (e.button === 0) {
                this.game.mouse.down = true;
                this._checkClick();
            }
        });

        this.game.canvas.addEventListener('mouseup', () => {
            this.game.mouse.down = false;
        });

        // Soporte tÃƒÂ¡ctil bÃƒÂ¡sico
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

    render(ctx) {
        if (!ctx) return;
        this.ctx = ctx;
        const state = this.game.stateManager.state;

        // Detectar entrada a chapter_select_story para disparar animaciÃƒÂ³n de entrada
        if (state === 'chapter_select_story' && this._csPrevState !== 'chapter_select_story') {
            this._csAnim.phase = 'enter';
            this._csAnim.t = 0;
        }
        this._csPrevState = state;

        // Avanzar animaciÃƒÂ³n de entrada
        if (this._csAnim.phase === 'enter') {
            this._csAnim.t = Math.min(1, this._csAnim.t + this._csAnim.speed);
            if (this._csAnim.t >= 1) this._csAnim.phase = 'idle';
        }
        
        // Reset de estado interactivo del frame
        this.activeButtons = [];
        this.game.canvas.style.cursor = 'default';

        // Despacho de renderizado segÃƒÂºn el estado
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
            case 'TROPHIES':
                this._renderPlaceholderScreen(state);
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

        // Dibujar ID de pantalla en la esquina superior derecha para referencia (Debug)
        this._drawDebugStateID(ctx, state);

        // Ã¢â€¢ Ã¢â€¢ Ã¢â€¢ Ã¢â€¢  CAPA FINAL: NOTIFICACIONES SUPERIORES Ã¢â€¢ Ã¢â€¢ Ã¢â€¢ Ã¢â€¢ 
        this._renderToasts();
    }

    /**
     * Dibuja el identificador de la pantalla actual en una esquina.
     * ÃƒÅ¡til para referencia rÃƒÂ¡pida durante el desarrollo.
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
        
        // PosiciÃƒÂ³n: Esquina superior derecha con margen
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
        
        // Borde neÃƒÂ³n
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
     * Basada en el diseÃƒÂ±o de 3 columnas: 25% GuÃƒÂ­a | 50% Hub Central | 25% Stats
     */
    _renderLoadingScreen() {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;
        const progress = this.game.loadingProgress || 0;

        // Ã¢â€â‚¬Ã¢â€â‚¬ 1. FONDO ANIMADO (BACKDROP) Ã¢â€â‚¬Ã¢â€â‚¬
        this._drawLoadingBackdrop(ctx, W, H);

        // Ã¢â€â‚¬Ã¢â€â‚¬ 2. GRID DE 3 COLUMNAS (25% | 50% | 25%) Ã¢â€â‚¬Ã¢â€â‚¬
        const colW1 = W * 0.25;
        const colW2 = W * 0.50;
        const colW3 = W * 0.25;

        // Columna Izquierda: GuÃƒÂ­a de Objetos
        this._drawLoadingGuide(ctx, 20, 40, colW1 - 40, H - 80);

        // Columna Central: Hub Principal (Logo + Barra)
        this._drawLoadingHub(ctx, colW1, 0, colW2, H, progress);

        // Columna Derecha: EstadÃƒÂ­sticas de SesiÃƒÂ³n
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

        // PartÃƒÂ­culas flotantes (simulando lo-starfield)
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
        this._drawGlassPanel(ctx, x, y, w, h, 'GUÃƒÂA DE JUEGO', 'Ã°Å¸â€œâ€“');

        const items = [
            { icon: 'Ã°Å¸â€™Â°', name: 'Moneda', val: '200', color: '#FFD700' },
            { icon: 'Ã°Å¸â€Â´', name: 'RubÃƒÂ­', val: '500', color: '#FF2975' },
            { icon: 'Ã°Å¸ÂÂ¸', name: 'Esmeralda', val: '800', color: '#A6F616' },
            { icon: 'Ã°Å¸â€˜â€˜', name: 'Corona', val: '1000', color: '#FFD700' },
            { icon: 'Ã°Å¸ÂÅ’', name: 'Banana', val: 'Combo+', color: '#FFD700' },
            { icon: 'Ã¢ÂÂ¤Ã¯Â¸Â', name: 'Vida', val: '+1 Ã¢ÂÂ¤Ã¯Â¸Â', color: '#FF2975' },
            { icon: 'Ã°Å¸Â§Â²', name: 'ImÃƒÂ¡n', val: 'Atrae', color: '#9c5fff' },
            { icon: 'Ã°Å¸â€ºÂ¡Ã¯Â¸Â', name: 'Escudo', val: 'Protege', color: '#3d7aed' }
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
        ctx.fillText('Ã°Å¸ÂÂ¸', centerX, centerY - 80);
        
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
        this._drawGlassPanel(ctx, x, y, w, h, 'MI SESIÃƒâ€œN', 'Ã°Å¸Å½Â¯');

        const stats = [
            { label: 'FROG COINS', val: this.game.totalItemsCaught || 0, icon: 'Ã°Å¸ÂÂ¸', color: '#A6F616' },
            { label: 'TOTAL ITEMS', val: this.game.scoreGlobal || 0, icon: 'Ã°Å¸Å½Â¯', color: '#18EED8' },
            { label: 'MUERTES', val: this.game.totalDeaths || 0, icon: 'Ã°Å¸â€™â‚¬', color: '#FF2975' },
            { label: 'DASHES', val: this.game.totalDashes || 0, icon: 'Ã¢Å¡Â¡', color: '#9c5fff' }
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
        const audioIcon = this.game.isMusicOn ? "ðŸ”Š SONIDO: ON" : "ðŸ”‡ SONIDO: OFF";
        this._drawPremiumButton(audioIcon, centerX, centerY + 150, (btnW / 2) - 10, 50, () => {
             this.game.toggleMusic();
        }, 'silver');
        
        // 4. SETTINGS
        this._drawPremiumButton("SETTINGS", centerX + (btnW / 2) + 10, centerY + 150, (btnW / 2) - 10, 50, () => {
             this.game.stateManager.navigate('settings_menu');
        }, 'silver');
    }

    _renderSettingsMenu() {
        const centerX = CANVAS_WIDTH / 2;
        this._drawText("SETTINGS", centerX, 100, "bold 42px Outfit", "center", this.colors.primary);

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
        this._drawText("SELECCIÓN DE MODO", centerX, 100, "bold 60px Outfit", "center", "#fff");
        this._drawText("Escoge una disciplina para desplegar el motor", centerX, 145, "18px Inter", "center", "rgba(255,255,255,0.4)");

        const gap = 45;
        const btnW = 440;
        const btnH = 480;
        const totalW = (btnW * 3) + (gap * 2);
        let startX = centerX - totalW / 2;
        const startY = 220;

        // 1. MODO HISTORIA (Cian Glow)
        this._drawModeCard(
            "MODO HISTORIA", 
            "Progresión narrativa a través de biomas dinámicos.", 
            "🗺️", 
            startX, startY, btnW, btnH, 
            () => {
                this.game.stateManager.setMode('STORY');
                this.game.stateManager.navigate('chapter_select_story');
            }, 
            '#00f2ff'
        );

        // 2. MODO ARCADE (Magenta Glow)
        startX += btnW + gap;
        this._drawModeCard(
            "MODO ARCADE", 
            "Desafíos infinitos con dificultad creciente por oleadas.", 
            "🎯", 
            startX, startY, btnW, btnH, 
            () => {
                this.game.stateManager.setMode('ARCADE');
                this.game.stateManager.navigate('chapter_select_arcade');
            }, 
            '#ff00ff'
        );

        // 3. MODO ABLIA (Verde Glow)
        startX += btnW + gap;
        this._drawModeCard(
            "MODO ABL / IA", 
            "Adaptación en tiempo real basada en tu nivel de habilidad.", 
            "🧠", 
            startX, startY, btnW, btnH, 
            () => {
                this.game.stateManager.setMode('ABL');
                this.game.stateManager.navigate('chapter_select_ablia');
            }, 
            '#00ff00'
        );

        // Botón VOLVER centrado abajo
        this._drawMenuButton("VOLVER", centerX - 100, CANVAS_HEIGHT - 100, 200, 50, () => {
            this.game.stateManager.back();
        });
    }

    /**
     * Dibuja una tarjeta de modo con estética Triple-A (Glassmorphism + Icono Gigante).
     */
    _drawModeCard(title, desc, icon, x, y, w, h, onClick, accentColor) {
        const ctx = this.ctx;
        const isHover = this._csIsHovered(x, y, w, h);
        const mouse = this.game.mouse;

        if (isHover && mouse.down && !this._clicked) {
            this._clicked = true;
            onClick();
            setTimeout(() => { this._clicked = false; }, 300);
        }

        ctx.save();
        
        // --- 1. FONDO & SHADOW ---
        if (isHover) {
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 40;
            ctx.translate(0, -10); // Levantar ligeramente en hover
        } else {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 15;
        }

        // Base Glassmorphism
        ctx.fillStyle = isHover ? 'rgba(255, 255, 255, 0.08)' : 'rgba(10, 15, 25, 0.6)';
        this._drawRoundedRect(x, y, w, h, 20);
        ctx.fill();

        // Borde Resplandeciente
        ctx.strokeStyle = isHover ? accentColor : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = isHover ? 3 : 1;
        ctx.stroke();

        // --- 2. ICONO GIGANTE (TRASLÚCIDO) ---
        ctx.font = "180px Inter";
        ctx.textAlign = "center";
        ctx.globalAlpha = isHover ? 0.35 : 0.15;
        ctx.fillStyle = accentColor;
        ctx.fillText(icon, x + w / 2, y + h / 2 + 40);
        ctx.globalAlpha = 1;

        // --- 3. TEXTO (INFO) ---
        // Título con Glow
        ctx.font = "bold 26px Outfit";
        ctx.fillStyle = "#fff";
        if (isHover) {
            ctx.shadowColor = "#fff";
            ctx.shadowBlur = 15;
        }
        ctx.fillText(title, x + w / 2, y + 60);
        ctx.shadowBlur = 0;

        // Descripción envuelta
        ctx.font = "16px Inter";
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        const wrapLines = this._wrapText(desc, w - 80);
        wrapLines.forEach((line, i) => {
            ctx.fillText(line, x + w / 2, y + h - 140 + (i * 24));
        });

        // Badge de "SELECCIONAR"
        if (isHover) {
            ctx.fillStyle = accentColor;
            this._drawRoundedRect(x + 100, y + h - 60, w - 200, 40, 10);
            ctx.fill();
            this._drawText("COMENZAR", x + w / 2, y + h - 34, "bold 14px Inter", "center", "#000");
        }

        ctx.restore();
        
        // Registrar para interacciones fuera de esta función (hover global)
        this.activeButtons.push({ x, y, w, h, onClick });
        if (isHover) this.game.canvas.style.cursor = 'pointer';
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

    // Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
    //  NUEVA PANTALLA DEDICADA: SELECCIÃƒâ€œN DE CAPÃƒÂTULOS Ã¢â‚¬â€ MODO HISTORIA
    // Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â

    /**
     * Pantalla de selecciÃƒÂ³n de capÃƒÂ­tulos del Modo Historia.
     * DiseÃƒÂ±o completamente independiente: fondo propio, grid de cards con
     * thumbnails reales, estados visuales (desbloqueado / bloqueado / completado),
     * animaciÃƒÂ³n de entrada y hover con glow de color del bioma.
     */
    _renderChapterSelectStory(state) {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;
        const anim = this._csAnim;
        const isArcade = state === 'chapter_select_arcade';

        // Ã¢â€â‚¬Ã¢â€â‚¬ 1. FONDO PROPIO Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        this._drawStoryBackground(ctx, W, H, isArcade);

        // Ã¢â€â‚¬Ã¢â€â‚¬ 2. HEADER Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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

        // LÃƒÂ­nea decorativa inferior del header
        const accentColor = isArcade ? '#ff00ff' : '#00f2ff';
        const lineGrad = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, 0);
        lineGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        lineGrad.addColorStop(0.3, accentColor + '99');
        lineGrad.addColorStop(0.7, accentColor + '99');
        lineGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = lineGrad;
        ctx.fillRect(0, 78, W, 1);

        // TÃƒÂ­tulo principal
        ctx.font = 'bold 34px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 20;
        ctx.fillText(isArcade ? 'MODO ARCADE' : 'MODO HISTORIA', W / 2, 44);

        // SubtÃƒÂ­tulo
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(180, 210, 255, 0.7)';
        ctx.shadowBlur = 0;
        ctx.fillText(isArcade ? 'DesafÃƒÂ­a tus lÃƒÂ­mites en niveles infinitos' : 'Selecciona un capÃƒÂ­tulo para comenzar tu aventura', W / 2, 66);

        ctx.restore();

        // Ã¢â€â‚¬Ã¢â€â‚¬ 3. GRID DE CAPÃƒÂTULOS (Paginado: 8 por pÃƒÂ¡gina) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        const registry = isArcade ? ARCADE_CHAPTER_REGISTRY : CHAPTER_REGISTRY;
        const chaptersFull = Object.values(registry);
        const PAGE_SIZE = 8;
        const totalPages = Math.ceil(chaptersFull.length / PAGE_SIZE);
        
        // Mantener la pÃƒÂ¡gina en rango
        if (this.chapterPage >= totalPages) this.chapterPage = totalPages - 1;
        if (this.chapterPage < 0) this.chapterPage = 0;

        const chapters = chaptersFull.slice(this.chapterPage * PAGE_SIZE, (this.chapterPage + 1) * PAGE_SIZE);

        // ConfiguraciÃƒÂ³n del grid: 4 columnas x 2 filas (Escalado para 1920x1080)
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

            // AnimaciÃƒÂ³n de entrada escalonada por card
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

            // Registrar botÃƒÂ³n con coordenadas reales (sin offset de animaciÃƒÂ³n)
            this.activeButtons.push({
                x, y: realY, w: CARD_W, h: CARD_H,
                onClick: () => {
                    if (!isLocked) {
                        this.game.stateManager.navigate('loading_screen');
                        this.game.start(ch.id);
                    } else {
                        this.game.achievements?.showToast({
                            title: 'Ã‚Â¡Bloqueado!',
                            desc: 'Completa el capÃƒÂ­tulo anterior para desbloquear este.',
                            icon: 'Ã°Å¸â€â€™'
                        });
                    }
                }
            });

            if (isHover) this.game.canvas.style.cursor = 'pointer';
        });

        // Ã¢â€â‚¬Ã¢â€â‚¬ 4. CONTROLES DE PAGINACIÃƒâ€œN Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        const ctrlY = H - 85;
        const btnW = 160;
        const btnH = 40;
        const center = W / 2;

        // Indicador de pÃƒÂ¡gina
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText(`PÃƒÂGINA ${this.chapterPage + 1} / ${totalPages}`, center, ctrlY - 20);

        // BotÃƒÂ³n Anterior
        if (this.chapterPage > 0) {
            this._drawMenuButton("ANTERIOR", center - btnW - 20, ctrlY, btnW, btnH, () => {
                this.chapterPage--;
                this._csAnim.t = 0.35; // Reset parcial para feedback visual
                this._csAnim.phase = 'enter';
                if (this.game.synth) this.game.synth.playBtnClick();
            });
        }

        // BotÃƒÂ³n Siguiente
        if (this.chapterPage < totalPages - 1) {
            this._drawMenuButton("SIGUIENTE", center + 20, ctrlY, btnW, btnH, () => {
                this.chapterPage++;
                this._csAnim.t = 0.35; // Reset parcial para feedback visual
                this._csAnim.phase = 'enter';
                if (this.game.synth) this.game.synth.playBtnClick();
            });
        }

        // BotÃƒÂ³n AtrÃƒÂ¡s (Estilo Story)
        this._drawStoryBackButton(30, H - 54, 148, 42, () => {
            this._csAnim.phase = 'idle';
            this._csAnim.t = 1;
            this.game.stateManager.back();
            this.chapterPage = 0;
        });
    }

    /**
     * Dibuja el fondo exclusivo de la pantalla de selecciÃƒÂ³n de capÃƒÂ­tulos.
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

        // PartÃƒÂ­culas ambientales sutiles
        this._drawStoryAmbientParticles(ctx, W, H);
    }

    /**
     * PartÃƒÂ­culas ambientales sutiles para dar vida al fondo.
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
     * Dibuja una card de capÃƒÂ­tulo con thumbnail, nombre, estado y efectos hover.
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
            // PatrÃƒÂ³n de puntos sutiles
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

        // 3. GRID DE CAPÍTULOS (8 por página)
        const chaptersFull = Object.values(registry);
        const PAGE_SIZE = 8;
        const totalPages = Math.ceil(chaptersFull.length / PAGE_SIZE) || 1;
        
        if (this.chapterPage >= totalPages) this.chapterPage = totalPages - 1;
        const chapters = chaptersFull.slice(this.chapterPage * PAGE_SIZE, (this.chapterPage + 1) * PAGE_SIZE);

        const COLS = 4;
        const CARD_W = 440;
        const CARD_H = 320;
        const GRID_X = (W - (COLS * CARD_W + (COLS - 1) * 40)) / 2;
        const GRID_Y = 160;

        chapters.forEach((ch, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = GRID_X + col * (CARD_W + 40);
            const y = GRID_Y + row * (CARD_H + 50);

            const isLocked = false; // Desbloqueo solicitado para testing/restauración
            const isCompleted = this._csIsChapterCompleted(ch.id);
            const isHover = this._csIsHovered(x, y, CARD_W, CARD_H);

            this._drawStoryChapterCard(this.ctx, ch, x, y, CARD_W, CARD_H, isLocked, isCompleted, isHover);

            this.activeButtons.push({
                x, y, w: CARD_W, h: CARD_H,
                onClick: () => {
                    this.game.stateManager.navigate('loading_screen');
                    this.game.start(ch.id);
                }
            });
            if (isHover) this.game.canvas.style.cursor = 'pointer';
        });

        // 4. PAGINACIÓN Y CONTROLES
        const ctrlY = H - 85;
        this._drawText(`PÁGINA ${this.chapterPage + 1} / ${totalPages}`, W / 2, ctrlY - 20, "12px Inter", "center", "#666");

        if (this.chapterPage > 0) {
            this._drawMenuButton("ANTERIOR", W / 2 - 180, ctrlY, 160, 45, () => { this.chapterPage--; });
        }
        if (this.chapterPage < totalPages - 1) {
            this._drawMenuButton("SIGUIENTE", W / 2 + 20, ctrlY, 160, 45, () => { this.chapterPage++; });
        }

        this._drawStoryBackButton(40, H - 75, 150, 45, () => { 
            this.game.stateManager.back();
            this.chapterPage = 0;
        });
    }

    _renderChapterSelectLegacy(type) {
        const centerX = CANVAS_WIDTH / 2;
        const H = CANVAS_HEIGHT;
        let registry, title, color;

        if (type === 'chapter_select_arcade') {
            registry = ARCADE_CHAPTER_REGISTRY;
            title = "DESAFÃƒÂO: ARCADE";
            color = this.colors.secondary;
        } else {
            registry = ABL_CHAPTER_REGISTRY;
            title = "MODO: ABL e IA";
            color = this.colors.accent;
        }

        this._drawText(title, centerX, 70, "bold 42px Outfit", "center", color, true);
        this._drawText("Selecciona una expediciÃƒÂ³n para comenzar", centerX, 110, "18px Inter", "center", "#aaa");

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
                        title: "Ã‚Â¡Bloqueado!", 
                        desc: "Completa niveles anteriores para jugar.", 
                        icon: "Ã°Å¸â€â€™" 
                    });
                }
            });
        });

        // Ã¢â€â‚¬Ã¢â€â‚¬ 4. CONTROLES DE PAGINACIÃƒâ€œN Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        const ctrlY = H - 80;
        const btnPW = 160;
        const btnPH = 45;

        // Indicador de pÃƒÂ¡gina (Reposicionado para evitar solapamiento con tarjetas)
        ctx.font = '14px Inter';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'center';
        ctx.fillText(`PÃƒÂGINA ${this.chapterPage + 1} / ${totalPages}`, centerX, ctrlY - 25);

        // BotÃƒÂ³n Anterior
        if (this.chapterPage > 0) {
            this._drawMenuButton("ANTERIOR", centerX - btnPW - 10, ctrlY, btnPW, btnPH, () => {
                this.chapterPage--;
                if (this.game.synth) this.game.synth.playBtnClick();
            });
        }

        // BotÃƒÂ³n Siguiente
        if (this.chapterPage < totalPages - 1) {
            const nextX = (this.chapterPage > 0) ? centerX + 10 : centerX - btnPW/2;
            this._drawMenuButton("SIGUIENTE", nextX, ctrlY, btnPW, btnPH, () => {
                this.chapterPage++;
                if (this.game.synth) this.game.synth.playBtnClick();
            });
        }

        // BotÃƒÂ³n Volver (Posicionado en la esquina inferior izquierda de forma segura)
        this._drawMenuButton("VOLVER", 40, H - 80, 140, 45, () => {
             this.game.stateManager.back();
             this.chapterPage = 0;
        });
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
             this._drawText("Ã°Å¸â€â€™", x + w/2, y + h/2 + 10, "32px Inter", "center", "#666");
        } else {
             this._drawText(ch.icon || 'Ã°Å¸â€œÂ', x + w/2, y + 50, "32px Inter", "center", "#fff");
             this._drawText(ch.name.toUpperCase(), x + w/2, y + 80, "bold 14px Outfit", "center", "#fff");
             this._drawText(`Lv. ${ch.id}`, x + w/2, y + 100, "12px Inter", "center", this.colors.secondary);
        }

        // Registrar tile como botÃƒÂ³n interactivo
        this.activeButtons.push({ x, y, w, h, onClick });
        
        if (isHover) {
            this.game.canvas.style.cursor = 'pointer';
        }
    }
    
    _renderHUD() {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const game = this.game;
        
        // Ã¢â€â‚¬Ã¢â€â‚¬ 1. GLASS HEADER FULL WIDTH Ã¢â€â‚¬Ã¢â€â‚¬
        ctx.save();
        const headerH = 85;
        const marginY = 10;
        const paddingX = 20;
        
        // Fondo de cristal que ocupa casi todo el ancho con mÃƒÂ¡rgenes elegantes
        ctx.fillStyle = 'rgba(10, 10, 25, 0.85)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        this._drawRoundedRect(paddingX, marginY, W - (paddingX * 2), headerH, 16, true, false);
        
        // Borde neÃƒÂ³n sutil
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        this._drawRoundedRect(paddingX, marginY, W - (paddingX * 2), headerH, 16, false, true);
        ctx.restore();

        // Ã¢â€â‚¬Ã¢â€â‚¬ DISTRIBUCIÃƒâ€œN DINÃƒÂMICA DE ELEMENTOS (MAXIMIZADO PARA 1920) Ã¢â€â‚¬Ã¢â€â‚¬
        const availableW = W - paddingX * 2.5; // Reducido margen lateral interno
        const startX = paddingX * 1.25;
        const boxY = marginY + 12;
        const boxH = 62; // Ligeramente mÃƒÂ¡s alto
        const gap = 14; // Un poco mÃƒÂ¡s de espacio entre bloques

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
        this._drawHUDStatBox("SCORE", Math.floor(game.score).toLocaleString(), curX, boxY, scoreW, boxH);
        curX += scoreW + gap;

        const bComboW = getWidth(weights.banana);
        this._drawHUDComboLinear("BANANA COMBO", game.bananaCombo, 5, 'Ã°Å¸ÂÅ’', curX, boxY, bComboW, boxH, '#FFE135');
        curX += bComboW + gap;

        const bombComboW = getWidth(weights.bomb);
        this._drawHUDComboLinear("BOMB COMBO", game.bombCombo, 5, 'Ã°Å¸â€™Â£', curX, boxY, bombComboW, boxH, '#FF4500');
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
        
        // Ã¢â€â‚¬Ã¢â€â‚¬ 3. RANK BADGE (ProgresiÃƒÂ³n Fase 8) Ã¢â€â‚¬Ã¢â€â‚¬
        const rankInfo = game.rankManager.getRankInfo(game.totalXP);
        this._drawRankBadge(W - paddingX - 120, marginY + 12, 100, 62, rankInfo);

        // Countdown
        if (game.state === 'COUNTDOWN' && game.countdown) {
            const val = game.countdown.val;
            const label = val > 0 ? val : "Ã‚Â¡GO!";
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

    // --- HELPERS PARA EL HUD IDÃƒâ€°NTICO AL ORIGINAL ---

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
            
            // Si es el ÃƒÂ­tem reciÃƒÂ©n ganado, hacemos que brille mÃƒÂ¡s
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
            ctx.fillText('Ã¢ÂÂ¤Ã¯Â¸Â', startX + col * (iconSize + gap) + iconSize/2, startY + row * (iconSize + gap) + iconSize/2);
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
                ctx.fillText('Ã¢ÂÂ¤Ã¯Â¸Â', 0, 0);
            } else {
                ctx.fillText('Ã¢ÂÂ¤Ã¯Â¸Â', startX + i * spacing, centerY);
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
        
        // Etiqueta de Nivel pequeÃƒÂ±a
        ctx.shadowBlur = 0;
        this._drawText(`LVL ${rankInfo.level}`, centerX, centerY + 30, "bold 9px Inter", "center", this.colors.primary);
        
        ctx.restore();
    }

    /**
     * RENDERER: PANTALLA DE GAME OVER AVANZADA (AAA PREMIUM)
     * Basada en el diseÃƒÂ±o de 3 columnas: 25% GuÃƒÂ­a | 50% Hero Score | 25% Stats
     */
    _renderGameOver() {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;
        const score = Math.floor(this.game.score || 0);

        // Ã¢â€â‚¬Ã¢â€â‚¬ 1. FONDO OSCURECIDO CON GLOW DE PELIGRO Ã¢â€â‚¬Ã¢â€â‚¬
        ctx.fillStyle = 'rgba(6, 8, 24, 0.92)';
        ctx.fillRect(0, 0, W, H);
        
        // Glow rojo de peligro en los bordes
        const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.8);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, 'rgba(255, 41, 11, 0.15)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Ã¢â€â‚¬Ã¢â€â‚¬ 2. GRID DE 3 COLUMNAS Ã¢â€â‚¬Ã¢â€â‚¬
        const colW1 = W * 0.25;
        const colW2 = W * 0.50;
        const colW3 = W * 0.25;

        // Columna Izquierda: GuÃƒÂ­a de Objetos (Reutilizada de Loading)
        this._drawLoadingGuide(ctx, 20, 40, colW1 - 40, H - 80);

        // Columna Central: Hero Score y Acciones
        this._drawGameOverHero(ctx, colW1, 0, colW2, H, score);

        // Columna Derecha: EstadÃƒÂ­sticas Finales
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

        // TÃƒÂ­tulo Game Over
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

        // Caja de PuntuaciÃƒÂ³n Final
        ctx.font = 'bold 12px Outfit';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '3px';
        ctx.fillText('PUNTUACIÃƒâ€œN FINAL', centerX, y + 430);

        ctx.font = 'bold 72px Outfit';
        ctx.fillStyle = '#A6F616';
        ctx.shadowColor = 'rgba(166, 246, 22, 0.4)';
        ctx.shadowBlur = 20;
        ctx.fillText(score.toLocaleString(), centerX, y + 510);
        ctx.shadowBlur = 0;

        // Botones de AcciÃƒÂ³n
        const btnW = 340;
        const btnH = 55;
        const btnX = centerX - btnW / 2;
        const startBtnsY = y + 580;

        this._drawMenuButton("REINTENTAR", btnX, startBtnsY, btnW, btnH, () => {
            game.softRetry();
        }, true);

        this._drawMenuButton("MENÃƒÅ¡ PRINCIPAL", btnX, startBtnsY + 70, btnW, btnH, () => {
            location.reload();
        });
    }

    _drawGameOverStats(ctx, x, y, w, h) {
        this._drawGlassPanel(ctx, x, y, w, h, 'ESTADÃƒÂSTICAS', 'Ã°Å¸â€œË†');

        const stats = [
            { label: 'ITEMS CAPTURADOS', val: this.game.score || 0, icon: 'Ã°Å¸Å½Â¯', color: '#18EED8' },
            { label: 'NIVEL ALCANZADO', val: this.game.level || 1, icon: 'Ã¢Â­Â', color: '#FFD700' },
            { label: 'MEJOR RÃƒâ€°CORD', val: localStorage.getItem('mx_high_score') || 0, icon: 'Ã°Å¸Ââ€ ', color: '#A6F616' },
            { label: 'BONUS TIEMPO', val: '+500', icon: 'Ã¢ÂÂ³', color: '#9c5fff' }
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
        const centerX = CANVAS_WIDTH / 2;
        this._drawText("SHOP", centerX, 80, "bold 42px Outfit", "center", this.colors.accent);
        this._drawText("PRÃƒâ€œXIMAMENTE - MEJORAS DE PERSONAJE", centerX, 200, "18px Inter", "center", "#aaa");
        
        this._drawMenuButton("VOLVER", centerX - 100, 380, 200, 50, () => {
            this.game.stateManager.back();
        });
    }

    _renderTrophiesScreen() {
        const centerX = CANVAS_WIDTH / 2;
        this._drawText("TROPHIES", centerX, 80, "bold 42px Outfit", "center", '#FFD700');
        this._drawText("TUS LOGROS Y COLECCIONABLES", centerX, 200, "18px Inter", "center", "#aaa");
        
        this._drawMenuButton("VOLVER", centerX - 100, 380, 200, 50, () => {
            this.game.stateManager.back();
        });
    }

    _renderVictoryScreen() {
        this._drawOverlayBG();
        const centerX = CANVAS_WIDTH / 2;
        this._drawText("VICTOIRE!", centerX, 180, "bold 92px Outfit", "center", this.colors.accent, true);
        this._drawText(`SCORE FINAL: ${Math.floor(this.game.score)}`, centerX, 240, "32px Outfit", "center", "#fff");

        this._drawMenuButton("VOLVER AL MENÃƒÅ¡", centerX - 150, 350, 300, 60, () => {
            location.reload();
        });
    }

    /**
     * Dibuja un botÃƒÂ³n de retroceso estilizado para las pantallas de capÃƒÂ­tulos de Historia.
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

        // Cuerpo del botÃƒÂ³n (Glassmorphism sutil)
        ctx.fillStyle = isHover ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = isHover ? '#fff' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        this._drawRoundedRect(x, y, w, h, h / 2, true, true);

        // Icono y Texto
        ctx.font = "bold 13px Outfit";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isHover ? "#fff" : "rgba(255, 255, 255, 0.8)";
        ctx.fillText("Ã¢â€ Â VOLVER", x + w / 2, y + h / 2 + 6);

        ctx.restore();
    }

    // --- PRIMITIVAS GRÃƒÂFICAS Y COMPONENTES ---

    _drawMenuButton(text, x, y, w, h, onClick, secondary = false) {
        const ctx = this.ctx;
        const isHover = this.hoveredButton && this.hoveredButton.x === x && this.hoveredButton.y === y && this.hoveredButton.w === w;
        
        // Registrar para interacciÃƒÂ³n en el siguiente frame/evento
        this.activeButtons.push({ x, y, w, h, onClick });

        ctx.save();
        
        // Sombra
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = isHover ? 20 : 10;
        ctx.shadowOffsetY = 5;

        // Fondo del botÃƒÂ³n
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

    _drawModeCard(title, desc, x, y, w, h, onClick, color) {
        const ctx = this.ctx;
        const isHover = this.hoveredButton && this.activeButtons.some(b => b.x === x && b.y === y);
        this.activeButtons.push({ x, y, w, h, onClick });

        ctx.save();
        
        // Fondo Premium Dorado
        const goldGradient = ctx.createLinearGradient(x, y, x, y + h);
        goldGradient.addColorStop(0, '#FFD700');
        goldGradient.addColorStop(0.5, '#FFA500');
        goldGradient.addColorStop(1, '#FF8C00');
        
        // Borde dorado brillante
        const borderGradient = ctx.createLinearGradient(x, y, x + w, y + h);
        borderGradient.addColorStop(0, '#FFED4E');
        borderGradient.addColorStop(0.5, '#FFD700');
        borderGradient.addColorStop(1, '#DAA520');
        
        // Sombra dorada
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = isHover ? 40 : 20;
        ctx.shadowOffsetY = 8;
        
        // Dibujar tarjeta dorada
        this._drawRoundedRect(x, y, w, h, 20, goldGradient, borderGradient);
        
        // Efecto de brillo adicional en hover
        if (isHover) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 50;
            ctx.strokeStyle = '#FFED4E';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Texto en color oscuro para contraste
        this._drawText(title, x + w / 2, y + 40, "bold 28px Outfit", "center", "#1a1a1a");
        this._drawText(desc, x + w / 2, y + 80, "14px Inter", "center", "rgba(0,0,0,0.7)");
        
        // Boton interno (Select) - Premium
        this._drawPremiumButton("SELECT", x + 40, y + 130, w - 80, 45, onClick, 'gold');
        
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

    _drawText(text, x, y, font, align, color, glow = false) {
        const ctx = this.ctx;
        ctx.save();
        ctx.font = font;
        ctx.textAlign = align;
        ctx.fillStyle = color;
        
        if (glow) {
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
        
        // Registrar para interacciÃ³n
        this.activeButtons.push({ x, y, w, h, onClick });

        ctx.save();
        
        // Definir colores segÃºn el estilo
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
        
        // Dibujar botÃ³n
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
     * Gestiona la animaciÃ³n y el renderizado de logros desbloqueados.
     */
    _renderToasts() {
        const ctx = this.ctx;
        const ts = this.toastState;
        const achManager = this.game.achievements;

        // 1. Sincronizar con AchievementManager (LÃ³gica de encolado)
        if (ts.phase === 'hidden' && achManager?.currentAchievement) {
            ts.ach = achManager.currentAchievement;
            ts.phase = 'entering';
            ts.timer = 0;
            ts.y = -120;
            ts.alpha = 0;
        }

        if (ts.phase === 'hidden') return;

        // 2. LÃ³gica de AnimaciÃ³n / TransiciÃ³n
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
                    // Limpiar el logro actual del manager para permitir el siguiente en la cola
                    if (achManager) achManager.currentAchievement = null;
                }
                break;
        }

        // 3. Renderizado GrÃ¡fico (Glassmorphism Premium)
        if (!ts.ach) return;

        const W = 500;
        const H = 70;
        const X = (CANVAS_WIDTH - W) / 2;
        const Y = ts.y;

        ctx.save();
        ctx.globalAlpha = ts.alpha;

        // Sombra de Profundidad
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 10;

        // Fondo Glassmorphism
        const grad = ctx.createLinearGradient(X, Y, X, Y + H);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        ctx.fillStyle = grad;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        this._drawRoundedRect(X, Y, W, H, 15, grad, 'rgba(255,255,255,0.3)');

        // Brillo superior (Glare)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(X + 2, Y + 2, W - 4, H / 2, [13, 13, 0, 0]);
        ctx.fill();

        // Icono (Emoji o SÃ­mbolo)
        ctx.font = "32px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.colors.primary;
        ctx.fillText(ts.ach.icon || 'ðŸ†', X + 45, Y + H / 2 + 3);

        // Texto: TÃ­tulo (Unlock!)
        ctx.shadowBlur = 0;
        this._drawText("Â¡LOGRO DESBLOQUEADO!", X + 85, Y + 25, "bold 10px Outfit", "left", this.colors.primary);
        
        // Texto: Nombre del Logro
        this._drawText(ts.ach.title.toUpperCase(), X + 85, Y + 48, "bold 20px Outfit", "left", "#fff");

        // LÃ­nea decorativa
        const lineW = 340;
        const lineGrad = ctx.createLinearGradient(X + 85, 0, X + 85 + lineW, 0);
        lineGrad.addColorStop(0, this.colors.primary);
        lineGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = lineGrad;
        ctx.fillRect(X + 85, Y + 28, lineW, 1.5);

        ctx.restore();
    }

    _lerp(a, b, t) {
        return a + (b - a) * t;
    }

    // --- MÃ‰TODOS DE COMPATIBILIDAD (Para no romper Game.js) ---
    updateHUD(pts) {}
    showOverlay(k) { console.log("Legacy showOverlay called for", k); }
    hideAllOverlays() {}
    updateAudioStatus() {}
    showNearMiss() {}
    showDamageVignette() {}
    toggleCinematicMode(active) {}
    formatCurrency(val) { return `Ã°Å¸ÂÂ¸ ${val}`; }
}
