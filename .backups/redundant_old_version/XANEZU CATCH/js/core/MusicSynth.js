import { CHAPTER_REGISTRY } from './ChapterRegistry.js';

export class MusicSynth {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.isPlaying = false;
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

        // 🛡️ Solo arrancar si el contexto está listo
        if (this.ctx.state === 'running') {
            source.start();
            this.ambientNode = source;
        } else {
            // Si el contexto está suspendido, esperar a la próxima interacción para reintentar
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
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.setTheme(chapter);

        if (this.isPlaying) return;
        this.isPlaying = true;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.sched();
    }

    setTheme(chapter) {
        this.chapter = chapter;
        const config = CHAPTER_REGISTRY[chapter] || CHAPTER_REGISTRY[1];
        const bgType = config.bg || 'forest';

        // 🎵 HANDLE MP3 MUSIC CROSSFADE
        if (config.musicMode !== 'procedural' && window.game && window.game.assetLoader && window.game.assetLoader.sounds) {
            const nextTrack = window.game.assetLoader.sounds[`bg${chapter}`];
            if (nextTrack && nextTrack !== this.currentMusicSource) {
                this.crossfadeMusic(nextTrack);
            }
        }

        // Core Musical Families
        const families = {
            nature: { t: 105, s: [261.63, 311.13, 349.23, 392.00, 466.16], r: 0.15 }, // Major Pentatonic
            arid: { t: 92, s: [196.00, 207.65, 246.94, 261.63, 293.66], r: 0.1 },  // Phrygian / Middle Eastern
            tech: { t: 126, s: [220.00, 261.63, 293.66, 329.63, 392.00], r: 0.1 }, // Minor
            aqueous: { t: 65, s: [130.81, 155.56, 174.61, 196.00, 233.08], r: 0.35 }, // Slow / Submerged
            mystic: { t: 88, s: [392.00, 440.00, 523.25, 587.33, 659.25], r: 0.45 }   // High / Celestial
        };

        let family = families.nature;

        if (bgType.match(/ocean|atlantis|lake|glowfish|rain|bubbles|wet|sludge/)) {
            family = families.aqueous;
        } else if (bgType.match(/desert|egypt|canyon|mars|valley|sun|phoenix|vanilla|volcano|embers/)) {
            family = families.arid;
        } else if (bgType.match(/neon|retro|data|quantum|micro|metro|factory|train|steampunk|clockwork|chrome|diesel|omega|lowpoly|tv|neural|core|blackhole/)) {
            family = families.tech;
        } else if (bgType.match(/zen|castle|library|dream|emerald|frozen|pirate|rome|maya|viking|olympus|aztec|crystals|gothic|isles|magic|astral|heaven|nostalgia|genesis|infinity/)) {
            family = families.mystic;
        }

        this.theme = bgType;
        this.tempo = family.t;
        this.scale = family.s;
        this.playAmbient(chapter);

        // Update Reverb dynamically based on family
        this.reverbGain.gain.setTargetAtTime(family.r, this.ctx.currentTime, 0.5);
    }

    crossfadeMusic(nextTrack, duration = 2000) {
        const prevTrack = this.currentMusicSource;
        this.currentMusicSource = nextTrack;

        // Fade Out Previous
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

        // Fade In Next
        nextTrack.loop = true;
        nextTrack.volume = 0;
        nextTrack.play().catch(e => console.warn("Music blocked:", e));

        let startIn = null;
        const fadeIn = (time) => {
            if (!startIn) startIn = time;
            const progress = (time - startIn) / duration;
            if (progress < 1) {
                nextTrack.volume = progress * 0.4; // Target volume 0.4
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

    // Stop ALL music (MP3 and Procedural)
    stopAll() {
        this.stopProcedural();
        this.stopMenuMusic();
        this.stopArcadeSelectMusic();
        this.stopMusic();

        // Safety: ensure any other playing chapter audio is killed
        if (window.game && window.game.sounds) {
            Object.keys(window.game.sounds).forEach(k => {
                if (k.startsWith('bg')) {
                    const s = window.game.sounds[k];
                    s.pause();
                    s.currentTime = 0;
                }
            });
        }
    }

    stopProcedural() {
        this.isPlaying = false;
        if (this.ambientNode) { try { this.ambientNode.stop(); } catch (e) { } }
    }

    sched() {
        if (!this.isPlaying) return;
        while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
            this.playPattern(this.nextNoteTime);

            // Dynamic Tempo based on score proximity (Juice)
            const proximityBpm = (window.game && window.game.camTrauma > 0.5) ? 25 : 0;
            this.nextNoteTime += 0.25 * (60.0 / (this.tempo + proximityBpm));
            this.noteIndex++;
        }
        setTimeout(() => this.sched(), 50);
    }

    playPattern(time) {
        const beat = this.noteIndex % 16;
        const combo = window.game ? window.game.collectionStreak : 0;

        // 1. Kick Drum
        if (this.theme !== 'ocean' && this.theme !== 'space') {
            if (beat % 4 === 0) { this.playTone(60, time, { type: 'sine', dur: 0.1, vol: 0.35, attack: 0.005, fm: 25 }); }
        }

        // 2. Snare / Clap (DEACTIVATED: Removed beep-like square sound)
        /*
        if (beat % 8 === 4 && combo > 5) {
            this.playTone(800, time, { type: 'square', dur: 0.05, vol: 0.06, fm: 1000 });
        }
        */

        // 3. Bass Line (Adds with combo)
        if (combo > 10 && beat % 4 === 0) {
            const lowF = this.scale[0] / 2;
            this.playTone(lowF, time, { type: 'triangle', dur: 0.4, vol: 0.12, attack: 0.05 });
        }

        // 4. Main Melody & Harmony (DEACTIVATED: Removed beep-like triangle sounds)
        /*
        if (beat % 2 === 0 || Math.random() > 0.6) {
            const f = this.scale[Math.floor(Math.random() * this.scale.length)];
            const vol = 0.08 + (Math.min(combo, 30) / 30) * 0.05;
            this.playTone(f, time, { type: 'triangle', vol: vol, useReverb: true });
    
            // 5. Harmony (Adds with high combo)
            if (combo > 20 && Math.random() > 0.5) {
                const hf = f * 1.5; // Perfect fifth
                this.playTone(hf, time, { type: 'sine', vol: vol * 0.5, useReverb: true });
            }
        }
        */
    }

    playMenuMusic() {
        if (this.isPlayingMenu) return true;

        // Safety check for assets
        const game = window.game;
        if (!game || !game.sounds || !game.sounds.musica_menu) {
            console.warn("Audio: Menu music asset not loaded yet");
            return false;
        }

        const m = game.sounds.musica_menu;
        m.loop = true;
        m.volume = 0; // Iniciar en silencio

        const tryPlay = () => {
            m.play().then(() => {
                console.log("Audio: Menu music started with Fade-in");
                this.isPlayingMenu = true;
                this.menuMusicSource = m;

                // 🎵 Activar ambiente una vez desbloqueado el contexto
                this.playAmbient(1);

                // 🎵 AAA Fade-in implementation (1.5s)
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
                console.log("Audio: Menu music blocked, will retry on next interaction");
                // Retry on next click
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
        pad.frequency.setValueAtTime(164.81, now); // E3

        const pad2 = this.ctx.createOscillator();
        pad2.type = 'sine';
        pad2.frequency.setValueAtTime(246.94, now); // B3

        const drone = this.ctx.createOscillator();
        drone.type = 'sawtooth';
        drone.frequency.setValueAtTime(82.41, now); // E2

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

        // Bell pulse arpeggio for gothic flavor
        this.arcadeSelectPulseInt = setInterval(() => {
            if (!this.isArcadeSelectPlaying) return;
            const t = this.ctx.currentTime;
            [329.63, 392.0, 493.88].forEach((f, i) => {
                this.playTone(f, t + i * 0.11, { type: 'sine', dur: 0.35, vol: 0.045, attack: 0.01, useReverb: true });
            });
        }, 2400);

        pad.start(now);
        pad2.start(now);
        drone.start(now);
        lfo.start(now);
        this.arcadeSelectMaster.gain.exponentialRampToValueAtTime(0.26, now + 1.2);

        this.arcadeSelectNodes = { pad, pad2, drone, lfo, lfoGain, filter, padGain, pad2Gain, droneGain };
        this.isArcadeSelectPlaying = true;
    }

    stopArcadeSelectMusic() {
        if (!this.isArcadeSelectPlaying) return;
        this.isArcadeSelectPlaying = false;
        if (this.arcadeSelectPulseInt) {
            clearInterval(this.arcadeSelectPulseInt);
            this.arcadeSelectPulseInt = null;
        }
        const now = this.ctx.currentTime;
        if (this.arcadeSelectMaster) {
            this.arcadeSelectMaster.gain.cancelScheduledValues(now);
            this.arcadeSelectMaster.gain.setValueAtTime(this.arcadeSelectMaster.gain.value, now);
            this.arcadeSelectMaster.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        }

        const nodes = this.arcadeSelectNodes || {};
        ['pad', 'pad2', 'drone', 'lfo'].forEach(k => {
            if (nodes[k]) {
                try { nodes[k].stop(now + 0.4); } catch (e) { }
            }
        });
        this.arcadeSelectNodes = null;
        this.arcadeSelectMaster = null;
    }

    resumeContext() {
        if (this.ctx.state === 'suspended') {
            return this.ctx.resume();
        }
        return Promise.resolve();
    }

    playBtnHover() { this.playTone(800, this.ctx.currentTime, { type: 'sine', dur: 0.05, vol: 0.04 }); }
    playBtnClick() { this.playTone(400, this.ctx.currentTime, { type: 'square', dur: 0.1, vol: 0.1, fm: 150 }); }

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
        // Capa 1: El "Pop" inicial (ataque)
        this.playTone(400, now, { type: 'sine', dur: 0.05, vol: 0.15, attack: 0.001 });
        // Capa 2: El "Whoosh" descendente (cuerpo del salto)
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

    // Compatibility aliases
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
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C major arpeggio
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
