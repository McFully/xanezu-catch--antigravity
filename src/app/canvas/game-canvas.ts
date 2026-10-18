import { Component, inject, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../core/services/game-state.service';
import { GameState } from '../core/models/game-state.enum';
import { GameEngine } from '../game/engine/game-engine';
import { AudioService } from '../core/audio.service';
import { GameDataService } from '../core/services/game-data.service';
import { ProgressionService } from '../core/services/progression.service';
import { ChapterService } from '../core/services/chapter.service';
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
    .hub-slot.top,
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
      height: auto;
      aspect-ratio: 30 / 9;
      max-height: 80vh;
      position: relative;
      background: #000;
      box-shadow: 0 0 100px rgba(0,0,0,1);
      z-index: 10;
      flex: 0 0 auto;
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
  private progressionService = inject(ProgressionService);
  private chapterService = inject(ChapterService);
  private cdr = inject(ChangeDetectorRef);
  public engine: GameEngine | null = null;

  async ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.updateCanvasSize();
    await this.audioService.init();

    const activeChapter = this.gameStateService.currentChapter();
    const activeMode = this.gameStateService.currentMode();

    Promise.resolve().then(async () => {
      this.engine = new GameEngine(canvas, this.audioService, this.gameStateService, this.gameData, activeChapter);
      this.engine.mode = activeMode;
      this.cdr.detectChanges();
      
      this.engine.onHudChange = () => {
        this.cdr.detectChanges();
      };

      this.engine.onSessionEnd = (isVictory) => {
        if (!this.engine) return;
        this.progressionService.recordSessionEnd({
          score: this.engine.score,
          level: this.engine.level,
          coinsTotal: this.engine.coins,
          sessionCoins: this.engine.sessionCoins,
          sessionGems: this.engine.sessionGems,
          sessionJumps: this.engine.sessionJumps,
          durationSeconds: this.engine.timer,
          isDeath: !isVictory
        });
        if (isVictory && activeChapter) {
          this.chapterService.unlockNextChapter(activeChapter.id);
        }
      };

      this.engine.onStateChange = (newState) => {
        if (newState === 'GAMEOVER') {
          this.gameStateService.navigate(GameState.GAME_OVER);
        } else if (newState === 'VICTORY') {
          this.gameStateService.navigate(GameState.VICTORY);
        }
      };

      this.engine.onProgressChange = (progress) => {
        this.gameStateService.loadingProgress.set(progress);
      };

      this.engine.onReady = () => {
        this.gameStateService.engineReady.set(true);
      };
      
      const tips = [this.gameData.getRandomTip(), this.gameData.getRandomTip()];
      await this.engine.init(tips);
      this.engine.start();
      this.cdr.detectChanges();
    });

    window.addEventListener('resize', this.handleResize);
  }

  private updateCanvasSize() {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  private handleResize = () => {
    this.updateCanvasSize();
    if (this.engine) {
      const rect = this.containerRef.nativeElement.getBoundingClientRect();
      this.engine.resize(rect.width, rect.height);
    }
  };

  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.engine) {
      this.engine.destroy();
    }
  }
}
