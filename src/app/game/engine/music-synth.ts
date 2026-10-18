import { CHAPTER_REGISTRY } from './chapter-registry';
import { ARCADE_CHAPTER_REGISTRY } from './arcade-registry';
import { ABLIA_CHAPTER_REGISTRY } from './ablia-registry';

const FAMILIES: Record<string, { t: number; s: number[]; r: number }> = {
  nature: { t: 105, s: [261.63, 311.13, 349.23, 392.0, 466.16], r: 0.15 },
  arid: { t: 92, s: [196.0, 207.65, 246.94, 261.63, 293.66], r: 0.1 },
  tech: { t: 126, s: [220.0, 261.63, 293.66, 329.63, 392.0], r: 0.1 },
  aqueous: { t: 65, s: [130.81, 155.56, 174.61, 196.0, 233.08], r: 0.35 },
  mystic: { t: 88, s: [392.0, 440.0, 523.25, 587.33, 659.25], r: 0.45 }
};

export class MusicSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private duckingNode: GainNode | null = null;
  private ambientNode: AudioBufferSourceNode | null = null;
  private schedTimer: ReturnType<typeof setTimeout> | null = null;

  public isPlaying = false;
  private tempo = 110;
  private nextNoteTime = 0;
  private noteIndex = 0;
  private theme = 'forest';
  private scale = [261.63, 311.13, 349.23, 392.0, 466.16];

  public bindContext(ctx: AudioContext, masterGain: GainNode, reverb: ConvolverNode | null): void {
    this.ctx = ctx;
    this.masterGain = masterGain;
    this.reverb = reverb;
    this.duckingNode = ctx.createGain();
    this.duckingNode.gain.value = 1.0;
    this.duckingNode.connect(this.masterGain);
  }

  private ensureContext(): void {
    if (this.ctx) return;
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.4;
    master.connect(ctx.destination);
    this.bindContext(ctx, master, null);
  }

  public playTone(
    freq: number,
    time: number,
    options: {
      type?: OscillatorType;
      dur?: number;
      vol?: number;
      fm?: number;
      attack?: number;
      release?: number;
      pan?: number;
      useReverb?: boolean;
    } = {}
  ): void {
    const {
      type = 'sine',
      dur = 0.3,
      vol = 0.12,
      fm = 0,
      attack = 0.04,
      release = 0.18,
      pan = 0,
      useReverb = false
    } = options;

    this.ensureContext();
    if (!this.ctx || !this.duckingNode) return;

    const carrier = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner();

    const pitchVar = 1 + (Math.random() - 0.5) * 0.015;
    carrier.type = type;
    carrier.frequency.setValueAtTime(freq * pitchVar, time);

    if (fm > 0) {
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      modulator.frequency.setValueAtTime(freq * 1.5, time);
      modGain.gain.setValueAtTime(fm, time);
      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      modulator.start(time);
      modulator.stop(time + dur + release);
    }

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur + release);
    panner.pan.setValueAtTime(pan, time);

    carrier.connect(gain);
    gain.connect(panner);
    panner.connect(this.duckingNode);

    if (useReverb && this.reverb) {
      gain.connect(this.reverb);
    }

    carrier.start(time);
    carrier.stop(time + dur + release);
  }

  public playAmbient(chapter: number): void {
    this.ensureContext();
    if (!this.ctx || !this.duckingNode || this.ctx.state !== 'running') return;

    this.stopAmbient();
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = chapter % 2 === 0 ? 600 : 400;

    const g = this.ctx.createGain();
    g.gain.value = 0.03;
    source.connect(filter);
    filter.connect(g);
    g.connect(this.duckingNode);

    try {
      source.start();
      this.ambientNode = source;
    } catch {}
  }

  private stopAmbient(): void {
    if (this.ambientNode) {
      try {
        this.ambientNode.stop();
      } catch {}
      this.ambientNode.disconnect();
      this.ambientNode = null;
    }
  }

  public playChapterMusic(chapter: any): void {
    this.ensureContext();
    if (!this.ctx) return;
    this.setTheme(chapter);
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.nextNoteTime = this.ctx.currentTime + 0.1;
      this.sched();
    }
  }

  public setTheme(chapter: any): void {
    let chapterId: any = chapter;
    let mode = 'STORY';

    if (typeof chapter === 'object' && chapter !== null) {
      chapterId = chapter.id;
      mode = chapter.mode || 'STORY';
    }

    let numericId = 1;
    if (typeof chapterId === 'string') {
      const matches = chapterId.match(/\d+/);
      if (matches) numericId = parseInt(matches[0], 10);
    } else if (typeof chapterId === 'number') {
      numericId = chapterId;
    }

    const config: any =
      mode === 'ARCADE'
        ? ARCADE_CHAPTER_REGISTRY[numericId]
        : mode === 'ABLIA'
          ? ABLIA_CHAPTER_REGISTRY[numericId]
          : CHAPTER_REGISTRY[numericId] || CHAPTER_REGISTRY[1];

    const themeKey = `${config?.biome || config?.bg || config?.theme || chapterId || 'forest'}`.toLowerCase();
    let family = FAMILIES['nature'];
    if (themeKey.match(/ocean|atlante|ruins|abyss|water/)) family = FAMILIES['aqueous'];
    else if (themeKey.match(/desert|egipto|sumeria|volcano|arid|moon/)) family = FAMILIES['arid'];
    else if (themeKey.match(/neon|retro|arcade|city|factory|tech/)) family = FAMILIES['tech'];
    else if (themeKey.match(/zen|maya|azteca|grecia|roma|nordic|inca|persa|hindu|japon|celt|babilonia|crystal/)) {
      family = FAMILIES['mystic'];
    }

    this.theme = themeKey;
    this.tempo = family.t;
    this.scale = family.s;
    this.playAmbient(numericId);
  }

  private sched(): void {
    if (!this.isPlaying || !this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
      const beat = this.noteIndex % 16;
      if (beat % 4 === 0) {
        this.playTone(60, this.nextNoteTime, { type: 'sine', dur: 0.1, vol: 0.2, attack: 0.005, fm: 20 });
      }
      if (beat % 2 === 0) {
        const note = this.scale[(this.noteIndex >> 1) % this.scale.length];
        this.playTone(note, this.nextNoteTime, { type: 'triangle', dur: 0.22, vol: 0.08, attack: 0.02, useReverb: true });
      }
      this.nextNoteTime += 0.25 * (60.0 / this.tempo);
      this.noteIndex++;
    }
    this.schedTimer = setTimeout(() => this.sched(), 50);
  }

  public stopMusic(): void {
    this.stopAll();
  }

  public stopAll(_gameRef?: any): void {
    this.isPlaying = false;
    if (this.schedTimer) {
      clearTimeout(this.schedTimer);
      this.schedTimer = null;
    }
    this.stopAmbient();
  }
}
