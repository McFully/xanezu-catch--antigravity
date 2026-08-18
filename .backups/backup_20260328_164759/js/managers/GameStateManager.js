export class GameStateManager {
    constructor(game) {
        this.game = game;
        this.mode = 'STORY'; // 'STORY', 'ARCADE', 'ABL'
        this.state = 'loading_screen'; // Iniciar siempre en carga
        
        // Historial de navegación para botón 'Atrás'
        this.history = [];
    }

    navigate(newState) {
        if (!newState) return;
        console.log(`[StateManager] 🔄 Transition: ${this.state} -> ${newState}`);
        if (this.state !== newState) {
            this.history.push(this.state);
            this.state = newState;
            if (this.game) this.game.state = newState;
        }
    }

    back() {
        if (this.history.length > 0) {
            const prevState = this.history.pop();
            console.log(`[StateManager] ⬅️ Back to: ${prevState}`);
            this.state = prevState;
            if (this.game) this.game.state = prevState;
        } else {
            this.state = 'main_menu';
            if (this.game) this.game.state = 'main_menu';
        }
    }

    setMode(mode) {
        console.log(`[StateManager] 🕹️ Mode set to: ${mode}`);
        this.mode = mode || 'STORY';
    }

    // Helpers de Estado (Actualizados según el plan)
    isMainMenu() { return this.state === 'main_menu'; }
    isGameplay() { return this.state === 'gameplay'; }
    isLoading() { return this.state === 'loading_screen'; }
    
    // Helpers de Modo
    isArcadeMode() { return this.mode === 'ARCADE'; }
    isABLMode() { return this.mode === 'ABL'; }
    isStoryMode() { return this.mode === 'STORY'; }
}
