import { Renderer } from './graphics/Renderer.js';
import { InputManager } from './systems/InputManager.js';
import { ObjectPool } from './systems/ObjectPool.js';
import { Player } from './entities/Player.js';
import { Bullet } from './entities/Bullet.js';
import { Swarmer } from './entities/Swarmer.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { VoidSystem } from './systems/VoidSystem.js';
import { GrazeSystem } from './systems/GrazeSystem.js';
import { SpawnSystem } from './systems/SpawnSystem.js';
import { EchoSystem } from './systems/EchoSystem.js';
import { HUD } from './ui/HUD.js';

export class Game {
  constructor() {
    this.renderer = null;
    this.input = null;
    this.player = null;
    this.hud = null;

    // Systems
    this.collisionSystem = null;
    this.voidSystem = null;
    this.grazeSystem = null;
    this.spawnSystem = null;
    this.echoSystem = null;

    // Object pools
    this.playerBulletPool = null;
    this.enemyBulletPool = null;
    this.enemyPool = null;

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.isInMenu = true;
    this.isShowingDeathScreen = false;
    this.lastTime = 0;

    // Game dimensions (fixed game units)
    this.GAME_WIDTH = 800;
    this.GAME_HEIGHT = 600;

    // Run statistics
    this.runStats = {
      timeSurvived: 0,
      enemiesKilled: 0,
      echoesEarned: 0,
      echoesLost: 0,
      zoneReached: 1
    };

    // Persistent stats
    this.bestZone = parseInt(localStorage.getItem('voidrunner_bestzone')) || 0;
  }

  init() {
    // Initialize renderer
    this.renderer = new Renderer(this.GAME_WIDTH, this.GAME_HEIGHT);
    this.renderer.init(document.getElementById('game-container'));

    // Initialize input manager
    this.input = new InputManager(this.renderer.canvas, this.renderer.camera, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Initialize systems
    this.echoSystem = new EchoSystem();
    this.voidSystem = new VoidSystem(this.GAME_HEIGHT, this.renderer.scene);
    this.grazeSystem = new GrazeSystem();
    this.collisionSystem = new CollisionSystem();

    // Initialize object pools
    this.playerBulletPool = new ObjectPool(
      () => new Bullet('player', this.renderer.scene),
      100
    );

    this.enemyBulletPool = new ObjectPool(
      () => new Bullet('enemy', this.renderer.scene),
      200
    );

    this.enemyPool = new ObjectPool(
      () => new Swarmer(this.renderer.scene),
      50
    );

    // Initialize spawn system
    this.spawnSystem = new SpawnSystem(this.enemyPool, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Initialize player
    this.player = new Player(this.renderer.scene, this.playerBulletPool, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Initialize HUD
    this.hud = new HUD();
    this.hud.init();

    // Setup menu event listeners
    this.setupMenuEvents();

    // Setup death screen events
    this.setupDeathScreenEvents();

    // Update menu stats on load
    this.updateMenuStats();

    // Start game loop
    this.lastTime = performance.now();
    this.gameLoop();
  }

  setupMenuEvents() {
    const escapeBtn = document.getElementById('btn-escape');

    escapeBtn.addEventListener('click', () => {
      this.startRun();
    });
  }

  setupDeathScreenEvents() {
    // Continue from death screen on any key press
    const continueFromDeath = () => {
      if (this.isShowingDeathScreen) {
        this.hideDeathScreen();
      }
    };

    document.addEventListener('keydown', continueFromDeath);
    document.getElementById('death-overlay').addEventListener('click', continueFromDeath);
  }

  startRun() {
    // Hide menu
    document.getElementById('menu-overlay').classList.add('hidden');
    this.isInMenu = false;
    this.isRunning = true;

    // Reset game state
    this.resetRun();
  }

  resetRun() {
    // Reset player
    this.player.reset();

    // Clear all pools
    this.playerBulletPool.releaseAll();
    this.enemyBulletPool.releaseAll();
    this.enemyPool.releaseAll();

    // Reset systems
    this.voidSystem.reset();
    this.grazeSystem.reset();
    this.spawnSystem.reset();
    this.echoSystem.resetRun();

    // Reset run statistics
    this.runStats = {
      timeSurvived: 0,
      enemiesKilled: 0,
      echoesEarned: 0,
      echoesLost: 0,
      zoneReached: 1
    };

    // Reset HUD
    this.hud.reset();
  }

  gameLoop(currentTime = 0) {
    requestAnimationFrame((t) => this.gameLoop(t));

    // Calculate delta time (cap at 50ms to prevent huge jumps)
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    if (this.isRunning && !this.isPaused) {
      this.update(dt);
    }

    this.render();
  }

  update(dt) {
    // Track time survived
    this.runStats.timeSurvived += dt;

    // Update zone progress (90 seconds per zone)
    const zoneProgress = (this.runStats.timeSurvived % 90) / 90;
    this.hud.setZoneProgress(zoneProgress);

    // Check zone advancement
    const currentZone = Math.floor(this.runStats.timeSurvived / 90) + 1;
    if (currentZone > this.runStats.zoneReached) {
      this.runStats.zoneReached = currentZone;
    }

    // Update input
    this.input.update();

    // Update player
    this.player.update(dt, this.input);

    // Update player bullets
    this.playerBulletPool.update(dt, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Update enemy bullets
    this.enemyBulletPool.update(dt, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Update spawn system
    this.spawnSystem.update(dt);

    // Update enemies
    this.enemyPool.forEach((enemy) => {
      enemy.update(dt, this.player.position, this.enemyBulletPool, this.GAME_WIDTH, this.GAME_HEIGHT);
    });

    // Update void system
    this.voidSystem.update(dt);

    // Update graze system
    const grazeResult = this.grazeSystem.update(
      dt,
      this.player,
      this.enemyBulletPool.getActive()
    );

    if (grazeResult.grazed) {
      this.echoSystem.addEchoes(grazeResult.echoes);
      this.voidSystem.onGraze();
      this.hud.onGraze(grazeResult.combo);
    }

    // Check collisions
    this.checkCollisions();

    // Check void death
    if (this.voidSystem.isPlayerInVoid(this.player.position.y)) {
      this.onPlayerDeath('void');
    }

    // Update HUD
    this.hud.update(
      this.player.health,
      this.echoSystem.carried,
      this.voidSystem.getPercentage(),
      this.grazeSystem.combo,
      this.player.dashCooldown,
      this.player.dashMaxCooldown,
      this.voidSystem.getState()
    );
  }

  checkCollisions() {
    // Player bullets vs enemies
    this.collisionSystem.checkBulletsVsEnemies(
      this.playerBulletPool.getActive(),
      this.enemyPool.getActive(),
      (bullet, enemy) => {
        enemy.takeDamage(bullet.damage);
        bullet.deactivate();

        if (enemy.health <= 0) {
          this.onEnemyKilled(enemy);
        }
      }
    );

    // Enemy bullets vs player
    if (!this.player.isInvincible) {
      this.collisionSystem.checkBulletsVsPlayer(
        this.enemyBulletPool.getActive(),
        this.player,
        (bullet) => {
          bullet.deactivate();
          this.onPlayerHit();
        }
      );
    }
  }

  onEnemyKilled(enemy) {
    // Track kill
    this.runStats.enemiesKilled++;
    this.runStats.echoesEarned += enemy.echoValue;

    // Add echoes
    this.echoSystem.addEchoes(enemy.echoValue);

    // Push back void
    this.voidSystem.onKill(enemy.isElite);

    // Spawn particles (TODO)
    // this.particleSystem.explosion(enemy.position.x, enemy.position.y);

    // Remove enemy
    enemy.deactivate();
  }

  onPlayerHit() {
    this.player.takeDamage();
    this.grazeSystem.onPlayerHit();
    this.hud.onDamage();

    // Screen flash
    const flash = document.getElementById('screen-flash');
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 100);

    if (this.player.health <= 0) {
      this.onPlayerDeath('damage');
    }
  }

  onPlayerDeath(cause) {
    this.isRunning = false;

    // Apply death penalty
    const lostEchoes = this.echoSystem.applyDeathPenalty();
    this.runStats.echoesLost = lostEchoes;

    // Update best zone
    if (this.runStats.zoneReached > this.bestZone) {
      this.bestZone = this.runStats.zoneReached;
      localStorage.setItem('voidrunner_bestzone', this.bestZone.toString());
    }

    // Show death screen
    this.showDeathScreen(cause);
  }

  showDeathScreen(cause) {
    this.isShowingDeathScreen = true;

    const overlay = document.getElementById('death-overlay');
    const title = overlay.querySelector('.death-title');
    const causeEl = document.getElementById('death-cause');

    // Set death message based on cause
    if (cause === 'void') {
      title.textContent = 'VOID CONSUMED';
      causeEl.textContent = 'Swallowed by the rising void';
    } else {
      title.textContent = 'SHIELDS DEPLETED';
      causeEl.textContent = 'Destroyed by enemy fire';
    }

    // Update stats
    document.getElementById('death-time').textContent =
      Math.floor(this.runStats.timeSurvived) + 's';
    document.getElementById('death-kills').textContent =
      this.runStats.enemiesKilled;
    document.getElementById('death-echoes').textContent =
      this.runStats.echoesEarned;
    document.getElementById('death-lost').textContent =
      this.runStats.echoesLost;

    // Show overlay
    overlay.classList.add('visible');
  }

  hideDeathScreen() {
    this.isShowingDeathScreen = false;

    document.getElementById('death-overlay').classList.remove('visible');
    document.getElementById('menu-overlay').classList.remove('hidden');
    this.isInMenu = true;
    this.updateMenuStats();
  }

  updateMenuStats() {
    document.getElementById('menu-echoes').textContent = this.echoSystem.banked;
    document.getElementById('menu-best-zone').textContent = this.bestZone;
  }

  render() {
    this.renderer.render();
  }
}
