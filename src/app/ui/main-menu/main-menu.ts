import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { GameState } from '../../core/models/game-state.enum';
import { AudioService } from '../../core/audio.service';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="menu-container" [style.backgroundImage]="'url(assets/menu/fondo/main_menu.webp)'">
      <div class="logo-area">
        <h1 class="game-logo">XANEZU <span>CATCH</span></h1>
        <p class="tagline">Premium Arcade Experience</p>
      </div>

      <!-- OVERLAY EULA (OBLIGATORIO PRIMER ARRANQUE) -->
      <div class="eula-overlay" *ngIf="showEula">
        <div class="eula-card">
          <h2>CONTRATO DE LICENCIA (EULA)</h2>
          <div class="eula-content">
            <p>Al utilizar este software, usted acepta los términos y condiciones de <strong>Xanezu Games</strong>.</p>
            <ul>
              <li>Uso no comercial exclusivamente.</li>
              <li>Prohibida la ingeniería inversa.</li>
              <li>Los activos del juego son propiedad intelectual registrada.</li>
              <li>Sistema de guardado local (partidas persistentes).</li>
              <li>Uso de Cookies técnicas para el estado del juego.</li>
            </ul>
            <p>Esta experiencia utiliza aceleración por hardware (Canvas API) y sistemas de síntesis de audio avanzados.</p>
          </div>
          <button class="btn-premium" (click)="acceptEula()">ACEPTAR Y CONTINUAR</button>
        </div>
      </div>

      <nav class="button-group">
        <button class="btn-premium" (click)="navigate(GameState.MODE_SELECT)">
          <span class="icon">🎮</span> INICIAR PARTIDA
        </button>
        <button class="btn-glass" (click)="navigate(GameState.SHOP)">
          <span class="icon">🛒</span> TIENDA XANEZU
        </button>
        <button class="btn-glass" (click)="navigate(GameState.SKIN_SELECTOR)">
          <span class="icon">👕</span> SKINS & AVATAR
        </button>
        <button class="btn-glass" (click)="navigate(GameState.SETTINGS)">
          <span class="icon">⚙️</span> AJUSTES
        </button>
      </nav>

      <!-- Panel de Audio Lateral: LOCKED / ON / OFF -->
      <div class="audio-control-aaa" 
           [class.locked]="!audioService.isInitialized()"
           (click)="toggleAudio($event)">
           <div class="audio-icon-wrapper">
             <span class="status-chip" *ngIf="!audioService.isInitialized()">LOCKED</span>
             <span class="material-icons">
               {{ audioService.isInitialized() ? (audioService.isMuted() ? 'volume_off' : 'volume_up') : 'lock' }}
             </span>
           </div>
           <div class="audio-label">
             {{ audioService.isInitialized() ? (audioService.isMuted() ? 'SONIDO: OFF' : 'SONIDO: ON') : 'AUDIO BLOQUEADO' }}
           </div>

           <!-- Mini Tooltip -->
           @if (showAudioTooltip) {
             <div class="audio-tooltip">¡Audio Desbloqueado!</div>
           }
      </div>

      <div class="system-badge">
        <span class="pulse"></span>
        SISTEMA ACTUALIZADO (v1.8.0)
      </div>

      <div class="footer">
        <span class="version">v1.8.0 - PREMIUM</span>
        <span class="creator">BY XANEZU GAMES</span>
      </div>
    </div>
  `,
  styles: [`
    .menu-container {
      position: fixed; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background-color: #050505;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      font-family: 'Outfit', sans-serif; overflow: hidden;
    }

    .logo-area { text-align: center; margin-bottom: 4rem; animation: fadeInDown 1s ease-out; }
    .game-logo {
      font-size: 5rem; letter-spacing: -2px; margin: 0; color: #fff;
      text-shadow: 0 0 30px rgba(0, 242, 255, 0.4);
    }
    .game-logo span {
      background: linear-gradient(90deg, #00f2ff, #ff00ff);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .tagline {
      font-size: 1.2rem; color: rgba(255, 255, 255, 0.5);
      margin-top: 1rem; letter-spacing: 4px; text-transform: uppercase;
    }

    .button-group { display: flex; flex-direction: column; gap: 1.2rem; width: 340px; }

    .btn-premium, .btn-glass {
      border: none; padding: 1.2rem 2rem; font-size: 1.1rem; font-weight: 800;
      border-radius: 16px; cursor: pointer; display: flex; align-items: center;
      gap: 1.2rem; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      text-transform: uppercase; letter-spacing: 1px;
    }

    .btn-premium {
      background: linear-gradient(90deg, #00f2ff, #0072ff); color: white;
      box-shadow: 0 10px 30px rgba(0, 114, 255, 0.3);
    }
    .btn-premium:hover { transform: scale(1.05) translateY(-5px); box-shadow: 0 15px 40px rgba(0, 114, 255, 0.5); }

    .btn-glass {
      background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1); color: white;
    }
    .btn-glass:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.3); transform: translateX(10px); }

    .audio-control-aaa {
      position: absolute; top: 2rem; right: 2rem;
      display: flex; align-items: center; gap: 15px; padding: 10px 25px;
      background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 50px;
      cursor: pointer; transition: all 0.4s ease; z-index: 100;
    }
    .audio-control-aaa:hover { background: rgba(255, 255, 255, 0.1); border-color: #00f2ff; transform: scale(1.05); }
    .audio-control-aaa.locked { filter: grayscale(1); opacity: 0.6; }
    
    .status-chip {
      background: #ff2d20; color: white; font-size: 8px; padding: 2px 6px;
      border-radius: 4px; font-weight: 900; margin-right: 5px;
    }

    .audio-label { font-size: 11px; font-weight: 900; letter-spacing: 1px; color: #fff; }
    
    .audio-tooltip {
      position: absolute; top: 60px; right: 0;
      background: #A6F616; color: #000; padding: 8px 15px; border-radius: 10px;
      font-size: 11px; font-weight: 900; white-space: nowrap;
      box-shadow: 0 10px 20px rgba(0,0,0,0.5);
      animation: tooltip-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes tooltip-pop { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    .system-badge {
      position: absolute; top: 2rem; left: 2rem;
      background: rgba(0, 242, 255, 0.05); border: 1px solid rgba(0, 242, 255, 0.2);
      padding: 0.6rem 1.2rem; border-radius: 10px; font-size: 10px; font-weight: 900;
      color: #00f2ff; display: flex; align-items: center; gap: 10px; letter-spacing: 2px;
    }
    .pulse { width: 8px; height: 8px; background: #00f2ff; border-radius: 50%; box-shadow: 0 0 10px #00f2ff; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }

    .footer {
      position: absolute; bottom: 2rem; display: flex; gap: 3rem;
      color: rgba(255, 255, 255, 0.2); font-size: 10px; font-weight: 800; letter-spacing: 3px;
    }

    /* EULA Overlay */
    .eula-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(20px);
      z-index: 5000; display: flex; align-items: center; justify-content: center;
    }
    .eula-card {
      width: 450px; background: #0a0a0a; border: 1px solid #333; padding: 3rem;
      border-radius: 30px; text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.8);
    }
    .eula-card h2 { color: #fff; font-size: 1.5rem; margin-bottom: 2rem; letter-spacing: 2px; }
    .eula-content { text-align: left; font-size: 0.9rem; color: #888; line-height: 1.6; margin-bottom: 2rem; }
    .eula-content ul { padding-left: 1.2rem; color: #00f2ff; }

    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MainMenuComponent implements OnInit {
  private gameStateService = inject(GameStateService);
  public audioService = inject(AudioService); 
  public GameState = GameState;
  
  public showAudioTooltip = false;
  public showEula = false;

  ngOnInit() {
    this.checkEula();
    // El AudioContext ya fue desbloqueado en el Boot Screen.
    // Reproducir música de menú — ya estará en caché, empieza instantáneamente.
    this.audioService.playMenuMusic();
  }

  private checkEula() {
    const accepted = localStorage.getItem('xanezu_eula_accepted');
    if (!accepted) this.showEula = true;
  }

  acceptEula() {
    localStorage.setItem('xanezu_eula_accepted', 'true');
    this.showEula = false;
    this.audioService.playClick();
  }

  async toggleAudio(event: Event) {
    event.stopPropagation();
    if (!this.audioService.isInitialized()) {
      await this.audioService.initAndPreload();
      this.showAudioTooltip = true;
      setTimeout(() => this.showAudioTooltip = false, 3000);
      await this.audioService.playMenuMusic();
    } else {
      this.audioService.toggleMute();
    }
    this.audioService.playClick();
  }

  navigate(state: GameState) {
    this.audioService.playClick();
    this.gameStateService.navigate(state);
  }
}
