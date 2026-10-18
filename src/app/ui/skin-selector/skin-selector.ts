import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { GameState } from '../../core/models/game-state.enum';
import { AudioService } from '../../core/audio.service';
import { Skin, GameDataService } from '../../core/services/game-data.service';
import { ProgressionService } from '../../core/services/progression.service';

@Component({
  selector: 'app-skin-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skin-overlay">
      <div class="animated-bg"></div>
      
      <header class="skin-header">
        <button class="btn-back" (click)="goBack()">
          <span class="icon">VOLVER</span>
        </button>
        <h1 class="title">SKINS Y <span>AVATAR</span></h1>
        <div class="coin-display">
          <span class="coin-icon">🟡</span>
          <span class="coin-val">{{ progression.totalCoins() }}</span>
        </div>
      </header>
    
      <div class="content">
        <!-- Preview Area (Stage) -->
        <div class="preview-area glass">
          <div class="preview-stage">
            <div class="stage-glow" [style.background]="selectedSkin()?.color"></div>
            <div class="bouncing-character" [style.color]="selectedSkin()?.color">
              <span class="character-emoji">{{ selectedSkin()?.emoji }}</span>
              <div class="character-shadow"></div>
            </div>
          </div>
          <div class="skin-info">
            <h2 class="skin-name">{{ selectedSkin()?.name }}</h2>
            <div class="skin-badges">
              <span *ngIf="selectedSkin()?.unlocked" class="badge unlocked">✓ ADQUIRIDO</span>
              <span *ngIf="!selectedSkin()?.unlocked" class="badge locked">🔒 BLOQUEADO</span>
            </div>
            
            <button 
              *ngIf="!selectedSkin()?.unlocked" 
              class="btn-unlock-premium" 
              [disabled]="progression.totalCoins() < (selectedSkin()?.price || 0)"
              (click)="unlockSkin()">
              <span>DESBLOQUEAR · {{ selectedSkin()?.price }}</span>
            </button>
            <p *ngIf="selectedSkin()?.unlocked" class="active-label">PIEL EQUIPADA</p>
          </div>
        </div>
    
        <!-- Selector Grid -->
        <div class="grid-container">
          <div class="skins-grid">
            @for (skin of gameData.skins; track skin.id) {
              <div 
                class="skin-card ultra-glass" 
                [class.active]="selectedSkin()?.id === skin.id"
                [class.is-locked]="!skin.unlocked"
                [style.--delay]="$index * 0.05 + 's'"
                (click)="selectSkin(skin)">
                <div class="skin-card-glow" [style.background]="skin.color"></div>
                <span class="card-emoji">{{ skin.emoji }}</span>
                <div class="selection-indicator"></div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skin-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #060812; z-index: 1500; display: flex; flex-direction: column; align-items: center;
      padding: 3rem 4rem; font-family: 'Outfit', sans-serif; color: white;
      overflow: hidden;
    }
    
    .animated-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at 50% 50%, #151a30 0%, #060812 100%);
      opacity: 0.5; z-index: -1;
    }

    .skin-header { width: 100%; max-width: 1400px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 4rem; }
    
    .btn-back { 
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; 
      padding: 1rem 1.5rem; border-radius: 12px; cursor: pointer; font-size: 0.8rem; font-weight: 800;
      transition: all 0.3s;
    }
    .btn-back:hover { background: rgba(0,242,255,0.1); border-color: #00f2ff; transform: translateX(-5px); }

    .title { font-size: 3rem; margin: 0; letter-spacing: -1.5px; font-weight: 900; }
    .title span { color: #ff00ff; text-shadow: 0 0 20px rgba(255,0,255,0.6); }

    .coin-display { 
      background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3);
      padding: 0.8rem 1.5rem; border-radius: 50px; display: flex; align-items: center; gap: 0.8rem;
      font-size: 1.4rem; font-weight: 900; color: #FFD700;
    }

    .content { display: grid; grid-template-columns: 1.2fr 1fr; gap: 5rem; flex: 1; width: 100%; max-width: 1400px; min-height: 0; }
    
    .preview-area.glass { 
      background: rgba(255,255,255,0.02); backdrop-filter: blur(20px);
      border-radius: 40px; border: 1px solid rgba(255,255,255,0.08);
      display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem;
      box-shadow: 0 30px 60px rgba(0,0,0,0.4);
    }
    
    .preview-stage { height: 350px; display: flex; align-items: center; justify-content: center; position: relative; width: 100%; }
    .stage-glow { 
      position: absolute; width: 300px; height: 300px; border-radius: 50%; opacity: 0.2; 
      filter: blur(80px); transition: all 1s ease; z-index: 1; 
    }
    
    .bouncing-character { font-size: 10rem; position: relative; z-index: 10; animation: breathe 4s ease-in-out infinite; }
    .character-shadow { 
      width: 120px; height: 20px; background: rgba(0,0,0,0.4); border-radius: 50%; 
      margin-top: 15px; filter: blur(5px); animation: shadowScale 4s ease-in-out infinite; 
    }

    .skin-info { text-align: center; margin-top: 3rem; width: 100%; }
    .skin-name { font-size: 2.5rem; font-weight: 900; margin-bottom: 1rem; }
    .skin-badges { display: flex; justify-content: center; gap: 1rem; margin-bottom: 2rem; }
    .badge { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 800; letter-spacing: 1px; }
    .badge.unlocked { background: rgba(0,255,100,0.1); color: #00FF64; border: 1px solid rgba(0,255,100,0.3); }
    .badge.locked { background: rgba(255,77,77,0.1); color: #FF4D4D; border: 1px solid rgba(255,77,77,0.3); }

    .btn-unlock-premium { 
      background: linear-gradient(90deg, #00f2ff, #0072ff); color: white; border: none; 
      padding: 1.2rem 3rem; border-radius: 15px; font-weight: 800; font-size: 1.1rem; 
      cursor: pointer; box-shadow: 0 10px 25px rgba(0,114,255,0.4);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .btn-unlock-premium:hover:not(:disabled) { transform: scale(1.05) translateY(-5px); box-shadow: 0 15px 35px rgba(0,114,255,0.5); }
    .btn-unlock-premium:disabled { opacity: 0.3; cursor: not-allowed; filter: grayscale(1); }
    
    .active-label { font-size: 0.9rem; font-weight: 800; color: #ff00ff; letter-spacing: 3px; opacity: 0.6; }

    .grid-container { overflow-y: auto; padding-right: 1.5rem; }
    .grid-container::-webkit-scrollbar { width: 4px; }
    .grid-container::-webkit-scrollbar-track { background: transparent; }
    .grid-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

    .skins-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .skin-card.ultra-glass {
      aspect-ratio: 1; background: rgba(255,255,255,0.03); border: 2px solid rgba(255,255,255,0.05);
      border-radius: 28px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; position: relative; overflow: hidden; transition: all 0.4s;
      animation: skinIn 0.5s ease-out backwards; animation-delay: var(--delay);
    }
    .skin-card:hover { border-color: rgba(255,255,255,0.3); transform: translateY(-8px); background: rgba(255,255,255,0.08); }
    .skin-card.active { border-color: #00f2ff; background: rgba(0,242,255,0.08); box-shadow: 0 10px 30px rgba(0,242,255,0.3); }
    .skin-card.is-locked { opacity: 0.4; filter: grayscale(1); }
    
    .card-emoji { font-size: 3.5rem; z-index: 2; transition: transform 0.3s; }
    .skin-card:hover .card-emoji { transform: scale(1.2) rotate(5deg); }
    
    .skin-card-glow { position: absolute; width: 100%; height: 100%; opacity: 0; filter: blur(30px); transition: opacity 0.4s; }
    .skin-card:hover .skin-card-glow { opacity: 0.2; }
    
    .selection-indicator { 
      position: absolute; bottom: 10px; width: 40px; height: 4px; 
      background: #00f2ff; border-radius: 10px; opacity: 0; transition: opacity 0.3s; 
    }
    .skin-card.active .selection-indicator { opacity: 1; }

    @keyframes breathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-25px); } }
    @keyframes shadowScale { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(0.6); opacity: 0.15; } }
    @keyframes skinIn { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `]
})
export class SkinSelectorComponent {
  private gameStateService = inject(GameStateService);
  private audioService = inject(AudioService);
  public progression = inject(ProgressionService);
  protected gameData = inject(GameDataService);

  public selectedSkin = signal<Skin | null>(null);

  constructor() {
    this.loadState();
  }

  loadState() {
    const currentSkinId = localStorage.getItem('mx_active_skin') || 'frog_og';
    this.gameData.skins.forEach(s => {
      if (s.id !== 'frog_og') {
        s.unlocked = localStorage.getItem(`skin_unlocked_${s.id}`) === 'true';
      }
    });
    this.selectedSkin.set(this.gameData.skins.find(s => s.id === currentSkinId) || this.gameData.skins[0]);
  }

  selectSkin(skin: Skin) {
    this.audioService.playClick();
    this.selectedSkin.set(skin);
    if (skin.unlocked) {
      localStorage.setItem('mx_active_skin', skin.id);
    }
  }

  unlockSkin() {
    const skin = this.selectedSkin();
    if (!skin || skin.unlocked) return;
    if (!this.progression.spendCoins(skin.price || 0)) return;

    this.audioService.playCollect(2);
    skin.unlocked = true;
    localStorage.setItem(`skin_unlocked_${skin.id}`, 'true');
    localStorage.setItem('mx_active_skin', skin.id);
  }

  goBack() {
    this.audioService.playClick();
    this.gameStateService.navigate(GameState.MAIN_MENU);
  }
}
