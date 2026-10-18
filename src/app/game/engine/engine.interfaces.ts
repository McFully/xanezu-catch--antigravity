import { IEntity } from './entity.model';
import { Player } from '../entities/player';
import { ParticleSystem } from './particle-system';
import { BiomeRenderer } from '../renderer/biome-renderer';
import { AbliaRenderer } from '../renderer/ablia-renderer';

export interface IEngineAudio {
  playJump(): void;
  playCollect(streak?: number): void;
  playDamage(): void;
  playVictory(): void;
  playChapterMusic(mode: string, folder: string): Promise<void>;
  stopMusic(): void;
}

export interface IGameEngineContext {
  mode: string;
  level: number;
  score: number;
  coins: number;
  multiplier: number;
  multiplierDuration: number;
  multiplierTimeLeft: number;
  multiplierTimer: number;
  maxMultiplier: number;
  currentSpeed: number;
  bananaComboActive: boolean;
  bananaComboTimer: number;
  hasMagnet: boolean;
  hasGemRadar: boolean;
  hasRevive: boolean;
  sessionCoins: number;
  sessionGems: number;
  sessionItemsBySprite: Record<string, number>;
  player: Player;
  entities: IEntity[];
  particles: ParticleSystem;
  audio: IEngineAudio;
  biomeRenderer: BiomeRenderer;
  abliaRenderer: AbliaRenderer;
  addTrauma(amount: number): void;
  triggerFlash(color: string, duration: number): void;
  triggerGameOver(): void;
  notifyHudChange(): void;
}
