import { Component, inject, OnDestroy, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { GameState } from '../../core/models/game-state.enum';
import { AudioService } from '../../core/audio.service';
import { GameDataService } from '../../core/services/game-data.service';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay active" [class]="gameStateService.currentMode()">
      <div class="loading-backdrop"></div>
      
      <div class="loading-content-aaa">
        <!-- Izquierda: Guía de Juego -->
        <div class="lo-col lo-col-left">
          <div class="go-panel-premium">
            <div class="go-panel-header">GUÍA DE PREMIOS</div>
            <div class="go-panel-body scrollable">
              <div class="go-section">
                <div class="go-section-title">RECOMPENSAS</div>
                <div class="go-prize-list">
                  @for (item of gameData.rewards.slice(0, 3); track item.id) {
                    <div class="go-prize-item rare">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                      <span class="val">XP</span>
                    </div>
                  }
                </div>
              </div>
              <div class="go-section">
                <div class="go-section-title">CONSUMIBLES</div>
                <div class="go-prize-list">
                  @for (item of gameData.powerups.slice(0, 2); track item.id) {
                    <div class="go-prize-item gold">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                      <span class="val">ACTIVO</span>
                    </div>
                  }
                </div>
              </div>
              <div class="go-section">
                <div class="go-section-title">ARTEFACTOS</div>
                <div class="go-prize-list">
                  @for (item of gameData.artifacts.slice(0, 1); track item.id) {
                    <div class="go-prize-item artifact">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="name">{{ item.name }}</span>
                      <span class="val">COLECCIONABLE</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Centro: Hub de Carga -->
        <div class="lo-col lo-col-center">
          <div class="lo-center-hub">
            <div class="lo-title-box">
              <span class="lo-label-main">LOADING SYSTEM</span>
              <h1 class="lo-game-title">XANEZU CATCH</h1>
              <span class="lo-chapter-tag">
                {{ currentChapterName }}
              </span>
            </div>

            <div class="lo-progress-container">
              <div class="lo-info">
                <span class="lo-status">{{ statusText }}</span>
                <span class="lo-percent">{{ gameStateService.loadingProgress() | number:'1.0-0' }}%</span>
              </div>
              <div class="lo-bar-outer">
                <div class="lo-bar-fill" [style.width.%]="gameStateService.loadingProgress()"></div>
              </div>
            </div>

            <div class="lo-tip-box">
              <span class="tip-header">CONSEJO PROFESIONAL</span>
              <p class="tip-text">{{ currentTip }}</p>
            </div>
          </div>
        </div>

        <!-- Derecha: Estadísticas -->
        <div class="lo-col lo-col-right">
          <div class="go-panel-premium">
            <div class="go-panel-header">ESTADÍSTICAS GLOBALES</div>
            <div class="go-panel-body">
              <div class="go-stat-premium">
                <span class="label">TIEMPO TOTAL</span>
                <span class="value">{{ stats.totalTime || '0h 0m' }}</span>
              </div>
              <div class="go-stat-premium">
                <span class="label">NIVEL MÁXIMO</span>
                <span class="value">NIV. {{ stats.maxLevel || 1 }}</span>
              </div>
              <div class="go-stat-premium">
                <span class="label">PARTIDAS JUGADAS</span>
                <span class="value">{{ stats.gamesPlayed || 0 }}</span>
              </div>
              <div class="go-stat-premium total-bonus">
                <span class="label">RÉCORD PERSONAL</span>
                <span class="value">{{ (stats.highScore || 0) | number }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed; inset: 0; background: #02040a; z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Outfit', sans-serif; color: white;
      -webkit-backdrop-filter: blur(18px) saturate(160%);
      backdrop-filter: blur(18px) saturate(160%);
    }

    .loading-backdrop {
      position: absolute; inset: 0; z-index: -1;
      background-image: radial-gradient(circle at 50% 50%, rgba(24, 238, 216, 0.1) 0%, transparent 70%);
      overflow: hidden;
    }

    .loading-content-aaa {
      display: grid; grid-template-columns: 28% 44% 28%;
      width: 96%; height: 85%; max-width: 1500px; gap: 30px;
      animation: lo-aaa-enter 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
    }

    @keyframes lo-aaa-enter {
      from { opacity: 0; transform: scale(0.98) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .lo-col { display: flex; flex-direction: column; height: 100%; }
    .lo-col-center { justify-content: center; align-items: center; }

    .go-panel-premium {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(24, 238, 216, 0.2);
      border-radius: 24px; display: flex; flex-direction: column; height: 100%;
      overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
    }

    .go-panel-header {
      padding: 18px; background: rgba(24, 238, 216, 0.1);
      border-bottom: 1px solid rgba(24, 238, 216, 0.2);
      color: #18EED8; font-weight: 900; font-size: 13px;
      letter-spacing: 3px; text-align: center; text-transform: uppercase;
    }

    .go-panel-body { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 15px; }
    .go-panel-body.scrollable { overflow-y: auto; }

    .go-section-title {
      font-size: 9px; font-weight: 800; color: rgba(255, 255, 255, 0.4);
      letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;
      padding-left: 5px; border-left: 2px solid #18EED8;
    }

    .go-prize-list { display: flex; flex-direction: column; gap: 8px; }
    .go-prize-item {
      display: flex; align-items: center; gap: 12px; padding: 12px;
      background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }

    .go-prize-item .icon { font-size: 20px; width: 24px; text-align: center; }
    .go-prize-item .name { flex: 1; font-size: 11px; font-weight: 600; color: #ccc; text-transform: uppercase; }
    .go-prize-item .val { font-weight: 900; color: #18EED8; font-size: 10px; opacity: 0.7; }
    
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

    .lo-center-hub { width: 100%; max-width: 600px; display: flex; flex-direction: column; align-items: center; gap: 40px; }
    .lo-title-box { text-align: center; display: flex; flex-direction: column; gap: 5px; }
    .lo-label-main { font-size: 12px; font-weight: 800; color: #18EED8; letter-spacing: 12px; text-transform: uppercase; margin-left: 12px; }
    .lo-game-title { font-size: 56px; color: #fff; margin: 0; letter-spacing: 2px; font-weight: 900; text-shadow: 0 5px 25px rgba(0,0,0,0.5); }
    .lo-chapter-tag { font-size: 11px; font-weight: 700; color: rgba(255, 255, 255, 0.4); background: rgba(255,255,255,0.05); padding: 6px 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); margin-top: 10px; }

    .lo-progress-container { width: 100%; display: flex; flex-direction: column; gap: 12px; }
    .lo-bar-outer { width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
    .lo-bar-fill { height: 100%; background: linear-gradient(90deg, #18EED8, #16A6F6); border-radius: 10px; box-shadow: 0 0 15px rgba(24, 238, 216, 0.4); transition: width 0.3s ease; }
    .lo-info { display: flex; justify-content: space-between; width: 100%; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
    .lo-status { color: #aaa; }
    .lo-percent { color: #fff; }

    .lo-tip-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 15px 25px; text-align: center; max-width: 400px; }
    .tip-header { font-size: 10px; font-weight: 900; color: #FFD700; letter-spacing: 2px; display: block; margin-bottom: 8px; }
    .tip-text { font-size: 12px; color: #eee; margin: 0; line-height: 1.5; font-style: italic; }

    @media (max-width: 1000px) {
      .loading-content-aaa { grid-template-columns: 1fr; overflow-y: auto; height: auto; padding: 40px 20px; }
      .lo-col-center { order: -1; margin-bottom: 30px; }
    }
  `]
})
export class LoadingScreenComponent implements OnInit, OnDestroy {
  public gameStateService = inject(GameStateService);
  private audioService = inject(AudioService);
  public gameData = inject(GameDataService);

  public statusText = 'INICIALIZANDO SISTEMAS...';
  public currentTip = '';
  public currentChapterName = 'Buscando Datos...';
  public stats: any = {};

  private tips = [
    "Usa el DASH en el aire para esquivar obstáculos difíciles.",
    "Captura 5 moscas doradas para activar el modo FEVER.",
    "Los artefactos raros te dan multiplicadores de puntuación permanentes.",
    "¡El imán atrae incluso las gemas más lejanas!",
    "Mantén la calma, el ritmo de la música te ayudará a saltar mejor.",
    "¿Sabías que cada capítulo tiene obstáculos únicos?",
    "El escudo te protege de un impacto. ¡No lo malgastes!",
    "Consigue Gemas de Vida para aguantar más en el modo Infinito."
  ];

  constructor() {
    this.audioService.stopMusic();
    
    // Reaccionar al estado Ready del motor
    effect(() => {
      if (this.gameStateService.engineReady()) {
        this.statusText = 'ESTADO: LISTO PARA DESPEGUE';
        setTimeout(() => {
          this.gameStateService.navigate(GameState.PLAYING);
        }, 1200);
      }
    });

    // Reaccionar al progreso para cambiar el status text
    effect(() => {
      const p = this.gameStateService.loadingProgress();
      if (p < 30) this.statusText = 'CARGANDO RECURSOS EXTERNOS...';
      else if (p < 60) this.statusText = 'CONFIGURANDO MOTOR FÍSICO...';
      else if (p < 90) this.statusText = 'SINCRONIZANDO PARTÍCULA XANEZU...';
      else if (!this.gameStateService.engineReady()) this.statusText = 'ESPERANDO RESPUESTA DEL NÚCLEO...';
    });
  }

  ngOnInit() {
    this.currentTip = this.tips[Math.floor(Math.random() * this.tips.length)];
    this.loadGlobalStats();
    this.currentChapterName = this.gameStateService.currentChapter()?.title || "CAPÍTULO SELECCIONADO";
  }

  loadGlobalStats() {
    // Simulación de carga de stats reales (esto debería venir de un servicio)
    this.stats = {
      totalTime: localStorage.getItem('mx_total_time_formatted') || '0h 42m',
      maxLevel: localStorage.getItem('mx_max_chapter') || '1',
      gamesPlayed: localStorage.getItem('mx_games_played') || '0',
      highScore: parseInt(localStorage.getItem('mx_high_score') || '0')
    };
  }

  ngOnDestroy() {
    console.log('[LoadingScreen] 🧹 Cleaning up loading screen.');
  }
}
