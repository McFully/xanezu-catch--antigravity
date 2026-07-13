export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 576;

// Sistema de Coordenadas Lógicas (Resolución Base)
export const LOGICAL_WIDTH = 1920;
export const LOGICAL_HEIGHT = 576;

// Calibración de Suelo (98% de la altura lógica)
export const GROUND_LEVEL_Y_PERCENT = 0.98;
export const LOGICAL_GROUND_Y = LOGICAL_HEIGHT * GROUND_LEVEL_Y_PERCENT;

export enum EngineState {
    BOOT = 'BOOT',
    LOADING = 'LOADING',
    READY = 'READY',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    GAMEOVER = 'GAMEOVER',
    VICTORY = 'VICTORY'
}
// --- GAMEPLAY ELEMENT SIZES ---
export const PLAYER_SIZE = 96;
export const OBSTACLE_W_SIZE = 100;
export const ITEM_SIZE = 64;
