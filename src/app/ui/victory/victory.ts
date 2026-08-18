import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { GameState } from '../../core/models/game-state.enum';
import { GameDataService } from '../../core/services/game-data.service';
import { AudioService } from '../../core/audio.service';

@Component({
  selector: 'app-victory',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" [class]="gameStateService.currentMode()">
      <div class="victory-card">
        <div class="badge">
          @if (gameStateService.currentMode() === 'story') { MISSION COMPLETE }
          @else if (gameStateService.currentMode() === 'arcade') { NUEVO RÉCORD }
          @else { MODO <span>ABLIA</span> }
        </div>
        
        <div class="stats-grid">
          @if (gameStateService.currentMode() === 'story') {
            <!-- MODO HISTORIA: 4 HUBS -->
            <div class="column">
              <div class="hub">
                <span class="label">RECOMPENSAS</span>
                <div class="item-list">
                  @for (item of gameData.rewards.slice(0,4); track item.id) {
                    <div class="item-entry">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                      <span class="count">x{{ getRandomCount() }}</span>
                    </div>
                  }
                </div>
              </div>
              <div class="hub">
                <span class="label">GEMAS</span>
                <div class="item-list">
                  @for (item of gameData.gems.slice(0,3); track item.id) {
                    <div class="item-entry">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                      <span class="count">x{{ getRandomCount() }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div class="column">
              <div class="hub">
                <span class="label">POWER-UPS</span>
                <div class="item-list">
                  @for (item of gameData.powerups.slice(0,3); track item.id) {
                    <div class="item-entry">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                      <span class="status">MAX LEVEL</span>
                    </div>
                  }
                </div>
              </div>
              <div class="hub">
                <span class="label">ARTEFACTOS</span>
                <div class="item-list">
                  @for (item of gameData.artifacts.slice(0,2); track item.id) {
                    <div class="item-entry">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                      <span class="found">UNLOCKED</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          } @else if (gameStateService.currentMode() === 'arcade') {
            <!-- MODO ARCADE: RÉCORDS -->
            <div class="column">
              <div class="hub arcade-highlight">
                <span class="label">LOGROS ARCADE</span>
                <div class="arcade-stats">
                  <div class="stat-row"><span>PUNTOS TOTALES</span> <span class="v">450K</span></div>
                  <div class="stat-row"><span>MULTIPLICADOR MAX</span> <span class="v">x8.0</span></div>
                  <div class="stat-row"><span>BONO VELOCIDAD</span> <span class="v">+15%</span></div>
                </div>
              </div>
            </div>
            <div class="column">
              <div class="hub">
                <span class="label">COLECCIONABLES</span>
                <div class="item-list">
                  @for (item of gameData.rewards.slice(0,6); track item.id) {
                    <div class="item-entry">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                      <span class="count">x{{ getRandomCount() }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          } @else {
            <!-- MODO ABLIA: ADAPTIVIDAD -->
            <div class="column">
              <div class="hub ia-focus">
                <span class="label">ANALÍTICA ABLIA</span>
                <div class="ia-metrics">
                   <div class="metric">
                    <span>SINCRONÍA</span>
                    <div class="bar"><div class="fill" style="width: 95%"></div></div>
                    <span class="val">95%</span>
                  </div>
                  <div class="metric">
                    <span>NIVEL ADAPTATIVO</span>
                    <span class="val" style="font-size: 1.5rem">ALPHA-9</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="column">
              <div class="hub message">
                <span class="label">FEEDBACK ABLIA</span>
                <p class="ia-text">"Sujeto demuestra una coordinación excepcional. Elevando umbral de dificultad para el próximo sector."</p>
              </div>
            </div>
          }
        </div>

        <div class="score-summary">
          <div class="stat"><span>Total Puntos:</span> <span class="val">350,000+</span></div>
          <div class="stat highlight"><span>Monedas Xanezu:</span> <span class="val">+2,500</span></div>
        </div>

        <div class="actions">
          <button class="btn-primary" (click)="nextChapter()">SIGUIENTE CAPÍTULO</button>
          <div class="btn-group">
            <button class="btn-secondary" (click)="navigate(GameState.MODE_SELECT)">CAPÍTULOS</button>
            <button class="btn-secondary" (click)="navigate(GameState.MAIN_MENU)">INICIO</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(6, 8, 18, 0.9); backdrop-filter: blur(20px);
      z-index: 2000; display: flex; align-items: center; justify-content: center;
      font-family: 'Outfit', sans-serif; color: white;
      --theme-color: #A6F616; --theme-glow: rgba(166, 246, 22, 0.4);
    }

    /* Temas Dinámicos */
    .overlay.story { --theme-color: #00f2ff; --theme-glow: rgba(0, 242, 255, 0.4); }
    .overlay.arcade { --theme-color: #A6F616; --theme-glow: rgba(166, 246, 22, 0.4); }
    .overlay.ablia { --theme-color: #FFD700; --theme-glow: rgba(255, 215, 0, 0.4); }

    .victory-card {
      width: 650px; background: rgba(25, 45, 35, 0.98); border: 2px solid var(--theme-color);
      padding: 3.5rem; border-radius: 40px; box-shadow: 0 0 60px var(--theme-glow);
      text-align: center; animation: slideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
    }
    .badge {
      position: absolute; top: -15px; left: 50%; transform: translateX(-50%);
      background: var(--theme-color); color: #000; padding: 0.5rem 1.5rem; border-radius: 50px;
      font-weight: 900; font-size: 0.75rem; letter-spacing: 2px;
      box-shadow: 0 0 20px var(--theme-glow);
    }
    .title { font-size: 3.5rem; margin-bottom: 2rem; letter-spacing: -2px; font-weight: 900; text-transform: uppercase; }
    .title span { color: var(--theme-color); text-shadow: 0 0 25px var(--theme-glow); }
    
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; height: 350px; margin-bottom: 2rem; }
    .column { display: flex; flex-direction: column; gap: 1rem; }
    .hub { 
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); 
      padding: 1.2rem; border-radius: 20px; flex: 1; text-align: left;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .label { font-size: 0.65rem; color: var(--theme-color); font-weight: 800; letter-spacing: 2px; display: block; margin-bottom: 1rem; opacity: 0.7; }
    
    .item-list { display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; }
    .item-entry { display: flex; align-items: center; gap: 0.8rem; background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 12px; font-size: 0.8rem; }
    .count, .status, .found { margin-left: auto; font-weight: 800; color: var(--theme-color); font-size: 0.7rem; }

    /* Arcade Stats */
    .arcade-stats { display: flex; flex-direction: column; gap: 1.2rem; justify-content: center; height: 100%; }
    .stat-row { display: flex; justify-content: space-between; font-weight: 800; font-size: 0.9rem; }
    .stat-row .v { color: var(--theme-color); }

    /* IA Metrics */
    .ia-metrics { display: flex; flex-direction: column; gap: 1.5rem; justify-content: center; height: 100%; }
    .metric { margin-bottom: 0.5rem; }
    .metric span:not(.val) { font-size: 0.7rem; opacity: 0.6; display: block; margin-bottom: 0.4rem; }
    .bar { height: 8px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; }
    .fill { height: 100%; background: var(--theme-color); box-shadow: 0 0 10px var(--theme-glow); }
    .metric .val { font-weight: 900; color: var(--theme-color); display: block; text-align: right; margin-top: 0.3rem; }
    .ia-text { font-size: 0.9rem; font-style: italic; opacity: 0.8; line-height: 1.5; color: var(--theme-color); }

    .score-summary { background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 24px; margin-bottom: 2rem; text-align: left; }
    .stat { display: flex; justify-content: space-between; margin-bottom: 0.6rem; font-size: 1.1rem; }
    .stat .val { font-weight: 900; }
    .stat.highlight { color: var(--theme-color); border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.8rem; margin-top: 0.8rem; }
    
    .actions { display: flex; flex-direction: column; gap: 1rem; }
    .btn-group { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .btn-primary { background: var(--theme-color); color: #000; border: none; padding: 1.1rem; border-radius: 15px; font-weight: 900; font-size: 1.1rem; cursor: pointer; }
    .btn-secondary { background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 1rem; border-radius: 15px; font-weight: 700; cursor: pointer; }

    @keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class VictoryComponent {
  public gameStateService = inject(GameStateService);
  private audioService = inject(AudioService);
  public gameData = inject(GameDataService);
  public GameState = GameState;

  getRandomCount() { return Math.floor(Math.random() * 5) + 1; }
  
  nextChapter() {
    this.audioService.playClick();
    this.gameStateService.navigate(GameState.MODE_SELECT);
  }

  navigate(state: GameState) {
    this.audioService.playClick();
    this.gameStateService.navigate(state);
  }
}
