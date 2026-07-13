import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngine, EngineState } from '../../game/engine/game-engine';
import { GameStateService } from '../../core/services/game-state.service';
import { GameState } from '../../core/models/game-state.enum';
import { calculateLevelFromXP, getLevelProgressPercentage, XP_PROGRESSION_TABLE } from '../../core/constants/progression.constants';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hud-container" *ngIf="engine">
      <!-- TOP HUD: 8 PREMIUM BLOCKS -->
      <div class="top-hud-bar" *ngIf="showTop">
        <!-- 1. NIVEL -->
        <div class="hud-block level-block">
          <div class="label">NIVEL</div>
          <div class="value large">{{ displayLevel }}</div>
        </div>

        <div class="hud-block progress-block extended-progress">
          <div class="label">PROGRESO</div>
          <div class="progress-container">
            <div class="progress-bar-track">
              <div class="progress-bar" [style.width.%]="displayProgressPercent"></div>
            </div>
          </div>
        </div>

        <!-- 3. BANANAS COMBO -->
        <div class="hud-block combo-block bananas">
          <div class="label">BANANAS COMBO</div>
          <div class="combo-slots">
            @for (i of [0,1,2,3,4]; track i) {
              <div class="slot" [class.active]="engine.player.bananasCollected > i">🍌</div>
            }
          </div>
        </div>

        <!-- 4. CHUCHES COMBO -->
        <div class="hud-block combo-block bombs">
          <div class="label">CHUCHES COMBO</div>
          <div class="combo-grid">
            @for (i of [0,1,2,3,4,5,6,7,8,9]; track i) {
              <div class="slot" [class.active]="engine.player.bombsCollected > i">🍬</div>
            }
          </div>
        </div>

        <!-- 5. VIDA EXTRA -->
        <div class="hud-block life-grid-block">
          <div class="label">VIDA EXTRA</div>
          <div class="combo-grid">
            @for (i of [0,1,2,3,4,5,6,7,8,9]; track i) {
              <div class="heart-mini" [class.filled]="engine.player.extraLifeProgress > i">❤️</div>
            }
          </div>
        </div>

        <!-- 6. VIDAS -->
        <div class="hud-block lives-block">
          <div class="label">VIDAS</div>
          <div class="lives-row">
            @for (i of [0,1,2]; track i) {
              <div class="heart" [class.active]="engine.player.lives > i">❤️</div>
            }
          </div>
        </div>

        <!-- 7. MULTIPLICADOR -->
        <div class="hud-block multiplier-block shine">
          <div class="label">MULTIPLICADOR</div>
          <div class="value">x{{ engine.multiplier }}</div>
          <div class="multiplier-timer">
            <div class="timer-fill" [style.width.%]="engine.multiplierTimer"></div>
          </div>
        </div>
      </div>

      <!-- BOTTOM HUD: 3 SECTIONS -->
      <div class="bottom-hud-bar" *ngIf="showBottom">
        <div class="section left-section">
          <div class="frog-icon-container">
             <div class="frog-bg"></div>
             <span class="emoji">🐸</span>
          </div>
          <div class="score-pill">
            {{ engine.score | number:'1.0-0' }}
          </div>
        </div>

        <div class="section center-section">
          <div class="powerup-slot" [class.active]="engine.player.shieldActive" title="SHIELD">
             <span class="icon">🛡️</span>
             <span class="status">{{ engine.player.shieldActive ? 'ACTIVE' : 'READY' }}</span>
          </div>
          <div class="powerup-slot" [class.active]="engine.player.magnetT > 0" title="MAGNET">
             <span class="icon">🧲</span>
             <span class="status">{{ engine.player.magnetT > 0 ? 'ACTIVE' : 'READY' }}</span>
          </div>
          <div class="powerup-slot" title="SPEED">
             <span class="icon">⚡</span>
             <span class="status">READY</span>
          </div>
        </div>

        <div class="section right-section">
            <div class="trophy-btn mockup">🏆</div>
            <!-- DEV STATUS TAG (Visual Proof of Sync) -->
            <div class="dev-tag">
               <div class="dot"></div>
               DEV LINK: 1.8.2-FIXED
            </div>
        </div>
      </div>
      
      <!-- PAUSE OVERLAY -->
      <div class="pause-overlay" *ngIf="engine.state === EngineState.PAUSED">
         <div class="pause-content">
            <h1>PAUSADO</h1>
            <p>Pulsa ESC o ESPACIO para continuar</p>
            <button class="exit-btn" (click)="exitGame()">SALIR AL MENÚ</button>
         </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=JetBrains+Mono:wght@700&display=swap');

    :host {
      display: block;
      width: 100%;
    }

    .hud-container {
      width: 100%;
      height: 100%;
      padding: 5px 0px;
      color: white;
      font-family: 'Outfit', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      pointer-events: none;
    }

    /* PAUSE OVERLAY */
    .pause-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      pointer-events: all;
    }
    .pause-content {
      text-align: center;
      background: linear-gradient(135deg, rgba(20,20,30,0.9), rgba(40,40,60,0.9));
      padding: 40px 80px;
      border-radius: 20px;
      border: 2px solid rgba(255,255,255,0.1);
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      animation: fadeIn 0.3s ease-out forwards;
    }
    .pause-content h1 {
      font-size: 4rem;
      font-weight: 900;
      margin: 0 0 10px 0;
      color: #00f2ff;
      text-transform: uppercase;
      letter-spacing: 4px;
    }
    .pause-content p {
      font-size: 1.2rem;
      color: #aaa;
      margin: 0 0 30px 0;
    }
    .exit-btn {
      background: linear-gradient(90deg, #ff4d4d, #ff0000);
      color: white;
      border: none;
      padding: 15px 40px;
      font-size: 1.2rem;
      font-weight: bold;
      border-radius: 50px;
      cursor: pointer;
      text-transform: uppercase;
      box-shadow: 0 5px 15px rgba(255, 0, 0, 0.4);
      transition: all 0.3s ease;
      font-family: 'Outfit', sans-serif;
    }
    .exit-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 25px rgba(255, 0, 0, 0.6);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* TOP BAR: 8 BLOCKS */
    .top-hud-bar {
      display: flex;
      justify-content: space-between;
      flex-wrap: nowrap;
      gap: 0px;
      width: 100%;
      box-sizing: border-box;
      margin: 0;
      border-bottom: 2px solid rgba(166, 246, 22, 0.3);
    }

    .hud-block {
      background: rgba(10, 15, 30, 0.7);
      backdrop-filter: blur(12px);
      border: none;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0px;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      transition: transform 0.3s ease;
      min-width: 0;
      height: 82px;
      box-sizing: border-box;
    }

    .level-block { flex: 1.2 1 0px !important; }
    .progress-block.extended-progress { flex: 7.5 1 0px !important; }
    .combo-block.bananas { flex: 3.8 1 0px !important; }
    .combo-block.bombs { flex: 3.8 1 0px !important; }
    .life-grid-block { flex: 2.8 1 0px !important; }
    .lives-block { flex: 2.5 1 0px !important; }
    .multiplier-block { flex: 2.2 1 0px !important; }

    .hud-block:hover { transform: translateY(-2px); border-color: rgba(166, 246, 22, 0.4); }

    .label {
      font-size: 9px;
      color: #A6F616;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2px;
      opacity: 0.8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    .value {
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      font-family: 'Outfit', sans-serif;
      line-height: 1.1;
    }
    .value.digital { font-family: 'JetBrains+Mono', monospace; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
    .value.large { font-size: 24px; color: #fff; }

    /* COMBO SLOTS */
    .combo-slots { display: flex; gap: 6px; margin-top: 2px; justify-content: center; width: 100%; }
    .slot { font-size: 16px; transition: all 0.3s; opacity: 0.2; transform: scale(0.8); }
    .slot.active { opacity: 1; transform: scale(1.1); filter: drop-shadow(0 0 5px #A6F616); }

    /* PROGRESS BLOCK */
    .progress-container { width: 100%; margin-top: 2px; position: relative; }
    .progress-bar-track { width: 100%; height: 16px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; overflow: hidden; }
    .progress-bar { height: 100%; background: linear-gradient(90deg, #A6F616, #00f2ff); border-radius: 4px; box-shadow: 0 0 10px rgba(166, 246, 22, 0.4); transition: width 0.3s ease; }
    .percentage { font-size: 8px; font-weight: 700; margin-top: 2px; opacity: 0.7; }
    .progress-text-row { display: flex; justify-content: space-between; font-size: 10px; margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
    .pts-current { color: #fff; font-weight: bold; }
    .pts-needed { color: #aaa; }
    .pts-remaining { font-size: 9px; color: #00f2ff; text-align: right; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

    /* COMBO GRID / LIFE GRID */
    .combo-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; margin-top: 2px; justify-items: center; width: 100%; max-width: 110px; }
    .heart-mini { font-size: 12px; transition: all 0.3s; opacity: 0.2; filter: grayscale(100%); }
    .heart-mini.filled { opacity: 1; filter: none; transform: scale(1.1); filter: drop-shadow(0 0 5px #ff2975); }
    .life-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; margin-top: 2px; }
    .dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255,255,255,0.2); }
    .dot.filled { background: #ff2975; border-color: #ff2975; box-shadow: 0 0 5px #ff2975; }

    /* LIVES ROW */
    .lives-row { display: flex; gap: 3px; margin-top: 2px; }
    .heart {
      font-size: 20px;
      color: #FF4D4D;
      text-shadow: 0 0 10px rgba(255, 77, 77, 0.6);
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      margin: 0 -1px;
    }
    .heart.active { opacity: 1; filter: drop-shadow(0 0 5px rgba(255, 41, 117, 0.5)); animation: pulse 2s infinite; }

    /* MULTIPLIER */
    .multiplier-block .value { 
      color: #A6F616; 
      text-shadow: 0 0 15px rgba(166, 246, 22, 0.4);
      font-size: 22px;
    }
    .multiplier-timer { 
      width: 100%; height: 4px; 
      background: rgba(166, 246, 22, 0.1); 
      border-radius: 2px; margin-top: 2px; 
      overflow: hidden; 
      border: 1px solid rgba(166, 246, 22, 0.2);
    }
    .timer-fill { height: 100%; background: #A6F616; transition: width 0.1s linear; }

    /* BOTTOM BAR */
    .bottom-hud-bar {
      display: flex; justify-content: space-between; align-items: flex-end;
      width: 100%; padding-bottom: 10px;
    }

    .section { display: flex; align-items: center; gap: 15px; }

    /* LEFT: FROG & SCORE */
    .frog-icon-container {
      position: relative; width: 60px; height: 60px;
      display: flex; align-items: center; justify-content: center;
    }
    .frog-bg {
      position: absolute; inset: 0; background: rgba(166, 246, 22, 0.2);
      border: 2px solid #A6F616; border-radius: 50%; animation: float 3s infinite ease-in-out;
      box-shadow: 0 0 20px rgba(166, 246, 22, 0.3);
    }
    .frog-icon-container .emoji { font-size: 32px; z-index: 1; position: relative; }

    .score-pill {
      background: rgba(0,0,0,0.8); border: 1px solid rgba(166, 246, 22, 0.3);
      padding: 6px 15px; border-radius: 4px;
      display: flex; flex-direction: column;
      font-weight: 900;
      color: #A6F616; font-size: 20px; backdrop-filter: blur(5px);
    }

    /* CENTER: POWERUPS */
    .powerup-slot {
      background: rgba(10, 15, 30, 0.6); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; padding: 8px 12px; display: flex; flex-direction: column;
      align-items: center; min-width: 80px; transition: all 0.3s;
    }
    .powerup-slot.active { border-color: #00f2ff; background: rgba(0, 242, 255, 0.1); box-shadow: 0 0 15px rgba(0, 242, 255, 0.3); }
    .powerup-slot .icon { font-size: 24px; margin-bottom: 2px; }
    .powerup-slot .status { font-size: 9px; font-weight: 800; opacity: 0.5; color: white; }
    .powerup-slot.active .status { opacity: 1; color: #00f2ff; }

    /* RIGHT: TROPHY */
    .trophy-btn {
      width: 50px; height: 50px; background: rgba(255, 215, 0, 0.2);
      border: 2px solid #FFD700; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
      cursor: pointer;
    }

    /* DEV TAG STYLES */
    .dev-tag {
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #00f2ff;
      border-radius: 4px;
      padding: 4px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #00f2ff;
      box-shadow: 0 0 20px rgba(0, 242, 255, 0.2);
      white-space: nowrap;
    }
    .dev-tag .dot {
      width: 6px; height: 6px;
      background: #00f2ff;
      border-radius: 50%;
      animation: blink 1s infinite;
    }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

    /* ANIMATIONS */
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

    .shadow-pulse { animation: shadow-glow 4s infinite; }
    @keyframes shadow-glow { 0%, 100% { box-shadow: 0 0 20px rgba(0,0,0,0.5); } 50% { box-shadow: 0 0 30px rgba(166, 246, 22, 0.2); } }

    .shine { position: relative; overflow: hidden; }
    .shine::after {
      content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
      transform: rotate(45deg); animation: shine 6s infinite;
    }
    @keyframes shine { 0% { transform: translate(-100%, -100%) rotate(45deg); } 100% { transform: translate(100%, 100%) rotate(45deg); } }

    @media (max-width: 1400px) {
      .top-hud-bar { gap: 8px; }
      .hud-block { padding: 6px; }
      .value { font-size: 16px; }
      .section { gap: 8px; }
      .powerup-slot { min-width: 60px; padding: 5px; }
    }
  `]
})
export class HUDComponent {
  @Input() engine!: GameEngine;
  @Input() mode: 'top' | 'bottom' | 'both' = 'both';

  public EngineState = EngineState;

  get showTop() { return this.mode === 'top' || this.mode === 'both'; }
  get showBottom() { return this.mode === 'bottom' || this.mode === 'both'; }

  get currentPoints(): number {
    const xp = this.engine?.score || 0;
    const currentLevel = calculateLevelFromXP(xp);
    const currentThreshold = currentLevel === 0 ? 0 : XP_PROGRESSION_TABLE[currentLevel];
    return xp - currentThreshold;
  }

  get neededPoints(): number {
    const xp = this.engine?.score || 0;
    const currentLevel = calculateLevelFromXP(xp);
    if (currentLevel >= 30) return 350000;
    const currentThreshold = currentLevel === 0 ? 0 : XP_PROGRESSION_TABLE[currentLevel];
    const nextThreshold = XP_PROGRESSION_TABLE[currentLevel + 1];
    return nextThreshold - currentThreshold;
  }

  get remainingPoints(): number {
    return Math.max(0, this.neededPoints - this.currentPoints);
  }

  get displayLevel(): number {
    return calculateLevelFromXP(this.engine?.score || 0);
  }
  
  get displayProgressPercent(): number {
    return getLevelProgressPercentage(this.engine?.score || 0);
  }

  constructor(private gameStateService: GameStateService) {}

  public exitGame(): void {
    if (this.engine) {
      this.engine.musicSynth.stopMusic();
    }
    this.gameStateService.navigate(GameState.MODE_SELECT);
  }
}
