import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { GameState } from '../../core/models/game-state.enum';
import { AudioService } from '../../core/audio.service';
import { ChapterService } from '../../core/services/chapter.service';

type SelectionView = 'MODE' | 'CHAPTER';

@Component({
  selector: 'app-chapter-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="selection-overlay" [class.showing-chapters]="currentView() === 'CHAPTER'">
      <!-- DUAL LAYER BACKGROUND SYSTEM (ANTI-FLICKER) -->
      <div class="bg-layers">
        <div class="bg-layer current" [style.backgroundImage]="'url(' + currentBg() + ')'"></div>
        <div class="bg-layer next" [class.visible]="isTransitioning()" [style.backgroundImage]="'url(' + nextBg() + ')'"></div>
      </div>

      <div class="dynamic-background">
        <div class="nebula-glow"></div>
        <div class="grid-overlay"></div>
      </div>

      <header class="header-premium">
        <button class="btn-back-circle" (click)="handleBack()">
          <span class="icon">BACK</span>
        </button>
        <div class="title-container">
          @if (currentView() === 'MODE') {
            <h1 class="main-title">MISSION <span>CONTROL</span></h1>
          } @else {
            <h1 class="main-title">{{ selectedMode() === 'ABLIA' ? 'MODO ABLIA' : selectedMode() }} <span>SECTOR</span></h1>
          }
        </div>
      </header>

      <!-- SECCIÓN 1: SELECCIÓN DE MODO -->
      <div class="view-wrapper" [class.hidden]="currentView() !== 'MODE'">
        <div class="mode-selection-grid">
          <div class="mode-card-premium story" [style.--delay]="'0.1s'" (click)="selectMode('STORY')">
            <div class="card-glass"></div>
            <div class="mode-icon-wrapper">📖</div>
            <h2>HISTORIA</h2>
            <div class="accent-line"></div>
            <p>Sigue la odisea de Xanezu a través de 16 capítulos épicos.</p>
            <div class="card-footer"><span>ID: STORY_SEQ</span></div>
          </div>

          <div class="mode-card-premium arcade" [style.--delay]="'0.2s'" (click)="selectMode('ARCADE')">
            <div class="card-glass"></div>
            <div class="mode-icon-wrapper">🕹️</div>
            <h2>ARCADE</h2>
            <div class="accent-line"></div>
            <p>Desafío de supervivencia pura. 16 sectores retro de alta intensidad.</p>
            <div class="card-footer"><span>RANK: PLATINUM</span></div>
          </div>

          <div class="mode-card-premium ablia" [style.--delay]="'0.3s'" (click)="selectMode('ABLIA')">
            <div class="card-glass"></div>
            <div class="mode-icon-wrapper">🧠</div>
            <h2>MODO ABLIA</h2>
            <div class="accent-line"></div>
            <p>Adaptación neuronal avanzada. 16 civilizaciones generadas procedimentalmente.</p>
            <div class="card-footer"><span>ID: ABLIA_SYSTEM</span></div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 2: SELECCIÓN DE CAPÍTULO -->
      <div class="view-wrapper" [class.hidden]="currentView() !== 'CHAPTER'">
        @if (currentView() === 'CHAPTER') {
          <div class="chapter-navigation-container">
            <button class="nav-arrow left" [disabled]="currentPage() === 0" (click)="changePage(-1)">
              <span class="arrow">‹</span>
            </button>
            
            <div class="chapter-grid-premium">
              @for (ch of chaptersForPage(); track ch.id) {
                <div 
                  class="chapter-card ultra-glass" 
                  [class.locked]="!ch.unlocked"
                  [style.--delay]="$index * 0.05 + 's'"
                  [style.backgroundImage]="'linear-gradient(rgba(6,8,18,0.7), rgba(6,8,18,0.7)), url(assets/' + (selectedMode()?.toLowerCase() || 'story') + '/' + ch.folder + '/fondos/nivel_1/fondo_intermedio.webp)'"
                  (click)="startChapter(ch.id, ch.unlocked)">
                  
                  <div class="card-content">
                    <div class="num-floating">{{ ch.id.split('_').pop() }}</div>
                    @if (!ch.unlocked) { <div class="lock-overlay">🔒</div> }
                    <div class="card-info">
                      <h3>{{ ch.title }}</h3>
                      <div class="meta">
                        <span class="diff" [attr.data-diff]="ch.difficulty">{{ ch.difficulty }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>

            <button class="nav-arrow right" [disabled]="isLastPage()" (click)="changePage(1)">
              <span class="arrow">›</span>
            </button>
          </div>

          <div class="pagination-footer">
            <div class="page-indicator">SECTOR {{ currentPage() + 1 }} / 2</div>
            <div class="dots-container">
              <div class="p-dot" [class.active]="currentPage() === 0"></div>
              <div class="p-dot" [class.active]="currentPage() === 1"></div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .selection-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 1500; display: flex; flex-direction: column; 
      padding: 3rem 5rem; font-family: 'Outfit', sans-serif; color: white;
      overflow: hidden;
    }

    .bg-layers {
      position: absolute; inset: 0; z-index: -2;
      background-color: #060812;
    }

    .bg-layer {
      position: absolute; inset: 0;
      background-size: cover;
      background-position: center;
      transition: opacity 1.2s ease-in-out;
    }

    .bg-layer.current { z-index: 1; opacity: 1; }
    .bg-layer.next { z-index: 2; opacity: 0; }
    .bg-layer.next.visible { opacity: 1; }
    
    .dynamic-background {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      z-index: -1; pointer-events: none;
    }
    .nebula-glow {
      position: absolute; width: 800px; height: 800px; background: radial-gradient(circle, rgba(0,242,255,0.08) 0%, transparent 70%);
      top: -100px; right: -100px; filter: blur(100px); animation: nebulaFloat 20s infinite alternate;
    }
    .grid-overlay {
      position: absolute; width: 100%; height: 100%;
      background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 50px 50px; perspective: 1000px; transform: rotateX(60deg) scale(2); transform-origin: top; opacity: 0.3;
    }

    .header-premium {
      width: 100%; display: flex; align-items: center; gap: 3rem; margin-bottom: 5rem; z-index: 10;
    }
    .btn-back-circle {
      width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1); color: white; font-weight: 800; font-size: 0.7rem;
      cursor: pointer; transition: all 0.4s;
    }
    .btn-back-circle:hover { background: #00f2ff; color: #000; border-color: #00f2ff; transform: rotate(-90deg); }

    .main-title { font-size: 3.5rem; margin: 0; letter-spacing: -2px; font-weight: 900; }
    .main-title span { color: #ff00ff; text-shadow: 0 0 25px rgba(255,0,255,0.4); }

    .view-wrapper { flex: 1; width: 100%; display: flex; flex-direction: column; transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
    .view-wrapper.hidden { opacity: 0; transform: translateY(30px) scale(0.98); pointer-events: none; position: absolute; }

    /* Mode Selection */
    .mode-selection-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; flex: 1; align-items: center; }
    
    .mode-card-premium {
      position: relative; height: 550px; border-radius: 40px; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 3rem; text-align: center; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      animation: cardIn 0.8s cubic-bezier(0.23, 1, 0.32, 1) backwards; animation-delay: var(--delay);
    }
    .card-glass { position: absolute; inset: 0; background: rgba(255,255,255,0.02); border: 2px solid rgba(255,255,255,0.05); border-radius: 40px; backdrop-filter: blur(15px); z-index: -1; transition: all 0.5s; }
    
    .mode-card-premium:hover { transform: translateY(-30px); }
    .mode-card-premium:hover .card-glass { border-color: #00f2ff; background: rgba(0,242,255,0.05); box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
    
    .mode-icon-wrapper { font-size: 5rem; margin-bottom: 2rem; transition: transform 0.4s; }
    .mode-card-premium:hover .mode-icon-wrapper { transform: scale(1.2) rotate(5deg); }
    
    .mode-card-premium h2 { font-size: 2.2rem; font-weight: 900; margin-bottom: 1.5rem; letter-spacing: 2px; }
    .accent-line { width: 40px; height: 4px; background: #ff00ff; margin-bottom: 2rem; border-radius: 10px; transition: width 0.4s; }
    .mode-card-premium:hover .accent-line { width: 100px; background: #00f2ff; }
    
    .mode-card-premium p { font-size: 1rem; opacity: 0.6; line-height: 1.6; margin: 0; }
    .card-footer { margin-top: auto; font-size: 0.7rem; font-weight: 800; letter-spacing: 2px; color: #ff00ff; opacity: 0.5; }

    /* Chapter Selection */
    .chapter-navigation-container { display: flex; align-items: center; gap: 3rem; flex: 1; }
    .chapter-grid-premium { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; flex: 1; }
    
    .chapter-card {
      aspect-ratio: 16/11; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1);
      cursor: pointer; overflow: hidden; position: relative; background-size: cover; background-position: center;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      animation: cardIn 0.5s ease-out backwards; animation-delay: var(--delay);
    }
    .chapter-card:hover:not(.locked) { transform: translateY(-15px); border-color: #00f2ff; box-shadow: 0 20px 40px rgba(0,242,255,0.3); }
    .chapter-card.locked { opacity: 0.4; filter: grayscale(1); cursor: not-allowed; }

    .card-content { width: 100%; height: 100%; display: flex; flex-direction: column; padding: 2rem; position: relative; }
    .num-floating { position: absolute; top: 1rem; right: 1.5rem; font-size: 4rem; font-weight: 900; opacity: 0.1; color: white; }
    .lock-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 2rem; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); }
    
    .card-info { margin-top: auto; }
    .card-info h3 { font-size: 1.3rem; font-weight: 800; margin-bottom: 0.5rem; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.8); }
    .meta { display: flex; gap: 1rem; }
    .diff { font-size: 0.65rem; font-weight: 900; letter-spacing: 1px; color: #00f2ff; padding: 0.3rem 0.8rem; border-radius: 6px; background: rgba(0,242,255,0.1); }

    .nav-arrow { width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; font-size: 2rem; }
    .nav-arrow:hover:not(:disabled) { background: #00f2ff; color: #000; border-color: #00f2ff; transform: scale(1.1); }
    .nav-arrow:disabled { opacity: 0.1; cursor: not-allowed; }

    .pagination-footer { width: 100%; display: flex; align-items: center; justify-content: space-between; margin-top: 3rem; }
    .page-indicator { font-size: 0.8rem; font-weight: 800; letter-spacing: 3px; color: rgba(255,255,255,0.3); }
    .dots-container { display: flex; gap: 1rem; }
    .p-dot { width: 30px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; transition: all 0.4s; }
    .p-dot.active { background: #00f2ff; width: 60px; box-shadow: 0 0 15px rgba(0,242,255,0.4); }

    @keyframes nebulaFloat { from { transform: translate(0, 0); } to { transform: translate(-30px, 30px); } }
    @keyframes cardIn { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `]  
})
export class ChapterSelectComponent implements OnInit {
  private gameStateService = inject(GameStateService);
  private audioService = inject(AudioService);
  private chapterService = inject(ChapterService);

  public currentView = signal<SelectionView>('MODE');
  public selectedMode = signal<string | null>(null);
  public currentPage = signal<number>(0);

  // Sistema de Background con Anti-Flicker
  public currentBg = signal<string>('assets/menu/fondo/mode_select.webp');
  public nextBg = signal<string>('assets/menu/fondo/mode_select.webp');
  public isTransitioning = signal<boolean>(false);

  constructor() {
    // Escuchar cambios en el background deseado y disparar transición
    effect(() => {
      const targetBg = this.backgroundUrl();
      if (targetBg !== this.currentBg()) {
        this.triggerBgTransition(targetBg);
      }
    }, { allowSignalWrites: true });
  }

  private triggerBgTransition(newUrl: string) {
    this.nextBg.set(newUrl);
    this.isTransitioning.set(true);
    
    setTimeout(() => {
      this.currentBg.set(newUrl);
      this.isTransitioning.set(false);
    }, 1200); // Sincronizado con CSS transition (opacity 1.2s)
  }

  ngOnInit() {
    // Sincronizar estado inicial
    this.currentBg.set(this.backgroundUrl());
    this.nextBg.set(this.backgroundUrl());
    // Sincronizar vista según el estado actual
    const state = this.gameStateService.currentState();
    if (state === GameState.STORY_CHAPTER_SELECT) {
      this.selectedMode.set('STORY');
      this.currentView.set('CHAPTER');
    } else if (state === GameState.ARCADE_CHAPTER_SELECT) {
      this.selectedMode.set('ARCADE');
      this.currentView.set('CHAPTER');
    } else if (state === GameState.ABLIA_CHAPTER_SELECT) {
      this.selectedMode.set('ABLIA');
      this.currentView.set('CHAPTER');
    }
  }

  public backgroundUrl = computed(() => {
    const state = this.gameStateService.currentState();
    const basePath = 'assets/menu/fondo/';
    
    switch (state) {
      case GameState.MODE_SELECT:
        return `${basePath}mode_select.webp`;
      case GameState.STORY_CHAPTER_SELECT:
        return `${basePath}story_chapter_select.webp`;
      case GameState.ARCADE_CHAPTER_SELECT:
        return `${basePath}arcade_chapter_select.webp`;
      case GameState.ABLIA_CHAPTER_SELECT:
        return `${basePath}ablia_chapter_select.webp`;
      default:
        return `${basePath}mode_select.webp`;
    }
  });

  public chaptersForPage = computed(() => {
    const start = this.currentPage() * 8;
    const mode = this.selectedMode() || 'STORY';
    
    // Obtenemos la rama real que tiene 16 configuraciones
    let chaptersByMode = this.chapterService.getChaptersByMode(mode);
    
    return chaptersByMode.slice(start, start + 8);
  });

  isLastPage() {
    return this.currentPage() === 1; // 16 capítulos en TODOS los modos
  }

  isOnePageOnly() {
    return false; // Todos tienen al menos 2 páginas según requisitos (12 o 16 niveles)
  }

  handleBack() {
    this.audioService.playClick();
    if (this.currentView() === 'CHAPTER') {
      this.currentView.set('MODE');
      this.gameStateService.navigate(GameState.MODE_SELECT);
    } else {
      this.gameStateService.navigate(GameState.MAIN_MENU);
    }
  }

  selectMode(mode: string) {
    this.audioService.playClick();
    this.selectedMode.set(mode);
    this.gameStateService.currentMode.set(mode.toLowerCase());
    this.currentPage.set(0);
    this.currentView.set('CHAPTER');

    // Cambiar a estado técnico específico solicitado
    if (mode === 'STORY') this.gameStateService.navigate(GameState.STORY_CHAPTER_SELECT);
    else if (mode === 'ARCADE') this.gameStateService.navigate(GameState.ARCADE_CHAPTER_SELECT);
    else if (mode === 'ABLIA') this.gameStateService.navigate(GameState.ABLIA_CHAPTER_SELECT);
  }

  changePage(dir: number) {
    this.audioService.playClick();
    const next = this.currentPage() + dir;
    if (next >= 0 && next <= 1) {
      this.currentPage.set(next);
    }
  }

  startChapter(chId: string, unlocked: boolean) {
    if (!unlocked) return;
    this.audioService.playClick();
    this.gameStateService.setChapter(chId);
    this.gameStateService.navigate(GameState.LOADING_SCREEN);
  }
}


