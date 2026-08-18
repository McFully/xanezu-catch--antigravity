export class ShopManager {
    constructor(game) {
        this.game = game;
        this.catalog = {
            consumables: {
                'magnet': { name: 'Imán de Frutas', price: 150, icon: '🧲', desc: 'Atrae frutas cercanas' },
                'shield': { name: 'Escudo Burbuja', price: 250, icon: '🫧', desc: 'Protege de un impacto' },
                'timer': { name: 'Reloj Lento', price: 300, icon: '⏳', desc: 'Ralentiza el tiempo' }
            },
            upgrades: {
                'jump_power': { name: 'Super Salto', basePrice: 1000, step: 500, max: 5 },
                'dash_cd': { name: 'Recarga Dash', basePrice: 1500, step: 750, max: 3 }
            },
            skins: {
                'gold': { name: 'Xanezu Dorado', price: 10000, requirement: 'chapter_5_complete' },
                'neon': { name: 'Xanezu Cyber', price: 25000, requirement: 'score_100k' }
            }
        };
    }

    buyConsumable(id) {
        const item = this.catalog.consumables[id];
        if (!item || this.game.totalCoins < item.price) return false;

        this.game.totalCoins -= item.price;
        this.game.unlocks[id] = (this.game.unlocks[id] || 0) + 1;
        this.game.saveSystem.saveCoins(this.game.totalCoins);
        this.game.saveSystem.saveUnlocks(this.game.unlocks);
        return true;
    }

    buyUpgrade(id) {
        const upgrade = this.catalog.upgrades[id];
        const currentLevel = this.game.skills[id] || 0;
        if (!upgrade || currentLevel >= upgrade.max) return false;

        const price = upgrade.basePrice + (currentLevel * upgrade.step);
        if (this.game.totalCoins < price) return false;

        this.game.totalCoins -= price;
        this.game.skills[id] = currentLevel + 1;
        this.game.saveSystem.saveCoins(this.game.totalCoins);
        this.game.saveSystem.saveSkills(this.game.skills);
        return true;
    }

    unlockSkin(id) {
        const skin = this.catalog.skins[id];
        if (!skin || this.game.totalCoins < skin.price) return false;
        if (this.game.unlocks.skins.includes(id)) return true;

        this.game.totalCoins -= skin.price;
        this.game.unlocks.skins.push(id);
        this.game.saveSystem.saveCoins(this.game.totalCoins);
        this.game.saveSystem.saveUnlocks(this.game.unlocks);
        return true;
    }
}
