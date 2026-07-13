export class PerformanceTracker {
  constructor(events) {
    this.events = events;
    this.reset();
  }

  reset() {
    this.stats = { survivalTime: 0, errors: 0, reactionSamples: [], skillUses: 0, score: 0 };
  }

  update(dtMs, score) {
    this.stats.survivalTime += dtMs;
    this.stats.score = score;
    this.events.emit('performance:update', this.getPerformanceIndex());
  }

  recordError() { this.stats.errors += 1; }
  recordReaction(ms) { this.stats.reactionSamples.push(ms); }
  recordSkillUse() { this.stats.skillUses += 1; }

  getPerformanceIndex() {
    const avgReaction = this.stats.reactionSamples.length
      ? this.stats.reactionSamples.reduce((a, b) => a + b, 0) / this.stats.reactionSamples.length
      : 280;
    const reactionScore = Math.max(0, Math.min(100, 100 - ((avgReaction - 120) / 3)));
    const survivalScore = Math.max(0, Math.min(100, this.stats.survivalTime / 250));
    const errorPenalty = Math.min(60, this.stats.errors * 6);
    const skillBonus = Math.min(20, this.stats.skillUses * 1.5);
    const scoreBonus = Math.min(30, this.stats.score / 500);
    return Math.max(0, Math.min(100, ((reactionScore * 0.35) + (survivalScore * 0.35) + skillBonus + scoreBonus) - errorPenalty));
  }
}
