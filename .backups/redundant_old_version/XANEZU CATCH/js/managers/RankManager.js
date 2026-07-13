export class RankManager {
    constructor() {
        this.ranks = [
            { name: 'BRONZE', min: 0, color: '#cd7f32' },
            { name: 'SILVER', min: 10000, color: '#c0c0c0' },
            { name: 'GOLD', min: 50000, color: '#ffd700' },
            { name: 'PLATINUM', min: 150000, color: '#e5e4e2' },
            { name: 'DIAMOND', min: 500000, color: '#b9f2ff' }
        ];
    }
    getRank(score) {
        for (let i = this.ranks.length - 1; i >= 0; i--) {
            if (score >= this.ranks[i].min) return this.ranks[i];
        }
        return this.ranks[0];
    }
}
