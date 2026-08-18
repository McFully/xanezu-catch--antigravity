export class PlayerProfileSystem {
  classify(metrics) {
    const { errors = 0, skillUses = 0, avgReaction = 280, speedBias = 0.5 } = metrics;
    if (avgReaction < 180 && speedBias > 0.7) return 'Speedrunner';
    if (errors < 3 && avgReaction < 220) return 'Preciso';
    if (skillUses > 20 && errors < 8) return 'Estrategico';
    if (errors > 18) return 'Caotico';
    if (speedBias > 0.65) return 'Agresivo';
    return 'Conservador';
  }

  riskReward(profile) {
    const table = {
      Conservador: { risk: 0.35, reward: 1.0 },
      Agresivo: { risk: 0.75, reward: 1.35 },
      Preciso: { risk: 0.6, reward: 1.25 },
      Caotico: { risk: 0.7, reward: 1.1 },
      Speedrunner: { risk: 0.85, reward: 1.45 },
      Estrategico: { risk: 0.55, reward: 1.3 }
    };
    return table[profile] || table.Conservador;
  }
}
