import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.esm.js';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { ChapterSelectScene } from './scenes/ChapterSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { ABLGameScene } from './scenes/ABLGameScene.js';

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#090b16',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MainMenuScene, ChapterSelectScene, GameScene, UIScene, ABLGameScene]
};
