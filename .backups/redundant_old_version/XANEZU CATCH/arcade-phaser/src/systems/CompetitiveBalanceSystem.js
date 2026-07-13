export class CompetitiveBalanceSystem {
  constructor() {
    this.internalPercentile = 50;
  }

  calibrate(learningData) {
    const scoreNorm = Math.max(0, Math.min(100, learningData.avgScore / 150));
    this.internalPercentile = Math.round((learningData.avgPerformance * 0.6) + (scoreNorm * 0.4));
    return this.internalPercentile;
  }

  getInvisibleAssist() {
    if (this.internalPercentile < 35) return { extraPowerupChance: 0.1, speedNerf: 0.08 };
    if (this.internalPercentile > 80) return { extraPowerupChance: -0.03, speedNerf: -0.06 };
    return { extraPowerupChance: 0, speedNerf: 0 };
  }
}
