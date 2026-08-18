import { Injectable, signal, computed } from '@angular/core';
import { 
  calculateLevelFromXP, 
  getXPForNextLevel, 
  getLevelProgressPercentage,
  XP_PROGRESSION_TABLE,
  MAX_LEVEL
} from '../constants/progression.constants';

@Injectable({
  providedIn: 'root'
})
export class ProgressionService {
  // Signal para el XP total (fuente de verdad reactiva)
  private totalXPInternal = signal<number>(this.loadXP());
  
  public totalXP = this.totalXPInternal.asReadonly();
  
  // Nivel actual derivado del XP
  public currentLevel = computed(() => calculateLevelFromXP(this.totalXP()));
  
  // Porcentaje de progreso en el nivel actual
  public progressPercentage = computed(() => getLevelProgressPercentage(this.totalXP()));
  
  // XP necesario para el siguiente nivel
  public nextLevelXP = computed(() => getXPForNextLevel(this.currentLevel()));
  
  // XP restante para subir de nivel
  public xpToNextLevel = computed(() => {
    const next = this.nextLevelXP();
    if (next === null) return 0;
    return next - this.totalXP();
  });

  constructor() {
    // Sincronizar con localStorage inicialmente
    this.totalXPInternal.set(this.loadXP());
  }

  /**
   * Carga el XP desde el almacenamiento local.
   */
  private loadXP(): number {
    return parseInt(localStorage.getItem('mx_total_xp') || '0', 10);
  }

  /**
   * Añade XP al total y persiste el cambio.
   * @param amount Cantidad de XP a añadir
   */
  public addXP(amount: number): void {
    const newXP = this.totalXP() + amount;
    this.totalXPInternal.set(newXP);
    localStorage.setItem('mx_total_xp', newXP.toString());
    
    // Verificar si se alcanzó un nuevo nivel máximo histórico
    const level = this.currentLevel();
    const maxLevel = parseInt(localStorage.getItem('mx_max_level') || '0', 10);
    if (level > maxLevel) {
      localStorage.setItem('mx_max_level', level.toString());
    }
  }

  /**
   * Retorna el umbral de XP para un nivel específico.
   */
  public getThresholdForLevel(level: number): number {
    return XP_PROGRESSION_TABLE[level] || 0;
  }
}
