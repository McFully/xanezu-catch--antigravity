import { Player } from '../entities/player';
import { CollectibleItem } from '../entities/item';

export class PhysicsSystem {
    constructor(private engine: any) {}

    public update(dt: number): void {
        const player = this.engine.player;
        
        // 1. Lógica del Imán para recolectar ítems
        if (this.engine.hasMagnet || player.magnetT > 0) {
            for (const ent of this.engine.entities) {
                if (ent instanceof CollectibleItem) {
                    const dist = Math.hypot(player.x - ent.x, player.y - ent.y);
                    if (dist < 400) {
                        const angle = Math.atan2(player.y - ent.y, player.x - ent.x);
                        ent.x += Math.cos(angle) * 15 * dt;
                        ent.y += Math.sin(angle) * 15 * dt;
                    }
                }
            }
        }
    }
}
