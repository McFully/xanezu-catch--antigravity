import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { GameState } from '../../core/models/game-state.enum';
import { AudioService } from '../../core/audio.service';
import { GameItem, GameDataService } from '../../core/services/game-data.service';
import { ProgressionService } from '../../core/services/progression.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="shop-overlay">
      <div class="animated-bg"></div>
      
      <header class="shop-header">
        <button class="btn-back" (click)="goBack()">
          <span class="icon">VOLVER</span>
        </button>
        <div class="header-content">
          <h1 class="title">TIENDA <span>XANEZU</span></h1>
          <div class="wallet-premium">
            <span class="wallet-icon">🟡</span>
            <span class="wallet-amount">{{ progression.totalCoins() }}</span>
          </div>
        </div>
      </header>

      <nav class="category-tabs glass">
        @for (cat of categories; track cat.id) {
          <button 
            [class.active]="activeCategory === cat.id"
            (click)="activeCategory = cat.id">
            {{ cat.label }}
          </button>
        }
      </nav>

      <div class="items-grid-container">
        <div class="items-grid">
          @for (item of filteredItems(); track item.id) {
            <div class="item-card ultra-glass" [class.is-bought]="item.owned" [style.--delay]="$index * 0.08 + 's'">
              <div class="item-glow"></div>
              <div class="item-icon-wrapper">
                <span class="icon">{{ item.icon }}</span>
              </div>
              <div class="item-info">
                <h3>{{ item.name }}</h3>
                <p>{{ item.description }}</p>
              </div>
              <div class="item-footer">
                <button 
                  class="btn-action-premium"
                  [class.owned]="item.owned"
                  [disabled]="!item.owned && progression.totalCoins() < (item.price || 0)"
                  (click)="buyItem(item)">
                  @if (!item.owned) {
                    <span class="price">🛒 {{ item.price }}</span>
                  } @else {
                    <span class="owned-text">✓ ADQUIRIDO</span>
                  }
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shop-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #060812; z-index: 1500; display: flex; flex-direction: column; align-items: center; 
      padding: 3rem 4rem; font-family: 'Outfit', sans-serif; color: white;
      overflow: hidden;
    }
    
    .animated-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at 10% 10%, #1a2a44 0%, #060812 100%);
      opacity: 0.6; z-index: -1;
    }

    .shop-header { width: 100%; max-width: 1400px; display: flex; align-items: center; margin-bottom: 4rem; gap: 3rem; }
    
    .btn-back { 
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      color: white; font-size: 0.8rem; font-weight: 800; padding: 1rem 1.5rem; border-radius: 12px;
      cursor: pointer; transition: all 0.3s;
    }
    .btn-back:hover { background: rgba(0,242,255,0.1); border-color: #00f2ff; transform: translateX(-5px); }

    .header-content { flex: 1; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 3.2rem; margin: 0; letter-spacing: -2px; font-weight: 900; }
    .title span { color: #00f2ff; text-shadow: 0 0 25px rgba(0,242,255,0.5); }
    
    .wallet-premium { 
      background: rgba(255, 215, 0, 0.1); padding: 1rem 2rem; border-radius: 50px;
      border: 1px solid rgba(255, 215, 0, 0.3); display: flex; align-items: center; gap: 1rem;
      font-size: 1.8rem; font-weight: 900; color: #FFD700;
      box-shadow: 0 0 20px rgba(255,215,0,0.15);
    }

    .category-tabs.glass { 
      display: flex; gap: 1rem; margin-bottom: 4rem; 
      background: rgba(255,255,255,0.03); padding: 0.5rem; border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .category-tabs button {
      background: transparent; border: none; color: rgba(255,255,255,0.4);
      font-size: 0.9rem; font-weight: 800; cursor: pointer; padding: 1rem 2.5rem;
      border-radius: 15px; transition: all 0.4s; letter-spacing: 2px;
    }
    .category-tabs button.active { 
      background: rgba(255,255,255,0.08); color: white; 
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }

    .items-grid-container { flex: 1; width: 100%; max-width: 1400px; overflow-y: auto; padding-right: 1.5rem; }
    .items-grid-container::-webkit-scrollbar { width: 4px; }
    .items-grid-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

    .items-grid { 
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
      gap: 2.5rem; padding-bottom: 5rem;
    }
    
    .item-card.ultra-glass {
      background: rgba(255,255,255,0.02); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 32px; 
      padding: 3rem 2rem; display: flex; flex-direction: column;
      align-items: center; text-align: center; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative; overflow: hidden;
      animation: itemFadeIn 0.6s ease-out backwards; animation-delay: var(--delay);
    }
    
    .item-card:hover { transform: translateY(-15px); border-color: rgba(0, 242, 255, 0.5); background: rgba(255,255,255,0.05); }
    .item-glow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at top right, rgba(0,242,255,0.1), transparent 70%); opacity: 0; transition: opacity 0.4s; }
    .item-card:hover .item-glow { opacity: 1; }

    .item-icon-wrapper { 
      width: 100px; height: 100px; background: rgba(255,255,255,0.03); border-radius: 30px;
      display: flex; align-items: center; justify-content: center; margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: transform 0.4s;
    }
    .item-card:hover .item-icon-wrapper { transform: scale(1.1) rotate(5deg); }
    .item-icon-wrapper .icon { font-size: 4.5rem; }

    .item-info h3 { margin: 0 0 0.8rem 0; font-size: 1.6rem; font-weight: 900; letter-spacing: -0.5px; }
    .item-info p { margin: 0; font-size: 1rem; color: rgba(255,255,255,0.5); line-height: 1.6; height: 3.2rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .item-footer { margin-top: 3rem; width: 100%; }
    
    .btn-action-premium { 
      width: 100%; padding: 1.2rem; border-radius: 18px; font-weight: 900; 
      cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: none; 
      font-size: 1.1rem; letter-spacing: 1px;
      background: #00f2ff; color: #060812; box-shadow: 0 10px 25px rgba(0,242,255,0.3);
    }
    .btn-action-premium:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0,242,255,0.5); }
    .btn-action-premium:disabled { opacity: 0.3; cursor: not-allowed; filter: grayscale(1); }
    
    .btn-action-premium.owned { 
      background: rgba(0,255,100,0.05); color: #00FF64; border: 1px solid rgba(0,255,100,0.3); 
      cursor: default; box-shadow: none; font-size: 0.9rem;
    }

    @keyframes itemFadeIn { from { opacity: 0; transform: scale(0.9) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `]
})
export class ShopComponent {
  private gameStateService = inject(GameStateService);
  private audioService = inject(AudioService);
  public progression = inject(ProgressionService);
  protected gameData = inject(GameDataService);

  public activeCategory = 'UPGRADE';
  public categories = [
    { id: 'UPGRADE', label: 'MEJORAS' },
    { id: 'POWERUP', label: 'POWER-UPS' },
    { id: 'CONSUMABLE', label: 'CONSUMIBLES' }
  ];

  constructor() {
    this.loadState();
  }

  loadState() {
    this.gameData.shopItems.forEach(item => {
      item.owned = localStorage.getItem(`shop_item_${item.id}`) === 'true';
    });
  }

  filteredItems(): GameItem[] {
    return this.gameData.shopItems.filter(item => item.category === this.activeCategory);
  }

  buyItem(item: GameItem) {
    if (item.owned) return;
    if (!this.progression.spendCoins(item.price || 0)) return;

    this.audioService.playCollect(3);
    item.owned = true;
    localStorage.setItem(`shop_item_${item.id}`, 'true');
  }

  goBack() {
    this.audioService.playClick();
    this.gameStateService.navigate(GameState.MAIN_MENU);
  }
}
