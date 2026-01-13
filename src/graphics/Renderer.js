import * as THREE from 'three';

export class Renderer {
  constructor(gameWidth, gameHeight) {
    this.GAME_WIDTH = gameWidth;
    this.GAME_HEIGHT = gameHeight;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.canvas = null;
  }

  init(container) {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a12);

    // Create orthographic camera for 2D gameplay
    // Camera bounds match game units, centered at origin
    this.camera = new THREE.OrthographicCamera(
      -this.GAME_WIDTH / 2,   // left
      this.GAME_WIDTH / 2,    // right
      this.GAME_HEIGHT / 2,   // top
      -this.GAME_HEIGHT / 2,  // bottom
      0.1,                     // near
      1000                     // far
    );
    this.camera.position.z = 10;

    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.updateSize();

    // Add canvas to container
    this.canvas = this.renderer.domElement;
    container.insertBefore(this.canvas, container.firstChild);

    // Handle window resize
    window.addEventListener('resize', () => this.updateSize());

    // Add starfield background
    this.createStarfield();

    // Add void visual
    this.createVoidVisual();
  }

  updateSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Calculate aspect ratio to fit game in window while maintaining proportions
    const gameAspect = this.GAME_WIDTH / this.GAME_HEIGHT;
    const windowAspect = width / height;

    let viewWidth, viewHeight;

    if (windowAspect > gameAspect) {
      // Window is wider than game - fit to height
      viewHeight = this.GAME_HEIGHT;
      viewWidth = this.GAME_HEIGHT * windowAspect;
    } else {
      // Window is taller than game - fit to width
      viewWidth = this.GAME_WIDTH;
      viewHeight = this.GAME_WIDTH / windowAspect;
    }

    // Update camera
    this.camera.left = -viewWidth / 2;
    this.camera.right = viewWidth / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(width, height);
  }

  createStarfield() {
    const starCount = 200;
    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * this.GAME_WIDTH * 1.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * this.GAME_HEIGHT * 1.5;
      positions[i * 3 + 2] = -5; // Behind everything
      sizes[i] = Math.random() * 2 + 0.5;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.6
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.name = 'starfield';
    this.scene.add(stars);
  }

  createVoidVisual() {
    // Create void plane that will be positioned based on void height
    const voidGeometry = new THREE.PlaneGeometry(this.GAME_WIDTH * 2, this.GAME_HEIGHT);
    const voidMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a0080,
      transparent: true,
      opacity: 0.8
    });

    const voidPlane = new THREE.Mesh(voidGeometry, voidMaterial);
    voidPlane.name = 'voidPlane';
    voidPlane.position.z = -1;
    voidPlane.position.y = -this.GAME_HEIGHT; // Start below screen
    this.scene.add(voidPlane);

    // Create void edge glow
    const edgeGeometry = new THREE.PlaneGeometry(this.GAME_WIDTH * 2, 20);
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b00ff,
      transparent: true,
      opacity: 0.6
    });

    const voidEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    voidEdge.name = 'voidEdge';
    voidEdge.position.z = -0.5;
    voidEdge.position.y = -this.GAME_HEIGHT / 2; // Start at bottom
    this.scene.add(voidEdge);
  }

  updateVoidVisual(voidHeight) {
    // voidHeight is 0-100 percentage
    const voidY = -this.GAME_HEIGHT / 2 + (voidHeight / 100) * this.GAME_HEIGHT;

    const voidPlane = this.scene.getObjectByName('voidPlane');
    const voidEdge = this.scene.getObjectByName('voidEdge');

    if (voidPlane) {
      voidPlane.position.y = voidY - this.GAME_HEIGHT / 2;
    }

    if (voidEdge) {
      voidEdge.position.y = voidY;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  // Screen shake effect
  shake(intensity) {
    const originalX = 0;
    const originalY = 0;

    const shakeAnimation = () => {
      intensity *= 0.9;

      if (intensity > 0.1) {
        this.camera.position.x = originalX + (Math.random() - 0.5) * intensity;
        this.camera.position.y = originalY + (Math.random() - 0.5) * intensity;
        requestAnimationFrame(shakeAnimation);
      } else {
        this.camera.position.x = originalX;
        this.camera.position.y = originalY;
      }
    };

    shakeAnimation();
  }
}
