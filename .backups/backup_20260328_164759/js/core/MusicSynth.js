import { CHAPTER_REGISTRY } from './ChapterRegistry.js';

export class MusicSynth {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.isPlaying = false;
        this.isPlayingMenu = false;
        this.isArcadeSelectPlaying = false;
        this.tempo = 110;
        this.nextNoteTime = 0;
        this.noteIndex = 0;
        this.theme = 'forest';
        this.scale = [261.63, 311.13, 349.23, 392.00, 466.16];

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

    createImpulseResponse(duration, decay) {
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

    playTone(freq, time, { type = 'sine', dur = 0.3, vol = 0.15, fm = 0, attack = 0.05, release = 0.2, pan = 0, useReverb = false }) {
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

        if (useReverb) {
            gain.connect(this.reverb);
        }

        carrier.start(time);
        carrier.stop(time + dur + release);
    }

    playAmbient(chapter) {
        if (this.ambientNode) { try { this.ambientNode.stop(); } catch (e) { } }
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer; source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        const settings = {
            1: { f: 400, v: 0.05 },
            2: { f: 800, v: 0.03 },
            4: { f: 200, v: 0.08 },
            5: { f: 1200, v: 0.04 },
            8: { f: 100, v: 0.1 }
        }[chapter] || { f: 500, v: 0.04 };

        filter.frequency.value = settings.f;
        const g = this.ctx.createGain(); g.gain.value = settings.v;
        source.connect(filter); filter.connect(g); g.connect(this.duckingNode);

        if (this.ctx.state === 'running') {
            source.start();
            this.ambientNode = source;
        } else {
            const resumeAmb = () => {
                if (this.ctx.state === 'running') {
                    try { source.start(); this.ambientNode = source; } catch (e) { }
                    window.removeEventListener('click', resumeAmb);
                }
            };
            window.addEventListener('click', resumeAmb);
        }
    }

    triggerDucking(dur = 0.5) {
        const now = this.ctx.currentTime;
        this.duckingNode.gain.cancelScheduledValues(now);
        this.duckingNode.gain.setValueAtTime(1.0, now);
        this.duckingNode.gain.exponentialRampToValueAtTime(0.4, now + 0.05);
        this.duckingNode.gain.exponentialRampToValueAtTime(1.0, now + dur);
    }

    start(chapter) {
        this.resumeContext().then(() => {
            this.setTheme(chapter);
            if (!this.isPlaying) {
                this.isPlaying = true;
                this.nextNoteTime = this.ctx.currentTime + 0.1;
                this.sched();
            }
        });
    }

    async resumeContext() {
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
        return Promise.resolve();
    }

    stopAll() {
        this.stopProcedural();
        this.stopMenuMusic();
        this.stopArcadeSelectMusic();
        this.stopMusic();

        // Safety: ensure any other playing chapter audio is killed
        if (window.game && window.game.assetLoader && window.game.assetLoader.sounds) {
            Object.keys(window.game.assetLoader.sounds).forEach(k => {
                if (k.startsWith('bg')) {
                    const s = window.game.assetLoader.sounds[k];
                    try {
                        s.pause();
                        s.currentTime = 0;
                    } catch (e) {}
                }
            });
        }
    }

    stopProcedural() {
        this.isPlaying = false;
        if (this.ambientNode) { try { this.ambientNode.stop(); } catch (e) { } }
    }

    setTheme(chapter) {
        const isConfigObject = typeof chapter === 'object' && chapter !== null;
        const chapterId = isConfigObject ? (chapter.id || 1) : chapter;
        const config = isConfigObject
            ? chapter
            : (window.game?.getActiveChapterConfig
                ? (window.game.getActiveChapterConfig(chapterId) || CHAPTER_REGISTRY[chapterId] || CHAPTER_REGISTRY[1])
                : (CHAPTER_REGISTRY[chapterId] || CHAPTER_REGISTRY[1]));
        const themeKey = `${config?.biome || config?.bg || config?.theme || config?.name || 'forest'}`.toLowerCase();

        this.chapter = chapterId;

        if (config.musicMode !== 'procedural' && window.game && window.game.assetLoader && window.game.assetLoader.sounds) {
            const nextTrack = window.game.assetLoader.sounds[`bg${chapterId}`];
            if (nextTrack && nextTrack !== this.currentMusicSource) {
                this.crossfadeMusic(nextTrack);
            }
        }

        const families = {
            nature: { t: 105, s: [261.63, 311.13, 349.23, 392.00, 466.16], r: 0.15 },
            arid: { t: 92, s: [196.00, 207.65, 246.94, 261.63, 293.66], r: 0.1 },
            tech: { t: 126, s: [220.00, 261.63, 293.66, 329.63, 392.00], r: 0.1 },
            aqueous: { t: 65, s: [130.81, 155.56, 174.61, 196.00, 233.08], r: 0.35 },
            mystic: { t: 88, s: [392.00, 440.00, 523.25, 587.33, 659.25], r: 0.45 }
        };

        let family = families.nature;
        if (themeKey.match(/ocean|atlantis|lake|glowfish|rain|bubbles|wet|sludge|underwater|abyss|ruins/)) {
            family = families.aqueous;
        } else if (themeKey.match(/desert|egypt|canyon|mars|valley|sun|phoenix|vanilla|volcano|embers|moon|lunar/)) {
            family = families.arid;
        } else if (themeKey.match(/neon|retro|data|quantum|micro|metro|factory|train|steampunk|clockwork|chrome|diesel|omega|lowpoly|tv|neural|core|blackhole|arcade|city|lab|toy/)) {
            family = families.tech;
        } else if (themeKey.match(/zen|castle|library|dream|emerald|frozen|pirate|rome|maya|viking|olympus|aztec|crystals|gothic|isles|magic|astral|heaven|nostalgia|genesis|infinity|japan|enchanted|swamp|mexico|ice|crystal/)) {
            family = families.mystic;
        }

        this.theme = themeKey;
        this.tempo = family.t;
        this.scale = family.s;
        this.playAmbient(chapterId);
        this.reverbGain.gain.setTargetAtTime(family.r, this.ctx.currentTime, 0.5);
    }

    crossfadeMusic(nextTrack, duration = 2000) {
        const prevTrack = this.currentMusicSource;
        this.currentMusicSource = nextTrack;

        if (prevTrack) {
            const startVol = prevTrack.volume;
            let start = null;
            const fadeOut = (time) => {
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

        let startIn = null;
        const fadeIn = (time) => {
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

    stopMusic() {
        if (this.currentMusicSource) {
            this.currentMusicSource.pause();
            this.currentMusicSource.currentTime = 0;
            this.currentMusicSource.volume = 0.4;
            this.currentMusicSource = null;
        }
    }

    sched() {
        if (!this.isPlaying) return;
        while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
            this.playPattern(this.nextNoteTime);
            const proximityBpm = (window.game && window.game.camTrauma > 0.5) ? 25 : 0;
            this.nextNoteTime += 0.25 * (60.0 / (this.tempo + proximityBpm));
            this.noteIndex++;
        }
        setTimeout(() => this.sched(), 50);
    }

    playPattern(time) {
        const beat = this.noteIndex % 16;
        const game = window.game;
        const combo = game ? game.collectionStreak : 0;
        if (this.theme !== 'ocean' && this.theme !== 'space') {
            if (beat % 4 === 0) { this.playTone(60, time, { type: 'sine', dur: 0.1, vol: 0.35, attack: 0.005, fm: 25 }); }
        }
        if (combo > 10 && beat % 4 === 0) {
            const lowF = this.scale[0] / 2;
            this.playTone(lowF, time, { type: 'triangle', dur: 0.4, vol: 0.12, attack: 0.05 });
        }
    }

    playMenuMusic() {
        if (this.isPlayingMenu) return true;
        const game = window.game;
        if (!game || !game.assetLoader || !game.assetLoader.sounds || !game.assetLoader.sounds.musica_menu) {
            return false;
        }
        const m = game.assetLoader.sounds.musica_menu;
        m.loop = true;
        m.volume = 0;
        const tryPlay = () => {
            m.play().then(() => {
                this.isPlayingMenu = true;
                this.menuMusicSource = m;
                this.playAmbient(1);
                const duration = 1500;
                const targetVol = 0.2;
                let start = null;
                const fade = (time) => {
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
            }).catch(e => {
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

    stopMenuMusic() {
        this.isPlayingMenu = false;
        if (this.menuMusicSource) {
            this.menuMusicSource.pause();
            this.menuMusicSource.currentTime = 0;
            this.menuMusicSource = null;
        }
        if (this.ambientNode) { try { this.ambientNode.stop(); } catch (e) { } }
    }

    startArcadeSelectMusic() {
        if (this.isArcadeSelectPlaying) return;
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
            if (!this.isArcadeSelectPlaying) return;
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

    stopArcadeSelectMusic() {
        if (!this.isArcadeSelectPlaying) return;
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

    playBtnHover() { 
        // Sonido Zen: Onda senoidal suave con ataque largo y rever
        this.playTone(600, this.ctx.currentTime, { type: 'sine', dur: 0.2, vol: 0.03, attack: 0.1, useReverb: true }); 
    }
    playBtnClick() { 
        // Sonido Zen: Acorde armónico limpio (pentatónico: Sol + Re)
        const now = this.ctx.currentTime;
        this.playTone(392.00, now, { type: 'sine', dur: 0.6, vol: 0.1, attack: 0.05, useReverb: true });
        this.playTone(587.33, now + 0.03, { type: 'sine', dur: 0.5, vol: 0.05, attack: 0.05, useReverb: true });
    }

    playZenAtmosphere() {
        if (this.zenNode) return; // Evitar duplicados
        
        const now = this.ctx.currentTime;
        this.zenNode = this.ctx.createGain();
        this.zenNode.gain.value = 0;
        this.zenNode.connect(this.duckingNode);
        
        // Osciladores para el pad Zen (Cuerdas/Cuenco)
        const freqs = [196.00, 246.94, 293.66, 392.00]; // Sol mayor / Pentatónica
        this.zenOscillators = freqs.map(f => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);
            
            // Vibrato sutil
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
        });

        this.zenNode.gain.linearRampToValueAtTime(0.15, now + 2);
    }

    stopZenAtmosphere() {
        if (!this.zenNode) return;
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

    playSkinEquip() {
        // Sonido de campana metálica brillante (Zen-Tech)
        const now = this.ctx.currentTime;
        this.playTone(880, now, { type: 'triangle', dur: 0.8, vol: 0.08, attack: 0.01, useReverb: true });
        this.playTone(1320, now + 0.05, { type: 'sine', dur: 0.6, vol: 0.04, attack: 0.05, useReverb: true });
    }

    playCollect(streak = 0) {
        const baseFreq = 110 * (1 + Math.min(streak, 20) * 0.05);
        this.playTone(baseFreq, this.ctx.currentTime, { type: 'triangle', dur: 0.2, vol: 0.2, fm: 200 });
    }

    playSpatial(type, x, freq, dur, vol, isCompanion = false) {
        const pan = (x / 1280) * 2 - 1;
        const finalVol = isCompanion ? vol * 0.6 : vol;
        this.playTone(freq, this.ctx.currentTime, { type, dur, vol: finalVol, pan });
    }

    playJumpWhoosh() {
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
    playDashWhoosh() { this.triggerDucking(0.4); this.playTone(100, this.ctx.currentTime, { type: 'sawtooth', dur: 0.2, vol: 0.25, fm: 400 }); }

    playJumpBark() { this.playJumpWhoosh(); }
    playDashBark() { this.playDashWhoosh(); }
    playDamageBark() { this.triggerDucking(0.5); this.playTone(150, this.ctx.currentTime, { type: 'sawtooth', dur: 0.3, vol: 0.4, fm: 100 }); }

    update(dt, game) {
        const now = this.ctx.currentTime;
        const targetFreq = (game.damageT > 0) ? 1500 : 20000;
        this.concussiveFilter.frequency.setTargetAtTime(targetFreq, now, 0.1);
    }

    updateIntensity(mult) {
        const targetGain = 0.5 + (Math.min(mult, 10) / 10) * 0.3;
        this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.5);
    }

    playAchievementFanfare() { [440, 554, 659, 880].forEach((f, i) => this.playTone(f, this.ctx.currentTime + i * 0.1, { type: 'square', dur: 0.4, vol: 0.08, attack: 0.02 })); }

    playCombo(streak) {
        const now = this.ctx.currentTime;
        const count = Math.min(streak, 8);
        for (let i = 0; i < count; i++) {
            this.playTone(440 * Math.pow(1.059, i), now + i * 0.05, { type: 'sine', dur: 0.1, vol: 0.05, attack: 0.01 });
        }
    }

    playLevelUp() {
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((f, i) => {
            this.playTone(f, now + i * 0.1, { type: 'triangle', dur: 0.4, vol: 0.12, attack: 0.05, useReverb: true });
        });
    }

    playNearMiss() {
        this.playTone(1500, this.ctx.currentTime, { type: 'sine', dur: 0.15, vol: 0.1, attack: 0.001, fm: 500 });
    }

    playUnlock() {
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
            this.playTone(f, now + i * 0.08, { type: 'sine', dur: 0.5, vol: 0.1, attack: 0.01, useReverb: true });
        });
    }
}
