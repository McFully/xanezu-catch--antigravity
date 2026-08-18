import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { CHAPTER_REGISTRY } from './ChapterRegistry.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.overlays = {
            menu: document.getElementById('menu-overlay'),
            gameover: document.getElementById('gameover-overlay'),
            victory: document.getElementById('victory-overlay'),
            chapter: document.getElementById('chapter-overlay'),
            trophy: document.getElementById('trophy-overlay'),
            shop: document.getElementById('shop-overlay'),
            settings: document.getElementById('settings-overlay'),
            congratulations: document.getElementById('congratulations-overlay')
        };
        this.vals = {
            score: document.getElementById('score-val'),
            level: document.getElementById('level-val'),
            best: document.getElementById('best-val'),
            final: document.getElementById('final-score'),
            bscore: document.getElementById('best-over'),
            vscore: document.getElementById('victory-score-val-new'),
            progressFill: document.getElementById('level-progress-fill'),
            progressText: document.getElementById('level-progress-text'),
            scoreItem: document.getElementById('score-val')?.parentElement,
            multUI: document.getElementById('multiplier-ui'),
            multFill: document.getElementById('multiplier-timer-fill'),
            multVal: document.getElementById('multiplier-val'),
            streakVal: document.getElementById('streak-val'),
            trophyList: document.getElementById('trophy-list'),
            shopList: document.getElementById('shop-list'),
            lives: document.getElementById('lives-val'),
            shopCoins: document.getElementById('shop-coins'),
            scoreVal: document.getElementById('score-val'),
            scoreItem: document.querySelector('.score-box'),
            bottomHUD: document.getElementById('bottom-hud'),
            slotShield: document.getElementById('slot-shield'),
            slotMagnet: document.getElementById('slot-magnet'),
            slotSpeed: document.getElementById('slot-speed')
        };
        this.btns = {
            start: document.getElementById('start-btn'),
            retry: document.getElementById('retry-btn'),
            restart: document.getElementById('menu-btn')
        };
        this.cache = {
            shopCoins: document.getElementById('shop-coins'),
            menuCoins: document.getElementById('menu-coins-val'),
            livesVal: document.getElementById('lives-val'),
            heartsGrid: document.getElementById('hearts-grid'),
            overlayContainer: document.getElementById('overlay-container'),
            shutter: document.getElementById('shutter'),
            nearMiss: document.getElementById('near-miss-flash'),
            damageVignette: document.getElementById('damage-vignette'),
            dashFill: document.getElementById('dash-bar-fill'),
            dashCont: document.getElementById('dash-bar-container')
        };
        this.chapterPage = 0;
        this.itemsPerPage = 8;
        this._lastHUD = { score: -1, level: -1, best: -1, lives: -1, streak: -1, bananaStreak: -1 };
        this._audioUnlockToastShown = false;
        this._lastAudioUnlocked = false;
        this.initChapterGrid();
        // Audio status element (A)
        this._audioStatusEl = document.getElementById('audio-status');
        this.loadingTips = [
            "Usa el DASH en el aire para esquivar obstáculos difíciles.",
            "Captura 5 moscas doradas para activar el modo FEVER.",
            "Los artefactos raros te dan multiplicadores de puntuación permanentes.",
            "¡El imán atrae incluso las gemas más lejanas!",
            "Mantén la calma, el ritmo de la música te ayudará a saltar mejor.",
            "¿Sabías que cada capítulo tiene obstáculos únicos?",
            "El escudo te protege de un impacto. ¡No lo malgastes!",
            "Consigue Gemas de Vida para aguantar más en el modo Infinito."
        ];
        this._currentTip = "";
        this.updateAudioStatus();
    }

    updateLoadingUI(percentage, statusText) {
        const bar = document.getElementById('loading-bar-fill');
        const percText = document.getElementById('loading-percentage');
        const statusEl = document.getElementById('loading-text');

        if (bar) bar.style.width = `${percentage}%`;
        if (percText) percText.textContent = `${Math.floor(percentage)}%`;
        if (statusEl) statusEl.textContent = statusText;

        // Actualizar tips aleatorios
        if (percentage % 25 === 0 && percentage > 0) {
            this._currentTip = this.loadingTips[Math.floor(Math.random() * this.loadingTips.length)];
            const tipEl = document.querySelector('#loading-overlay .tip-text');
            if (tipEl) tipEl.textContent = this._currentTip;
            this._refreshLoadingStats();
        }
    }

    /**
     * Actualiza el HUD unificado durante el gameplay
     */
    updateHUD(ptsGained = 0) {
        const game = this.game;
        if (!game) return;

        // 1. Banana Combo (5 slots)
        const comboContainer = document.querySelector('.combo-linear');
        const bananaSlots = document.querySelectorAll('#combo-slots .banana-slot');
        const currentComboCount = game.bananaCombo || 0;

        if (currentComboCount === 5 && this._prevCombo < 5 && comboContainer) {
            this._triggerFlash(comboContainer);
        }
        this._prevCombo = currentComboCount;

        bananaSlots.forEach((slot, idx) => {
            if (idx < currentComboCount) slot.classList.add('active');
            else slot.classList.remove('active');
        });

        // 1.1 Bomb Combo (5 slots)
        const bombContainer = document.querySelector('.bomb-linear');
        const bombSlots = document.querySelectorAll('#bomb-slots .bomb-slot');
        const currentBombCount = game.bombCombo || 0;

        if (currentBombCount === 5 && this._prevBomb < 5 && bombContainer) {
            this._triggerFlash(bombContainer);
        }
        this._prevBomb = currentBombCount;

        bombSlots.forEach((slot, idx) => {
            if (idx < currentBombCount) slot.classList.add('active');
            else slot.classList.remove('active');
        });

        // 2. Vida Extra (10 corazones en rejilla 5x2)
        const extraLifeContainer = document.querySelector('.extra-life-linear');
        const heartSlots = document.querySelectorAll('#extra-life-slots .heart-slot');
        const extraLifeHearts = game.extraLifeHearts || 0;

        if (extraLifeHearts === 0 && this._prevExtraLife === 9 && extraLifeContainer) {
            this._triggerFlash(extraLifeContainer);
        }
        this._prevExtraLife = extraLifeHearts;

        heartSlots.forEach((slot, idx) => {
            if (idx < extraLifeHearts) slot.classList.add('active');
            else slot.classList.remove('active');
        });

        // 3. Vidas (Main hearts)
        const livesCont = document.getElementById('lives-container');
        if (livesCont && this._lastHUD.lives !== game.lives) {
            let html = '';
            for (let i = 0; i < game.lives; i++) {
                html += '<span class="heart active">❤️</span>';
            }
            livesCont.innerHTML = html;
            this._lastHUD.lives = game.lives;
        }

        // 5. Otros stats y Progreso
        const levelVal = document.getElementById('level-val');
        if (levelVal && this._lastHUD.level !== game.level) {
            levelVal.textContent = game.level;
            this._lastHUD.level = game.level;
        }

        const multiplierVal = document.getElementById('multiplier-val');
        if (multiplierVal) multiplierVal.textContent = `x${game.mult}`;

        // 3. PROGRESS (PROGRESO)
        // Calculamos el inicio del nivel actual y el objetivo del nivel actual.
        const currentGoal = game.getLevelTarget(game.level);
        const prevGoal = game.level === 1 ? 0 : game.getLevelTarget(game.level - 1);

        // Puntos conseguidos DENTRO de este nivel específico
        const pointsInLevel = Math.max(0, game.score - prevGoal);
        // Cantidad total de puntos que pide el nivel
        const pointsNeededForLevel = currentGoal - prevGoal;

        // Progreso de 0% a 100%
        const progressRaw = (pointsInLevel / pointsNeededForLevel) * 100;
        const progressClamped = Math.min(100, Math.max(0, progressRaw));

        const chapterFill = document.getElementById('chapter-progress-fill');
        if (chapterFill) {
            chapterFill.style.width = `${progressClamped}%`;
            // Transición de color de rojo (0) a verde lima (100)
            const hue = Math.floor((progressClamped / 100) * 100);
            chapterFill.style.background = `linear-gradient(90deg, hsl(${Math.max(0, hue - 20)}, 90%, 50%), hsl(${hue}, 100%, 50%))`;
            chapterFill.style.boxShadow = `0 0 10px hsl(${hue}, 100%, 50%, 0.6)`;
        }

        const chapterPerc = document.getElementById('progress-percent-hud');
        if (chapterPerc) {
            chapterPerc.innerHTML = `<span style="font-weight: bold; font-size: 1.1em;">${Math.floor(game.score).toLocaleString()}</span> <span style="opacity: 0.7; font-size: 0.8em;">/ ${Math.floor(currentGoal).toLocaleString()} XP</span>`;
        }

        // 6. Score
        if (this.vals.scoreVal && this._lastHUD.score !== game.score) {
            this.vals.scoreVal.textContent = Math.floor(game.score || 0).toLocaleString();
            this._lastHUD.score = game.score;
        }

        // Efecto visual al ganar puntos
        if (ptsGained > 0 && this.vals.scoreItem) {
            this.vals.scoreItem.classList.remove('score-punch');
            void this.vals.scoreItem.offsetWidth;
            this.vals.scoreItem.classList.add('score-punch');
        }

        // 7. Dash Bar
        if (game.frog) {
            const dashPerc = Math.min(100, Math.max(0, (1 - game.frog.dashCd / 120) * 100));
            if (this.cache.dashFill) this.cache.dashFill.style.width = `${dashPerc}%`;

            if (game.frog.dashCd <= 0) {
                this.cache.dashCont?.classList.add('ready');
            } else {
                this.cache.dashCont?.classList.remove('ready');
            }
        }

        // 8. Multiplier Timer UI
        if (game.mult > 1) {
            const maxT = game.mult === 4 ? 60 * 60 : 30 * 60;
            const pct = (game.multT / maxT) * 100;
            this.vals.multUI?.classList.add('active');
            if (this.vals.multFill) {
                this.vals.multFill.style.width = `${pct}%`;
                this.vals.multFill.style.background = game.mult === 4 ? '#FF00FF' : 'var(--secondary)';
            }
            this.vals.multUI?.classList.add('mult-shake');
        } else {
            this.vals.multUI?.classList.remove('active', 'mult-shake');
        }

        if (this._lastHUD.totalCoins !== game.totalCoins) {
            if (this.cache.menuCoins) this.cache.menuCoins.innerText = game.totalCoins;
            if (this.cache.shopCoins) this.cache.shopCoins.innerText = game.totalCoins;
            const hudXanezuVal = document.getElementById('hud-xanezu-val');
            if (hudXanezuVal) hudXanezuVal.innerText = game.totalCoins;
            this._lastHUD.totalCoins = game.totalCoins;
        }

        this._updateItemSlots();
        this.updateTrophyRecords();
        this.updateAudioStatus();
    }

    _updateItemSlots() {
        const p = this.game.frog;
        if (!p) return;

        // SHIELD
        if (this.vals.slotShield) {
            const isActive = p.shieldT > 0 || p.shieldActive;
            this.vals.slotShield.classList.toggle('active', isActive);
            this.vals.slotShield.querySelector('.state-label').innerText = isActive ? 'ACTIVE' : 'READY';
        }

        // MAGNET
        if (this.vals.slotMagnet) {
            const isActive = p.magnetT > 0;
            this.vals.slotMagnet.classList.toggle('active', isActive);
            this.vals.slotMagnet.querySelector('.state-label').innerText = isActive ? 'ACTIVE' : 'READY';
        }

        // SPEED / LIGHTNING
        if (this.vals.slotSpeed) {
            const isActive = (p.speedBoostT > 0) || (p.infiniteDashT > 0) || (p.dashT > 0);
            this.vals.slotSpeed.classList.toggle('active', isActive);
            this.vals.slotSpeed.querySelector('.state-label').innerText = isActive ? 'ACTIVE' : 'READY';
        }
    }

    /**
     * Lanza un destello visual en el elemento indicado
     */
    _triggerFlash(el) {
        el.classList.remove('set-complete-flash');
        void el.offsetWidth; // Trigger reflow
        el.classList.add('set-complete-flash');
        setTimeout(() => el.classList.remove('set-complete-flash'), 1000);
    }

    _refreshLoadingStats() {
        const stats = this.game.stats || {};
        const totalTime = parseInt(localStorage.getItem('mx_total_time') || 0);
        const hours = Math.floor(totalTime / 3600);
        const mins = Math.floor((totalTime % 3600) / 60);

        const timeEl = document.querySelector('.lo-col-right .go-stat-premium:nth-child(1) .value');
        const levelEl = document.querySelector('.lo-col-right .go-stat-premium:nth-child(2) .value');
        const recordEl = document.querySelector('.lo-col-right .go-stat-premium:nth-child(4) .value');

        if (timeEl) timeEl.textContent = `${hours}h ${mins}m`;
        if (levelEl) levelEl.textContent = `NIV. ${this.game.maxChapter * 10 || 1}`;
        if (recordEl) recordEl.textContent = (this.game.highScore || 0).toLocaleString();

        const xanezusContainer = document.querySelector('.lo-col-left .go-prize-list');
        if (xanezusContainer) {
            xanezusContainer.innerHTML = `
                <div class="go-prize-item rare"><span class="icon">🐸</span> <span class="name">FROG COINS</span> <span class="val">${this.game.totalCoins || 0}</span></div>
                <div class="go-prize-item gold"><span class="icon">🏆</span> <span class="name">Logros</span> <span class="val">${Object.keys(stats).length || 0} / 12</span></div>
            `;
        }

        const chNameEl = document.getElementById('loading-chapter-name');
        if (chNameEl && CHAPTER_REGISTRY[this.game.chapter]) {
            chNameEl.textContent = `CAPÍTULO ${this.game.chapter}: ${CHAPTER_REGISTRY[this.game.chapter].name.toUpperCase()}`;
        }
    }

    updateAudioStatus() {
        if (!this._audioStatusEl || !this.game) return;
        const unlocked = !!this.game.audioUnlocked;
        const on = !!this.game.isMusicOn;
        this._audioStatusEl.textContent = unlocked ? (on ? 'Audio: On' : 'Audio: Off') : '🔊 TOCA PARA ACTIVAR AUDIO';
        this._audioStatusEl.style.display = 'block';

        if (unlocked && !this._lastAudioUnlocked) {
            this._audioStatusEl.classList.remove('animate');
            // restart CSS animation
            void this._audioStatusEl.offsetWidth;
            this._audioStatusEl.classList.add('animate');
        }
        this._lastAudioUnlocked = unlocked;
    }

    showAudioUnlockTooltip() {
        if (!this.game?.audioUnlocked || this._audioUnlockToastShown) return;
        this._audioUnlockToastShown = true;

        const tip = document.createElement('div');
        tip.className = 'audio-unlock-tooltip';
        tip.textContent = 'Audio desbloqueado';
        document.body.appendChild(tip);

        setTimeout(() => {
            tip.classList.add('hide');
            setTimeout(() => tip.remove(), 300);
        }, 1700);
    }

    triggerShutter(callback, useGlitch = true) {
        if (!this.cache.shutter) {
            if (callback) callback();
            return;
        }
        if (useGlitch) this.cache.shutter.classList.add('glitch');
        this.cache.shutter.classList.add('active');

        setTimeout(() => {
            if (callback) callback();
            setTimeout(() => {
                this.cache.shutter.classList.remove('active', 'glitch');
            }, 500);
        }, 600);
    }

    showNearMiss() {
        if (!this.cache.nearMiss) return;
        this.cache.nearMiss.classList.add('active');
        setTimeout(() => this.cache.nearMiss.classList.remove('active'), 200);
    }

    showDamageVignette(duration = 600) {
        if (!this.cache.damageVignette) return;
        this.cache.damageVignette.classList.add('active');
        setTimeout(() => this.cache.damageVignette.classList.remove('active'), duration);
    }

    formatCurrency(amount) {
        return `🐸 ${amount}`;
    }

    showOverlay(k) {
        console.log(`UI: Requesting overlay [${k}]`);
        const next = this.overlays[k];

        this.hideAllOverlays();

        if (next) {
            console.log(`UI: Showing overlay [${k}]`);
            next.classList.add('active', 'entering');
            // Ensure container is active
            if (this.cache.overlayContainer) {
                this.cache.overlayContainer.style.pointerEvents = 'auto';
            }
            if (k === 'settings') this.updateSettingsUI();
            if (k === 'trophy') this.updateTrophyRecords();
        } else {
            console.warn(`UI: Overlay [${k}] not found!`);
        }
    }

    hideAllOverlays() {
        Object.keys(this.overlays).forEach(key => {
            const o = this.overlays[key];
            if (o) {
                o.classList.remove('active', 'entering', 'exiting');
            }
        });
        // If all hidden, we should probably let clicks pass to canvas if playing
        if (this.game.state === 'PLAYING' || this.game.state === 'COUNTDOWN') {
            if (this.cache.overlayContainer) {
                this.cache.overlayContainer.style.pointerEvents = 'none';
            }
        }
    }

    triggerClickFeedback(el) {
        if (!el) return;
        el.classList.add('clicked');
        setTimeout(() => el.classList.remove('clicked'), 300);
    }

    /**
     * Alterna entre el layout estándar y el cinematográfico (2.35:1)
     */
    toggleCinematicMode(active) {
        if (active) {
            document.body.classList.add('cinematic-mode');
        } else {
            document.body.classList.remove('cinematic-mode');
        }
        // Forzar resize para que el canvas se adapte al nuevo layout inmediatamente
        this.game.resize();
    }

    // --- drawHUD(ctx) ELIMINADO PARA EVITAR SOLAPAMIENTOS ---
    // La puntuación ahora se maneja vía HTML en el header unificado.

    updateCongratulationsUI(finalScore) {
        const scoreEl = document.getElementById('congratulations-score');
        if (scoreEl) scoreEl.textContent = Math.floor(finalScore).toLocaleString();

        const xpBody = document.getElementById('xp-table-body');
        if (xpBody && this.game.levelManager) {
            let html = '';
            for (let i = 1; i <= 30; i++) {
                const xp = this.game.getLevelTarget(i);
                // Resaltar el nivel actual/máximo (generalmente 30 en esta pantalla, pero por flexibilidad se evalúa la progresión)
                const isMax = (i === 30 || i === this.game.level);
                html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); ${isMax ? 'color: #A6F616; font-weight: bold; font-size: 1.1em;' : ''}">
                    <td style="padding: 6px;">Nivel ${i}</td>
                    <td style="padding: 6px; text-align: right;">${xp.toLocaleString()} xp</td>
                </tr>`;
            }
            xpBody.innerHTML = html;
        }
    }

    updateShopUI() {
        const list = this.vals.shopList;
        if (!list) return;
        list.innerHTML = '';
        const coinDisplay = document.getElementById('shop-coins');
        if (coinDisplay) coinDisplay.textContent = this.game.totalCoins;

        const treeHeader = document.createElement('h3');
        treeHeader.className = "shop-section-title";
        treeHeader.textContent = "SKILL TREE (PERMANENT)";
        list.appendChild(treeHeader);

        const skills = [
            { id: 'jumpBoost', name: 'Moon Jump', desc: 'Lower gravity impact', price: 1500, icon: '🚀' },
            { id: 'dashEfficiency', name: 'Speed Drift', desc: 'Extended dash duration', price: 2000, icon: '⚡' },
            { id: 'resilience', name: 'Hard Shell', desc: 'Chance to survive hits', price: 5000, icon: '🐢' }
        ];

        skills.forEach(s => {
            const lvl = this.game.skills[s.id] || 0;
            const cost = s.price * (lvl + 1);
            const card = document.createElement('div');
            card.className = 'shop-item';

            // 💎 Use premium icons if available
            const global = this.game.assetLoader.globalObjects;
            const premiumIcon = s.id === 'jumpBoost' ? global['spring'] : (s.id === 'dashEfficiency' ? global['bolt'] : null);
            const iconHtml = premiumIcon ? `<img src="${premiumIcon.src}" class="shop-item-premium-icon">` : `<div class="item-icon">${s.icon}</div>`;

            card.innerHTML = `
        ${iconHtml}
        <div class="item-info">
          <div class="item-name">${s.name} (Lv.${lvl})</div>
          <div class="item-desc">${s.desc}</div>
          <div class="item-price">${this.formatCurrency(cost)}</div>
          <button class="buy-btn" onclick="window.game.buySkill('${s.id}', ${cost})">UPGRADE</button>
        </div>
      `;
            list.appendChild(card);
        });

        const legacyHeader = document.createElement('h3');
        legacyHeader.className = "shop-section-title";
        legacyHeader.textContent = "GEAR & SKINS";
        list.appendChild(legacyHeader);

        const items = [
            { id: 'upgrade_magnet', name: 'Elite Magnet', desc: 'Bonus range', cost: 500, icon: 'magnet' },
            { id: 'upgrade_shield', name: 'Reinforced Shield', desc: 'Bonus time', cost: 500, icon: 'shield' },
            { id: 'skin_gold', name: 'Gold Skin', desc: 'Shiny flex', cost: 3000, icon: '✨' }
        ];

        items.forEach(item => {
            const isOwnedSkin = (item.id === 'skin_gold' && this.game.unlocks.skins.includes('gold'));
            const card = document.createElement('div');
            card.className = 'shop-item' + (isOwnedSkin ? ' owned' : '');

            // 💎 Use premium icons if available
            const global = this.game.assetLoader.globalObjects || {};
            const premiumItemIcon = global[item.icon];
            const itemIconHtml = premiumItemIcon ? `<img src="${premiumItemIcon.src}" class="shop-item-premium-icon">` : `<div class="item-icon">${item.icon}</div>`;

            card.innerHTML = `
        ${itemIconHtml}
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-desc">${item.desc}</div>
          <div class="item-price">${isOwnedSkin ? 'OWNED' : this.formatCurrency(item.cost)}</div>
          <button class="buy-btn" ${isOwnedSkin ? 'disabled' : ''} onclick="window.game.buyItem('${item.id}')">${isOwnedSkin ? 'MAXED' : 'BUY'}</button>
        </div>
      `;
            list.appendChild(card);
        });
    }

    updateChaptersUI() {
        const grid = document.getElementById('chapter-grid');
        if (!grid) return;
        const isAdaptiveModes = !this.game.stateManager?.isCampaignMode?.();
        const unlocked = this.game.getActiveUnlockedChapters ? this.game.getActiveUnlockedChapters() : (this.game.unlockedChapters || [1]);
        const registry = this.game.getActiveRegistry ? this.game.getActiveRegistry() : CHAPTER_REGISTRY;
        const cards = grid.querySelectorAll('.chapter-card');

        cards.forEach(card => {
            const id = parseInt(card.dataset.chapter);
            const cfg = registry[id] || {};
            const unlockScore = cfg.unlockScore || 0;

            // Unlock/Lock visual state
            if (unlocked.includes(id)) {
                card.classList.remove('locked');
                card.classList.add('unlocked');
                card.title = `${cfg.name || `Capitulo ${id}`} - DESBLOQUEADO`;
            } else {
                card.classList.add('locked');
                card.classList.remove('unlocked');
                card.title = `Necesitas ${unlockScore} puntos globales`;
            }

            const lockEl = card.querySelector('.ch-lock');
            if (lockEl) {
                if (isAdaptiveModes) {
                    if (unlocked.includes(id)) {
                        lockEl.textContent = 'UNLOCKED';
                    } else {
                        // Pattern: Tarjeta 1: LOCKED, Tarjeta 2: LOCK 2000, etc.
                        lockEl.textContent = id === 1 ? 'LOCKED' : `LOCK ${unlockScore}`;
                    }
                    lockEl.style.display = 'inline-block';
                } else {
                    lockEl.style.display = 'none';
                }
            }
        });

        this.updateChaptersPagination();
    }

    updateChaptersPagination() {
        const grid = document.getElementById('chapter-grid');
        if (!grid) return;
        const cards = grid.querySelectorAll('.chapter-card');
        const isArcadeMode = this.game.stateManager?.isArcadeMode?.() === true;
        const isABLMode = this.game.stateManager?.isABLMode?.() === true;
        const isGrid12 = isArcadeMode || isABLMode;
        const perPage = isGrid12 ? 12 : this.itemsPerPage;
        const start = this.chapterPage * perPage;
        const end = start + perPage;
        const total = cards.length;
        const maxPages = Math.ceil(total / perPage);

        const visibleIds = [];
        cards.forEach((card, index) => {
            if (index >= start && index < end) {
                card.classList.add('visible');
                visibleIds.push(card.id);
            } else {
                card.classList.remove('visible');
            }
        });



        // Update keyboard navigation mapping
        if (this.game.menuMapping) {
            this.game.menuMapping['CHAPTER_SELECT'] = visibleIds;
        }

        // Update indicator
        const indicator = document.getElementById('page-indicator');
        if (indicator) {
            if (isGrid12) indicator.textContent = isArcadeMode ? 'ARCADE CHAPTERS' : 'ABL IA CHAPTERS';
            else indicator.textContent = `PAGE ${(this.chapterPage + 1).toString().padStart(2, '0')} / ${maxPages.toString().padStart(2, '0')}`;
        }

        // Update buttons state
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pagination = document.querySelector('.chapter-pagination');
        if (pagination) pagination.style.display = (maxPages > 1) ? 'flex' : 'none';
        if (prevBtn) prevBtn.disabled = this.chapterPage === 0;
        if (nextBtn) nextBtn.disabled = (this.chapterPage + 1) >= maxPages;
    }

    nextChapterPage() {
        const perPage = this.game.stateManager?.isArcadeMode?.() ? 12 : this.itemsPerPage;
        const total = Object.keys(this.game.getActiveRegistry ? this.game.getActiveRegistry() : CHAPTER_REGISTRY).length;
        const maxPages = Math.ceil(total / perPage);
        if ((this.chapterPage + 1) < maxPages) {
            this.chapterPage++;
            this.updateChaptersPagination();
            if (this.game.synth) this.game.synth.playBtnHover();
        }
    }

    prevChapterPage() {
        if (this.chapterPage > 0) {
            this.chapterPage--;
            this.updateChaptersPagination();
            if (this.game.synth) this.game.synth.playBtnHover();
        }
    }

    initChapterGrid() {
        const grid = document.getElementById('chapter-grid');
        if (!grid) return;
        const registry = this.game.getActiveRegistry ? this.game.getActiveRegistry() : CHAPTER_REGISTRY;
        const isAdaptiveModes = !this.game.stateManager?.isCampaignMode?.();
        const isArcadeMode = this.game.stateManager?.isArcadeMode?.() === true;
        const chapterScreen = document.querySelector('.chapter-screen');

        if (chapterScreen) {
            chapterScreen.classList.toggle('arcade-select-theme', isArcadeMode);
            chapterScreen.classList.toggle('abl-select-theme', this.game.stateManager?.isABLMode?.() === true);
        }

        const isGrid12 = isArcadeMode || this.game.stateManager?.isABLMode?.() === true;

        if (isGrid12) {
            if (isArcadeMode) {
                this._applyArcadeSelectBackground();
            } else {
                // Clear inline backgrounds from Arcade mode if in ABL mode
                if (chapterScreen) {
                    chapterScreen.style.backgroundImage = '';
                    chapterScreen.style.backgroundSize = '';
                    chapterScreen.style.backgroundPosition = '';
                }
            }
            grid.classList.add('arcade-grid-12');
        } else {
            grid.classList.remove('arcade-grid-12');
            grid.style.background = '';
            if (chapterScreen) {
                chapterScreen.style.backgroundImage = '';
                chapterScreen.style.backgroundSize = '';
                chapterScreen.style.backgroundPosition = '';
            }
        }

        // Limpiar el grid estático
        grid.innerHTML = '';

        Object.entries(registry).forEach(([id, config]) => {
            const card = document.createElement('div');
            card.className = `chapter-card ch-${id} locked`;
            card.id = `btn-ch-${id}`;
            card.dataset.chapter = id;

            const isArcadeMode = this.game.stateManager?.isArcadeMode?.() === true;

            // Aplicar fondo temático dinámico (Regla de Capa Única)
            if (config.assetsDir && !isABLMode && !isArcadeMode) {
                // Modo Campaña: Usar la imagen oficial del capítulo 
                const bgPath = `assets/${config.assetsDir}/fondos/nivel_1/fondo_intermedio.webp`;
                card.style.backgroundImage = `url('${bgPath}')`;
                card.style.backgroundSize = 'cover';
                card.style.backgroundPosition = 'center';
                card.style.backgroundRepeat = 'no-repeat';

                if (config.colors && config.colors.length > 0) {
                    card.style.border = `2px solid ${config.colors[0]}88`;
                    card.style.boxShadow = `inset 0 0 20px rgba(0,0,0,0.4), 0 8px 25px rgba(0,0,0,0.3)`;
                }
            } else if (isArcadeMode) {
                // Modo Arcade: Estilo Retro Premium (Pixelated Look)
                const c1 = config.colors[0];
                const c2 = config.colors[1];
                const c3 = config.colors[2] || c1;

                card.classList.add('arcade-premium-card');
                card.style.background = `
                    repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px),
                    radial-gradient(circle at 50% 50%, ${c1}cc 0%, transparent 60%),
                    linear-gradient(135deg, #0f172a 0%, #000 100%)`;
                card.style.border = `2px solid ${c2}`;
                card.style.boxShadow = `0 0 15px ${c1}66, inset 0 0 10px rgba(0,255,100,0.1)`;
                card.style.imageRendering = 'pixelated';
            } else if (config.colors && config.colors.length >= 2) {
                // Fallback para ABL
                card.style.background = `linear-gradient(135deg, ${config.colors[0]} 0%, ${config.colors[1]} 100%)`;
                card.style.border = `2px solid ${config.colors[0]}44`;
            }

            card.onclick = () => window.LoadChapter(parseInt(id), card);

            if (isGrid12) {
                card.innerHTML = `
                    <div class="ch-name-top">${config.name}</div>
                    <div class="chapter-info">
                        <span class="ch-lock">LOCKED</span>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <div class="chapter-thumb"><span>${config.icon}</span></div>
                    <div class="chapter-info">
                        <span class="ch-num">${id.padStart(2, '0')}</span>
                        <span class="ch-name">${config.name}</span>
                        <span class="ch-character">${config.character || ''}</span>
                        <span class="ch-lock" style="display:${isAdaptiveModes ? 'inline-block' : 'none'}">LOCK ${(config.unlockScore || 0)}</span>
                    </div>
                `;
            }
            grid.appendChild(card);
        });
    }

    _applyArcadeSelectBackground() {
        const screen = document.querySelector('.chapter-screen');
        if (!screen) return;

        const cvs = document.createElement('canvas');
        cvs.width = 1280;
        cvs.height = 720;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        const g = ctx.createLinearGradient(0, 0, 0, 720);
        g.addColorStop(0, '#080711');
        g.addColorStop(0.5, '#0f0c1f');
        g.addColorStop(1, '#05060c');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1280, 720);

        for (let i = 0; i < 24; i++) {
            const x = Math.random() * 1280;
            const y = Math.random() * 720;
            const r = 80 + Math.random() * 220;
            const c = ['rgba(146,74,255,0.16)', 'rgba(67,182,255,0.14)', 'rgba(255,76,153,0.12)'][i % 3];
            const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
            rg.addColorStop(0, c);
            rg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rg;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let y = 0; y < 720; y += 3) {
            ctx.fillStyle = y % 6 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
            ctx.fillRect(0, y, 1280, 1);
        }

        const data = cvs.toDataURL('image/png');
        screen.style.backgroundImage = `url('${data}')`;
        screen.style.backgroundSize = 'cover';
        screen.style.backgroundPosition = 'center';
    }

    updateSettingsUI() {
        const musicToggle = document.getElementById('toggle-music');
        const soundToggle = document.getElementById('toggle-sound');

        if (musicToggle) {
            if (this.game.isMusicOn) musicToggle.classList.add('on');
            else musicToggle.classList.remove('on');
        }

        if (soundToggle) {
            // Default to on if not explicitly off
            const isOn = (this.game.isSoundOn !== false);
            if (isOn) soundToggle.classList.add('on');
            else soundToggle.classList.remove('on');
        }

        this.updateAudioStatus();
    }

    updateTrophyRecords() {
        const stats = this.game.stats || {};

        // 1. Novice Jumper - Score 1000
        const trophyScore1k = document.getElementById('trophy-score1k');
        if (trophyScore1k) trophyScore1k.textContent = `${(this.game.highScore || 0).toLocaleString()} / 1,000`;

        // 2. Sky Master - Score 10000
        const trophyScore10k = document.getElementById('trophy-score10k');
        if (trophyScore10k) trophyScore10k.textContent = `${(this.game.highScore || 0).toLocaleString()} / 10,000`;

        // 3. Coin Collector - 50 coins
        const trophyCoins50 = document.getElementById('trophy-coins50');
        if (trophyCoins50) trophyCoins50.textContent = `${this.game.totalCoins || 0} / 50`;

        // 4. Deep Diver - Chapter 4
        const trophyChapter4 = document.getElementById('trophy-chapter4');
        if (trophyChapter4) trophyChapter4.textContent = `Ch. ${this.game.maxChapter || 1}`;

        // 5. Astronaut - Chapter 8
        const trophyChapter8 = document.getElementById('trophy-chapter8');
        if (trophyChapter8) trophyChapter8.textContent = `Ch. ${this.game.maxChapter || 1}`;

        // 6. Combo King - 10x
        const trophyCombo10 = document.getElementById('trophy-combo10');
        if (trophyCombo10) trophyCombo10.textContent = `${this.game.maxMult || 0}x`;

        // 7. First Blood - explosions
        const trophyFirstBlood = document.getElementById('trophy-first_blood');
        if (trophyFirstBlood) trophyFirstBlood.textContent = (stats.explotions || 0) > 0 ? 'SÍ' : 'NO';

        // 8. Speed Demon - 3 dashes in air
        const trophySpeedDemon = document.getElementById('trophy-speed_demon');
        if (trophySpeedDemon) trophySpeedDemon.textContent = `${stats.maxAirDashes || 0}`;

        // 9. Untouchable - levels no damage
        const trophyUntouchable = document.getElementById('trophy-untouchable');
        if (trophyUntouchable) trophyUntouchable.textContent = `${stats.levelsNoDamage || 0}`;

        // 10. Banana King - 100 bananas
        const trophyBananaKing = document.getElementById('trophy-banana_king');
        if (trophyBananaKing) trophyBananaKing.textContent = `${stats.totalBananas || 0} / 100`;

        // 11. Candy Crusher - 50 green candies
        const trophyCandyCrusher = document.getElementById('trophy-candy_crusher');
        if (trophyCandyCrusher) trophyCandyCrusher.textContent = `${stats.totalGreenCandies || 0} / 50`;

        // 12. Combo God - double combo
        const trophyComboGod = document.getElementById('trophy-combo_god');
        if (trophyComboGod) trophyComboGod.textContent = stats.doubleComboInLife ? 'SÍ' : 'NO';
    }
}
