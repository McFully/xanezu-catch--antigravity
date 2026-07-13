export class GameStateManager {
    constructor() {
        this.mode = 'CAMPAIGN';
    }

    setMode(mode) {
        this.mode = mode || 'CAMPAIGN';
    }

    isArcadeMode() {
        return this.mode === 'ARCADE';
    }

    isABLMode() {
        return this.mode === 'ABL';
    }

    isCampaignMode() {
        return this.mode === 'CAMPAIGN';
    }
}
