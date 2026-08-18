import { GameEngine } from './game-engine';
import { Obstacle, ObstacleType } from '../entities/obstacle';
import { CollectibleItem, ItemType } from '../entities/item';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, LOGICAL_GROUND_Y, OBSTACLE_W_SIZE } from './engine.constants';

export class DirectorSystem {
    private obstacleTimer: number = 0;
    private itemTimer: number = 0;
    private lastWasTop: boolean = false;

    constructor(private engine: any) {}

    public update(dt: number, speed: number, delay: number): void {
        // Obstáculos en dientes de sierra (reducido un 30% y más distantes)
        this.obstacleTimer += dt;
        const obstacleDelay = delay * 1.2;
        if (this.obstacleTimer > obstacleDelay) {
            this.spawnObstacleSawtooth(speed);
            this.obstacleTimer = 0;
        }

        // Spawneo de objetos reducido en un 80% (una quinta parte)
        this.itemTimer += dt;
        const itemDelay = delay * 2.5;
        if (this.itemTimer > itemDelay) {
            this.spawnItem(speed);
            this.itemTimer = 0;
        }
    }

    private spawnObstacleSawtooth(speed: number): void {
        const screenW = LOGICAL_WIDTH;
        
        // Alternar diente de sierra: uno arriba, uno abajo
        this.lastWasTop = !this.lastWasTop;
        const isTop = this.lastWasTop;
        
        const w = OBSTACLE_W_SIZE; 
        
        // Alturas de obstáculos reducidas en un 5% (arriba: 323, abajo: 182)
        const h = isTop ? 323 : 182; 
        
        // Alineación y margen
        const y = isTop ? -45 : LOGICAL_GROUND_Y - h + 35;
        
        const spriteKey = isTop ? this.engine.biomeRenderer.getRandomTopKey() : this.engine.biomeRenderer.getRandomBotKey();
        const obs = new Obstacle(screenW, y, w, h, ObstacleType.BOX, speed, spriteKey);
        obs.setMode(this.engine.mode);
        this.engine.entities.push(obs);
    }

    private spawnItem(speed: number): void {
        const screenW = LOGICAL_WIDTH;
        // Distribuido en Y
        const y = 100 + Math.random() * (LOGICAL_HEIGHT - 200);
        
        const spriteNames = [
            'coin', 'ruby', 'diamond', 'banana', 'candy_red', 'magnet', 'shield', 'star',
            'bolt', 'bomb', 'candy_blue', 'candy_brown', 'candy_cyan', 'candy_green',
            'candy_grey', 'candy_orange', 'candy_pink', 'candy_purple', 'candy_yellow',
            'clock', 'clover', 'crown', 'emerald', 'feather', 'fly_gold', 'ghost',
            'gift', 'heart', 'hourglass', 'ice', 'mini', 'pearl', 'rainbow'
        ];
        
        const spriteName = spriteNames[Math.floor(Math.random() * spriteNames.length)];
        
        let type = ItemType.CANDY;
        if (spriteName === 'coin') {
            type = ItemType.COIN;
        } else if (['ruby', 'diamond', 'emerald', 'pearl'].includes(spriteName)) {
            type = ItemType.GEM;
        } else if (['banana', 'heart', 'candy_red', 'candy_blue', 'candy_brown', 'candy_cyan', 'candy_green', 'candy_grey', 'candy_orange', 'candy_pink', 'candy_purple', 'candy_yellow'].includes(spriteName)) {
            type = ItemType.CANDY;
        } else {
            type = ItemType.POWERUP;
        }
        
        // Escalonar en X para que no se solapen exactamente
        const xOffset = Math.random() * 200;
        const item = new CollectibleItem(screenW + xOffset, y, type, speed);
        (item as any).spriteName = spriteName;
        
        this.engine.entities.push(item);
    }
}
