import { CollectibleItem } from '../entities/item';
import { IGameEngineContext } from './engine.interfaces';

export class PhysicsSystem {
  constructor(private engine: IGameEngineContext) {}

  public update(dt: number): void {
    const player = this.engine.player;

    if (this.engine.hasMagnet || player.magnetT > 0) {
      const range = this.engine.hasMagnet ? 520 : 400;
      for (const ent of this.engine.entities) {
        if (ent instanceof CollectibleItem) {
          const dist = Math.hypot(player.x - ent.x, player.y - ent.y);
          if (dist < range) {
            const angle = Math.atan2(player.y - ent.y, player.x - ent.x);
            ent.x += Math.cos(angle) * 15 * dt;
            ent.y += Math.sin(angle) * 15 * dt;
          }
        }
      }
    }
  }
}
