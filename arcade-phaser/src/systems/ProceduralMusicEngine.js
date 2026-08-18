export class ProceduralMusicEngine {
  constructor(scene, events) {
    this.scene = scene;
    this.events = events;
    this.ctx = null;
    this.gain = null;
    this.osc = null;
    this.base = 220;
    this.events.on('performance:update', (pi) => this.onPerformance(pi));
  }

  start(style, level) {
    this.stop();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.gain = this.ctx.createGain();
    this.osc = this.ctx.createOscillator();
    this.base = this.baseFromStyle(style) + ((level - 1) * 8);
    this.osc.type = 'sawtooth';
    this.osc.frequency.value = this.base;
    this.gain.gain.value = 0.05;
    this.osc.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    this.osc.start();
  }

  baseFromStyle(style) {
    const map = {
      'Epic Medieval Synth': 198,
      'Folk Chiptune': 228,
      'Dark Dungeon Synth': 146,
      'Ancient Ambient Synth': 176,
      'Crystal Electro': 248,
      'Seaside Chiptune': 216,
      'Epic Mountain Synth': 186,
      'Viking Chiptune': 238,
      'Dark Ambient': 132,
      'Lava Electro': 258,
      'Gothic Choir Synth': 164,
      'Epic Viking Synth': 202
    };
    return map[style] || 220;
  }

  onPerformance(pi) {
    if (!this.osc || !this.ctx) return;
    const factor = 0.8 + ((pi / 100) * 0.7);
    this.osc.frequency.setTargetAtTime(this.base * factor, this.ctx.currentTime, 0.15);
    this.gain.gain.setTargetAtTime(0.04 + ((pi / 100) * 0.06), this.ctx.currentTime, 0.15);
  }

  stop() {
    try { this.osc?.stop(); } catch (e) {}
    try { this.osc?.disconnect(); } catch (e) {}
    try { this.gain?.disconnect(); } catch (e) {}
    this.osc = null;
    this.gain = null;
    this.ctx = null;
  }
}
