import { Injectable, signal } from '@angular/core';
import { GameState } from '../models/game-state.enum';
import { BehaviorSubject, Observable } from 'rxjs';
import { Chapter } from '../models/chapter.model';
import { CHAPTERS } from '../constants/chapters.constants';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  // Estado actual usando BehaviorSubject (para reactividad RxJS)
  private stateSubject = new BehaviorSubject<GameState>(GameState.BOOT);
  public state$: Observable<GameState> = this.stateSubject.asObservable();

  // Versión en Signal para la UI de Angular moderna
  public currentState = signal<GameState>(GameState.BOOT);

  // Capítulo seleccionado actualmente
  public currentChapter = signal<Chapter>(CHAPTERS[0]);

  // Modo de juego (story, arcade, ablia)
  public currentMode = signal<string>('story');

  // Signals para sincronización de carga real
  public loadingProgress = signal<number>(0);
  public loadingMessage = signal<string>('INICIANDO...');
  public loadingLogs = signal<string[]>([]);
  public currentLoadingFile = signal<string>('');
  public engineReady = signal<boolean>(false);

  constructor() {
    // Sincronizar el subject inicial con la señal
    this.state$.subscribe(state => {
      this.currentState.set(state);
      // Resetear estado de carga al cambiar de estado (excepto si entramos a carga)
      if (state !== GameState.LOADING_SCREEN && state !== GameState.PLAYING) {
        this.loadingProgress.set(0);
        this.loadingMessage.set('ESPERANDO...');
        this.loadingLogs.set([]);
        this.currentLoadingFile.set('');
        this.engineReady.set(false);
      }
    });
  }

  /**
   * Navega a un nuevo estado del sistema.
   * Reemplaza la funcionalidad de GameStateManager.navigate().
   */
  public navigate(newState: GameState): void {
    if (this.stateSubject.value === newState) return;
    
    console.log(`[GameStateService] 🔄 Navigation: ${this.stateSubject.value} -> ${newState}`);
    this.stateSubject.next(newState);
  }

  /**
   * Establece el capítulo actual.
   */
  public setChapter(chapterId: string): void {
    const chapter = CHAPTERS.find(c => c.id === chapterId);
    if (chapter) {
      this.currentChapter.set(chapter);
      console.log(`[GameStateService] 📖 Chapter Selected: ${chapter.title}`);
    }
  }

  /**
   * Verifica si el motor de juego debe estar activo.
   */
  public isGameplayActive(): boolean {
    return this.stateSubject.value === GameState.PLAYING || 
           this.stateSubject.value === GameState.PAUSED ||
           this.stateSubject.value === GameState.LOADING_SCREEN;
  }

  /**
   * Helpers de estado
   */
  public isAt(state: GameState): boolean {
    return this.stateSubject.value === state;
  }

  /**
   * Añade un mensaje al log de carga.
   */
  public addLoadingLog(msg: string): void {
    const logs = this.loadingLogs();
    // Mantener solo los últimos 15 logs para evitar saturar la UI
    this.loadingLogs.set([...logs.slice(-14), `[OK] ${msg}`]);
  }
}

