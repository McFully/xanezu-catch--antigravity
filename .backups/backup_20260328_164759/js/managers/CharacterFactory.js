export class CharacterFactory {
    applyTheme(game, chapterConfig) {
        if (!game || !chapterConfig) return;

        const isArcade = game.stateManager?.isArcadeMode?.() === true;
        const isABL = game.stateManager?.isABLMode?.() === true;
        const colors = chapterConfig.colors || ['#A6F616', '#18EED8'];
        const biome = String(chapterConfig.biome || chapterConfig.bg || 'forest').toLowerCase();
        const accent = isABL
            ? this._getAblAccent(biome, colors)
            : (colors[1] || colors[0]);
        const glow = isArcade
            ? colors[0]
            : isABL
                ? accent
                : 'transparent';

        game.characterTheme = {
            name: chapterConfig.character || chapterConfig.name,
            particlePrimary: colors[0],
            particleSecondary: accent,
            isPremium: isArcade,
            isABL,
            glowColor: glow,
            biome,
        };

        if (game.particles) {
            const count = isArcade ? 40 : (isABL ? 26 : 16);
            game.particles.spawn(220, 120, game.characterTheme.particlePrimary, count, 'spark');
            if (isArcade) {
                game.particles.spawn(250, 130, game.characterTheme.particleSecondary, 10, 'star');
            } else if (isABL) {
                game.particles.spawn(248, 128, game.characterTheme.particleSecondary, 8, 'circle');
            }
        }
    }

    _getAblAccent(biome, colors) {
        if (/arcade|retro|space|tech/.test(biome)) return '#77f7ff';
        if (/lava|volcano/.test(biome)) return '#ff8740';
        if (/ice|crystal/.test(biome)) return '#c6f3ff';
        if (/japan|enchanted/.test(biome)) return '#f3a7ff';
        if (/desert|moon/.test(biome)) return '#ffd27d';
        if (/underwater|rain/.test(biome)) return '#7ed6ff';
        return colors[1] || colors[0] || '#18EED8';
    }
}
