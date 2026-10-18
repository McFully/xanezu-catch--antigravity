import { Injectable } from '@angular/core';
import { Chapter } from '../models/chapter.model';
import { ALL_CHAPTERS, STORY_CHAPTERS, ARCADE_CHAPTERS, ABLIA_CHAPTERS } from '../constants/chapters.constants';

const UNLOCKED_STORAGE_KEY = 'mx_unlocked_chapters';

@Injectable({
  providedIn: 'root'
})
export class ChapterService {
  private chapters: Chapter[] = ALL_CHAPTERS;

  constructor() {
    this.loadUnlockedState();
  }

  private loadUnlockedState(): void {
    try {
      const raw = localStorage.getItem(UNLOCKED_STORAGE_KEY);
      if (!raw) return;
      const unlockedIds: string[] = JSON.parse(raw);
      if (Array.isArray(unlockedIds)) {
        for (const ch of this.chapters) {
          if (unlockedIds.includes(ch.id)) {
            ch.unlocked = true;
          }
        }
      }
    } catch (e) {
      console.warn('[ChapterService] Error loading unlocked chapters:', e);
    }
  }

  private saveUnlockedState(): void {
    const unlockedIds = this.chapters.filter(c => c.unlocked).map(c => c.id);
    localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(unlockedIds));
  }

  getChapters(): Chapter[] {
    return this.chapters;
  }

  getChaptersByMode(mode: 'STORY' | 'ARCADE' | 'ABLIA' | string): Chapter[] {
    const normalized = mode.toUpperCase();
    if (normalized === 'STORY') return STORY_CHAPTERS;
    if (normalized === 'ARCADE') return ARCADE_CHAPTERS;
    if (normalized === 'ABLIA') return ABLIA_CHAPTERS;
    return this.chapters.filter(c => c.mode === normalized);
  }

  getChapterById(id: string): Chapter | undefined {
    return this.chapters.find(c => c.id === id);
  }

  getNextChapter(currentId: string): Chapter | null {
    const currentIndex = this.chapters.findIndex(c => c.id === currentId);
    if (currentIndex !== -1 && currentIndex + 1 < this.chapters.length) {
      const nextChapter = this.chapters[currentIndex + 1];
      if (nextChapter && nextChapter.mode === this.chapters[currentIndex].mode) {
        return nextChapter;
      }
    }
    return null;
  }

  unlockNextChapter(currentId: string): Chapter | null {
    const nextChapter = this.getNextChapter(currentId);
    if (nextChapter) {
      nextChapter.unlocked = true;
      this.saveUnlockedState();
      return nextChapter;
    }
    return null;
  }
}
