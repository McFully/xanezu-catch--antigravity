import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.esm.js';
import { ABL_CHAPTERS } from '../config/chaptersConfig.js';

export class ChapterSelectScene extends Phaser.Scene {
  constructor() { super('ChapterSelectScene'); }

  init(data) {
    this.mode = data?.mode || 'ABL';
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x070d1e);
    this.add.text(width / 2, 60, 'ABL - Seleccion de Capitulo', { fontFamily: 'monospace', fontSize: '36px', color: '#b8f6ff' }).setOrigin(0.5);

    const scoreGlobal = parseInt(localStorage.getItem('abl_score_global') || '0', 10) || 0;
    const prevUnlocked = parseInt(localStorage.getItem('abl_last_unlocked_count') || '1', 10) || 1;
    const unlockedNow = ABL_CHAPTERS.filter((c) => scoreGlobal >= c.unlockScore).length;
    localStorage.setItem('abl_last_unlocked_count', String(unlockedNow));

    this.add.text(30, 20, `Score Global: ${scoreGlobal}`, { fontFamily: 'monospace', fontSize: '24px', color: '#f8fafc' });
    if (unlockedNow > prevUnlocked) {
      const msg = this.add.text(width / 2, 112, `Nuevo capitulo desbloqueado x${unlockedNow - prevUnlocked}!`, {
        fontFamily: 'monospace', fontSize: '24px', color: '#31f7ff', backgroundColor: '#0f172a'
      }).setOrigin(0.5);
      this.tweens.add({ targets: msg, alpha: { from: 1, to: 0 }, y: msg.y - 20, duration: 1800, onComplete: () => msg.destroy() });
    }

    const cols = 3;
    ABL_CHAPTERS.forEach((chapter, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 220 + (col * 420);
      const y = 190 + (row * 120);
      const unlocked = scoreGlobal >= chapter.unlockScore;

      const card = this.add.rectangle(x, y, 380, 108, unlocked ? 0x12243a : 0x2b1a1a)
        .setStrokeStyle(2, unlocked ? 0x32d7ff : 0xa85555)
        .setInteractive({ useHandCursor: unlocked });

      this.add.text(x - 170, y - 34, `CAP ${chapter.id}`, { fontFamily: 'monospace', fontSize: '18px', color: '#f8fafc' });
      this.add.text(x - 170, y - 10, chapter.theme, { fontFamily: 'monospace', fontSize: '16px', color: unlocked ? '#d6f8ff' : '#fca5a5' });
      this.add.text(x - 170, y + 12, `${chapter.character} | ${chapter.musicStyle}`, {
        fontFamily: 'monospace', fontSize: '12px', color: unlocked ? '#93c5fd' : '#fca5a5'
      });
      this.add.text(x - 170, y + 32, unlocked ? 'UNLOCKED' : `LOCK ${chapter.unlockScore}`, {
        fontFamily: 'monospace', fontSize: '14px', color: unlocked ? '#22d3ee' : '#f87171'
      });

      if (unlocked) {
        card.on('pointerdown', () => this.scene.start('ABLGameScene', { chapterId: chapter.id }));
      }
    });

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }
}
