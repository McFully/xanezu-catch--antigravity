export class CharacterFactory {
    applyTheme(game, chapterConfig) {
        if (!game || !chapterConfig) return;

        const isArcade = game.stateManager?.isArcadeMode?.() === true;
        const colors = chapterConfig.colors || ['#A6F616', '#18EED8'];

        game.characterTheme = {
            name: chapterConfig.character || chapterConfig.name,
            particlePrimary: colors[0],
            particleSecondary: colors[1] || colors[0],
            isPremium: isArcade,
            glowColor: isArcade ? colors[0] : 'transparent'
        };

        if (game.particles) {
            const count = isArcade ? 40 : 16;
            game.particles.spawn(220, 120, game.characterTheme.particlePrimary, count, 'spark');
            if (isArcade) {
                game.particles.spawn(250, 130, '#FFFFFF', 10, 'star');
            }
        }
    }
}
