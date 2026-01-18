import * as THREE from 'three';

export class Turret {
  constructor(scene) {
    this.scene = scene;

    // POOL REQUIRED
    this.active = false;
    this.shouldRemove = false;

    // STATS
    this.health = 20;
    this.maxHealth = 20;
    this.echoValue = 5;
    this.isElite = false;

    // MOVEMENT
    this.position = { x: 0, y: 0 };
    this.state = 'entering'; // 'entering' | 'active'
    this.driftSpeed = 60;
    this.targetY = 0; // Where to stop

    // ROTATION
    this.rotation = 0; // Current barrel angle
    this.rotationSpeed = 2; // Radians per second

    // ATTACK
    this.shootTimer = 0;
    this.shootInterval = 3.0;
    this.burstTimer = 0;
    this.burstCount = 0;
    this.burstDelay = 0.1;
    this.bulletsPerBurst = 4;
    this.bulletSpeed = 220;
    this.spreadAngle = 5 * (Math.PI / 180); // Slight spread

    // HITBOX
    this.hitboxSize = 28;

    // VISUAL STATE
    this.damageFlash = 0;

    // MESH
    this.mesh = null;
    this.barrel = null;
    this.eliteGlow = null;
    this.createMesh();
  }

  createMesh() {
    // Create a group to hold base and barrel
    this.mesh = new THREE.Group();
    this.mesh.position.z = 0.2;
    this.mesh.visible = false;
    this.scene.add(this.mesh);

    // Hexagonal base
    const baseShape = new THREE.Shape();
    const sides = 6;
    const radius = 16;
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) baseShape.moveTo(x, y);
      else baseShape.lineTo(x, y);
    }
    baseShape.closePath();

    const baseGeom = new THREE.ShapeGeometry(baseShape);
    const baseMat = new THREE.MeshBasicMaterial({
      color: 0x6644ff,
      transparent: true,
      opacity: 1
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    this.mesh.add(base);
    this.baseMesh = base;

    // Barrel (rectangle)
    const barrelGeom = new THREE.PlaneGeometry(6, 18);
    const barrelMat = new THREE.MeshBasicMaterial({
      color: 0x8866ff,
      transparent: true,
      opacity: 1
    });
    this.barrel = new THREE.Mesh(barrelGeom, barrelMat);
    this.barrel.position.y = 8; // Offset from center
    this.barrel.position.z = 0.1;
    this.mesh.add(this.barrel);

    // Center dot
    const dotGeom = new THREE.CircleGeometry(4, 16);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    const dot = new THREE.Mesh(dotGeom, dotMat);
    dot.position.z = 0.15;
    this.mesh.add(dot);
    this.dotMesh = dot;

    // Elite glow effect
    const glowGeom = new THREE.ShapeGeometry(baseShape);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0
    });
    this.eliteGlow = new THREE.Mesh(glowGeom, glowMat);
    this.eliteGlow.scale.set(1.4, 1.4, 1);
    this.eliteGlow.position.z = -0.1;
    this.mesh.add(this.eliteGlow);
  }

  init(config) {
    this.position.x = config.x;
    this.position.y = config.y;
    this.isElite = config.isElite || false;

    // Set stats based on elite status
    this.maxHealth = this.isElite ? 50 : 20;
    this.health = this.maxHealth;
    this.echoValue = this.isElite ? 12 : 5;

    // Elite shoots faster
    this.shootInterval = this.isElite ? 2.0 : 3.0;

    // Target Y position (40-70% from bottom of screen)
    // config.gameHeight would be passed, but we can estimate
    this.targetY = config.y - (100 + Math.random() * 150);

    this.state = 'entering';
    this.rotation = -Math.PI / 2; // Point downward initially
    this.shootTimer = Math.random() * this.shootInterval;
    this.burstCount = 0;

    // Visual setup
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;
    this.mesh.rotation.z = 0;
    this.mesh.visible = true;

    this.baseMesh.material.color.setHex(this.isElite ? 0xffd700 : 0x6644ff);
    this.barrel.material.color.setHex(this.isElite ? 0xffee88 : 0x8866ff);

    // Elite glow
    if (this.isElite) {
      this.eliteGlow.material.opacity = 0.4;
    } else {
      this.eliteGlow.material.opacity = 0;
    }

    this.shouldRemove = false;
    this.damageFlash = 0;
  }

  update(dt, playerPos, bulletPool, gameWidth, gameHeight) {
    if (!this.active || this.shouldRemove) return;

    if (this.state === 'entering') {
      this.updateEntering(dt);
    } else {
      this.updateActive(dt, playerPos, bulletPool);
    }

    // Damage flash decay
    if (this.damageFlash > 0) {
      this.damageFlash -= dt * 5;
      const flashIntensity = Math.max(0, this.damageFlash);
      const baseColor = this.isElite ? 0xffd700 : 0x6644ff;
      const r = ((baseColor >> 16) & 0xff) / 255;
      const g = ((baseColor >> 8) & 0xff) / 255;
      const b = (baseColor & 0xff) / 255;
      this.baseMesh.material.color.setRGB(
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

    // Check if pushed into void (below screen)
    if (this.position.y < -gameHeight / 2 - 50) {
      this.shouldRemove = true;
    }
  }

  updateEntering(dt) {
    // Drift down to target position
    this.position.y -= this.driftSpeed * dt;

    if (this.position.y <= this.targetY) {
      this.position.y = this.targetY;
      this.state = 'active';
    }
  }

  updateActive(dt, playerPos, bulletPool) {
    // Rotate barrel toward player
    this.rotateToward(playerPos, dt);

    // Handle burst firing
    if (this.burstCount > 0) {
      this.burstTimer += dt;
      if (this.burstTimer >= this.burstDelay) {
        this.burstTimer = 0;
        this.fireBullet(bulletPool);
        this.burstCount--;
      }
    } else {
      // Cooldown between bursts
      this.shootTimer += dt;
      if (this.shootTimer >= this.shootInterval) {
        this.shootTimer = 0;
        this.startBurst();
      }
    }
  }

  rotateToward(playerPos, dt) {
    // Calculate target angle
    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const targetAngle = Math.atan2(dy, dx) - Math.PI / 2; // Adjust for barrel orientation

    // Smooth rotation
    let angleDiff = targetAngle - this.rotation;

    // Normalize to -PI to PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const maxRotation = this.rotationSpeed * dt;
    if (Math.abs(angleDiff) < maxRotation) {
      this.rotation = targetAngle;
    } else {
      this.rotation += Math.sign(angleDiff) * maxRotation;
    }

    // Apply rotation to mesh
    this.mesh.rotation.z = this.rotation;
  }

  startBurst() {
    this.burstCount = this.bulletsPerBurst;
    this.burstTimer = 0;
  }

  fireBullet(bulletPool) {
    if (!bulletPool) return;

    // Fire in barrel direction with slight spread
    const baseAngle = this.rotation + Math.PI / 2; // Convert back from barrel orientation
    const spread = (Math.random() - 0.5) * this.spreadAngle;
    const angle = baseAngle + spread;

    const bullet = bulletPool.acquire();
    if (bullet) {
      bullet.init({
        x: this.position.x + Math.cos(baseAngle) * 20,
        y: this.position.y + Math.sin(baseAngle) * 20,
        velocityX: Math.cos(angle) * this.bulletSpeed,
        velocityY: Math.sin(angle) * this.bulletSpeed
      });
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
      x: this.position.x - this.hitboxSize / 2,
      y: this.position.y - this.hitboxSize / 2,
      width: this.hitboxSize,
      height: this.hitboxSize
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
    this.burstCount = 0;
    this.state = 'entering';
  }
}
