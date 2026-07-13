export class ScoreSystem {
    constructor(initialScoreGlobal = 0) {
        this.scoreGlobal = Math.max(0, Math.floor(initialScoreGlobal || 0));
    }

    getProjectedTotal(runScore) {
        return this.scoreGlobal + Math.max(0, Math.floor(runScore || 0));
    }

    commitRunScore(runScore) {
        this.scoreGlobal = this.getProjectedTotal(runScore);
        return this.scoreGlobal;
    }
}
