/**
 * RankManager: Sistema de Progresión AAA para Xanezu Catch.
 * Gestiona niveles (1-100), Rangos (0-5) y XP persistente.
 */
export class RankManager {
    constructor() {
        this.ranks = [
            { id: 0, name: 'ROOKIE', icon: '🥚', color: '#cd7f32', minLevel: 1 },
            { id: 1, name: 'VETERAN', icon: '⚔️', color: '#c0c0c0', minLevel: 10 },
            { id: 2, name: 'ELITE', icon: '✨', color: '#ffd700', minLevel: 25 },
            { id: 3, name: 'MASTER', icon: '👑', color: '#e5e4e2', minLevel: 50 },
            { id: 4, name: 'LEGEND', icon: '🌌', color: '#b9f2ff', minLevel: 75 },
            { id: 5, name: 'XANEZU LORD', icon: '👽', color: '#ff00ff', minLevel: 100 }
        ];
    }

    /**
     * Calcula el nivel basado en la XP total.
     * Curva de dificultad: Level = Floor(sqrt(XP / 100))
     */
    getLevel(xp) {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    /**
     * Calcula la XP requerida para alcanzar el inicio de un nivel específico.
     */
    getXPForLevel(level) {
        if (level <= 1) return 0;
        return Math.pow(level - 1, 2) * 100;
    }

    /**
     * Obtiene el rango actual según el nivel.
     */
    getRankByLevel(level) {
        for (let i = this.ranks.length - 1; i >= 0; i--) {
            if (level >= this.ranks[i].minLevel) return this.ranks[i];
        }
        return this.ranks[0];
    }

    /**
     * Devuelve el objeto de progreso formateado para la UI.
     */
    getProgress(xp) {
        const level = this.getLevel(xp);
        const rank = this.getRankByLevel(level);
        const xpStart = this.getXPForLevel(level);
        const xpEnd = this.getXPForLevel(level + 1);
        const progress = (xp - xpStart) / (xpEnd - xpStart);

        return {
            level,
            rank,
            xpCurrent: xp - xpStart,
            xpTotal: xpEnd - xpStart,
            percent: progress,
            totalXP: xp
        };
    }
}
