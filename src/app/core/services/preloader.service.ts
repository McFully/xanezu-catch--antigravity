import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PreloaderService {
  private preloadedImages: Set<string> = new Set();
  public isReady = signal(false);
  public progress = signal(0);

  private criticalAssets = [
    'assets/menu/fondo/main_menu.webp',
    'assets/menu/fondo/mode_select.webp',
    'assets/menu/fondo/story_chapter_select.webp',
    'assets/menu/fondo/arcade_chapter_select.webp',
    'assets/menu/fondo/ablia_chapter_select.webp'
  ];

  async preloadAll(): Promise<void> {
    const total = this.criticalAssets.length + 1;
    let loaded = 0;
    const updateProgress = () => {
      loaded++;
      this.progress.set(Math.floor((loaded / total) * 100));
    };

    const promises = this.criticalAssets.map(async src => {
      await this.preloadImage(src);
      updateProgress();
    });

    const audioPromise = this.preloadAudio('assets/menu/audio/musica menu.ogg');
    promises.push(audioPromise.then(() => updateProgress()));

    await Promise.all(promises);
    this.progress.set(100);
    this.isReady.set(true);
    console.log('[PreloaderService] 🖼️ All critical UI assets and audio preloaded.');
  }

  private preloadImage(src: string): Promise<void> {
    if (this.preloadedImages.has(src)) return Promise.resolve();

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedImages.add(src);
        resolve();
      };
      img.onerror = () => {
        console.warn(`[PreloaderService] ❌ Failed to preload: ${src}`);
        resolve();
      };
      img.src = src;
    });
  }

  private preloadAudio(src: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.oncanplaythrough = () => {
        resolve();
      };
      audio.onerror = () => {
        console.warn(`[PreloaderService] ❌ Failed to preload audio: ${src}`);
        resolve();
      };
      audio.src = src;
    });
  }
}
