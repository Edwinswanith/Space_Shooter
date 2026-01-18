import * as THREE from 'three';

export class Drifter {
  constructor(scene) {
    this.scene = scene;

    // POOL REQUIRED
    this.active = false;
    this.shouldRemove = false;

    // STATS
    this.health = 12;
    this.maxHealth = 12;
    this.echoValue = 3;
    this.isElite = false;

    // MOVEMENT
    this.position = { x: 0, y: 0 };
    this.horizontalSpeed = 120;
    this.verticalSpeed = 40;
    this.horizontalDirection = 1; // 1 or -1

    // ATTACK
    this.shootTimer = 0;
    this.shootInterval = 2.5;
    this.bulletSpeed = 180;
    this.spreadAngle = 15 * (Math.PI / 180); // 15 degrees in radians

    // HITBOX
    this.hitboxWidth = 32;
    this.hitboxHeight = 24;

    // VISUAL STATE
    this.damageFlash = 0;

    // MESH
    this.mesh = null;
    this.eliteGlow = null;
    this.createMesh();
  }

  createMesh() {
    // Wide hexagonal shape for drifter
    const shape = new THREE.Shape();
    shape.moveTo(0, 12);      // Top
    shape.lineTo(18, 6);      // Top right
    shape.lineTo(18, -6);     // Bottom right
    shape.lineTo(0, -12);     // Bottom
    shape.lineTo(-18, -6);    // Bottom left
    shape.lineTo(-18, 6);     // Top left
    shape.lineTo(0, 12);      // Back to top

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff8844,
      transparent: true,
      opacity: 1
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = 0.2;
    this.mesh.visible = false;
    this.scene.add(this.mesh);

    // Elite glow effect
    const glowGeom = new THREE.ShapeGeometry(shape);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0
    });
    this.eliteGlow = new THREE.Mesh(glowGeom, glowMat);
    this.eliteGlow.scale.set(1.3, 1.3, 1);
    this.eliteGlow.position.z = -0.1;
    this.mesh.add(this.eliteGlow);
  }

  init(config) {
    this.position.x = config.x;
    this.position.y = config.y;
    this.isElite = config.isElite || false;

    // Set stats based on elite status
    this.maxHealth = this.isElite ? 30 : 12;
    this.health = this.maxHealth;
    this.echoValue = this.isElite ? 8 : 3;

    // Random initial direction
    this.horizontalDirection = Math.random() > 0.5 ? 1 : -1;
    this.shootTimer = Math.random() * this.shootInterval; // Stagger shots

    // Visual setup
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;
    this.mesh.visible = true;
    this.mesh.material.color.setHex(this.isElite ? 0xffd700 : 0xff8844);

    // Elite glow
    if (this.isElite) {
      this.eliteGlow.material.opacity = 0.4;
    } else {
      this.eliteGlow.material.opacity = 0;
    }

    // Reset tilt
    this.mesh.rotation.z = this.horizontalDirection * 0.15;

    this.shouldRemove = false;
    this.damageFlash = 0;
  }

  update(dt, playerPos, bulletPool, gameWidth, gameHeight) {
    if (!this.active || this.shouldRemove) return;

    // Horizontal movement with bounce
    this.position.x += this.horizontalSpeed * this.horizontalDirection * dt;

    // Bounce off screen edges
    const halfWidth = gameWidth / 2 - 30;
    if (this.position.x > halfWidth) {
      this.position.x = halfWidth;
      this.horizontalDirection = -1;
      this.mesh.rotation.z = -0.15;
    } else if (this.position.x < -halfWidth) {
      this.position.x = -halfWidth;
      this.horizontalDirection = 1;
      this.mesh.rotation.z = 0.15;
    }

    // Slow vertical drift downward
    this.position.y -= this.verticalSpeed * dt;

    // Shooting
    this.shootTimer += dt;
    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0;
      this.shoot(playerPos, bulletPool);
    }

    // Damage flash decay
    if (this.damageFlash > 0) {
      this.damageFlash -= dt * 5;
      const flashIntensity = Math.max(0, this.damageFlash);
      const baseColor = this.isElite ? 0xffd700 : 0xff8844;
      const r = ((baseColor >> 16) & 0xff) / 255;
      const g = ((baseColor >> 8) & 0xff) / 255;
      const b = (baseColor & 0xff) / 255;
      this.mesh.material.color.setRGB(
        r + (1 - r) * flashIntensity,
        g + (1 - g) * flashIntensity,
        b + (1 - b) * flashIntensity
      );
    }

    // Update mesh position
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;

    // Elite glow pulse
    if (this.isElite) {
      this.eliteGlow.material.opacity = 0.3 + Math.sin(performance.now() * 0.005) * 0.15;
    }

    // Check if below screen
    if (this.position.y < -gameHeight / 2 - 50) {
      this.shouldRemove = true;
    }
  }

  shoot(playerPos, bulletPool) {
    if (!bulletPool) return;

    // Calculate direction to player
    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return;

    // Normalize direction
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Fire 3 bullets in spread pattern
    const angles = [-this.spreadAngle, 0, this.spreadAngle];

    for (const angle of angles) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotatedDirX = dirX * cos - dirY * sin;
      const rotatedDirY = dirX * sin + dirY * cos;

      const bullet = bulletPool.acquire();
      if (bullet) {
        bullet.init({
          x: this.position.x,
          y: this.position.y - 15,
          velocityX: rotatedDirX * this.bulletSpeed,
          velocityY: rotatedDirY * this.bulletSpeed
        });
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    this.damageFlash = 1;

    if (this.health <= 0) {
      this.shouldRemove = true;
    }
  }

  getHitbox() {
    return {
      x: this.position.x - this.hitboxWidth / 2,
      y: this.position.y - this.hitboxHeight / 2,
      width: this.hitboxWidth,
      height: this.hitboxHeight
    };
  }

  deactivate() {
    this.shouldRemove = true;
  }

  onRelease() {
    this.mesh.visible = false;
    this.health = this.maxHealth;
    this.shouldRemove = false;
    this.damageFlash = 0;
    this.shootTimer = 0;
  }
}
