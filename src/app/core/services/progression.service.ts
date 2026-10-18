import { Injectable, signal, computed } from '@angular/core';
import {
  calculateLevelFromXP,
  getXPForNextLevel,
  getLevelProgressPercentage,
  XP_PROGRESSION_TABLE
} from '../constants/progression.constants';

@Injectable({
  providedIn: 'root'
})
export class ProgressionService {
  private totalXPInternal = signal<number>(this.readInt('mx_total_xp', 0));
  private coinsInternal = signal<number>(this.readInt('mx_total_coins', 0));
  private highScoreInternal = signal<number>(this.readInt('mx_high_score', 0));
  private maxLevelInternal = signal<number>(this.readInt('mx_max_level', 0));
  private gamesPlayedInternal = signal<number>(this.readInt('mx_games_played', 0));
  private totalSecondsInternal = signal<number>(this.readInt('mx_total_seconds', 0));
  private difficultyInternal = signal<'NORMAL' | 'DIFÍCIL'>(
    (localStorage.getItem('mx_difficulty') as 'NORMAL' | 'DIFÍCIL') || 'NORMAL'
  );

  public totalXP = this.totalXPInternal.asReadonly();
  public coins = this.coinsInternal.asReadonly();
  public totalCoins = this.coinsInternal.asReadonly();
  public highScore = this.highScoreInternal.asReadonly();
  public maxLevel = this.maxLevelInternal.asReadonly();
  public gamesPlayed = this.gamesPlayedInternal.asReadonly();
  public difficulty = this.difficultyInternal.asReadonly();

  public currentLevel = computed(() => calculateLevelFromXP(this.totalXP()));
  public progressPercentage = computed(() => getLevelProgressPercentage(this.totalXP()));
  public nextLevelXP = computed(() => getXPForNextLevel(this.currentLevel()));

  public xpToNextLevel = computed(() => {
    const next = this.nextLevelXP();
    if (next === null) return 0;
    return Math.max(0, next - this.totalXP());
  });

  public totalTimeFormatted = computed(() => {
    const totalSecs = this.totalSecondsInternal();
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return `${hours}h ${mins}m`;
  });

  private readInt(key: string, fallback: number): number {
    const raw = localStorage.getItem(key);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  public addXP(amount: number): void {
    const newXP = this.totalXPInternal() + Math.max(0, Math.floor(amount));
    this.totalXPInternal.set(newXP);
    localStorage.setItem('mx_total_xp', newXP.toString());
  }

  public setCoins(amount: number): void {
    const clean = Math.max(0, Math.floor(amount));
    this.coinsInternal.set(clean);
    localStorage.setItem('mx_total_coins', clean.toString());
  }

  public spendCoins(amount: number): boolean {
    if (this.coinsInternal() < amount) return false;
    this.setCoins(this.coinsInternal() - amount);
    return true;
  }

  public recordSessionEnd(params: {
    score: number;
    level: number;
    coinsTotal: number;
    sessionCoins: number;
    sessionGems: number;
    sessionJumps: number;
    durationSeconds: number;
    isDeath: boolean;
  }): number {
    const cleanScore = Math.floor(params.score);
    const xpEarned = Math.floor(cleanScore / 10);
    this.addXP(xpEarned);
    this.setCoins(params.coinsTotal);

    if (cleanScore > this.highScoreInternal()) {
      this.highScoreInternal.set(cleanScore);
      localStorage.setItem('mx_high_score', cleanScore.toString());
    }

    if (params.level > this.maxLevelInternal()) {
      this.maxLevelInternal.set(params.level);
      localStorage.setItem('mx_max_level', params.level.toString());
    }

    const games = this.gamesPlayedInternal() + 1;
    this.gamesPlayedInternal.set(games);
    localStorage.setItem('mx_games_played', games.toString());

    const totalSecs = this.totalSecondsInternal() + Math.max(0, Math.floor(params.durationSeconds));
    this.totalSecondsInternal.set(totalSecs);
    localStorage.setItem('mx_total_seconds', totalSecs.toString());
    localStorage.setItem('mx_total_time_seconds', totalSecs.toString());
    localStorage.setItem('mx_total_time_formatted', this.totalTimeFormatted());

    const totalJumps = this.readInt('mx_total_jumps', 0) + params.sessionJumps;
    const totalCoinsCol = this.readInt('mx_total_coins_collected', 0) + params.sessionCoins;
    const totalGemsCol = this.readInt('mx_total_gems_collected', 0) + params.sessionGems;
    localStorage.setItem('mx_total_jumps', totalJumps.toString());
    localStorage.setItem('mx_total_coins_collected', totalCoinsCol.toString());
    localStorage.setItem('mx_total_gems_collected', totalGemsCol.toString());

    if (params.isDeath) {
      const totalDeaths = this.readInt('mx_total_deaths', 0) + 1;
      localStorage.setItem('mx_total_deaths', totalDeaths.toString());
    }

    localStorage.setItem('mx_last_score', cleanScore.toString());
    localStorage.setItem('mx_last_coins', params.sessionCoins.toString());
    localStorage.setItem('mx_last_gems', params.sessionGems.toString());

    return xpEarned;
  }

  public setDifficulty(diff: 'NORMAL' | 'DIFÍCIL'): void {
    this.difficultyInternal.set(diff);
    localStorage.setItem('mx_difficulty', diff);
  }

  public getThresholdForLevel(level: number): number {
    return XP_PROGRESSION_TABLE[level] || 0;
  }

  public exportBackupJson(): string {
    const backup: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('mx_') || k.startsWith('shop_item_') || k.startsWith('skin_unlocked_') || k.startsWith('xanezu_'))) {
        backup[k] = localStorage.getItem(k);
      }
    }
    return JSON.stringify({
      project: 'Xanezu Catch',
      publisher: 'Aritz Bahamonde Larxé',
      exportedAt: new Date().toISOString(),
      data: backup
    }, null, 2);
  }
}
