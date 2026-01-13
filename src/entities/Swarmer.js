import * as THREE from 'three';

const CONFIG = {
  health: 5,
  speed: 120,           // Pixels per second (downward)
  echoValue: 1,
  hitbox: { width: 24, height: 24 },

  // Sine wave motion
  sineAmplitude: 40,    // Pixels left/right
  sineFrequency: 2,     // Cycles per second

  // Shooting
  shootInterval: 2,     // Seconds
  bulletSpeed: 200,
  bulletDamage: 1
};

export class Swarmer {
  constructor(scene) {
    this.scene = scene;

    // State
    this.active = false;
    this.shouldRemove = false;

    // Properties
    this.health = CONFIG.health;
    this.maxHealth = CONFIG.health;
    this.echoValue = CONFIG.echoValue;
    this.isElite = false;

    // Position
    this.position = { x: 0, y: 0 };
    this.spawnX = 0;

    // Timers
    this.time = 0;
    this.shootTimer = 0;

    // Create mesh
    this.mesh = null;
    this.createMesh();
  }

  createMesh() {
    // Create angular insect-like shape
    const shape = new THREE.Shape();
    const s = CONFIG.hitbox.width / 2;

    // Angular insect design
    shape.moveTo(0, s);           // Top
    shape.lineTo(s * 0.6, s * 0.3);
    shape.lineTo(s, 0);           // Right
    shape.lineTo(s * 0.6, -s * 0.3);
    shape.lineTo(0, -s);          // Bottom
    shape.lineTo(-s * 0.6, -s * 0.3);
    shape.lineTo(-s, 0);          // Left
    shape.lineTo(-s * 0.6, s * 0.3);
    shape.lineTo(0, s);

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = 0;
    this.mesh.visible = false;
    this.scene.add(this.mesh);
  }

  init(config) {
    this.position.x = config.x;
    this.position.y = config.y;
    this.spawnX = config.x;

    this.health = CONFIG.health;
    this.isElite = config.isElite || false;

    // Elite modifications
    if (this.isElite) {
      this.health *= 2.5;
      this.maxHealth = this.health;
      this.echoValue = 8;
      this.mesh.material.color.setHex(0xffd700); // Gold
    } else {
      this.echoValue = CONFIG.echoValue;
      this.mesh.material.color.setHex(0xff3333); // Red
    }

    this.time = Math.random() * Math.PI * 2; // Random start phase
    this.shootTimer = Math.random() * CONFIG.shootInterval; // Random initial delay

    // Update mesh
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;
    this.mesh.visible = true;

    this.shouldRemove = false;
  }

  update(dt, playerPos, bulletPool, gameWidth, gameHeight) {
    if (!this.active || this.shouldRemove) return;

    this.time += dt;

    // Sine wave horizontal movement
    const previousX = this.position.x;
    this.position.x = this.spawnX +
      Math.sin(this.time * CONFIG.sineFrequency * Math.PI * 2) *
      CONFIG.sineAmplitude;

    // Downward drift
    this.position.y -= CONFIG.speed * dt;

    // Update mesh
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;

    // Rotation based on movement
    const velocityX = this.position.x - previousX;
    this.mesh.rotation.z = velocityX * 0.05;

    // Shooting
    this.shootTimer += dt;
    if (this.shootTimer >= CONFIG.shootInterval && bulletPool) {
      this.shootTimer = 0;
      this.shoot(playerPos, bulletPool);
    }

    // Remove if below screen
    if (this.position.y < -gameHeight / 2 - 50) {
      this.shouldRemove = true;
    }
  }

  shoot(playerPos, bulletPool) {
    // Aim at player
    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return;

    const vx = (dx / dist) * CONFIG.bulletSpeed;
    const vy = (dy / dist) * CONFIG.bulletSpeed;

    const bullet = bulletPool.acquire();
    bullet.init({
      x: this.position.x,
      y: this.position.y - 10,
      vx: vx,
      vy: vy,
      damage: CONFIG.bulletDamage
    });
  }

  takeDamage(amount) {
    this.health -= amount;

    // Flash white on damage
    this.mesh.material.color.setHex(0xffffff);
    setTimeout(() => {
      if (this.active) {
        this.mesh.material.color.setHex(this.isElite ? 0xffd700 : 0xff3333);
      }
    }, 50);
  }

  deactivate() {
    this.shouldRemove = true;
  }

  onRelease() {
    this.mesh.visible = false;
    this.shouldRemove = false;
  }

  // Get hitbox for collision detection
  getHitbox() {
    return {
      x: this.position.x - CONFIG.hitbox.width / 2,
      y: this.position.y - CONFIG.hitbox.height / 2,
      width: CONFIG.hitbox.width,
      height: CONFIG.hitbox.height
    };
  }
}
