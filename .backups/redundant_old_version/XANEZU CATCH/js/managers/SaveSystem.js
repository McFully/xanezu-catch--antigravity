export class SaveSystem {
    _prefix(mode = 'arcade') {
        const key = String(mode || 'arcade').toLowerCase();
        if (key === 'abl') return 'mx_abl';
        return 'mx_arcade';
    }

    loadModeProgress(mode = 'arcade') {
        const prefix = this._prefix(mode);
        const scoreGlobal = parseInt(localStorage.getItem(`${prefix}_score_global`) || '0', 10) || 0;
        let unlockedChapters = [];
        try {
            unlockedChapters = JSON.parse(localStorage.getItem(`${prefix}_unlocked_chapters`) || '[]');
        } catch (e) {
            unlockedChapters = [];
        }
        const lastPlayedChapter = parseInt(localStorage.getItem(`${prefix}_last_chapter`) || '1', 10) || 1;
        return { scoreGlobal, unlockedChapters, lastPlayedChapter };
    }

    saveModeProgress(mode = 'arcade', { scoreGlobal, unlockedChapters, lastPlayedChapter }) {
        const prefix = this._prefix(mode);
        if (Number.isFinite(scoreGlobal)) localStorage.setItem(`${prefix}_score_global`, String(Math.max(0, Math.floor(scoreGlobal))));
        if (Array.isArray(unlockedChapters)) localStorage.setItem(`${prefix}_unlocked_chapters`, JSON.stringify(unlockedChapters));
        if (Number.isFinite(lastPlayedChapter)) localStorage.setItem(`${prefix}_last_chapter`, String(Math.max(1, Math.floor(lastPlayedChapter))));
    }

    loadArcadeProgress() {
        return this.loadModeProgress('arcade');
    }

    saveArcadeProgress({ scoreGlobal, unlockedChapters, lastPlayedChapter }) {
        this.saveModeProgress('arcade', { scoreGlobal, unlockedChapters, lastPlayedChapter });
    }
}
