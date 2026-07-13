export class Obstacle {
  constructor(scene, x, y, speed, scale = 1, textureKey = null) {
    this.scene = scene;
    if (textureKey) {
      this.sprite = scene.physics.add.image(x, y, textureKey).setOrigin(0.5);
      this.sprite.setDisplaySize(56 * scale, 56 * scale);
    } else {
      this.sprite = scene.add.rectangle(x, y, 48 * scale, 48 * scale, 0xff2e63).setOrigin(0.5);
      scene.physics.add.existing(this.sprite);
    }
    this.sprite.body.setVelocityX(-speed);
    this.sprite.body.setImmovable(true);
  }

  update() {
    if (this.sprite.x < -100) this.sprite.destroy();
  }
}
