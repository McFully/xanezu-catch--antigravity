import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.esm.js';

export class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    this.registry.events.on('changedata', () => {
      // Placeholder for cross-scene HUD sync
    });
  }
}
