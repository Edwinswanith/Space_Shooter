import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particleGroups = [];
  }

  explosion(x, y, color = 0xff3333, count = 12) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 100 + Math.random() * 150;

      const geometry = new THREE.CircleGeometry(3, 6);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0.5);
      this.scene.add(mesh);

      particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 2 + Math.random()
      });
    }
    this.particleGroups.push(particles);
  }

  spark(x, y, color = 0x00ffff, count = 4) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;

      const geometry = new THREE.CircleGeometry(2, 4);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0.5);
      this.scene.add(mesh);

      particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 4
      });
    }
    this.particleGroups.push(particles);
  }

  update(dt) {
    for (let g = this.particleGroups.length - 1; g >= 0; g--) {
      const particles = this.particleGroups[g];
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.life -= p.decay * dt;
        p.mesh.material.opacity = Math.max(0, p.life);
        p.mesh.scale.setScalar(0.5 + p.life * 0.5);

        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
          particles.splice(i, 1);
        }
      }
      if (particles.length === 0) {
        this.particleGroups.splice(g, 1);
      }
    }
  }

  clear() {
    for (const particles of this.particleGroups) {
      for (const p of particles) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      }
    }
    this.particleGroups = [];
  }
}
