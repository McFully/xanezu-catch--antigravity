/**
 * Nexus Premium Interface Controller
 * XANEZU CATCH - Antigravity Build
 */

const Nexus = {
    isOpen: false,
    activeTab: 'rewards',
    
    // Mock data for initial features
    features: {
        rewards: [
            { id: 'daily_gold', icon: '💰', title: 'Recompensa Diaria', desc: 'Recoge 100 monedas de oro cada 24 horas.', price: 'GRATIS', action: 'Recoger' },
            { id: 'premium_pass', icon: '🎟️', title: 'Xanezu Pass', desc: 'Desbloquea multiplicadores de puntos y skins exclusivas.', price: '1.99€', action: 'Comprar' },
            { id: 'double_exp', icon: '⚡', title: 'Doble XP (1h)', desc: 'Aumenta tu ganancia de experiencia durante una hora.', price: '500G', action: 'Activar' }
        ],
        stats: {
            games_played: 124,
            high_score: 15420,
            total_bananas: 890,
            level: 12,
            rank: 'Oro III'
        },
        premium: [
            { id: 'ad_free', icon: '🚫', title: 'Sin Anuncios', desc: 'Elimina todos los anuncios y banners del juego.', price: '4.99€', action: 'Desbloquear' },
            { id: 'dark_matter_skin', icon: '✨', title: 'Skin Materia Oscura', desc: 'Atrapa frutas con un efecto visual estelar único.', price: '1200G', action: 'Comprar' },
            { id: 'vip_status', icon: '💎', title: 'Estatus VIP', desc: 'Prioridad máxima en eventos y medalla exclusiva.', price: '9.99€', action: 'Unirse' }
        ]
    },

    init() {
        console.log("🚀 Nexus Initialized");
        this.render();
        this.setupEventListeners();
    },

    render() {
        const overlay = document.createElement('div');
        overlay.id = 'nexus-overlay';
        overlay.innerHTML = `
            <div class="nexus-container">
                <div class="nexus-header">
                    <div class="nexus-title-group">
                        <div class="nexus-logo-icon">X</div>
                        <h2 class="nexus-title">NEXUS PREMIUM</h2>
                    </div>
                    <div class="nexus-close" id="nexus-close-btn">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
                
                <div class="nexus-tabs">
                    <div class="nexus-tab active" data-tab="rewards">RECOMPENSAS</div>
                    <div class="nexus-tab" data-tab="stats">MIS STATS</div>
                    <div class="nexus-tab" data-tab="premium">TIENDA PREMIUM</div>
                </div>

                <div class="nexus-content">
                    <div class="nexus-section active" id="nexus-rewards">
                        <div class="nexus-grid">
                            ${this.renderGrid(this.features.rewards)}
                        </div>
                    </div>
                    <div class="nexus-section" id="nexus-stats">
                        <div class="stats-header">
                            <div class="stat-box">
                                <div class="stat-value">${this.features.stats.level}</div>
                                <div class="stat-label">Nivel</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${this.features.stats.high_score}</div>
                                <div class="stat-label">Mejor Puntuación</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${this.features.stats.rank}</div>
                                <div class="stat-label">Rango Global</div>
                            </div>
                        </div>
                        <div class="nexus-grid">
                            <div class="nexus-item-card">
                                <div class="nexus-item-icon">🍌</div>
                                <div class="nexus-item-title">Frutas Atrapadas</div>
                                <div class="nexus-item-desc">Total de frutas recolectadas: <strong>${this.features.stats.total_bananas}</strong></div>
                            </div>
                            <div class="nexus-item-card">
                                <div class="nexus-item-icon">🎮</div>
                                <div class="nexus-item-title">Partidas Jugadas</div>
                                <div class="nexus-item-desc">Has completado <strong>${this.features.stats.games_played}</strong> partidas desde tu registro.</div>
                            </div>
                        </div>
                    </div>
                    <div class="nexus-section" id="nexus-premium">
                        <div class="nexus-grid">
                            ${this.renderGrid(this.features.premium)}
                        </div>
                    </div>
                </div>

                <div class="nexus-footer-promo">
                    <span class="nexus-badge">INFO</span>
                    Todas las compras ayudan a financiar el desarrollo de Antigravity Labs.
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Cache elements
        this.overlay = overlay;
        this.container = overlay.querySelector('.nexus-container');
    },

    renderGrid(items) {
        return items.map(item => `
            <div class="nexus-item-card" data-id="${item.id}">
                <div class="nexus-item-icon">${item.icon}</div>
                <div class="nexus-item-title">${item.title}</div>
                <div class="nexus-item-desc">${item.desc}</div>
                <div class="nexus-item-footer">
                    <span class="nexus-price">${item.price}</span>
                    <button class="nexus-btn">${item.action}</button>
                </div>
            </div>
        `).join('');
    },

    setupEventListeners() {
        // Toggle Buttons (we will need to add these to the menu)
        document.getElementById('nexus-close-btn').addEventListener('click', () => this.close());
        
        // Tab system
        const tabs = this.overlay.querySelectorAll('.nexus-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Prevention of propagation
        this.container.addEventListener('click', (e) => e.stopPropagation());
    },

    switchTab(tabId) {
        if (this.activeTab === tabId) return;
        
        // Update UI
        this.overlay.querySelectorAll('.nexus-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabId);
        });

        this.overlay.querySelectorAll('.nexus-section').forEach(s => {
            s.classList.toggle('active', s.id === `nexus-${tabId}`);
        });

        this.activeTab = tabId;
        this.vibrate(10);
    },

    open() {
        this.overlay.classList.add('active');
        this.vibrate(20);
        document.body.classList.add('nexus-open'); // For potential body styling
    },

    close() {
        this.overlay.classList.remove('active');
        this.vibrate(5);
        document.body.classList.remove('nexus-open');
    },

    vibrate(ms) {
        if ('vibrate' in navigator) navigator.vibrate(ms);
    }
};

// Auto-init on load
window.addEventListener('DOMContentLoaded', () => Nexus.init());

// Global access for the menu
window.Nexus = Nexus;
