import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.esm.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) { this.mode = data?.mode || 'MODO_X'; }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x111827);
    this.add.text(width / 2, height / 2 - 20, `${this.mode} (placeholder)`, { fontFamily: 'monospace', fontSize: '40px', color: '#f8fafc' }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 40, 'Presiona ESC para volver', { fontFamily: 'monospace', fontSize: '22px', color: '#93c5fd' }).setOrigin(0.5);
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }
}
