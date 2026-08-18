import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.esm.js';
import { getChapterById } from '../config/chaptersConfig.js';
import { Player } from '../entities/Player.js';
import { Obstacle } from '../entities/Obstacle.js';
import { AdaptiveAISystem } from '../systems/AdaptiveAISystem.js';
import { PersistentLearningSystem } from '../systems/PersistentLearningSystem.js';
import { PlayerProfileSystem } from '../systems/PlayerProfileSystem.js';
import { CompetitiveBalanceSystem } from '../systems/CompetitiveBalanceSystem.js';
import { PredictiveEnemyAI } from '../systems/PredictiveEnemyAI.js';
import { PerformanceTracker } from '../systems/PerformanceTracker.js';
import { ProceduralMusicEngine } from '../systems/ProceduralMusicEngine.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { DifficultyScaler } from '../systems/DifficultyScaler.js';
import { ensureChapterTextures } from '../utils/ThemeVisualFactory.js';

export class ABLGameScene extends Phaser.Scene {
  constructor() {
    super('ABLGameScene');
  }

  init(data) {
    this.chapter = getChapterById(data?.chapterId || 1);
  }

  create() {
    const { width, height } = this.scale;
    this.touch = { up: false, down: false, left: false, right: false };
    this.lastProfile = 'Conservador';

    const visual = ensureChapterTextures(this, this.chapter.id);
    this.playerTexture = visual.playerKey;
    this.obstacleTexture = visual.obstacleKey;
    const [pc1, pc2, pc3] = visual.palette;

    this.bgA = this.add.tileSprite(width / 2, height / 2, width, height, '__WHITE').setTint(pc1).setAlpha(0.18);
    this.bgB = this.add.tileSprite(width / 2, height / 2, width, height, '__WHITE').setTint(pc2).setAlpha(0.12);
    this.bgC = this.add.tileSprite(width / 2, height / 2, width, height, '__WHITE').setTint(pc3).setAlpha(0.08);

    this.eventsBus = new Phaser.Events.EventEmitter();
    this.performance = new PerformanceTracker(this.eventsBus);
    this.adaptiveAI = new AdaptiveAISystem(this.eventsBus);
    this.learning = new PersistentLearningSystem();
    this.profileSystem = new PlayerProfileSystem();
    this.balance = new CompetitiveBalanceSystem();
    this.enemyAI = new PredictiveEnemyAI(this.eventsBus);
    this.skillSystem = new SkillSystem();
    this.diff = new DifficultyScaler();
    this.music = new ProceduralMusicEngine(this, this.eventsBus);

    this.score = 0;
    this.level = 1;
    this.lastSpawn = 0;
    this.obstacles = [];
    this.cursors = this.input.keyboard.createCursorKeys();

    this.player = new Player(this, 180, height / 2, this.playerTexture);
    this.skillSystem.configure(this.chapter.character);
    this.music.start(this.chapter.musicStyle, this.level);

    const learned = this.learning.load();
    this.balance.calibrate(learned);
    this.assist = this.balance.getInvisibleAssist();

    this.hudTop = this.add.text(24, 16, '', { fontFamily: 'monospace', fontSize: '22px', color: '#e2e8f0' });
    this.hudSub = this.add.text(24, 46, '', { fontFamily: 'monospace', fontSize: '18px', color: '#7dd3fc' });
    this.hudSkill = this.add.text(24, 72, '', { fontFamily: 'monospace', fontSize: '16px', color: '#f9a8d4' });
    this.help = this.add.text(width - 20, 16, 'SPACE: skill | ESC: menu', { fontFamily: 'monospace', fontSize: '16px', color: '#a5b4fc' }).setOrigin(1, 0);
    this.piBarBg = this.add.rectangle(width - 220, 50, 320, 14, 0x111827).setOrigin(0, 0.5);
    this.piBar = this.add.rectangle(width - 220, 50, 0, 14, pc2).setOrigin(0, 0.5);
    this.piLabel = this.add.text(width - 220, 25, 'Performance', { fontFamily: 'monospace', fontSize: '14px', color: '#e2e8f0' });

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.skillSystem.tryUse()) {
        this.performance.recordSkillUse();
        this.score += Math.round(80 * this.skillSystem.getScoreMultiplier());
      }
    });
    this.input.keyboard.on('keydown-ESC', () => this.exitToMenu());

    this._setupTouchControls(width, height, pc1, pc2);

    this.time.addEvent({ delay: 120, loop: true, callback: () => this.score += 8 });
  }

  update(_t, dt) {
    this.bgA.tilePositionX += 0.08;
    this.bgB.tilePositionX += 0.18;
    this.bgC.tilePositionX += 0.32;

    this.player.update({
      left: { isDown: this.cursors.left.isDown || this.touch.left },
      right: { isDown: this.cursors.right.isDown || this.touch.right },
      up: { isDown: this.cursors.up.isDown || this.touch.up },
      down: { isDown: this.cursors.down.isDown || this.touch.down }
    });
    this.skillSystem.update(dt);

    this.level = this.diff.getLevelFromScore(this.score);
    const speedMult = this.diff.speedMultiplier(this.chapter.baseSpeed, this.level);
    const ai = this.adaptiveAI.params;

    this.performance.update(dt, this.score);

    if (_t - this.lastSpawn > (ai.spawnRate + (this.assist.speedNerf * 250))) {
      this.spawnObstacle(speedMult, ai);
      this.lastSpawn = _t;
    }

    this.obstacles = this.obstacles.filter((o) => {
      o.sprite.body.setVelocityX(-(260 * speedMult * ai.speedFactor));
      o.update();
      if (!o.sprite.active) return false;

      if (this.physics.overlap(this.player.sprite, o.sprite)) {
        this.performance.recordError();
        this.score = Math.max(0, this.score - 250);
        o.sprite.destroy();
        return false;
      }
      return true;
    });

    const avgReaction = this.performance.stats.reactionSamples.length
      ? Math.round(this.performance.stats.reactionSamples.reduce((a, b) => a + b, 0) / this.performance.stats.reactionSamples.length)
      : 280;
    const profile = this.profileSystem.classify({
      errors: this.performance.stats.errors,
      skillUses: this.performance.stats.skillUses,
      avgReaction,
      speedBias: Math.min(1, speedMult / 2.4)
    });
    this.lastProfile = profile;

    const pi = this.performance.getPerformanceIndex();
    this.piBar.width = Math.max(1, Math.round((pi / 100) * 320));

    this.hudTop.setText(`ABL | CAP ${this.chapter.id} ${this.chapter.theme} | LV ${this.level}/10 | SCORE ${Math.floor(this.score)}`);
    this.hudSub.setText(`Perfil: ${profile} | IA spawn ${Math.round(ai.spawnRate)}ms speed ${ai.speedFactor.toFixed(2)} hitbox ${ai.hitboxScale.toFixed(2)}`);
    this.hudSkill.setText(`Skill: ${this.skillSystem.skill?.id || 'none'} | CD ${(this.skillSystem.cooldown / 1000).toFixed(1)}s | PI ${pi.toFixed(1)}`);
  }

  spawnObstacle(speedMult, ai) {
    const { width, height } = this.scale;
    const prediction = this.enemyAI.update(this.player.sprite, ai);
    const y = Phaser.Math.Clamp(prediction.targetY + Phaser.Math.Between(-120, 120), 60, height - 60);
    const obs = new Obstacle(this, width + 60, y, 260 * speedMult * ai.speedFactor, ai.hitboxScale, this.obstacleTexture);
    this.obstacles.push(obs);
  }

  exitToMenu() {
    const perf = this.performance.getPerformanceIndex();
    const summary = this.learning.saveRun(perf, this.score);
    const oldTotal = parseInt(localStorage.getItem('abl_score_global') || '0', 10) || 0;
    localStorage.setItem('abl_score_global', String(oldTotal + Math.max(0, Math.floor(this.score))));
    localStorage.setItem('abl_last_summary', JSON.stringify(summary));
    this.music.stop();
    this.scene.start('MainMenuScene');
  }

  _setupTouchControls(width, height, c1, c2) {
    const leftPad = this.add.rectangle(120, height - 110, 220, 160, c1, 0.13).setStrokeStyle(2, c1, 0.45).setInteractive();
    const rightPad = this.add.rectangle(width - 120, height - 110, 220, 160, c2, 0.13).setStrokeStyle(2, c2, 0.45).setInteractive();
    this.add.text(120, height - 110, 'MOVE', { fontFamily: 'monospace', fontSize: '18px', color: '#dbeafe' }).setOrigin(0.5);
    this.add.text(width - 120, height - 110, 'SKILL', { fontFamily: 'monospace', fontSize: '18px', color: '#dbeafe' }).setOrigin(0.5);

    leftPad.on('pointerdown', (p) => {
      const lx = p.x - leftPad.x;
      const ly = p.y - leftPad.y;
      this.touch.left = lx < -20;
      this.touch.right = lx > 20;
      this.touch.up = ly < -20;
      this.touch.down = ly > 20;
    });
    leftPad.on('pointermove', (p) => {
      if (!p.isDown) return;
      const lx = p.x - leftPad.x;
      const ly = p.y - leftPad.y;
      this.touch.left = lx < -18;
      this.touch.right = lx > 18;
      this.touch.up = ly < -18;
      this.touch.down = ly > 18;
    });
    const clearTouch = () => { this.touch = { up: false, down: false, left: false, right: false }; };
    leftPad.on('pointerup', clearTouch);
    leftPad.on('pointerout', clearTouch);

    rightPad.on('pointerdown', () => {
      if (this.skillSystem.tryUse()) {
        this.performance.recordSkillUse();
        this.score += Math.round(80 * this.skillSystem.getScoreMultiplier());
      }
    });
  }
}
