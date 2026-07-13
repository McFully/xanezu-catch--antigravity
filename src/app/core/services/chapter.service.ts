import { Injectable } from '@angular/core';
import { Chapter } from '../models/chapter.model';
import { ALL_CHAPTERS, STORY_CHAPTERS, ARCADE_CHAPTERS, ABLIA_CHAPTERS } from '../constants/chapters.constants';

@Injectable({
  providedIn: 'root'
})
export class ChapterService {
  private chapters: Chapter[] = ALL_CHAPTERS;

  getChapters(): Chapter[] {
    return this.chapters;
  }

  getChaptersByMode(mode: 'STORY' | 'ARCADE' | 'ABLIA' | string): Chapter[] {
    if (mode === 'STORY') return STORY_CHAPTERS;
    if (mode === 'ARCADE') return ARCADE_CHAPTERS;
    if (mode === 'ABLIA') return ABLIA_CHAPTERS;
    return this.chapters.filter(c => c.mode === mode);
  }

  getChapterById(id: string): Chapter | undefined {
    return this.chapters.find(c => c.id === id);
  }

  unlockNextChapter(currentId: string): void {
    const currentIndex = this.chapters.findIndex(c => c.id === currentId);
    if (currentIndex !== -1 && currentIndex + 1 < this.chapters.length) {
      const nextChapter = this.chapters[currentIndex + 1];
      // Solo desbloqueamos si es del mismo modo
      if (nextChapter && nextChapter.mode === this.chapters[currentIndex].mode) {
         nextChapter.unlocked = true;
      }
    }
  }
}
