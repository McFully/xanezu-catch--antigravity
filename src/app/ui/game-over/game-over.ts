import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { GameDataService } from '../../core/services/game-data.service';
import { GameState } from '../../core/models/game-state.enum';

@Component({
  selector: 'app-game-over',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gameover-overlay active">
      <div class="gameover-content-aaa">
        
        <!-- Izquierda: Premios (2x2 Grid) -->
        <div class="lo-col lo-col-left">
          <div class="go-panel-premium">
            <div class="go-panel-header">PREMIOS OBTENIDOS</div>
            <div class="go-panel-body scrollable grid-2x2">
              
              <!-- Hub 1: RECOMPENSAS -->
              <div class="go-section">
                <div class="go-section-title">RECOMPENSAS</div>
                <div class="go-prize-list">
                  @for (item of gameData.rewards.slice(0, 2); track item.id) {
                    <div class="go-prize-item rare">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Hub 2: POWER-UPS -->
              <div class="go-section">
                <div class="go-section-title">POWER-UPS</div>
                <div class="go-prize-list">
                  @for (item of gameData.powerups.slice(0, 2); track item.id) {
                    <div class="go-prize-item gold">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Hub 3: GEMAS -->
              <div class="go-section">
                <div class="go-section-title">GEMAS</div>
                <div class="go-prize-list">
                  @for (item of gameData.gems.slice(0, 2); track item.id) {
                    <div class="go-prize-item rare">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Hub 4: ARTEFACTOS -->
              <div class="go-section">
                <div class="go-section-title">ARTEFACTOS</div>
                <div class="go-prize-list">
                  @for (item of gameData.artifacts.slice(0, 2); track item.id) {
                    <div class="go-prize-item artifact">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                    </div>
                  }
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Centro: Score y Acciones -->
        <div class="lo-col lo-col-center">
          <div class="go-center-wrapper">
            <h1 class="gameover-title-premium">GAME OVER</h1>
            <div class="go-score-hero">
              <span class="score-label">PUNTUACIÓN FINAL</span>
              <span class="score-number">{{ (gameData.lastGameStats.score || 0) | number }}</span>
            </div>
            
            <div class="go-action-buttons">
              <button class="menu-btn primary-btn" (click)="retry()">REINTENTAR</button>
              <button class="menu-btn secondary-btn" (click)="goToChapters()">SELECCIONAR CAPÍTULO</button>
              <button class="menu-btn secondary-btn" (click)="goToMenu()">MENÚ PRINCIPAL</button>
            </div>
          </div>
        </div>

        <!-- Derecha: Estadísticas -->
        <div class="lo-col lo-col-right">
          <div class="go-panel-premium">
            <div class="go-panel-header">ANÁLISIS PARTIDA</div>
            <div class="go-panel-body">
              <div class="go-stat-premium">
                <span class="label">TIEMPO VIVIDO</span>
                <span class="value">{{ gameData.lastGameStats.time || '0:00' }}</span>
              </div>
              <div class="go-stat-premium">
                <span class="label">NIVEL ALCANZADO</span>
                <span class="value">NIVEL {{ gameData.lastGameStats.level || 1 }}</span>
              </div>
              <div class="go-stat-premium">
                <span class="label">MULTI. MÁXIMO</span>
                <span class="value">x{{ gameData.lastGameStats.maxMultiplier || 1 }}</span>
              </div>
              <div class="go-stat-premium total-bonus">
                <span class="label">XP TOTAL GANADA</span>
                <span class="value">+{{ (gameData.lastGameStats.xp || 0) | number }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .gameover-overlay {
      position: fixed; inset: 0; background: rgba(8, 4, 4, 0.9); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Outfit', sans-serif;
      backdrop-filter: blur(15px) saturate(160%);
    }

    .gameover-content-aaa {
      display: grid; grid-template-columns: 32% 40% 28%;
      width: 98%; height: 90%; max-width: 1600px; gap: 30px; padding: 20px;
      animation: go-aaa-enter 0.7s cubic-bezier(0.19, 1, 0.22, 1) forwards;
    }

    @keyframes go-aaa-enter {
      from { opacity: 0; transform: scale(0.95) translateY(30px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .lo-col { display: flex; flex-direction: column; height: 100%; }

    .go-panel-premium {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 215, 0, 0.15); border-radius: 24px;
      display: flex; flex-direction: column; height: 100%; overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px);
    }

    .go-panel-header {
      padding: 18px; background: rgba(255, 215, 0, 0.1);
      border-bottom: 1px solid rgba(255, 215, 0, 0.2);
      color: #FFD700; font-weight: 900; font-size: 13px;
      letter-spacing: 3px; text-align: center; text-transform: uppercase;
    }

    .go-panel-body { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 15px; }
    .go-panel-body.scrollable { overflow-y: auto; }
    
    .grid-2x2 {
      display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 20px;
    }

    .go-section { display: flex; flex-direction: column; gap: 10px; }
    .go-section-title {
      font-size: 9px; font-weight: 800; color: rgba(255, 255, 255, 0.4);
      letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;
      border-left: 2px solid #FFD700; padding-left: 5px;
    }

    .go-prize-list { display: flex; flex-direction: column; gap: 6px; }
    .go-prize-item {
      display: flex; align-items: center; gap: 10px; padding: 10px;
      background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }
    .go-prize-item .icon { font-size: 18px; }
    .go-prize-item .name { font-size: 9px; color: #ccc; font-weight: 600; text-transform: uppercase; }

    .go-prize-item.rare { border-left: 3px solid #18EED8; }
    .go-prize-item.gold { border-left: 3px solid #FFD700; }
    .go-prize-item.artifact { border-left: 3px solid #9370DB; }

    .go-stat-premium {
      padding: 15px; background: rgba(255, 255, 255, 0.03); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .go-stat-premium .label { display: block; font-size: 9px; color: #888; letter-spacing: 1px; margin-bottom: 4px; }
    .go-stat-premium .value { display: block; font-size: 16px; font-weight: 900; color: #fff; }
    .go-stat-premium.total-bonus { background: linear-gradient(135deg, rgba(24, 238, 216, 0.15) 0%, rgba(0,0,0,0.4) 100%); border-color: #18EED855; margin-top: auto; }
    .go-stat-premium.total-bonus .value { color: #18EED8; font-size: 22px; }

    .lo-col-center { justify-content: center; align-items: center; }
    .go-center-wrapper { display: flex; flex-direction: column; align-items: center; gap: 45px; text-align: center; }

    .gameover-title-premium {
      font-size: 100px; margin: 0; color: #ff2d20; letter-spacing: 10px; font-weight: 900;
      text-shadow: 0 0 30px rgba(255, 45, 32, 0.6), 0 5px 0 #800;
      animation: go-title-pulse 2s ease-in-out infinite alternate;
    }

    @keyframes go-title-pulse {
      from { transform: scale(1); filter: drop-shadow(0 0 20px rgba(255, 45, 32, 0.4)); }
      to { transform: scale(1.02); filter: drop-shadow(0 0 40px rgba(255, 45, 32, 0.8)); }
    }

    .go-score-hero { display: flex; flex-direction: column; gap: 5px; }
    .go-score-hero .score-label { font-size: 14px; font-weight: 800; color: rgba(255, 255, 255, 0.4); letter-spacing: 6px; }
    .go-score-hero .score-number { font-size: 72px; font-weight: 900; color: #fff; line-height: 1; }

    .go-action-buttons { display: flex; flex-direction: column; gap: 15px; width: 100%; min-width: 320px; pointer-events: auto; }
    .menu-btn {
      width: 100%; height: 60px; font-size: 14px; font-weight: 800; letter-spacing: 3px; border-radius: 16px;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .primary-btn { background: #FFD700; color: #000; border: none; box-shadow: 0 0 30px rgba(255, 215, 0, 0.3); }
    .primary-btn:hover { transform: scale(1.05); box-shadow: 0 0 50px rgba(255, 215, 0, 0.6); }
    .secondary-btn { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; }
    .secondary-btn:hover { background: rgba(255, 255, 255, 0.1); transform: scale(1.03); border-color: #fff; }

    @media (max-width: 1100px) {
      .gameover-content-aaa { grid-template-columns: 1fr; overflow-y: auto; height: auto; padding: 40px 20px; }
      .lo-col-center { order: -1; }
      .grid-2x2 { grid-template-columns: 1fr; }
    }
  `]
})
export class GameOverComponent {
  private gameStateService = inject(GameStateService);
  public gameData = inject(GameDataService);

  retry() {
    this.gameStateService.navigate(GameState.LOADING_SCREEN);
  }

  goToChapters() {
    this.gameStateService.navigate(GameState.STORY_CHAPTER_SELECT);
  }

  goToMenu() {
    this.gameStateService.navigate(GameState.MAIN_MENU);
  }
}
