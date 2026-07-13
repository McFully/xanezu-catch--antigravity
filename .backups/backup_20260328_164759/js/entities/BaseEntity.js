export class Entity {
    constructor(x, y, w, h, speed) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.speed = speed;
        this.dead = false;
    }
    update(dt) {
        this.x -= this.speed * dt;
        if (this.x + this.w < -150) this.dead = true;
    }
    getBounds() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
