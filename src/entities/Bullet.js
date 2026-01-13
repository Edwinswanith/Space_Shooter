import * as THREE from 'three';

const BULLET_COLORS = {
  player: 0x00ffff,
  enemy: 0xff3333,
  boss: 0xff00ff
};

export class Bullet {
  constructor(owner, scene) {
    this.scene = scene;
    this.ownerType = owner; // 'player', 'enemy', 'boss'

    // State
    this.active = false;
    this.shouldRemove = false;

    // Physics
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.damage = 1;

    // Size - player bullets larger and more visible
    this.width = owner === 'player' ? 6 : 8;
    this.height = owner === 'player' ? 16 : 8;

    // Create mesh
    this.mesh = null;
    this.glow = null;
    this.createMesh();
  }

  createMesh() {
    const geometry = this.ownerType === 'player'
      ? new THREE.PlaneGeometry(this.width, this.height)
      : new THREE.CircleGeometry(this.width / 2, 8);

    const material = new THREE.MeshBasicMaterial({
      color: BULLET_COLORS[this.ownerType],
      transparent: true,
      opacity: 1
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = 0.5;
    this.mesh.visible = false;
    this.scene.add(this.mesh);

    // Add glow effect for player bullets
    if (this.ownerType === 'player') {
      const glowGeometry = new THREE.PlaneGeometry(this.width * 2.5, this.height * 1.5);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3
      });
      this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
      this.glow.position.z = -0.1;
      this.mesh.add(this.glow);
    }
  }

  init(config) {
    this.position.x = config.x;
    this.position.y = config.y;
    this.velocity.x = config.vx || 0;
    this.velocity.y = config.vy || 0;
    this.damage = config.damage || 1;

    // Update mesh
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;
    this.mesh.visible = true;

    // Optional color override
    if (config.color) {
      this.mesh.material.color.setHex(config.color);
    }

    this.shouldRemove = false;
  }

  update(dt, gameWidth, gameHeight) {
    if (!this.active || this.shouldRemove) return;

    // Move bullet
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // Update mesh
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;

    // Check bounds
    const margin = 50;
    if (
      this.position.x < -gameWidth / 2 - margin ||
      this.position.x > gameWidth / 2 + margin ||
      this.position.y < -gameHeight / 2 - margin ||
      this.position.y > gameHeight / 2 + margin
    ) {
      this.shouldRemove = true;
    }
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
      x: this.position.x - this.width / 2,
      y: this.position.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}
