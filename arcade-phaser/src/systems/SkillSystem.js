export class SkillSystem {
  constructor() {
    this.skill = null;
    this.cooldown = 0;
  }

  configure(character) {
    const map = {
      'Caballero Real': { id: 'shield', cd: 4900, scoreMult: 1.08 },
      'Aldeano Valiente': { id: 'dash', cd: 4200, scoreMult: 1.1 },
      'Explorador Oscuro': { id: 'phase', cd: 5200, scoreMult: 1.14 },
      'Arqueologo': { id: 'relicBurst', cd: 4800, scoreMult: 1.13 },
      'Minero Luminoso': { id: 'crystalPulse', cd: 5000, scoreMult: 1.16 },
      'Marinero': { id: 'tidalDrift', cd: 4500, scoreMult: 1.11 },
      'Guardian': { id: 'fortressGuard', cd: 5200, scoreMult: 1.12 },
      'Vikingo': { id: 'axeStorm', cd: 4700, scoreMult: 1.15 },
      'Espiritu Errante': { id: 'spectralBlink', cd: 4300, scoreMult: 1.12 },
      'Explorador Volcanico': { id: 'lavaDash', cd: 4600, scoreMult: 1.17 },
      'Sacerdote Arcano': { id: 'choirBarrier', cd: 5400, scoreMult: 1.14 },
      'Vikingo Lider': { id: 'ragnarCall', cd: 5600, scoreMult: 1.2 }
    };
    this.skill = map[character] || { id: 'focus', cd: 5000, scoreMult: 1.1 };
    this.cooldown = 0;
  }

  update(dtMs) {
    this.cooldown = Math.max(0, this.cooldown - dtMs);
  }

  tryUse() {
    if (!this.skill || this.cooldown > 0) return false;
    this.cooldown = this.skill.cd;
    return true;
  }

  getScoreMultiplier() {
    return this.skill ? this.skill.scoreMult : 1;
  }
}
