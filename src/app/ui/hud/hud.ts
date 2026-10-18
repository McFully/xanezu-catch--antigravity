import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngine, EngineState } from '../../game/engine/game-engine';
import { GameStateService } from '../../core/services/game-state.service';
import { GameState } from '../../core/models/game-state.enum';
import { calculateLevelFromXP, getLevelProgressPercentage, XP_PROGRESSION_TABLE } from '../../core/constants/progression.constants';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hud.html',
  styleUrl: './hud.css'
})
export class HUDComponent {
  @Input() engine!: GameEngine;
  @Input() mode: 'top' | 'bottom' | 'both' = 'both';

  public EngineState = EngineState;

  get showTop() { return this.mode === 'top' || this.mode === 'both'; }
  get showBottom() { return this.mode === 'bottom' || this.mode === 'both'; }

  get currentPoints(): number {
    const xp = this.engine?.score || 0;
    const currentLevel = calculateLevelFromXP(xp);
    const currentThreshold = currentLevel === 0 ? 0 : XP_PROGRESSION_TABLE[currentLevel];
    return xp - currentThreshold;
  }

  get neededPoints(): number {
    const xp = this.engine?.score || 0;
    const currentLevel = calculateLevelFromXP(xp);
    if (currentLevel >= 30) return 350000;
    const currentThreshold = currentLevel === 0 ? 0 : XP_PROGRESSION_TABLE[currentLevel];
    const nextThreshold = XP_PROGRESSION_TABLE[currentLevel + 1];
    return nextThreshold - currentThreshold;
  }

  get remainingPoints(): number {
    return Math.max(0, this.neededPoints - this.currentPoints);
  }

  get displayLevel(): number {
    return calculateLevelFromXP(this.engine?.score || 0);
  }
  
  get displayProgressPercent(): number {
    return getLevelProgressPercentage(this.engine?.score || 0);
  }

  constructor(private gameStateService: GameStateService) {}

  public exitGame(): void {
    if (this.engine) {
      this.engine.audio.stopMusic();
    }
    this.gameStateService.navigate(GameState.MODE_SELECT);
  }

  public openTrophies(): void {
    if (this.engine) {
      this.engine.audio.stopMusic();
    }
    this.gameStateService.navigate(GameState.TROPHIES);
  }
}
