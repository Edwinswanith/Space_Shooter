import * as THREE from 'three';

const CRYSTAL_COLORS = {
  fury: 0xff4444,    // Red
  scatter: 0xffff44, // Yellow
  pierce: 0x4444ff,  // Blue
  seeker: 0x44ff44   // Green
};

export class Crystal {
  constructor(scene) {
    this.scene = scene;

    // POOL REQUIRED
    this.active = false;
    this.shouldRemove = false;

    // PROPERTIES
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.type = 'fury';
    this.lifetime = 8;
    this.magnetRadius = 150;
    this.collectRadius = 30;

    // VISUAL STATE
    this.rotation = 0;
    this.pulse = 0;

    // MESH
    this.mesh = null;
    this.glow = null;
    this.createMesh();
  }

  createMesh() {
    // Diamond/rhombus shape
    const shape = new THREE.Shape();
    shape.moveTo(0, 10);
    shape.lineTo(6, 0);
    shape.lineTo(0, -10);
    shape.lineTo(-6, 0);
    shape.lineTo(0, 10);

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = 0.3;
    this.mesh.visible = false;
    this.scene.add(this.mesh);

    // Glow effect
    const glowGeom = new THREE.ShapeGeometry(shape);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    this.glow = new THREE.Mesh(glowGeom, glowMat);
    this.glow.scale.set(1.5, 1.5, 1);
    this.glow.position.z = -0.1;
    this.mesh.add(this.glow);
  }

  init(config) {
    this.position.x = config.x;
    this.position.y = config.y;
    this.type = config.type || 'fury';

    // Burst upward on spawn
    this.velocity.x = (Math.random() - 0.5) * 100;
    this.velocity.y = 150 + Math.random() * 50;

    this.lifetime = 8;
    this.rotation = 0;
    this.pulse = 0;

    // Set color
    const color = CRYSTAL_COLORS[this.type] || 0xffffff;
    this.mesh.material.color.setHex(color);
    this.glow.material.color.setHex(color);

    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;
    this.mesh.visible = true;
    this.shouldRemove = false;
  }

  update(dt, playerPos, gameWidth, gameHeight, magnetMultiplier = 1) {
    if (!this.active || this.shouldRemove) return;

    // Lifetime countdown
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.shouldRemove = true;
      return;
    }

    // Fade in last 2 seconds
    if (this.lifetime < 2) {
      this.mesh.material.opacity = this.lifetime / 2;
      this.glow.material.opacity = (this.lifetime / 2) * 0.3;
    }

    // Gravity
    this.velocity.y -= 200 * dt;

    // Magnet toward player when close (apply multiplier to radius)
    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const effectiveMagnetRadius = this.magnetRadius * magnetMultiplier;

    if (dist < effectiveMagnetRadius && dist > 0) {
      const strength = (1 - dist / effectiveMagnetRadius) * 400;
      this.velocity.x += (dx / dist) * strength * dt;
      this.velocity.y += (dy / dist) * strength * dt;
    }

    // Apply velocity
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // Rotation animation
    this.rotation += dt * 3;
    this.mesh.rotation.z = this.rotation;

    // Pulse glow
    this.pulse += dt * 4;
    this.glow.scale.setScalar(1.5 + Math.sin(this.pulse) * 0.2);

    // Update mesh position
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;

    // Bounds check
    if (this.position.y < -gameHeight / 2 - 50) {
      this.shouldRemove = true;
    }
  }

  isColliding(playerPos) {
    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy) < this.collectRadius;
  }

  deactivate() {
    this.shouldRemove = true;
  }

  onRelease() {
    this.mesh.visible = false;
    this.mesh.material.opacity = 1;
    this.glow.material.opacity = 0.3;
    this.shouldRemove = false;
  }
}
