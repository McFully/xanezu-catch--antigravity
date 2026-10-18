import { EngineState } from './engine.constants';

export interface IInputTarget {
  state: EngineState;
  togglePause(): void;
  jump(): void;
  resize(): void;
}

export class InputController {
  private keydownListener: (e: KeyboardEvent) => void;
  private mousedownListener: (e: MouseEvent) => void;
  private resizeListener: () => void;

  constructor(private target: IInputTarget) {
    this.keydownListener = (e: KeyboardEvent) => this.handleKeyDown(e);
    this.mousedownListener = (e: MouseEvent) => this.handleMouseDown(e);
    this.resizeListener = () => this.target.resize();

    window.addEventListener('keydown', this.keydownListener);
    window.addEventListener('mousedown', this.mousedownListener);
    window.addEventListener('resize', this.resizeListener);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (key === 'escape' || key === 'esc') {
      this.target.togglePause();
      return;
    }

    if (key === ' ' || key === 'arrowup' || key === 'w') {
      if (this.target.state === EngineState.PAUSED) {
        this.target.togglePause();
      } else {
        this.target.jump();
      }
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      if (this.target.state === EngineState.PAUSED) {
        this.target.togglePause();
      } else {
        this.target.jump();
      }
    }
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.keydownListener);
    window.removeEventListener('mousedown', this.mousedownListener);
    window.removeEventListener('resize', this.resizeListener);
  }
}
