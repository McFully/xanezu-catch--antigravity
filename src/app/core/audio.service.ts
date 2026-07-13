import { Injectable, signal } from '@angular/core';
import { Chapter } from './models/chapter.model';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  public isMuted = signal<boolean>(false);
  private initialized = false;
  private musicBuffers: Map<string, AudioBuffer> = new Map();
  private currentMusicSource: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;

  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Inicializa el AudioContext con un gesto de usuario y precarga la música del menú.
   * Debe llamarse desde un evento de click/touch para desbloquear el AudioContext.
   */
  public async initAndPreload(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
    await this.ensureContext();
    await this.preloadMenuMusic();
    console.log('[AudioService] ✅ AudioContext desbloqueado y música de menú precargada.');
  }

  /**
   * Pre-carga el buffer de la música del menú sin reproducirla.
   */
  public async preloadMenuMusic(): Promise<void> {
    if (!this.initialized || !this.ctx) return;
    const path = 'assets/menu/audio/musica%20menu.ogg';
    if (!this.musicBuffers.has(path)) {
      try {
        const response = await fetch(path);
        if (response.ok || response.status === 0) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await this.ctx!.decodeAudioData(arrayBuffer);
          this.musicBuffers.set(path, buffer);
          console.log('[AudioService] 🎵 Buffer de música de menú precargado.');
        }
      } catch (e) {
        console.warn('[AudioService] ⚠️ No se pudo precargar música de menú:', e);
      }
    }
  }

  /**
   * Reproduce la música del menú. Si ya está precargada, empieza de inmediato.
   */
  public async playMenuMusic(): Promise<void> {
    if (!this.initialized) await this.init();
    await this.ensureContext();
    if (!this.isMuted() && !this.currentMusicSource) {
      await this.playMusic('assets/menu/audio/musica%20menu.ogg');
    }
  }

  constructor() {
    // Intentar cargar preferencia de mute
    this.isMuted.set(localStorage.getItem('mx_audio_muted') === 'true');
  }

  /**
   * Inicializa el AudioContext tras un gesto del usuario.
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted() ? 0 : 0.4;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5; // Música algo más suave que los FX
    this.musicGain.connect(this.masterGain);

    // Configuración de Reverb básica
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this.createImpulseResponse(1.5, 2.0);

    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = 0.15;

    reverbGain.connect(this.masterGain);
    this.reverb.connect(reverbGain);
    this.masterGain.connect(this.ctx.destination);

    this.initialized = true;
    console.log('🔊 Audio Service Initialized');
  }

  /**
   * Reproduce música desde cualquier ruta.
   */
  public async playMusic(path: string, loop: boolean = true): Promise<void> {
    if (!this.initialized || !this.ctx) await this.init();
    await this.ensureContext();

    // Detener música actual
    this.stopMusic();

    try {
      let buffer = this.musicBuffers.get(path);
      if (!buffer) {
        console.log(`[AudioService] 🎵 Loading music: ${path}`);
        const response = await fetch(path);
        if (!response.ok && response.status !== 0) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        buffer = await this.ctx!.decodeAudioData(arrayBuffer);
        this.musicBuffers.set(path, buffer);
      }

      this.currentMusicSource = this.ctx!.createBufferSource();
      this.currentMusicSource.buffer = buffer;
      this.currentMusicSource.loop = loop;
      this.currentMusicSource.connect(this.musicGain!);
      this.currentMusicSource.start(0);
      console.log(`[AudioService] ▶️ Playing: ${path}`);
    } catch (e) {
      console.error(`[AudioService] ❌ Error playing music: ${path}`, e);
    }
  }

  private async ensureContext(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public async playChapterMusic(mode: string, folder: string): Promise<void> {
    if (!mode || !folder) return;

    if (mode.toUpperCase() === 'ABLIA') {
      console.log(`[AudioService] 🎵 Skipping chapter music for ABLIA mode.`);
      return;
    }
    
    // Asegurar que el AudioContext está activo antes de reproducir
    if (!this.initialized) await this.init();
    await this.ensureContext();
    
    const path = `assets/${mode.toLowerCase()}/${folder}/audios/${folder}.ogg`;
    await this.playMusic(path, true);
  }

  public stopMusic(): void {
    if (this.currentMusicSource) {
      try {
        this.currentMusicSource.stop();
      } catch (e) {
        // Ignorar si ya estaba detenido
      }
      this.currentMusicSource.disconnect();
      this.currentMusicSource = null;
    }
  }

  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.ctx!.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx!.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  public playTone(freq: number, dur: number = 0.3, vol: number = 0.1, type: OscillatorType = 'sine'): void {
    if (!this.initialized || !this.ctx || this.isMuted()) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    // También conectar a la reverb para profundidad
    if (this.reverb) gain.connect(this.reverb);

    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  // --- FX PREDETERMINADOS ---

  public playJump(): void {
    this.playTone(300, 0.2, 0.1, 'triangle');
    this.playTone(450, 0.1, 0.05, 'sine');
  }

  public playCollect(streak: number = 0): void {
    const freq = 440 * Math.pow(1.059, Math.min(streak, 12));
    this.playTone(freq, 0.15, 0.12, 'sine');
    this.playTone(freq * 2, 0.1, 0.05, 'triangle');
  }

  public playDamage(): void {
    this.playTone(150, 0.4, 0.3, 'sawtooth');
    this.playTone(100, 0.2, 0.2, 'square');
  }

  public playVictory(): void {
    this.playTone(440, 0.2, 0.1, 'sine');
    this.playTone(554, 0.2, 0.1, 'sine');
    this.playTone(659, 0.4, 0.1, 'sine');
  }

  public playClick(): void {
    this.playTone(600, 0.1, 0.05, 'sine');
  }

  public setMute(muted: boolean): void {
    this.isMuted.set(muted);
    localStorage.setItem('mx_audio_muted', String(muted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.4, this.ctx.currentTime, 0.1);
    }
  }

  public toggleMute(): boolean {
    const next = !this.isMuted();
    this.setMute(next);
    return next;
  }

  public getMuted(): boolean {
    return this.isMuted();
  }
}
