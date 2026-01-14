import * as THREE from 'three';

// Configuration constants
const CONFIG = {
  // Movement
  lerpFactor: 0.12,
  maxSpeed: 800,

  // Bounds
  bounds: {
    left: -380,
    right: 380,
    top: 280,
    bottom: -210  // 15% buffer from void
  },

  // Hitbox
  hitbox: { width: 16, height: 16 },
  visualSize: { width: 32, height: 32 },

  // Combat
  baseFireRate: 6,  // shots per second
  baseDamage: 5,
  bulletSpeed: 600,

  // Dash
  dashDistance: 80,
  dashDuration: 0.15,
  dashCooldown: 2.5,

  // Health
  maxHealth: 3,
  invincibilityDuration: 1.2
};

export class Player {
  constructor(scene, bulletPool, gameWidth, gameHeight) {
    this.scene = scene;
    this.bulletPool = bulletPool;
    this.GAME_WIDTH = gameWidth;
    this.GAME_HEIGHT = gameHeight;

    // Position
    this.position = { x: 0, y: -100 };

    // Health
    this.health = CONFIG.maxHealth;
    this.maxHealth = CONFIG.maxHealth;

    // Invincibility
    this.isInvincible = false;
    this.invincibilityTimer = 0;

    // Firing
    this.fireTimer = 0;
    this.fireInterval = 1 / CONFIG.baseFireRate;

    // Dash
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashMaxCooldown = CONFIG.dashCooldown;
    this.dashStartPos = { x: 0, y: 0 };
    this.dashEndPos = { x: 0, y: 0 };

    // Visual
    this.mesh = null;
    this.afterimages = [];

    // Audio callbacks
    this.onShoot = null;
    this.onDash = null;

    // Create visual
    this.createMesh();
  }

  createMesh() {
    // Create ship geometry (triangle pointing up)
    const shape = new THREE.Shape();
    const w = CONFIG.visualSize.width / 2;
    const h = CONFIG.visualSize.height / 2;

    shape.moveTo(0, h);           // Top point
    shape.lineTo(-w, -h);         // Bottom left
    shape.lineTo(0, -h * 0.5);    // Center notch
    shape.lineTo(w, -h);          // Bottom right
    shape.lineTo(0, h);           // Back to top

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = 0;
    this.scene.add(this.mesh);

    // Add glow effect
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const glowGeometry = new THREE.ShapeGeometry(shape);
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.glow.scale.set(1.3, 1.3, 1);
    this.glow.position.z = -0.1;
    this.mesh.add(this.glow);
  }

  reset() {
    this.position = { x: 0, y: -100 };
    this.health = CONFIG.maxHealth;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.fireTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;

    // Show mesh
    this.mesh.visible = true;
  }

  update(dt, input) {
    // Update invincibility
    if (this.isInvincible) {
      this.invincibilityTimer -= dt;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        this.mesh.material.opacity = 1;
      } else {
        // Flicker effect
        this.mesh.visible = Math.floor(this.invincibilityTimer * 20) % 2 === 0;
      }
    }

    // Update dash cooldown
    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt;
    }

    // Handle dash
    if (this.isDashing) {
      this.updateDash(dt);
    } else {
      // Check for dash trigger
      if (input.isDashTriggered() && this.dashCooldown <= 0) {
        this.startDash(input.getMousePosition());
      }

      // Normal movement
      this.updateMovement(dt, input.getMousePosition());
    }

    // Handle firing
    this.updateFiring(dt, input.isFireHeld());

    // Update visual position
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;
  }

  updateMovement(dt, mousePos) {
    // Target position is mouse position, clamped to bounds
    const targetX = this.clamp(mousePos.x, CONFIG.bounds.left, CONFIG.bounds.right);
    const targetY = this.clamp(mousePos.y, CONFIG.bounds.bottom, CONFIG.bounds.top);

    // Frame-rate independent lerp
    const lerpAmount = 1 - Math.pow(1 - CONFIG.lerpFactor, dt * 60);

    this.position.x += (targetX - this.position.x) * lerpAmount;
    this.position.y += (targetY - this.position.y) * lerpAmount;

    // Ship tilts based on horizontal movement
    const velocityX = targetX - this.position.x;
    this.mesh.rotation.z = this.clamp(velocityX * 0.01, -0.3, 0.3);
  }

  startDash(mousePos) {
    this.isDashing = true;
    this.dashTimer = 0;
    this.dashCooldown = CONFIG.dashCooldown;
    this.isInvincible = true;

    if (this.onDash) this.onDash();

    // Calculate dash direction (toward mouse)
    const dx = mousePos.x - this.position.x;
    const dy = mousePos.y - this.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If mouse is very close, dash upward
    let dirX, dirY;
    if (dist < 10) {
      dirX = 0;
      dirY = 1;
    } else {
      dirX = dx / dist;
      dirY = dy / dist;
    }

    // Calculate end position
    this.dashStartPos = { ...this.position };
    this.dashEndPos = {
      x: this.clamp(this.position.x + dirX * CONFIG.dashDistance, CONFIG.bounds.left, CONFIG.bounds.right),
      y: this.clamp(this.position.y + dirY * CONFIG.dashDistance, CONFIG.bounds.bottom, CONFIG.bounds.top)
    };

    // Spawn afterimages
    this.spawnAfterimages();
  }

  updateDash(dt) {
    this.dashTimer += dt;
    const progress = this.dashTimer / CONFIG.dashDuration;

    if (progress >= 1) {
      // Dash complete
      this.isDashing = false;
      this.isInvincible = false;
      this.position.x = this.dashEndPos.x;
      this.position.y = this.dashEndPos.y;
    } else {
      // Ease-out interpolation
      const eased = 1 - Math.pow(1 - progress, 3);
      this.position.x = this.lerp(this.dashStartPos.x, this.dashEndPos.x, eased);
      this.position.y = this.lerp(this.dashStartPos.y, this.dashEndPos.y, eased);
    }
  }

  spawnAfterimages() {
    // Create 5 afterimages along dash path
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const x = this.lerp(this.dashStartPos.x, this.dashEndPos.x, t);
      const y = this.lerp(this.dashStartPos.y, this.dashEndPos.y, t);

      const afterimage = this.mesh.clone();
      afterimage.position.x = x;
      afterimage.position.y = y;
      afterimage.position.z = -0.2;
      afterimage.material = afterimage.material.clone();
      afterimage.material.transparent = true;
      afterimage.material.opacity = 0.5 - (t * 0.4);

      this.scene.add(afterimage);

      // Fade out and remove
      const fadeOut = () => {
        afterimage.material.opacity -= 0.02;
        if (afterimage.material.opacity <= 0) {
          this.scene.remove(afterimage);
        } else {
          requestAnimationFrame(fadeOut);
        }
      };

      setTimeout(fadeOut, i * 30);
    }
  }

  updateFiring(dt, isFireHeld) {
    this.fireTimer += dt;

    if (isFireHeld && this.fireTimer >= this.fireInterval) {
      this.fireTimer = 0;
      this.fire();
    }
  }

  fire() {
    const bullet = this.bulletPool.acquire();
    bullet.init({
      x: this.position.x,
      y: this.position.y + 20,
      vx: 0,
      vy: CONFIG.bulletSpeed,
      damage: CONFIG.baseDamage
    });

    if (this.onShoot) this.onShoot();
  }

  takeDamage() {
    if (this.isInvincible) return;

    this.health--;
    this.isInvincible = true;
    this.invincibilityTimer = CONFIG.invincibilityDuration;
  }

  // Helper functions
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
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
