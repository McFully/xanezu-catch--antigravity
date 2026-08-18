import { Player } from '../entities/player';
import { IEntity } from './entity.model';

export class CollisionSystem {
    constructor(private engine: any) {}

    public check(p: Player, e: IEntity): boolean {
        const pad = 12; // Ajustado proporcionalmente a la reducción de tamaño
        return (
            p.x + pad < e.x + e.w - pad &&
            p.x + p.w - pad > e.x + pad &&
            p.y + pad < e.y + e.h - pad &&
            p.y + p.h - pad > e.y + pad
        );
    }
}
