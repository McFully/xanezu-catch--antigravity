export class AchievementManager {
    constructor(game) {
        this.game = game;
        this.achievements = [
            { id: 'score1k', title: 'Novice Jumper', desc: 'Score 1,000 Points', check: (g) => g.score >= 1000, icon: '🥉' },
            { id: 'score10k', title: 'Sky Master', desc: 'Score 10,000 Points', check: (g) => g.score >= 10000, icon: '🥇' },
            { id: 'coins50', title: 'Coin Collector', desc: 'Collect 50 Total Coins', check: (g) => g.totalCoins >= 50, icon: '💰' },
            { id: 'chapter4', title: 'Deep Diver', desc: 'Reach The Ocean', check: (g) => g.chapter >= 4, icon: '🌊' },
            { id: 'chapter8', title: 'Astronaut', desc: 'Reach Space', check: (g) => g.chapter >= 8, icon: '👩‍🚀' },
            { id: 'combo10', title: 'Combo King', desc: 'Reach 10x Modifier', check: (g) => g.mult >= 10, icon: '🔥' },
            { id: 'first_blood', title: 'First Blood', desc: 'First Explosion Combo!', check: (g) => g.stats.explosions > 0, icon: '🍌' },
            { id: 'speed_demon', title: 'Speed Demon', desc: '3 Dashes in air!', check: (g) => g.stats.maxAirDashes >= 3, icon: '⚡' },
            { id: 'untouchable', title: 'Untouchable', desc: 'Level without damage', check: (g) => g.stats.levelNoDamage, icon: '🛡️' },
            { id: 'banana_king', title: 'Banana King', desc: '100 Bananas total', check: (g) => g.stats.totalBananas >= 100, icon: '👑' },
            { id: 'candy_crusher', title: 'Candy Crusher', desc: '50 Green Candies total', check: (g) => g.stats.totalGreenCandies >= 50, icon: '🍬' },
            { id: 'combo_god', title: 'Combo God', desc: 'Double combo in one life', check: (g) => g.stats.doubleComboInLife, icon: '🙌' }
        ];
        this.unlocked = JSON.parse(localStorage.getItem('mx_achievements') || '[]');

        // 🎬 TICKER LOGIC: Ahora es puramente lógica, UIManager se encarga del renderizado
        this.currentAchievement = null;
        this.queue = [];
        this.isShowing = false;
    }

    check() {
        this.achievements.forEach(ach => {
            if (!this.unlocked.includes(ach.id) && ach.check(this.game)) {
                this.unlock(ach);
            }
        });
    }

    unlock(ach) {
        if (this.unlocked.includes(ach.id)) return;
        this.unlocked.push(ach.id);
        localStorage.setItem('mx_achievements', JSON.stringify(this.unlocked));
        this.queueToast(ach);
        if (this.game.triggerFlash) {
            const flashColor = this.game.characterTheme?.particlePrimary || '#FFD700';
            this.game.triggerFlash(flashColor, 20);
        }
        if (this.game.synth) this.game.synth.playAchievementFanfare();
    }

    queueToast(ach) {
        this.queue.push(ach);
        if (!this.isShowing) this.processQueue();
    }

    processQueue() {
        if (this.queue.length === 0) {
            this.currentAchievement = null;
            this.isShowing = false;
            return;
        }

        this.isShowing = true;
        const ach = this.queue.shift();
        this.showToast(ach);

        // Los logros duran 8s debido a la animación ticker-scroll
        setTimeout(() => {
            this.processQueue();
        }, 8500);
    }

    showToast(ach) {
        // Establecer el logro actual para que sea capturado por el render() de UIManager
        this.currentAchievement = ach;
    }
}
