/**
 * XANEZU CATCH - Main Entry Point
 * Arquitectura 100% Canvas - Sin Dependencias DOM
 * --------------------------------------------------
 * Este archivo inicializa el motor modular del juego y gestiona
 * el ciclo de vida inicial. Toda la lógica de UI se ha movido
 * al sistema de estados renderizado por Canvas.
 */

import { Game } from './core/Game.js';

const initGame = async () => {
    if (window.gameInitialized) return;
    window.gameInitialized = true;

    try {
        console.log("🚀 Xanezu Catch: Iniciando motor de alto rendimiento...");
        
        // Inicialización del motor principal
        // El constructor de Game ya maneja el canvas y el resize global.
        window.game = new Game();
        await window.game.init();
        
        console.log("🎮 Sistema de Juego Preparado (Estado: " + window.game.state + ")");
    } catch (e) {
        console.error("❌ ERROR FATAL: Fallo al inicializar el juego:", e);
        if (window.onerror) {
            window.onerror(e.message, null, null, null, e);
        }
    }
};

// Punto de entrada seguro
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Log de Versión para Depuración
console.log("📦 Versión: STITCH EDITION / ALPHA v0.2.0-CANVAS");
