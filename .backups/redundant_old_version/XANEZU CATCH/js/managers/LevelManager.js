export class LevelManager {
    /**
     * Calcula la puntuación necesaria para completar un nivel específico del capítulo.
     * Fórmula: 600 + (350000 - 600) * ((n - 1) / 29) ^ 1.85
     */
    getLevelTarget(level) {
        const n = Math.max(1, Math.min(Math.floor(level || 1), 30));
        if (n === 1) return 600;

        // Puntos base: 600 para nivel 1, 350.000 para nivel 30
        const minXP = 600;
        const maxXP = 350000;

        const target = minXP + (maxXP - minXP) * Math.pow((n - 1) / 29, 1.85);
        return Math.round(target);
    }

    getSpeedMultiplier(chapterConfig, level) {
        const base = Number(chapterConfig?.baseSpeed || 1.0);
        const lvl = Math.max(1, Math.floor(level || 1));
        return base + (lvl * 0.15);
    }

    /**
     * Cada capítulo tiene un máximo de 30 niveles.
     */
    getMaxLevel(chapterConfig) {
        return 30;
    }
}
