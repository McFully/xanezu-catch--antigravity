/**
 * Suite de Pruebas Unitarias para Xanezu Catch
 * Valida la lógica central sin dependencias de motor gráfico.
 */

import { RankManager } from '../js/managers/RankManager.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error("❌ FAIL: " + message);
    }
    console.log("✅ PASS: " + message);
}

async function runTests() {
    console.log("🚀 Iniciando suite de pruebas de Lógica Central...");
    
    const rm = new RankManager();

    // Test 1: Cálculo de Nivel
    assert(rm.getLevel(0) === 1, "XP 0 debería ser Nivel 1");
    assert(rm.getLevel(400) === 3, "XP 400 debería ser Nivel 3 (sqrt(400/100)+1 = 3)");
    assert(rm.getLevel(10000) === 11, "XP 10000 debería ser Nivel 11");

    // Test 2: XP requerida
    assert(rm.getXPForLevel(1) === 0, "Level 1 requiere 0 XP");
    assert(rm.getXPForLevel(2) === 100, "Level 2 requiere 100 XP");

    // Test 3: Sistema de Rangos
    assert(rm.getRankByLevel(1).name === 'ROOKIE', "Nivel 1 es ROOKIE");
    assert(rm.getRankByLevel(10).name === 'VETERAN', "Nivel 10 es VETERAN");
    assert(rm.getRankByLevel(100).name === 'XANEZU LORD', "Nivel 100 es XANEZU LORD");

    // Test 4: Progreso de UI
    const progress = rm.getProgress(250);
    assert(progress.level === 2, "250 XP es Nivel 2");
    assert(progress.percent === 0.5, "250 XP en Nivel 2 (100-400) es 50%");

    console.log("\n✨ Todas las pruebas de lógica han pasado con éxito.");
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});
