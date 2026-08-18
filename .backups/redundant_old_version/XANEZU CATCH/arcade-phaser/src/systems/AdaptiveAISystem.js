export class AdaptiveAISystem {
  constructor(events) {
    this.events = events;
    this.params = { spawnRate: 1000, speedFactor: 1.0, hitboxScale: 1.0, patternRisk: 0.5, powerupRate: 0.15 };
    this.events.on('performance:update', (index) => this.apply(index));
  }

  apply(performanceIndex) {
    const t = performanceIndex / 100;
    this.params.spawnRate = 1200 - (500 * t);
    this.params.speedFactor = 0.9 + (0.6 * t);
    this.params.hitboxScale = 1.08 - (0.18 * t);
    this.params.patternRisk = 0.3 + (0.6 * t);
    this.params.powerupRate = 0.25 - (0.12 * t);
    this.events.emit('ai:params', { ...this.params });
  }
}
