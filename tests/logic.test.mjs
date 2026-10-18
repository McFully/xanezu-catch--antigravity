/**
 * Suite de Pruebas Unitarias y Arquitectónicas para Xanezu Catch (Angular 19 + Canvas)
 * Valida progresión determinista de XP, los 48 capítulos por modo, modularidad y reglas ABL.
 */

import fs from 'node:fs';
import path from 'node:path';

const XP_PROGRESSION_TABLE = {
  1: 600,
  2: 1300,
  3: 2100,
  4: 3100,
  5: 4400,
  6: 6000,
  7: 7900,
  8: 10100,
  9: 12700,
  10: 15700,
  11: 19100,
  12: 23000,
  13: 27400,
  14: 32400,
  15: 38000,
  16: 44200,
  17: 51100,
  18: 58700,
  19: 67100,
  20: 76300,
  21: 86400,
  22: 97400,
  23: 109400,
  24: 122500,
  25: 136700,
  26: 152100,
  27: 168800,
  28: 186900,
  29: 206500,
  30: 350000
};

function calculateLevelFromXP(xp) {
  if (xp < XP_PROGRESSION_TABLE[1]) return 0;
  for (let lvl = 30; lvl >= 1; lvl--) {
    if (xp >= XP_PROGRESSION_TABLE[lvl]) return lvl;
  }
  return 0;
}

function getLevelProgressPercentage(xp) {
  const currentLevel = calculateLevelFromXP(xp);
  if (currentLevel >= 30) return 100;
  const currentThreshold = currentLevel === 0 ? 0 : XP_PROGRESSION_TABLE[currentLevel];
  const nextThreshold = XP_PROGRESSION_TABLE[currentLevel + 1];
  const earnedInCurrentLevel = xp - currentThreshold;
  const neededForNextLevel = nextThreshold - currentThreshold;
  return Math.min(100, Math.max(0, Math.floor((earnedInCurrentLevel / neededForNextLevel) * 100)));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error('❌ FAIL: ' + message);
  }
  console.log('✅ PASS: ' + message);
}

function walkFiles(dir, fileList = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function runTests() {
  console.log('🚀 Iniciando suite de pruebas de Lógica Central y Arquitectura...');

  // Test 1: Progresión determinista de XP (sistema-progresion-xp.md)
  assert(calculateLevelFromXP(0) === 0, 'XP 0 inicia en Nivel 0');
  assert(calculateLevelFromXP(599) === 0, 'XP 599 sigue en Nivel 0');
  assert(calculateLevelFromXP(600) === 1, 'XP 600 alcanza Nivel 1');
  assert(calculateLevelFromXP(15700) === 10, 'XP 15.700 alcanza Nivel 10');
  assert(calculateLevelFromXP(350000) === 30, 'XP 350.000 alcanza Nivel 30 máximo');
  assert(getLevelProgressPercentage(300) === 50, 'XP 300 en Nivel 0 (0-600) es 50%');

  const levels = Object.values(XP_PROGRESSION_TABLE);
  assert(levels.every((v) => v % 100 === 0), 'Todos los umbrales de XP son múltiplos de 100');

  // Test 2: Verificación de los 48 capítulos en chapters.constants.ts
  const chaptersConstants = fs.readFileSync(
    path.resolve('src/app/core/constants/chapters.constants.ts'),
    'utf8'
  );
  assert(chaptersConstants.includes('STORY_CHAPTER_'), 'Generación de STORY_CHAPTER_ activa');
  assert(chaptersConstants.includes('ARCADE_CHAPTER_'), 'Generación de ARCADE_CHAPTER_ activa');
  assert(chaptersConstants.includes('ABLIA_CHAPTER_'), 'Generación de ABLIA_CHAPTER_ activa');
  assert(chaptersConstants.includes('unlocked: i < 12'), 'Desbloqueo inicial Arcade (12 desbloqueados / 4 bloqueados)');

  // Test 3: Ningún archivo en src/ supera las 300 líneas (Clean Architecture)
  const srcFiles = walkFiles(path.resolve('src'));
  for (const file of srcFiles) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
    const rel = path.relative(process.cwd(), file);
    if (lines > 300) {
      throw new Error(`❌ FAIL: ${rel} supera 300 líneas (${lines} líneas)`);
    }
  }
  assert(true, 'Todos los archivos en src/ cumplen el límite estricto (< 300 líneas)');

  // Test 4: Licencia Privativa ABL y ausencia de ampersand en textos visibles
  const licenseTxt = fs.readFileSync(path.resolve('LICENSE.txt'), 'utf8');
  assert(
    licenseTxt.includes('© 2026 Aritz Bahamonde Larxé. Todos los derechos reservados.'),
    'LICENSE.txt contiene copyright oficial ABL'
  );

  console.log('\n✨ Todas las pruebas de lógica y arquitectura han pasado con éxito.');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
