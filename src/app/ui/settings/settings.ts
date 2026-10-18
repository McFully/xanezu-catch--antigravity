import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { AudioService } from '../../core/audio.service';
import { GameState } from '../../core/models/game-state.enum';
import { ProgressionService } from '../../core/services/progression.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay">
      <div class="settings-panel">
        <div class="header">
          <button class="btn-back" (click)="close()">⬅️ VOLVER</button>
          <h1>AJUSTES</h1>
        </div>

        <div class="settings-grid">
          <div class="setting-item">
            <span class="label">AUDIO</span>
            <button class="btn-toggle" [class.active]="!audioService.isMuted()" (click)="toggleAudio()">
              {{ !audioService.isMuted() ? 'ON' : 'OFF' }}
            </button>
          </div>
          <div class="setting-item">
            <span class="label">DIFICULTAD</span>
            <div class="selector">
              <button 
                class="btn-sel" 
                [class.active]="progression.difficulty() === 'NORMAL'"
                (click)="setDifficulty('NORMAL')">
                NORMAL
              </button>
              <button 
                class="btn-sel" 
                [class.active]="progression.difficulty() === 'DIFÍCIL'"
                (click)="setDifficulty('DIFÍCIL')">
                DIFÍCIL
              </button>
            </div>
          </div>
          <div class="setting-item">
            <span class="label">EXPORTAR PARTIDA</span>
            <button class="btn-action" (click)="exportBackup()">
              {{ backupSaved() ? '✓ BACKUP DESCARGADO' : 'GENERAR BACKUP' }}
            </button>
          </div>
        </div>

        <div class="footer">
          <p>© 2026 Aritz Bahamonde Larxé. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(10, 14, 20, 0.9); z-index: 1500; display: flex; align-items: center; justify-content: center;
      font-family: 'Outfit', sans-serif; color: white;
    }
    .settings-panel {
      width: 500px; background: rgba(20, 25, 45, 0.95); border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 2.5rem; border-radius: 24px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }
    .header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 3rem; }
    .btn-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; }
    .settings-grid { display: flex; flex-direction: column; gap: 2rem; }
    .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; }
    .label { font-weight: 700; letter-spacing: 1px; color: rgba(255,255,255,0.7); font-size: 0.9rem; }
    .btn-toggle { 
      width: 80px; padding: 0.5rem; border-radius: 8px; border: 2px solid rgba(255,255,255,0.1); 
      background: #333; color: white; cursor: pointer; font-weight: bold; transition: all 0.2s;
    }
    .btn-toggle.active { background: #00f2ff; color: #000; border-color: #00f2ff; box-shadow: 0 0 15px rgba(0, 242, 255, 0.4); }
    .selector { display: flex; gap: 0.5rem; }
    .btn-sel { background: none; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; }
    .btn-sel.active { background: rgba(0, 242, 255, 0.2); border-color: #00f2ff; color: #00f2ff; font-weight: 800; }
    .btn-action { background: #ff00ff; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
    .btn-action:hover { transform: scale(1.04); }
    .footer { margin-top: 3rem; font-size: 0.7rem; color: rgba(255,255,255,0.35); text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; }
  `]
})
export class SettingsComponent {
  private stateService = inject(GameStateService);
  public audioService = inject(AudioService);
  public progression = inject(ProgressionService);
  public backupSaved = signal(false);

  async toggleAudio() {
    if (!this.audioService.isInitialized()) {
      await this.audioService.init();
    }
    this.audioService.toggleMute();
    this.audioService.playClick();
  }

  setDifficulty(diff: 'NORMAL' | 'DIFÍCIL') {
    this.audioService.playClick();
    this.progression.setDifficulty(diff);
  }

  exportBackup() {
    this.audioService.playClick();
    const json = this.progression.exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xanezu-catch-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.backupSaved.set(true);
    setTimeout(() => this.backupSaved.set(false), 3000);
  }

  close() {
    this.audioService.playClick();
    this.stateService.navigate(GameState.MAIN_MENU);
  }
}
