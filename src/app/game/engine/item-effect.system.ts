import { IEntity } from './entity.model';
import { Obstacle } from '../entities/obstacle';
import { CollectibleItem, ItemType } from '../entities/item';
import { IGameEngineContext } from './engine.interfaces';
import { calculateLevelFromXP, XP_PROGRESSION_TABLE } from '../../core/constants/progression.constants';

export class ItemEffectSystem {
  constructor(private engine: IGameEngineContext) {}

  public handleCollision(ent: IEntity, index: number): void {
    if (ent instanceof Obstacle) {
      this.handleObstacleCollision(ent, index);
    } else if (ent instanceof CollectibleItem) {
      this.handleItemCollision(ent, index);
    }
  }

  private handleObstacleCollision(ent: Obstacle, index: number): void {
    if (this.engine.bananaComboActive) return;

    if (this.engine.player.shieldActive) {
      this.engine.player.shieldActive = false;
      this.engine.audio.playDamage();
      this.engine.addTrauma(0.3);
      this.engine.triggerFlash('#00f2ff', 5);
      this.engine.particles.addFloatingText(ent.x, ent.y, 'ESCUDO USADO', '#00f2ff', 30, 'pop');
      this.engine.entities.splice(index, 1);
      this.engine.notifyHudChange();
      return;
    }

    this.engine.audio.playDamage();
    this.engine.player.lives--;
    this.engine.player.health = Math.max(0, (this.engine.player.lives / 3) * 100);
    this.engine.particles.spawn(ent.x, ent.y, '#FF4D4D', 20, 'square');

    if (this.engine.mode.toUpperCase() === 'ABLIA') {
      const theme = this.engine.abliaRenderer.getThemeColors();
      this.engine.particles.spawn(ent.x, ent.y, theme.accent, 15, 'shard');
      this.engine.abliaRenderer.triggerAB();
    }

    this.engine.particles.addFloatingText(ent.x, ent.y - 20, '-1 VIDA ❤️', '#FF0000', 40, 'shake');
    this.engine.addTrauma(0.5);
    this.engine.triggerFlash('#FF0000', 10);
    this.engine.entities.splice(index, 1);

    if (this.engine.player.lives <= 0) {
      if (this.engine.hasRevive) {
        this.engine.hasRevive = false;
        localStorage.setItem('shop_item_revive', 'false');
        this.engine.player.lives = 1;
        this.engine.player.health = 40;
        this.engine.particles.addFloatingText(this.engine.player.x, this.engine.player.y - 40, '¡REANIMACIÓN ACTIVA! 💉', '#00FF64', 32, 'pop');
      } else {
        this.engine.triggerGameOver();
      }
    }
    this.engine.notifyHudChange();
  }

  private handleItemCollision(ent: CollectibleItem, index: number): void {
    let col = '#FFE135';
    let points = 50;
    const sName = (ent as any).spriteName || 'coin';
    let abilityText = '';

    this.engine.sessionItemsBySprite[sName] = (this.engine.sessionItemsBySprite[sName] || 0) + 1;

    if (sName === 'shield') {
      this.engine.player.shieldActive = true;
      col = '#00f2ff'; points = 100; abilityText = 'ESCUDO ACTIVADO 🛡️';
    } else if (sName === 'magnet') {
      this.engine.player.magnetT = 15;
      col = '#ff79c6'; points = 100; abilityText = 'IMÁN ACTIVADO 🧲';
    } else if (sName === 'star') {
      this.engine.multiplier = this.engine.multiplier === 1 ? 2 : this.engine.multiplier * 2;
      this.engine.multiplierTimeLeft = this.engine.multiplierDuration;
      this.engine.multiplierTimer = 100;
      this.engine.maxMultiplier = Math.max(this.engine.maxMultiplier, this.engine.multiplier);
      col = '#A6F616'; points = 100; abilityText = `MULTIPLICADOR x${this.engine.multiplier} 🌟`;
    } else if (sName === 'bolt') {
      this.engine.currentSpeed = Math.min(15, this.engine.currentSpeed + 1.5);
      col = '#ffd84d'; points = 150; abilityText = 'SUPER VELOCIDAD ⚡';
    } else if (sName === 'bomb') {
      col = '#ff4d4d'; points = 120; abilityText = 'DETONACIÓN ACTIVA 💣';
      this.explodeObstacles('#ff4d4d', 20);
      this.engine.addTrauma(0.4);
      this.engine.triggerFlash('#ff4d4d', 10);
    } else if (sName === 'clock') {
      this.engine.currentSpeed = Math.max(5, this.engine.currentSpeed - 2.5);
      col = '#00f2ff'; points = 100; abilityText = 'TIEMPO LENTIFICADO ⏱️';
    } else if (sName === 'clover') {
      col = '#7cf27c'; points = 300; abilityText = 'SUERTE TRÉBOL +300 🍀';
    } else if (sName === 'crown') {
      col = '#ffd700'; points = 500; abilityText = 'CORONA REAL +500 👑';
    } else if (sName === 'emerald') {
      this.engine.sessionGems++;
      col = '#2ecc71'; points = 300; abilityText = 'ESMERALDA RARA +300 💎';
    } else if (sName === 'pearl') {
      this.engine.sessionGems++;
      col = '#f3e5ab'; points = 250; abilityText = 'PERLA MARINA +250 🦪';
    } else if (sName === 'feather') {
      this.engine.player.vy = -14;
      col = '#e0f7fa'; points = 100; abilityText = 'SALTO FLOTANTE 🪶';
    } else if (sName === 'fly_gold') {
      col = '#ffd700'; points = 400; abilityText = 'MOSCA DORADA +400 🪰';
    } else if (sName === 'ghost') {
      this.engine.bananaComboActive = true;
      this.engine.bananaComboTimer = 5.0;
      col = '#cfd8dc'; points = 150; abilityText = 'MODO INVISIBLE (FANTASMA) 👻';
    } else if (sName === 'gift') {
      col = '#ff8a80'; points = 180; abilityText = 'REGALO DE PUNTOS +180 🎁';
    } else if (sName === 'hourglass') {
      col = '#ffe082'; points = 200; abilityText = 'TIEMPO EXTRA +200 ⏳';
    } else if (sName === 'ice') {
      this.engine.currentSpeed = 4;
      col = '#80deea'; points = 100; abilityText = 'PANTALLA CONGELADA ❄️';
    } else if (sName === 'mini') {
      col = '#a5d6a7'; points = 150; abilityText = 'MINI RANA +150 🐸';
    } else if (sName === 'rainbow') {
      this.engine.bananaComboActive = true;
      this.engine.bananaComboTimer = 6.0;
      this.engine.multiplier = Math.max(this.engine.multiplier * 2, 4);
      this.engine.multiplierTimeLeft = this.engine.multiplierDuration;
      this.engine.multiplierTimer = 100;
      this.engine.maxMultiplier = Math.max(this.engine.maxMultiplier, this.engine.multiplier);
      col = '#ff80ab'; points = 250; abilityText = 'MODO ARCOÍRIS ACTIVADO 🌈';
    } else if (sName === 'banana') {
      this.engine.player.bananasCollected++;
      col = '#FFE135'; points = 50;
      abilityText = `BANANAS COMBO +1 (${this.engine.player.bananasCollected}/5) 🍌`;
      if (this.engine.player.bananasCollected >= 5) {
        this.triggerBananaCombo();
      }
    } else if (sName === 'heart') {
      this.engine.player.extraLifeProgress++;
      col = '#FF4D4D'; points = 80;
      abilityText = `VIDA EXTRA +1 (${this.engine.player.extraLifeProgress}/10) ❤️`;
      if (this.engine.player.extraLifeProgress >= 10) {
        this.engine.player.extraLifeProgress = 0;
        this.engine.player.lives++;
        this.engine.particles.addFloatingText(ent.x, ent.y - 70, '¡+1 VIDA EXTRA! ❤️', '#FF2975', 32, 'pop');
      }
    } else if (sName.startsWith('candy_')) {
      if (!this.engine.player.collectedCandyTypes.includes(sName)) {
        this.engine.player.collectedCandyTypes.push(sName);
      }
      this.engine.player.bombsCollected = this.engine.player.collectedCandyTypes.length;
      col = '#ff79c6'; points = 60;
      abilityText = `CHUCHES COMBO (${this.engine.player.bombsCollected}/10) 🍬`;
      if (this.engine.player.bombsCollected >= 10) {
        this.triggerCandyCombo();
        points += 500;
      }
    } else if (ent.type === ItemType.COIN) {
      this.engine.coins++;
      this.engine.sessionCoins++;
      col = '#FFD700';
      abilityText = `MONEDA +${points * this.engine.multiplier} 🪙`;
    } else if (ent.type === ItemType.GEM) {
      points = 200;
      this.engine.sessionGems++;
      col = '#00f2ff';
      abilityText = `GEMA +${points * this.engine.multiplier} 💎`;
    } else {
      abilityText = `OBJETO +${points * this.engine.multiplier} ✨`;
    }

    this.engine.score += points * this.engine.multiplier;
    this.engine.audio.playCollect(Math.floor(this.engine.score / 1000));
    this.engine.particles.spawn(ent.x + ent.w / 2, ent.y + ent.h / 2, col, 15, 'circle');
    this.engine.particles.addFloatingText(ent.x + ent.w / 2, ent.y - 45, abilityText, col, 26, 'pop');

    const nextLvl = calculateLevelFromXP(this.engine.score);
    const currentThreshold = nextLvl === 0 ? 0 : XP_PROGRESSION_TABLE[nextLvl];
    const nextThreshold = XP_PROGRESSION_TABLE[nextLvl + 1] || 350000;
    const remaining = Math.max(0, nextThreshold - currentThreshold - (this.engine.score - currentThreshold));
    this.engine.particles.addFloatingText(ent.x + ent.w / 2, ent.y - 15, `Faltan ${remaining} pts`, '#00f2ff', 20, 'shake');

    this.engine.entities.splice(index, 1);
    this.engine.notifyHudChange();
  }

  public triggerBananaCombo(): void {
    this.engine.player.bananasCollected = 0;
    this.engine.bananaComboActive = true;
    this.engine.bananaComboTimer = 1.5;
    this.engine.audio.playVictory();
    this.engine.triggerFlash('#A6F616', 15);
    this.engine.addTrauma(0.5);
    this.explodeObstacles('#A6F616', 30);
  }

  public triggerCandyCombo(): void {
    this.engine.player.bombsCollected = 0;
    this.engine.player.collectedCandyTypes = [];
    this.engine.audio.playVictory();
    this.engine.triggerFlash('#ff79c6', 15);
    this.engine.addTrauma(0.4);
    this.explodeObstacles('#ff79c6', 25);
    this.engine.particles.addFloatingText(
      this.engine.player.x,
      this.engine.player.y - 60,
      '¡EXPLOSIÓN CHUCHES COMBO +500! 🍬',
      '#ff79c6',
      34,
      'pop'
    );
  }

  private explodeObstacles(color: string, particleCount: number): void {
    for (const ent of this.engine.entities) {
      if (ent instanceof Obstacle) {
        this.engine.particles.spawn(ent.x + ent.w / 2, ent.y + ent.h / 2, color, particleCount, 'shard');
      }
    }
    this.engine.entities = this.engine.entities.filter(ent => !(ent instanceof Obstacle));
  }
}
