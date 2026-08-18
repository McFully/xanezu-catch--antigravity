export class SaveSystem {
    constructor() {
        this.pendingSaves = {};
        this.saveTimeout = null;
        this.batchSaveDelay = 500; // ms
        
        // Listen for app close events to ensure data is saved
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.flushAllSaves());
            window.addEventListener('unload', () => this.flushAllSaves());
        }
    }

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

    /**
     * Batch save system to avoid excessive localStorage writes
     * Collects multiple save requests and flushes them periodically
     */
    batchSave(key, value) {
        this.pendingSaves[key] = value;
        
        // Clear existing timeout
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        
        // Schedule flush
        this.saveTimeout = setTimeout(() => this.flushAllSaves(), this.batchSaveDelay);
    }

    /**
     * Immediately flush all pending saves to localStorage
     */
    flushAllSaves() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        
        try {
            for (const [key, value] of Object.entries(this.pendingSaves)) {
                if (value === null || value === undefined) {
                    localStorage.removeItem(key);
                } else {
                    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                }
            }
            this.pendingSaves = {};
            console.log('[SaveSystem] Batch save flushed successfully');
        } catch (e) {
            console.error('[SaveSystem] Flush error:', e);
        }
    }

    /**
     * Save game statistics
     */
    saveStats(stats) {
        this.batchSave('mx_stats', stats);
    }

    /**
     * Save total coins
     */
    saveCoins(coins) {
        this.batchSave('mx_total_coins', String(coins));
    }

    /**
     * Save unlocks (magnet, shield, skins)
     */
    saveUnlocks(unlocks) {
        this.batchSave('mx_unlocks', unlocks);
    }

    /**
     * Save skill tree
     */
    saveSkillTree(skills) {
        this.batchSave('mx_skill_tree', skills);
    }

    /**
     * Save chapter progress
     */
    saveChapterProgress(chapter, level, score) {
        this.batchSave(`mx_ch${chapter}_max_level`, String(level));
        this.batchSave(`mx_ch${chapter}_best_score`, String(score));
    }

    /**
     * Save high score
     */
    saveHighScore(score) {
        this.batchSave('mx_high_score', String(score));
    }

    /**
     * Save max chapter
     */
    saveMaxChapter(chapter) {
        this.batchSave('mx_max_chapter', String(chapter));
    }

    /**
     * Save games played
     */
    saveGamesPlayed(count) {
        this.batchSave('mx_games_played', String(count));
    }

    /**
     * Save music setting
     */
    saveMusicSetting(enabled) {
        this.batchSave('mx_music_on', enabled ? '1' : '0');
    }

    /**
     * Save sound setting
     */
    saveSoundSetting(enabled) {
        this.batchSave('mx_sound_on', enabled ? '1' : '0');
    }

    /**
     * Save total stats
     */
    saveTotalStats(stats) {
        this.batchSave('mx_total_catches', String(stats.totalItemsCaught || 0));
        this.batchSave('mx_total_deaths', String(stats.totalDeaths || 0));
        this.batchSave('mx_total_dashes', String(stats.totalDashes || 0));
        this.batchSave('mx_total_time', String(stats.totalTimePlayed || 0));
        this.batchSave('mx_high_level', String(stats.highLevelReached || 1));
    }
}
