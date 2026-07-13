import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.esm.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('abl') === '1') {
      this.scene.start('ChapterSelectScene', { mode: 'ABL' });
      return;
    }

    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x090b16);
    this.add.text(width / 2, 90, 'ARCADE PHASER', { fontFamily: 'monospace', fontSize: '44px', color: '#ffffff' }).setOrigin(0.5);

    const entries = [
      { label: 'Modo 1', action: () => this.scene.start('GameScene', { mode: 'MODO_1' }) },
      { label: 'Modo 2', action: () => this.scene.start('GameScene', { mode: 'MODO_2' }) },
      { label: 'Modo 3', action: () => this.scene.start('GameScene', { mode: 'MODO_3' }) },
      { label: 'ABL - Modo IA Adaptativa', action: () => this.scene.start('ChapterSelectScene', { mode: 'ABL' }), abl: true }
    ];

    entries.forEach((entry, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = (width / 2) + (col === 0 ? -240 : 240) + 40;
      const y = 260 + (row * 180);

      const box = this.add.rectangle(x, y, 430, 110, entry.abl ? 0x140f2f : 0x111827, 1)
        .setStrokeStyle(entry.abl ? 3 : 2, entry.abl ? 0x31f7ff : 0x475569)
        .setInteractive({ useHandCursor: true });

      const text = this.add.text(x, y + 8, entry.label, {
        fontFamily: 'monospace',
        fontSize: entry.abl ? '26px' : '24px',
        color: entry.abl ? '#31f7ff' : '#e2e8f0'
      }).setOrigin(0.5, 0.5).setWordWrapWidth(390, true);

      if (entry.abl) {
        const icon = this.add.text(x - 180, y - 34, '🤖', { fontSize: '34px' }).setOrigin(0.5);
        const neon = this.add.rectangle(x, y, 446, 126, 0x31f7ff, 0.06).setStrokeStyle(1, 0x31f7ff, 0.35);
        neon.setDepth(-1);
        this.tweens.add({ targets: [box, text], alpha: { from: 0.75, to: 1 }, yoyo: true, repeat: -1, duration: 620 });
        this.tweens.add({ targets: icon, scale: { from: 1, to: 1.2 }, yoyo: true, repeat: -1, duration: 550 });
        this.tweens.add({ targets: neon, alpha: { from: 0.08, to: 0.22 }, yoyo: true, repeat: -1, duration: 620 });
      }

      box.on('pointerover', () => box.setFillStyle(entry.abl ? 0x1d1450 : 0x1f2937));
      box.on('pointerout', () => box.setFillStyle(entry.abl ? 0x140f2f : 0x111827));
      box.on('pointerdown', entry.action);
    });
  }
}
