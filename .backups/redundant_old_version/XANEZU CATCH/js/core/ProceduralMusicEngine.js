export class ProceduralMusicEngine {
    constructor(synth) {
        this.synth = synth;
        this.baseTempo = 110;
        this.currentChapter = 1;
    }

    _tempoFromStyle(style) {
        const table = {
            'Chiptune Tropical': 128,
            'Epic Synth Medieval': 118,
            'Industrial Synth': 126,
            'Tribal Digital': 124,
            'Dark Synthwave': 112,
            'Experimental Electro': 130,
            'Techno Epic': 136,
            'Deep Bass Cave': 104,
            'Electro Carnival': 132,
            'Happy Chiptune': 138,
            'Procedural Abstract Synth': 122,
            'Dark Epic Synth': 116,
        };
        return table[style] || 120;
    }

    startChapter(chapterConfig, level = 1) {
        if (!this.synth || !chapterConfig) return;
        this.currentChapter = chapterConfig.id || 1;
        this.baseTempo = this._tempoFromStyle(chapterConfig.musicStyle);
        this.synth.stopMusic?.();
        this.synth.stopProcedural?.();
        this.synth.setTheme?.(this.currentChapter);
        this.setLevel(level);
        this.synth.start?.(this.currentChapter);
    }

    setLevel(level) {
        if (!this.synth) return;
        const lvl = Math.max(1, Math.floor(level || 1));
        const targetTempo = this.baseTempo + ((lvl - 1) * 5);
        this.synth.tempo = targetTempo;
        if (this.synth.ctx && this.synth.masterGain) {
            const now = this.synth.ctx.currentTime;
            const mg = this.synth.masterGain.gain;
            mg.cancelScheduledValues(now);
            mg.setTargetAtTime(0.42, now, 0.08);
            mg.setTargetAtTime(0.58, now + 0.18, 0.22);
        }
    }

    playUnlockEvent() {
        if (!this.synth) return;
        this.synth.playUnlock?.();
        this.synth.playAchievementFanfare?.();
    }
}
