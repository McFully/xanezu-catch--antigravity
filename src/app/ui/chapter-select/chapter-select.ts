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
  styleUrl: './chapter-select.css',
  template: `
    <div class="selection-overlay" [class.showing-chapters]="currentView() === 'CHAPTER'">
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
          <span class="icon">VOLVER</span>
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
  `
})
export class ChapterSelectComponent implements OnInit {
  private gameStateService = inject(GameStateService);
  private audioService = inject(AudioService);
  private chapterService = inject(ChapterService);

  public currentView = signal<SelectionView>('MODE');
  public selectedMode = signal<string | null>(null);
  public currentPage = signal<number>(0);

  public currentBg = signal<string>('assets/menu/fondo/mode_select.webp');
  public nextBg = signal<string>('assets/menu/fondo/mode_select.webp');
  public isTransitioning = signal<boolean>(false);

  constructor() {
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
    }, 1200);
  }

  ngOnInit() {
    this.currentBg.set(this.backgroundUrl());
    this.nextBg.set(this.backgroundUrl());
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
      case GameState.MODE_SELECT: return `${basePath}mode_select.webp`;
      case GameState.STORY_CHAPTER_SELECT: return `${basePath}story_chapter_select.webp`;
      case GameState.ARCADE_CHAPTER_SELECT: return `${basePath}arcade_chapter_select.webp`;
      case GameState.ABLIA_CHAPTER_SELECT: return `${basePath}ablia_chapter_select.webp`;
      default: return `${basePath}mode_select.webp`;
    }
  });

  public chaptersForPage = computed(() => {
    const start = this.currentPage() * 8;
    const mode = this.selectedMode() || 'STORY';
    return this.chapterService.getChaptersByMode(mode).slice(start, start + 8);
  });

  isLastPage() {
    return this.currentPage() === 1;
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
