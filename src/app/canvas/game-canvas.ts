import { Component, inject, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../core/services/game-state.service';
import { GameState } from '../core/models/game-state.enum';
import { GameEngine } from '../game/engine/game-engine';
import { AudioService } from '../core/audio.service';
import { GameDataService } from '../core/services/game-data.service';
import { HUDComponent } from '../ui/hud/hud';

@Component({
  selector: 'app-game-canvas',
  standalone: true,
  imports: [CommonModule, HUDComponent],
  template: `
    <div class="layout-wrapper">
      <div class="hub-slot top">
        <app-hud *ngIf="engine" [engine]="engine" mode="top"></app-hud>
      </div>
      
      <div class="canvas-container" #container>
        <canvas #gameCanvas></canvas>
      </div>

      <div class="hub-slot bottom">
        <app-hud *ngIf="engine" [engine]="engine" mode="bottom"></app-hud>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #000;
      color: #fff;
    }
    .layout-wrapper {
      display: flex;
      flex-direction: column;
      width: 100vw;
      height: 100vh;
      background: #000;
    }
    .hub-slot.top {
      flex: 1; 
      height: 92px;
      max-height: 92px;
      display: flex;
      align-items: center;
      justify-content: stretch;
      background: #050505;
      position: relative;
      z-index: 5;
      box-sizing: border-box;
      width: 100%;
    }
    .hub-slot.bottom {
      flex: 1;
      height: 92px;
      max-height: 92px;
      display: flex;
      align-items: center;
      justify-content: stretch;
      background: #050505;
      position: relative;
      z-index: 5;
      box-sizing: border-box;
      width: 100%;
    }
    .canvas-container {
      width: 100vw;
      height: auto; /* Altura dinámica */
      aspect-ratio: 30 / 9; /* Mantener la proporción ultrawide core */
      max-height: 80vh; /* Seguridad para no tapar los hubs del todo */
      position: relative;
      background: #000;
      box-shadow: 0 0 100px rgba(0,0,0,1);
      z-index: 10;
      flex: 0 0 auto; /* El canvas manda en su altura según el aspect-ratio */
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class GameCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container') containerRef!: ElementRef<HTMLElement>;
  
  private gameStateService = inject(GameStateService);
  private audioService = inject(AudioService);
  private gameData = inject(GameDataService);
  private cdr = inject(ChangeDetectorRef);
  public engine: GameEngine | null = null;
  private updateActive = true;

  private tickHUD = () => {
    if (this.engine) {
      this.cdr.detectChanges();
    }
    if (this.updateActive) {
      requestAnimationFrame(this.tickHUD);
    }
  };

  async ngAfterViewInit() {
    console.log('[GameCanvas] 🎬 Initializing Ultrawide 30:9 Engine...');
    const canvas = this.canvasRef.nativeElement;
    
    // Fuerza inicial a dimensiones de contenedor
    this.updateCanvasSize();
    
    // Inicializar audio
    await this.audioService.init();

    // Obtener capítulo activo
    const activeChapter = this.gameStateService.currentChapter();
    const activeMode = this.gameStateService.currentMode();

    Promise.resolve().then(async () => {
      this.engine = new GameEngine(canvas, this.audioService, this.gameStateService, this.gameData, activeChapter);
      this.engine.mode = activeMode;
      this.cdr.detectChanges();
      
      // Escuchar cambios de estado del motor para navegar en Angular
      this.engine.onStateChange = (newState) => {
        if (newState === 'GAMEOVER') {
          this.gameStateService.navigate(GameState.GAME_OVER);
        } else if (newState === 'VICTORY') {
          this.gameStateService.navigate(GameState.VICTORY);
        }
      };

      // Sincronización de carga real
      this.engine.onProgressChange = (progress) => {
        this.gameStateService.loadingProgress.set(progress);
      };

      this.engine.onReady = () => {
        this.gameStateService.engineReady.set(true);
      };
      
      // Iniciar con tips del GameDataService
      const tips = [this.gameData.getRandomTip(), this.gameData.getRandomTip()];
      await this.engine.init(tips);
      
      this.engine.start();
      
      // Iniciar el loop de actualización del HUD DOM
      this.updateActive = true;
      this.tickHUD();
    });

    // Listener para redimensionado fluído
    window.addEventListener('resize', this.handleResize);
  }

  private updateCanvasSize() {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;
    
    // Usamos el tamaño real del contenedor DOM (30vw)
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  private handleResize = () => {
    this.updateCanvasSize();
    if (this.engine) {
      const rect = this.containerRef.nativeElement.getBoundingClientRect();
      this.engine.resize(rect.width, rect.height);
      console.log(`[GameCanvas] ↔️ Container Resized: ${rect.width}x${rect.height}`);
    }
  };

  ngOnDestroy() {
    console.log('[GameCanvas] 🛑 Stopping Engine and cleaning memory...');
    this.updateActive = false;
    window.removeEventListener('resize', this.handleResize);
    if (this.engine) {
      this.engine.destroy(); // Fix: Limpia listeners de window internos del motor
    }
  }
}

