/**
 * SISTEMA DE PROGRESIÓN DE XP - XANEZU CATCH
 * Fuente única de verdad definida en sistema-progresion-xp.md
 */

export const MAX_LEVEL = 30;
export const FINAL_XP_GOAL = 350000;

/**
 * Tabla de XP acumulado por nivel.
 * El índice representa el nivel alcanzado (nivel 1 al 30).
 * El valor es el XP necesario para alcanzar dicho nivel.
 */
export const XP_PROGRESSION_TABLE: { [nivel: number]: number } = {
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

/**
 * Calcula el nivel actual basado en el XP acumulado.
 * @param xp XP total acumulado por el jugador
 */
export function calculateLevelFromXP(xp: number): number {
  if (xp < XP_PROGRESSION_TABLE[1]) return 0;
  
  let currentLevel = 0;
  for (let level = 1; level <= MAX_LEVEL; level++) {
    if (xp >= XP_PROGRESSION_TABLE[level]) {
      currentLevel = level;
    } else {
      break;
    }
  }
  return currentLevel;
}

/**
 * Retorna el XP necesario para alcanzar el siguiente nivel.
 * @param currentLevel Nivel actual del jugador
 */
export function getXPForNextLevel(currentLevel: number): number | null {
  if (currentLevel >= MAX_LEVEL) return null;
  return XP_PROGRESSION_TABLE[currentLevel + 1];
}

/**
 * Retorna el porcentaje de progreso dentro del nivel actual.
 * @param xp XP total acumulado
 */
export function getLevelProgressPercentage(xp: number): number {
  const currentLevel = calculateLevelFromXP(xp);
  if (currentLevel >= MAX_LEVEL) return 100;

  const currentThreshold = currentLevel === 0 ? 0 : XP_PROGRESSION_TABLE[currentLevel];
  const nextThreshold = XP_PROGRESSION_TABLE[currentLevel + 1];
  
  const levelRange = nextThreshold - currentThreshold;
  const xpInCurrentLevel = xp - currentThreshold;
  
  return Math.min(100, Math.max(0, (xpInCurrentLevel / levelRange) * 100));
}
