export class MilestoneManager {
    constructor(game) {
        this.game = game;
        this.milestones = [];
        this.reached = JSON.parse(localStorage.getItem('mx_milestones_reached') || '[]');
        this.generateMoreThan1000();
        this._updateTick = 0;
    }

    generateMoreThan1000() {
        for (let i = 1; i <= 500; i++) {
            this.milestones.push({ id: `score_${i}`, title: `Score Reach: ${(i * 1000).toLocaleString()} Pts`, check: (g) => g.highScore >= i * 1000 });
        }
        for (let i = 1; i <= 200; i++) {
            const val = i * 10;
            this.milestones.push({ id: `catch_${i}`, title: `Caught: ${val} Items Total`, check: (g) => g.totalItemsCaught >= val });
        }
        for (let i = 1; i <= 100; i++) {
            this.milestones.push({ id: `death_${i}`, title: `Hardships Endured: ${i} Times`, check: (g) => g.totalDeaths >= i });
        }
        for (let i = 1; i <= 100; i++) {
            this.milestones.push({ id: `dash_${i}`, title: `Speed Demon: ${i * 50} Dashes`, check: (g) => g.totalDashes >= i * 50 });
        }
        for (let i = 1; i <= 100; i++) {
            this.milestones.push({ id: `time_${i}`, title: `Veteran: ${i} Minutes Played`, check: (g) => g.totalTimePlayed >= i * 60 * 60 });
        }
        for (let i = 1; i <= 50; i++) {
            this.milestones.push({ id: `level_${i}`, title: `Ascension: Level ${i} Reached`, check: (g) => g.highLevelReached >= i });
        }
    }

    update() {
        this._updateTick++;
        if (this._updateTick < 60) return; // Only check once per second
        this._updateTick = 0;

        this.milestones.forEach(m => {
            if (!this.reached.includes(m.id) && m.check(this.game)) {
                this.reached.push(m.id);
                localStorage.setItem('mx_milestones_reached', JSON.stringify(this.reached));
                // Silence death milestones during gameplay - they are annoying
                if (!m.id.startsWith('death_')) {
                    this.game.achievements.showToast({ title: "Trophy Unlocked!", desc: m.title, icon: "🏆" });
                }
            }
        });
    }
}
