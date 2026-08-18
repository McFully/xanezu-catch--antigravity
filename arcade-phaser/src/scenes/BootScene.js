import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.esm.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const params = new URLSearchParams(window.location.search);
    const goABL = params.get('abl') === '1';
    if (goABL) {
      this.scene.start('ChapterSelectScene', { mode: 'ABL' });
      return;
    }
    this.scene.start('MainMenuScene');
  }
}
