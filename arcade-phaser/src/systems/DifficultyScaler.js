export class DifficultyScaler {
  getLevelFromScore(score) {
    return Math.max(1, Math.min(10, 1 + Math.floor(score / 1200)));
  }

  speedMultiplier(baseSpeed, level) {
    return baseSpeed + (level * 0.15);
  }

  bpm(base, level) {
    return base + ((level - 1) * 5);
  }
}
