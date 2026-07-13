import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.esm.js';
import { gameConfig } from './gameConfig.js';

window.Phaser = Phaser;

const game = new Phaser.Game(gameConfig);
window.ablGame = game;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      return;
    }
    navigator.serviceWorker.register('./service-worker.js').then((reg) => {
      reg.update();
    }).catch(() => {});
  });
}
