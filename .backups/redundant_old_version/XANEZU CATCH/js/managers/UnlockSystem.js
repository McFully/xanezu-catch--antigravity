export class UnlockSystem {
    constructor(chapterManager) {
        this.chapterManager = chapterManager;
    }

    getUnlockedChapters(scoreTotal) {
        const total = Math.max(0, Math.floor(scoreTotal || 0));
        const ids = this.chapterManager.getAllIds();
        const unlocked = ids.filter((id) => {
            const cfg = this.chapterManager.getById(id);
            return total >= (cfg?.unlockScore || 0);
        });
        return unlocked.length ? unlocked : [1];
    }

    /**
     * Lógica Estricta Arcade: Solo desbloquea el SIGUIENTE capítulo si el actual superó la meta.
     * @param {number[]} currentUnlocked Lista actual de IDs
     * @param {number} chapterPlayed Capítulo recién terminado
     * @param {number} scoreAchieved Puntuación obtenida en ese capítulo
     * @returns {number[]} Nueva lista de desbloqueados
     */
    getArcadeUnlocks(currentUnlocked, chapterPlayed, scoreAchieved) {
        const nextId = chapterPlayed + 1;
        const nextCfg = this.chapterManager.getById(nextId);

        // Solo evaluamos el siguiente inmediato si no está ya desbloqueado
        if (nextCfg && !currentUnlocked.includes(nextId)) {
            const required = nextCfg.unlockScore || 0;
            if (scoreAchieved >= required) {
                console.log(`ARCADE: ¡Capítulo ${nextId} desbloqueado! (Meta: ${required})`);
                return [...new Set([...currentUnlocked, nextId])].sort((a, b) => a - b);
            }
        }
        return currentUnlocked;
    }
}
