import { CHAPTER_REGISTRY } from './chapter-registry';
import { ARCADE_CHAPTER_REGISTRY } from './arcade-registry';
import { ABLIA_CHAPTER_REGISTRY } from './ablia-registry';

export class MusicSynth {
    private ctx: AudioContext | null = null;
    private _ctxInitialized = false;
    public isPlaying = false;
    public isPlayingMenu = false;
    public isArcadeSelectPlaying = false;
    private tempo = 110;
    private nextNoteTime = 0;
    private noteIndex = 0;
    private theme = 'forest';
    private scale = [261.63, 311.13, 349.23, 392.00, 466.16];
    
    private masterGain: GainNode | null = null;
    private reverb: ConvolverNode | null = null;
    private reverbGain: GainNode | null = null;
    private concussiveFilter: BiquadFilterNode | null = null;
    private duckingNode: GainNode | null = null;
    private ambientNode: AudioBufferSourceNode | null = null;
    private currentMusicSource: HTMLAudioElement | null = null;
    private menuMusicSource: HTMLAudioElement | null = null;
    
    private arcadeSelectMaster: GainNode | null = null;
    private arcadeSelectPulseInt: any = null;
    private arcadeSelectNodes: any = null;
    
    private zenNode: GainNode | null = null;
    private zenOscillators: any[] | null = null;
    
    private chapter: number = 1;

    constructor() {
        const unlock = async () => {
            await this.resumeContext();
            if (this.currentMusicSource && this.currentMusicSource.paused) {
                this.currentMusicSource.play().catch(e => console.warn("[MusicSynth] Retry play failed:", e));
            }
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('pointerdown', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        window.addEventListener('pointerdown', unlock);
    }

    private _ensureContext() {
        if (this._ctxInitialized) return;
        this._ctxInitialized = true;

        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();

        if (!this.ctx) return;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;

        this.reverb = this.ctx.createConvolver();
        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.value = 0.15;
        this.createImpulseResponse(1.5, 2.0);

        this.concussiveFilter = this.ctx.createBiquadFilter();
        this.concussiveFilter.type = 'lowpass';
        this.concussiveFilter.frequency.value = 20000;

        this.duckingNode = this.ctx.createGain();
        this.duckingNode.gain.value = 1.0;

        this.duckingNode.connect(this.concussiveFilter);
        this.concussiveFilter.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.reverbGain.connect(this.concussiveFilter);
        this.reverb.connect(this.reverbGain);
    }

    private createImpulseResponse(duration: number, decay: number) {
        if (!this.ctx || !this.reverb) return;
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.ctx.createBuffer(2, length, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        this.reverb.buffer = impulse;
    }

    public playTone(freq: number, time: number, options: { 
        type?: OscillatorType, 
        dur?: number, 
        vol?: number, 
        fm?: number, 
        attack?: number, 
        release?: number, 
        pan?: number, 
        useReverb?: boolean 
    } = {}) {
        const { type = 'sine', dur = 0.3, vol = 0.15, fm = 0, attack = 0.05, release = 0.2, pan = 0, useReverb = false } = options;
        
        this._ensureContext();
        if (!this.ctx || !this.duckingNode) return;

        const carrier = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner();

        const pitchVar = 1 + (Math.random() - 0.5) * 0.02;
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

    public playAmbient(chapter: number) {
        this._ensureContext();
        if (!this.ctx || !this.duckingNode) return;

        if (this.ambientNode) { try { this.ambientNode.stop(); } catch (e) { } }
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer; source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        const settings: { [key: number]: { f: number, v: number } } = {
            1: { f: 400, v: 0.05 },
            2: { f: 800, v: 0.03 },
            4: { f: 200, v: 0.08 },
            5: { f: 1200, v: 0.04 },
            8: { f: 100, v: 0.1 }
        };
        const s = settings[chapter] || { f: 500, v: 0.04 };

        filter.frequency.value = s.f;
        const g = this.ctx.createGain(); g.gain.value = s.v;
        source.connect(filter); filter.connect(g); g.connect(this.duckingNode);

        if (this.ctx.state === 'running') {
            source.start();
            this.ambientNode = source;
        } else {
            const resumeAmb = () => {
                if (this.ctx && this.ctx.state === 'running') {
                    try { source.start(); this.ambientNode = source; } catch (e) { }
                    window.removeEventListener('click', resumeAmb);
                }
            };
            window.addEventListener('click', resumeAmb);
        }
    }

    public triggerDucking(dur = 0.5) {
        this._ensureContext();
        if (!this.ctx || !this.duckingNode) return;
        const now = this.ctx.currentTime;
        this.duckingNode.gain.cancelScheduledValues(now);
        this.duckingNode.gain.setValueAtTime(1.0, now);
        this.duckingNode.gain.exponentialRampToValueAtTime(0.4, now + 0.05);
        this.duckingNode.gain.exponentialRampToValueAtTime(1.0, now + dur);
    }

    public start(chapter: number, gameRef?: any) {
        this.playChapterMusic(chapter, gameRef);
    }

    public playChapterMusic(chapter: any, gameRef?: any) {
        this.resumeContext().then(() => {
            this.setTheme(chapter, gameRef);
            if (!this.isPlaying && this.ctx) {
                this.isPlaying = true;
                this.nextNoteTime = this.ctx.currentTime + 0.1;
                this.sched(gameRef);
            }
        });
    }

    public async resumeContext() {
        this._ensureContext();
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
        return Promise.resolve();
    }

    public stopAll(gameRef?: any) {
        this.stopProcedural();
        this.stopMenuMusic();
        this.stopArcadeSelectMusic();
        this.stopMusic();

        if (gameRef && gameRef.assetLoader && gameRef.assetLoader.sounds) {
            Object.keys(gameRef.assetLoader.sounds).forEach(k => {
                if (k.startsWith('bg')) {
                    const s = gameRef.assetLoader.sounds[k];
                    try {
                        s.pause();
                        s.currentTime = 0;
                    } catch (e) {}
                }
            });
        }
    }

    public stopProcedural() {
        this.isPlaying = false;
        if (this.ambientNode) { try { this.ambientNode.stop(); } catch (e) { } }
    }

    public setTheme(chapter: any, gameRef?: any) {
        let chapterId: any = chapter;
        let mode: string = 'STORY';

        if (typeof chapter === 'object' && chapter !== null) {
            chapterId = chapter.id;
            mode = chapter.mode || 'STORY';
        } else if (typeof chapter === 'string') {
            if (chapter.startsWith('STORY_CHAPTER_')) mode = 'STORY';
            else if (chapter.startsWith('ARCADE_CHAPTER_')) mode = 'ARCADE';
            else if (chapter.startsWith('ABLIA_CHAPTER_')) mode = 'ABLIA';
        }

        let numericId = 1;
        if (typeof chapterId === 'string') {
            const matches = chapterId.match(/\d+/);
            if (matches) numericId = parseInt(matches[0]);
        } else if (typeof chapterId === 'number') {
            numericId = chapterId;
        }

        let config: any;
        if (mode === 'ARCADE') config = ARCADE_CHAPTER_REGISTRY[numericId];
        else if (mode === 'ABLIA') config = ABLIA_CHAPTER_REGISTRY[numericId];
        else config = CHAPTER_REGISTRY[numericId];

        if (!config) config = CHAPTER_REGISTRY[1];
        
        const themeKey = `${config?.biome || config?.bg || config?.theme || config?.name || 'forest'}`.toLowerCase();
        this.chapter = numericId;

        if (config?.musicMode !== 'procedural' && gameRef?.assetLoader?.sounds) {
            const nextTrack = gameRef.assetLoader.sounds[`bg${numericId}`];
            if (nextTrack && nextTrack !== this.currentMusicSource) {
                this.crossfadeMusic(nextTrack);
            }
        }

        const families: { [key: string]: { t: number, s: number[], r: number } } = {
            nature: { t: 105, s: [261.63, 311.13, 349.23, 392.00, 466.16], r: 0.15 },
            arid: { t: 92, s: [196.00, 207.65, 246.94, 261.63, 293.66], r: 0.1 },
            tech: { t: 126, s: [220.00, 261.63, 293.66, 329.63, 392.00], r: 0.1 },
            aqueous: { t: 65, s: [130.81, 155.56, 174.61, 196.00, 233.08], r: 0.35 },
            mystic: { t: 88, s: [392.00, 440.00, 523.25, 587.33, 659.25], r: 0.45 }
        };

        let family = families['nature'];
        if (themeKey.match(/ocean|atlantis|lake|glowfish|rain|bubbles|wet|sludge|underwater|abyss|ruins/)) {
            family = families['aqueous'];
        } else if (themeKey.match(/desert|egypt|canyon|mars|valley|sun|phoenix|vanilla|volcano|embers|moon|lunar/)) {
            family = families['arid'];
        } else if (themeKey.match(/neon|retro|data|quantum|micro|metro|factory|train|steampunk|clockwork|chrome|diesel|omega|lowpoly|tv|neural|core|blackhole|arcade|city|lab|toy/)) {
            family = families['tech'];
        } else if (themeKey.match(/zen|castle|library|dream|emerald|frozen|pirate|rome|maya|viking|olympus|aztec|crystals|gothic|isles|magic|astral|heaven|nostalgia|genesis|infinity|japan|enchanted|swamp|mexico|ice|crystal/)) {
            family = families['mystic'];
        }

        this.theme = themeKey;
        this.tempo = family.t;
        this.scale = family.s;
        this.playAmbient(numericId);
        if (this.reverbGain && this.ctx) {
            this.reverbGain.gain.setTargetAtTime(family.r, this.ctx.currentTime, 0.5);
        }
    }

    public crossfadeMusic(nextTrack: HTMLAudioElement, duration = 2000) {
        const prevTrack = this.currentMusicSource;
        this.currentMusicSource = nextTrack;

        if (prevTrack) {
            const startVol = prevTrack.volume;
            let start: number | null = null;
            const fadeOut = (time: number) => {
                if (!start) start = time;
                const progress = (time - start) / duration;
                if (progress < 1) {
                    prevTrack.volume = Math.max(0, startVol * (1 - progress));
                    requestAnimationFrame(fadeOut);
                } else {
                    prevTrack.pause();
                    prevTrack.currentTime = 0;
                }
            };
            requestAnimationFrame(fadeOut);
        }

        nextTrack.loop = true;
        nextTrack.volume = 0;
        nextTrack.play().catch(e => console.warn("Music blocked:", e));

        let startIn: number | null = null;
        const fadeIn = (time: number) => {
            if (!startIn) startIn = time;
            const progress = (time - startIn) / duration;
            if (progress < 1) {
                nextTrack.volume = progress * 0.4;
                requestAnimationFrame(fadeIn);
            } else {
                nextTrack.volume = 0.4;
            }
        };
        requestAnimationFrame(fadeIn);
    }

    public stopMusic() {
        if (this.currentMusicSource) {
            this.currentMusicSource.pause();
            this.currentMusicSource.currentTime = 0;
            this.currentMusicSource.volume = 0.4;
            this.currentMusicSource = null;
        }
    }

    private sched(gameRef?: any) {
        if (!this.isPlaying || !this.ctx) return;
        while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
            this.playPattern(this.nextNoteTime, gameRef);
            const proximityBpm = (gameRef && gameRef.camTrauma > 0.5) ? 25 : 0;
            this.nextNoteTime += 0.25 * (60.0 / (this.tempo + proximityBpm));
            this.noteIndex++;
        }
        setTimeout(() => this.sched(gameRef), 50);
    }

    private playPattern(time: number, gameRef?: any) {
        const beat = this.noteIndex % 16;
        const combo = gameRef ? gameRef.collectionStreak : 0;
        if (this.theme !== 'ocean' && this.theme !== 'space') {
            if (beat % 4 === 0) { this.playTone(60, time, { type: 'sine', dur: 0.1, vol: 0.35, attack: 0.005, fm: 25 }); }
        }
        if (combo > 10 && beat % 4 === 0) {
            const lowF = this.scale[0] / 2;
            this.playTone(lowF, time, { type: 'triangle', dur: 0.4, vol: 0.12, attack: 0.05 });
        }
    }

    public playMenuMusic(gameRef?: any) {
        if (this.isPlayingMenu) return true;
        if (!gameRef?.assetLoader?.sounds?.musica_menu) {
            return false;
        }
        const m = gameRef.assetLoader.sounds.musica_menu;
        m.loop = true;
        m.volume = 0;
        const tryPlay = () => {
            m.play().then(() => {
                this.isPlayingMenu = true;
                this.menuMusicSource = m;
                this.playAmbient(1);
                const duration = 1500;
                const targetVol = 0.2;
                let start: number | null = null;
                const fade = (time: number) => {
                    if (!start) start = time;
                    const progress = (time - start) / duration;
                    if (progress < 1) {
                        m.volume = progress * targetVol;
                        requestAnimationFrame(fade);
                    } else {
                        m.volume = targetVol;
                    }
                };
                requestAnimationFrame(fade);
            }).catch(() => {
                const retryHandler = () => {
                    m.play().then(() => {
                        this.isPlayingMenu = true;
                        this.menuMusicSource = m;
                    }).catch(() => { });
                    window.removeEventListener('click', retryHandler);
                };
                window.addEventListener('click', retryHandler, { once: true });
            });
        };
        tryPlay();
        return true;
    }

    public stopMenuMusic() {
        this.isPlayingMenu = false;
        if (this.menuMusicSource) {
            this.menuMusicSource.pause();
            this.menuMusicSource.currentTime = 0;
            this.menuMusicSource = null;
        }
        if (this.ambientNode) { try { this.ambientNode.stop(); } catch (e) { } }
    }

    public startArcadeSelectMusic() {
        if (this.isArcadeSelectPlaying) return;
        this._ensureContext();
        if (!this.ctx || !this.duckingNode) return;

        this.resumeContext();
        this.stopMenuMusic();
        const now = this.ctx.currentTime;
        this.arcadeSelectMaster = this.ctx.createGain();
        this.arcadeSelectMaster.gain.value = 0.0001;
        this.arcadeSelectMaster.connect(this.duckingNode);

        const pad = this.ctx.createOscillator();
        pad.type = 'triangle';
        pad.frequency.setValueAtTime(164.81, now);
        const pad2 = this.ctx.createOscillator();
        pad2.type = 'sine';
        pad2.frequency.setValueAtTime(246.94, now);
        const drone = this.ctx.createOscillator();
        drone.type = 'sawtooth';
        drone.frequency.setValueAtTime(82.41, now);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.18;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 14;
        lfo.connect(lfoGain);
        lfoGain.connect(pad.frequency);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.8;

        const padGain = this.ctx.createGain();
        padGain.gain.value = 0.13;
        const pad2Gain = this.ctx.createGain();
        pad2Gain.gain.value = 0.09;
        const droneGain = this.ctx.createGain();
        droneGain.gain.value = 0.06;

        pad.connect(padGain);
        pad2.connect(pad2Gain);
        drone.connect(droneGain);
        padGain.connect(filter);
        pad2Gain.connect(filter);
        droneGain.connect(filter);
        filter.connect(this.arcadeSelectMaster);

        this.arcadeSelectPulseInt = setInterval(() => {
            if (!this.isArcadeSelectPlaying || !this.ctx) return;
            const t = this.ctx.currentTime;
            [329.63, 392.0, 493.88].forEach((f, i) => {
                this.playTone(f, t + i * 0.11, { type: 'sine', dur: 0.35, vol: 0.045, attack: 0.01, useReverb: true });
            });
        }, 2400);

        pad.start(now); pad2.start(now); drone.start(now); lfo.start(now);
        this.arcadeSelectMaster.gain.exponentialRampToValueAtTime(0.26, now + 1.2);
        this.arcadeSelectNodes = { pad, pad2, drone, lfo, lfoGain, filter, padGain, pad2Gain, droneGain };
        this.isArcadeSelectPlaying = true;
    }

    public stopArcadeSelectMusic() {
        if (!this.isArcadeSelectPlaying || !this.ctx) return;
        this.isArcadeSelectPlaying = false;
        if (this.arcadeSelectPulseInt) { clearInterval(this.arcadeSelectPulseInt); this.arcadeSelectPulseInt = null; }
        const now = this.ctx.currentTime;
        if (this.arcadeSelectMaster) {
            this.arcadeSelectMaster.gain.cancelScheduledValues(now);
            this.arcadeSelectMaster.gain.setValueAtTime(this.arcadeSelectMaster.gain.value, now);
            this.arcadeSelectMaster.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        }
        const nodes = this.arcadeSelectNodes || {};
        ['pad', 'pad2', 'drone', 'lfo'].forEach(k => { if (nodes[k]) try { nodes[k].stop(now + 0.4); } catch (e) { } });
        this.arcadeSelectNodes = null;
        this.arcadeSelectMaster = null;
    }

    public playBtnHover() { 
        if (!this.ctx) return;
        this.playTone(600, this.ctx.currentTime, { type: 'sine', dur: 0.2, vol: 0.03, attack: 0.1, useReverb: true }); 
    }
    public playBtnClick() { 
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.playTone(392.00, now, { type: 'sine', dur: 0.6, vol: 0.1, attack: 0.05, useReverb: true });
        this.playTone(587.33, now + 0.03, { type: 'sine', dur: 0.5, vol: 0.05, attack: 0.05, useReverb: true });
    }

    public playZenAtmosphere() {
        if (this.zenNode) return; 
        this._ensureContext();
        if (!this.ctx || !this.duckingNode) return;
        
        const now = this.ctx.currentTime;
        this.zenNode = this.ctx.createGain();
        this.zenNode.gain.value = 0;
        this.zenNode.connect(this.duckingNode);
        
        const freqs = [196.00, 246.94, 293.66, 392.00]; 
        this.zenOscillators = freqs.map(f => {
            if (!this.ctx || !this.zenNode) return null;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);
            
            const lfo = this.ctx.createOscillator();
            const lfoG = this.ctx.createGain();
            lfo.frequency.value = 0.1 + Math.random() * 0.2;
            lfoG.gain.value = 2;
            lfo.connect(lfoG);
            lfoG.connect(osc.frequency);
            lfo.start();
            
            osc.connect(g);
            g.gain.value = 0.04;
            g.connect(this.zenNode);
            osc.start();
            return { osc, lfo };
        }).filter(o => o !== null);

        this.zenNode.gain.linearRampToValueAtTime(0.15, now + 2);
    }

    public stopZenAtmosphere() {
        if (!this.zenNode || !this.ctx) return;
        const now = this.ctx.currentTime;
        this.zenNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        setTimeout(() => {
            if (this.zenOscillators) {
                this.zenOscillators.forEach(o => { o.osc.stop(); o.lfo.stop(); });
            }
            this.zenNode = null;
            this.zenOscillators = null;
        }, 1600);
    }

    public playSkinEquip() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.playTone(880, now, { type: 'triangle', dur: 0.8, vol: 0.08, attack: 0.01, useReverb: true });
        this.playTone(1320, now + 0.05, { type: 'sine', dur: 0.6, vol: 0.04, attack: 0.05, useReverb: true });
    }

    public playCollect(streak = 0) {
        if (!this.ctx) return;
        const baseFreq = 110 * (1 + Math.min(streak, 20) * 0.05);
        this.playTone(baseFreq, this.ctx.currentTime, { type: 'triangle', dur: 0.2, vol: 0.2, fm: 200 });
    }

    public playSpatial(type: OscillatorType, x: number, freq: number, dur: number, vol: number, isCompanion = false) {
        this._ensureContext();
        if (!this.ctx) return;
        const pan = (x / 1280) * 2 - 1;
        const finalVol = isCompanion ? vol * 0.6 : vol;
        this.playTone(freq, this.ctx.currentTime, { type, dur, vol: finalVol, pan });
    }

    public playJumpWhoosh() {
        this._ensureContext();
        if (!this.ctx || !this.duckingNode) return;
        this.triggerDucking(0.2);
        const now = this.ctx.currentTime;
        this.playTone(400, now, { type: 'sine', dur: 0.05, vol: 0.15, attack: 0.001 });
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(g); g.connect(this.duckingNode);
        osc.start(now); osc.stop(now + 0.15);
    }
    public playDashWhoosh() { 
        this._ensureContext(); 
        if (!this.ctx) return; 
        this.triggerDucking(0.4); 
        this.playTone(100, this.ctx.currentTime, { type: 'sawtooth', dur: 0.2, vol: 0.25, fm: 400 }); 
    }

    public playJumpBark() { this.playJumpWhoosh(); }
    public playDashBark() { this.playDashWhoosh(); }
    public playDamageBark() { 
        this._ensureContext(); 
        if (!this.ctx) return; 
        this.triggerDucking(0.5); 
        this.playTone(150, this.ctx.currentTime, { type: 'sawtooth', dur: 0.3, vol: 0.4, fm: 100 }); 
    }

    public update(_dt: number, gameRef?: any) {
        if (!this.ctx || !this.concussiveFilter) return;
        const now = this.ctx.currentTime;
        const targetFreq = (gameRef?.damageT > 0) ? 1500 : 20000;
        this.concussiveFilter.frequency.setTargetAtTime(targetFreq, now, 0.1);
    }

    public updateIntensity(mult: number) {
        if (!this.ctx || !this.masterGain) return;
        const targetGain = 0.5 + (Math.min(mult, 10) / 10) * 0.3;
        this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.5);
    }

    public playAchievementFanfare() { 
        this._ensureContext(); 
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [440, 554, 659, 880].forEach((f, i) => this.playTone(f, now + i * 0.1, { type: 'square', dur: 0.4, vol: 0.08, attack: 0.02 })); 
    }

    public playCombo(streak: number) {
        this._ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const count = Math.min(streak, 8);
        for (let i = 0; i < count; i++) {
            this.playTone(440 * Math.pow(1.059, i), now + i * 0.05, { type: 'sine', dur: 0.1, vol: 0.05, attack: 0.01 });
        }
    }

    public playLevelUp() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((f, i) => {
            this.playTone(f, now + i * 0.1, { type: 'triangle', dur: 0.4, vol: 0.12, attack: 0.05, useReverb: true });
        });
    }

    public playNearMiss() {
        if (!this.ctx) return;
        this.playTone(1500, this.ctx.currentTime, { type: 'sine', dur: 0.15, vol: 0.1, attack: 0.001, fm: 500 });
    }

    public playNearMissFeedback() {
        this.playNearMiss();
        this.playDashWhoosh();
    }

    public playDamageFeedback() {
        this.playDamageBark();
        this.triggerDucking(0.8);
    }

    public playUnlock() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
            this.playTone(f, now + i * 0.08, { type: 'sine', dur: 0.5, vol: 0.1, attack: 0.01, useReverb: true });
        });
    }
}
