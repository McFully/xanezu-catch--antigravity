const KEY = 'abl-learning-v1';

export class PersistentLearningSystem {
  load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{"runs":0,"avgPerformance":50,"avgScore":0}');
    } catch (e) {
      return { runs: 0, avgPerformance: 50, avgScore: 0 };
    }
  }

  saveRun(performance, score) {
    const prev = this.load();
    const runs = prev.runs + 1;
    const avgPerformance = ((prev.avgPerformance * prev.runs) + performance) / runs;
    const avgScore = ((prev.avgScore * prev.runs) + score) / runs;
    const next = { runs, avgPerformance, avgScore };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }
}
