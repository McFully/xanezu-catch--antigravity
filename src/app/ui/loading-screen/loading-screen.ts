import { Component, inject, OnDestroy, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { GameState } from '../../core/models/game-state.enum';
import { AudioService } from '../../core/audio.service';
import { GameDataService } from '../../core/services/game-data.service';
import { ProgressionService } from '../../core/services/progression.service';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './loading-screen.css',
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
                <span class="value">{{ progression.totalTimeFormatted() }}</span>
              </div>
              <div class="go-stat-premium">
                <span class="label">NIVEL MÁXIMO</span>
                <span class="value">NIV. {{ progression.maxLevel() }}</span>
              </div>
              <div class="go-stat-premium">
                <span class="label">PARTIDAS JUGADAS</span>
                <span class="value">{{ progression.gamesPlayed() }}</span>
              </div>
              <div class="go-stat-premium total-bonus">
                <span class="label">RÉCORD PERSONAL</span>
                <span class="value">{{ progression.highScore() | number }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoadingScreenComponent implements OnInit, OnDestroy {
  public gameStateService = inject(GameStateService);
  private audioService = inject(AudioService);
  public gameData = inject(GameDataService);
  public progression = inject(ProgressionService);

  public statusText = 'INICIALIZANDO SISTEMAS...';
  public currentTip = '';
  public currentChapterName = 'Buscando Datos...';
  private readyTimeout: any = null;

  constructor() {
    this.audioService.stopMusic();
    
    effect(() => {
      if (this.gameStateService.engineReady()) {
        this.statusText = 'ESTADO: LISTO PARA DESPEGUE';
        this.readyTimeout = setTimeout(() => {
          this.gameStateService.navigate(GameState.PLAYING);
        }, 1200);
      }
    });

    effect(() => {
      const p = this.gameStateService.loadingProgress();
      if (p < 30) this.statusText = 'CARGANDO RECURSOS EXTERNOS...';
      else if (p < 60) this.statusText = 'CONFIGURANDO MOTOR FÍSICO...';
      else if (p < 90) this.statusText = 'SINCRONIZANDO PARTÍCULA XANEZU...';
      else if (!this.gameStateService.engineReady()) this.statusText = 'ESPERANDO RESPUESTA DEL NÚCLEO...';
    });
  }

  ngOnInit() {
    this.currentTip = this.gameData.getRandomTip();
    this.currentChapterName = this.gameStateService.currentChapter()?.title || 'CAPÍTULO SELECCIONADO';
  }

  ngOnDestroy() {
    if (this.readyTimeout) {
      clearTimeout(this.readyTimeout);
    }
  }
}
