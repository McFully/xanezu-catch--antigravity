import { Obstacle, ObstacleType } from '../entities/obstacle';
import { CollectibleItem, ItemType } from '../entities/item';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, LOGICAL_GROUND_Y, OBSTACLE_W_SIZE } from './engine.constants';
import { IGameEngineContext } from './engine.interfaces';

const BASE_SPRITE_NAMES = [
  'coin', 'ruby', 'diamond', 'banana', 'candy_red', 'magnet', 'shield', 'star',
  'bolt', 'bomb', 'candy_blue', 'candy_brown', 'candy_cyan', 'candy_green',
  'candy_grey', 'candy_orange', 'candy_pink', 'candy_purple', 'candy_yellow',
  'clock', 'clover', 'crown', 'emerald', 'feather', 'fly_gold', 'ghost',
  'gift', 'heart', 'hourglass', 'ice', 'mini', 'pearl', 'rainbow'
];

const GEM_SPRITES = ['ruby', 'diamond', 'emerald', 'pearl'];

export class DirectorSystem {
  private obstacleTimer: number = 0;
  private itemTimer: number = 0;
  private lastWasTop: boolean = false;

  constructor(private engine: IGameEngineContext) {}

  public update(dt: number, speed: number, delay: number): void {
    this.obstacleTimer += dt;
    const obstacleDelay = delay * 1.2;
    if (this.obstacleTimer > obstacleDelay) {
      this.spawnObstacleSawtooth(speed);
      this.obstacleTimer = 0;
    }

    this.itemTimer += dt;
    const itemDelay = delay * 2.5;
    if (this.itemTimer > itemDelay) {
      this.spawnItem(speed);
      this.itemTimer = 0;
    }
  }

  private spawnObstacleSawtooth(speed: number): void {
    this.lastWasTop = !this.lastWasTop;
    const isTop = this.lastWasTop;
    const w = OBSTACLE_W_SIZE;
    const h = isTop ? 323 : 182;
    const y = isTop ? -45 : LOGICAL_GROUND_Y - h + 35;

    const spriteKey = isTop
      ? this.engine.biomeRenderer.getRandomTopKey()
      : this.engine.biomeRenderer.getRandomBotKey();
    const obs = new Obstacle(LOGICAL_WIDTH, y, w, h, ObstacleType.BOX, speed, spriteKey);
    obs.setMode(this.engine.mode);
    this.engine.entities.push(obs);
  }

  private spawnItem(speed: number): void {
    const y = 100 + Math.random() * (LOGICAL_HEIGHT - 200);
    const pool = this.engine.hasGemRadar ? [...BASE_SPRITE_NAMES, ...GEM_SPRITES] : BASE_SPRITE_NAMES;
    const spriteName = pool[Math.floor(Math.random() * pool.length)];

    let type = ItemType.CANDY;
    if (spriteName === 'coin') {
      type = ItemType.COIN;
    } else if (GEM_SPRITES.includes(spriteName)) {
      type = ItemType.GEM;
    } else if (spriteName === 'banana' || spriteName === 'heart' || spriteName.startsWith('candy_')) {
      type = ItemType.CANDY;
    } else {
      type = ItemType.POWERUP;
    }

    const xOffset = Math.random() * 200;
    const item = new CollectibleItem(LOGICAL_WIDTH + xOffset, y, type, speed);
    (item as any).spriteName = spriteName;
    this.engine.entities.push(item);
  }
}
