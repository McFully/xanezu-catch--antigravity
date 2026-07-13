import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameStateService } from './core/services/game-state.service';
import { GameState } from './core/models/game-state.enum';
import { PreloaderService } from './core/services/preloader.service';
import { AudioService } from './core/audio.service';

// Importación de componentes de capa UI y Canvas
import { GameCanvasComponent } from './canvas/game-canvas';
import { MainMenuComponent } from './ui/main-menu/main-menu';
import { ChapterSelectComponent } from './ui/chapter-select/chapter-select';
import { LoadingScreenComponent } from './ui/loading-screen/loading-screen';
import { GameOverComponent } from './ui/game-over/game-over';
import { SettingsComponent } from './ui/settings/settings';
import { ShopComponent } from './ui/shop/shop';
import { SkinSelectorComponent } from './ui/skin-selector/skin-selector';
import { TrophiesComponent } from './ui/trophies/trophies';
import { VictoryComponent } from './ui/victory/victory';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    CommonModule,
    GameCanvasComponent,
    MainMenuComponent,
    ChapterSelectComponent,
    LoadingScreenComponent,
    GameOverComponent,
    SettingsComponent,
    ShopComponent,
    SkinSelectorComponent,
    TrophiesComponent,
    VictoryComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  public gameStateService = inject(GameStateService);
  public preloader = inject(PreloaderService);
  public readonly GameState = GameState;
  private audioService = inject(AudioService);

  async ngOnInit() {
    console.log('[App] 🚀 Booting Xanezu Catch...');
    
    // Iniciar pre-carga de assets críticos de UI (imágenes, audio pre-fetch)
    await this.preloader.preloadAll();
    
    // NO navegar automáticamente — esperar gesto del usuario (onTapToStart)
    // para desbloquear AudioContext antes de entrar al menú
  }

  /**
   * Llamado al hacer click en "TOCA PARA INICIAR".
   * Este click es el gesto de usuario que desbloquea el AudioContext.
   */
  async onTapToStart() {
    // 1. Inicializar AudioContext y precargar el buffer de la música del menú
    await this.audioService.initAndPreload();
    
    // 2. Navegar al menú principal
    this.gameStateService.navigate(GameState.MAIN_MENU);
    
    // 3. Reproducir música de menú (ya estará en caché, empieza al instante)
    await this.audioService.playMenuMusic();
  }
}

