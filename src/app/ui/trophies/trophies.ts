import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { GameState } from '../../core/models/game-state.enum';
import { AudioService } from '../../core/audio.service';

interface Trophy {
  id: string;
  title: string;
  description: string;
  icon: string;
  achieved: boolean;
  progress: number;
  target: number;
}

@Component({
  selector: 'app-trophies',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trophy-overlay">
      <header class="header">
        <button class="btn-back" (click)="goBack()">←</button>
        <h1 class="title">GALERÍA DE <span>TROFEOS</span></h1>
      </header>

      <div class="stats-banner">
        <div class="stat-card">
          <span class="val">{{ totalXP }}</span>
          <span class="lab">XP TOTAL</span>
        </div>
        <div class="stat-card">
          <span class="val">{{ highScore }}</span>
          <span class="lab">BEST SCORE</span>
        </div>
        <div class="stat-card">
          <span class="val">{{ totalDeaths }}</span>
          <span class="lab">MORTALIDADES</span>
        </div>
      </div>

      <div class="trophy-list">
        <div *ngFor="let t of trophies" class="trophy-card" [class.locked]="!t.achieved">
          <div class="trophy-icon">{{ t.icon }}</div>
          <div class="trophy-info">
            <h3>{{ t.title }}</h3>
            <p>{{ t.description }}</p>
            <div class="progress-bar" *ngIf="!t.achieved">
              <div class="fill" [style.width.%]="(t.progress / t.target) * 100"></div>
            </div>
          </div>
          <div class="badge" *ngIf="t.achieved">✓</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .trophy-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #060812; z-index: 1500; display: flex; flex-direction: column; align-items: center;
      padding: 3rem 2rem; font-family: 'Outfit', sans-serif; color: white;
      overflow-y: auto;
    }
    .header { display: flex; align-items: center; gap: 2rem; margin-bottom: 4rem; }
    .btn-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; width: 50px; height: 50px; border-radius: 12px; cursor: pointer; }
    .title { font-size: 2.5rem; margin: 0; }
    .title span { color: #00f2ff; text-shadow: 0 0 15px rgba(0,242,255,0.4); }

    .stats-banner { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 4rem; }
    .stat-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 20px; text-align: center; }
    .stat-card .val { display: block; font-size: 2rem; font-weight: 700; color: #00f2ff; }
    .stat-card .lab { font-size: 0.8rem; letter-spacing: 2px; opacity: 0.5; }

    .trophy-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; overflow-y: auto; }
    .trophy-card { 
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1.5rem; border-radius: 20px;
      display: flex; align-items: center; gap: 1.5rem; position: relative; transition: all 0.3s;
    }
    .trophy-card:hover { transform: scale(1.02); background: rgba(255,255,255,0.05); border-color: rgba(0,242,255,0.2); }
    .trophy-card.locked { opacity: 0.4; filter: grayscale(1); }
    
    .trophy-icon { font-size: 3rem; }
    .trophy-info { flex: 1; }
    .trophy-info h3 { margin: 0 0 0.3rem 0; font-size: 1.2rem; }
    .trophy-info p { margin: 0 0 0.8rem 0; font-size: 0.9rem; opacity: 0.6; }

    .progress-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; }
    .fill { height: 100%; background: #00f2ff; }

    .badge { position: absolute; top: 1rem; right: 1rem; color: #00FF64; font-weight: 900; }
  `]
})
export class TrophiesComponent {
  private gameStateService = inject(GameStateService);
  private audioService = inject(AudioService);

  public totalXP = 0;
  public highScore = 0;
  public totalDeaths = 0;

  public trophies: Trophy[] = [
    { id: 'first_jump', title: 'Saltador Novato', description: 'Realiza 100 saltos en total.', icon: '👟', achieved: false, progress: 45, target: 100 },
    { id: 'rich_frog', title: 'Rana Capitalista', description: 'Consigue 5,000 monedas acumuladas.', icon: '💰', achieved: false, progress: 1200, target: 5000 },
    { id: 'survivor', title: 'Superviviente Sónico', description: 'Aguanta 5 minutos en una partida.', icon: '⏱️', achieved: true, progress: 300, target: 300 },
    { id: 'collector', title: 'Coleccionista de Brillo', description: 'Recoge 50 gemas.', icon: '💎', achieved: false, progress: 12, target: 50 },
    { id: 'master_pilot', title: 'As del Vuelo', description: 'Llega al nivel 10 en Historia.', icon: '🎖️', achieved: false, progress: 3, target: 10 },
  ];

  constructor() {
    this.loadStats();
  }

  loadStats() {
    this.totalXP = parseInt(localStorage.getItem('mx_total_xp') || '0');
    this.highScore = parseInt(localStorage.getItem('mx_high_score') || '0');
    this.totalDeaths = parseInt(localStorage.getItem('mx_total_deaths') || '0');

    const totalJumps = parseInt(localStorage.getItem('mx_total_jumps') || '0');
    const totalCoins = parseInt(localStorage.getItem('mx_total_coins_collected') || '0');
    const totalGems = parseInt(localStorage.getItem('mx_total_gems_collected') || '0');
    const maxLevel = parseInt(localStorage.getItem('mx_max_level') || '0');

    // Actualizar progreso de trofeos dinámicamente
    this.trophies.forEach(t => {
      switch(t.id) {
        case 'first_jump': 
          t.progress = Math.min(t.target, totalJumps);
          break;
        case 'rich_frog':
          t.progress = Math.min(t.target, totalCoins);
          break;
        case 'collector':
          t.progress = Math.min(t.target, totalGems);
          break;
        case 'master_pilot':
          t.progress = Math.min(t.target, maxLevel);
          break;
      }
      t.achieved = t.progress >= t.target;
    });
  }

  goBack() {
    this.audioService.playClick();
    this.gameStateService.navigate(GameState.MAIN_MENU);
  }
}
