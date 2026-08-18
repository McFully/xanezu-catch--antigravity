export class Player {
  constructor(scene, x, y, textureKey = null) {
    this.scene = scene;
    if (textureKey) {
      this.sprite = scene.physics.add.image(x, y, textureKey).setOrigin(0.5);
      this.sprite.setDisplaySize(52, 52);
    } else {
      this.sprite = scene.add.rectangle(x, y, 44, 44, 0x00f5ff).setOrigin(0.5);
      scene.physics.add.existing(this.sprite);
    }
    this.sprite.body.setCollideWorldBounds(true);
    this.speed = 360;
  }

  update(cursors) {
    const b = this.sprite.body;
    b.setVelocity(0, 0);
    if (cursors.left?.isDown) b.setVelocityX(-this.speed);
    if (cursors.right?.isDown) b.setVelocityX(this.speed);
    if (cursors.up?.isDown) b.setVelocityY(-this.speed);
    if (cursors.down?.isDown) b.setVelocityY(this.speed);
  }

  setColor(colorHex) {
    if ('fillColor' in this.sprite) this.sprite.fillColor = colorHex;
    else this.sprite.setTint(colorHex);
  }
}
