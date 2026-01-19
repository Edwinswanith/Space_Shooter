import { Renderer } from './graphics/Renderer.js';
import { InputManager } from './systems/InputManager.js';
import { ObjectPool } from './systems/ObjectPool.js';
import { Player } from './entities/Player.js';
import { Bullet } from './entities/Bullet.js';
import { Swarmer } from './entities/Swarmer.js';
import { Drifter } from './entities/Drifter.js';
import { Turret } from './entities/Turret.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { VoidSystem } from './systems/VoidSystem.js';
import { GrazeSystem } from './systems/GrazeSystem.js';
import { SpawnSystem } from './systems/SpawnSystem.js';
import { EchoSystem } from './systems/EchoSystem.js';
import { CrystalSystem } from './systems/CrystalSystem.js';
import { MutationSystem } from './systems/MutationSystem.js';
import { LevelUpSystem } from './systems/LevelUpSystem.js';
import { ZoneSystem } from './systems/ZoneSystem.js';
import { LeaderboardSystem } from './systems/LeaderboardSystem.js';
import { HUD } from './ui/HUD.js';
import { LevelUpUI } from './ui/LevelUpUI.js';
import { CheckpointUI } from './ui/CheckpointUI.js';
import { ZoneIntroUI } from './ui/ZoneIntroUI.js';
import { AudioManager } from './audio/AudioManager.js';
import { ParticleSystem } from './graphics/ParticleSystem.js';
import { GAME_MODES, getMode, getEndlessDifficulty, getEndlessEnemyWeights } from './data/ModeConfig.js';
import { getZoneConfig } from './data/ZoneConfig.js';

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
    this.crystalSystem = null;
    this.mutationSystem = null;
    this.levelUpSystem = null;
    this.zoneSystem = null;
    this.leaderboard = null;
    this.levelUpUI = null;
    this.checkpointUI = null;
    this.zoneIntroUI = null;
    this.audio = null;
    this.particleSystem = null;

    // Crystal/upgrade multipliers
    this.crystalMagnetMultiplier = 1;

    // Object pools
    this.playerBulletPool = null;
    this.enemyBulletPool = null;

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.isInMenu = true;
    this.isShowingDeathScreen = false;
    this.lastTime = 0;

    // Current game mode
    this.currentMode = null;

    // Game dimensions (fixed game units)
    this.GAME_WIDTH = 800;
    this.GAME_HEIGHT = 600;

    // Run statistics
    this.runStats = {
      timeSurvived: 0,
      enemiesKilled: 0,
      echoesEarned: 0,
      echoesLost: 0,
      zone: 1
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
    this.particleSystem = new ParticleSystem(this.renderer.scene);
    this.leaderboard = new LeaderboardSystem();

    // Initialize object pools
    this.playerBulletPool = new ObjectPool(
      () => new Bullet('player', this.renderer.scene),
      100
    );

    this.enemyBulletPool = new ObjectPool(
      () => new Bullet('enemy', this.renderer.scene),
      200
    );

    // Initialize spawn system with multi-enemy support
    this.spawnSystem = new SpawnSystem(this.GAME_WIDTH, this.GAME_HEIGHT);

    // Register enemy pools
    this.spawnSystem.registerPool('swarmer', new ObjectPool(
      () => new Swarmer(this.renderer.scene),
      30
    ));
    this.spawnSystem.registerPool('drifter', new ObjectPool(
      () => new Drifter(this.renderer.scene),
      20
    ));
    this.spawnSystem.registerPool('turret', new ObjectPool(
      () => new Turret(this.renderer.scene),
      15
    ));

    // Initialize zone system
    this.zoneSystem = new ZoneSystem();

    // Initialize crystal and mutation systems
    this.crystalSystem = new CrystalSystem(this.renderer.scene, this.GAME_WIDTH, this.GAME_HEIGHT);
    this.mutationSystem = new MutationSystem();
    this.levelUpSystem = new LevelUpSystem();
    this.levelUpUI = new LevelUpUI();
    this.checkpointUI = new CheckpointUI();
    this.zoneIntroUI = new ZoneIntroUI();

    // Initialize player
    this.player = new Player(this.renderer.scene, this.playerBulletPool, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Connect player to mutation system
    this.player.mutations = this.mutationSystem;

    // Initialize audio
    this.audio = new AudioManager();
    const initAudio = () => this.audio.init();
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    // Wire up player audio callbacks
    this.player.onShoot = () => this.audio.playShoot();
    this.player.onDash = () => this.audio.playDash();

    // Initialize HUD
    this.hud = new HUD();
    this.hud.init();

    // Wire up crystal collection callback
    this.crystalSystem.onCollect = (type) => {
      if (this.mutationSystem.addStack(type)) {
        this.audio.playCrystalCollect();
        this.hud.updateMutations(this.mutationSystem.getStacks());
      }
    };

    // Wire up mutation display callback
    this.mutationSystem.onMutationChange = (stacks) => {
      this.hud.updateMutations(stacks);
    };

    // Wire up level-up trigger
    this.levelUpSystem.onLevelUp = (upgrades, level) => {
      this.isPaused = true;
      this.audio.playLevelUp();
      this.levelUpUI.show(upgrades, level);
    };

    // Wire up upgrade selection
    this.levelUpUI.onSelect = (index) => {
      this.levelUpSystem.selectUpgrade(index, this.player, this);
      this.levelUpUI.hide();
      this.isPaused = false;
    };

    // Wire up zone system callbacks
    this.zoneSystem.onZoneComplete = (zone, stats) => {
      this.isPaused = true;
      const checkpointType = this.currentMode?.checkpointType || 'choice';
      this.checkpointUI.show(zone, stats, checkpointType, this.echoSystem);
    };

    this.zoneSystem.onIntroStart = (zone, config) => {
      this.isPaused = true;
      const duration = this.currentMode?.zoneIntroDuration || 3;
      this.zoneIntroUI.show(zone, config, duration);
    };

    this.zoneSystem.onZoneStart = (zone, config) => {
      // Apply zone configuration
      this.spawnSystem.configureZone(config);
      this.spawnSystem.zoneTimer = 0;
      this.voidSystem.setBaseRate(config.voidRate * (this.currentMode?.voidRateMultiplier || 1));
    };

    // Wire up checkpoint completion
    this.checkpointUI.onComplete = (choice) => {
      if (choice === 'bank') {
        this.echoSystem.bank();
      }
      // 'carry' keeps echoes in carried, 'auto' auto-banks in void rush

      // Restore 1 health at checkpoint
      if (this.player.health < this.player.maxHealth) {
        this.player.health++;
      }

      // Advance to next zone
      this.zoneSystem.advanceToNextZone();
    };

    // Wire up zone intro completion
    this.zoneIntroUI.onComplete = () => {
      this.zoneSystem.startZone();
      this.isPaused = false;
    };

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
    // Mode selection buttons
    document.getElementById('btn-campaign')?.addEventListener('click', () => {
      this.startRun('campaign');
    });

    document.getElementById('btn-voidrush')?.addEventListener('click', () => {
      this.startRun('voidrush');
    });

    document.getElementById('btn-endless')?.addEventListener('click', () => {
      this.startRun('endless');
    });
  }

  setupDeathScreenEvents() {
    const continueFromDeath = () => {
      if (this.isShowingDeathScreen) {
        this.hideDeathScreen();
      }
    };

    document.addEventListener('keydown', continueFromDeath);
    document.getElementById('death-overlay').addEventListener('click', continueFromDeath);
  }

  startRun(modeId = 'campaign') {
    // Set game mode
    this.currentMode = getMode(modeId);
    this.currentModeId = modeId;

    // Hide menu
    document.getElementById('menu-overlay').classList.add('hidden');
    this.isInMenu = false;
    this.isRunning = true;

    // Reset game state
    this.resetRun();

    // Apply mode configuration
    this.applyModeConfig();

    // Update HUD with mode indicator
    this.hud.setMode(modeId);

    // Start first zone (skip intro for first zone)
    const zoneConfig = this.zoneSystem.getConfig();
    this.spawnSystem.configureZone(zoneConfig);
    this.hud.setZoneInfo(zoneConfig.id, zoneConfig.name, this.currentMode.zoneDuration || 90);
    this.zoneSystem.skipIntro();
  }

  applyModeConfig() {
    const mode = this.currentMode;

    // Zone system
    this.zoneSystem.setModeConfig(mode);

    // Level-up system
    this.levelUpSystem.levelUpInterval = mode.levelUpInterval || 45;

    // Spawn system rate multiplier
    this.spawnSystem.setSpawnRateMultiplier(mode.spawnRateMultiplier || 1);

    // Void system multipliers
    this.voidSystem.setPushbackMultiplier?.(mode.pushbackMultiplier || 1);

    // Checkpoint UI duration (for void rush auto-dismiss)
    if (mode.checkpointDuration) {
      this.checkpointUI.setAutoDuration(mode.checkpointDuration);
    }
  }

  resetRun() {
    // Reset player
    this.player.reset();

    // Clear all pools
    this.playerBulletPool.releaseAll();
    this.enemyBulletPool.releaseAll();
    this.spawnSystem.releaseAll();

    // Reset systems
    this.voidSystem.reset();
    this.grazeSystem.reset();
    this.spawnSystem.reset();
    this.zoneSystem.reset();
    this.echoSystem.resetRun();
    this.crystalSystem.reset();
    this.mutationSystem.reset();
    this.levelUpSystem.reset();
    this.particleSystem.clear();

    // Reset upgrade multipliers
    this.crystalMagnetMultiplier = 1;

    // Reset run statistics
    this.runStats = {
      timeSurvived: 0,
      enemiesKilled: 0,
      echoesEarned: 0,
      echoesLost: 0,
      zone: 1
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

    // Update zone system (handles zone transitions for campaign/voidrush)
    if (this.currentMode?.hasZones) {
      this.zoneSystem.update(dt);
      this.hud.setZoneProgress(this.zoneSystem.getProgress());

      // Update zone info display
      const zoneConfig = this.zoneSystem.getConfig();
      const timeRemaining = this.zoneSystem.getTimeRemaining();
      this.hud.setZoneInfo(zoneConfig.id, zoneConfig.name, timeRemaining);

      this.runStats.zone = this.zoneSystem.currentZone;
    } else {
      // Endless mode: continuous difficulty scaling
      this.updateEndlessDifficulty();
    }

    // Update input
    this.input.update();

    // Update player
    this.player.update(dt, this.input);

    // Update player bullets
    this.playerBulletPool.update(dt, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Update homing on player bullets
    const allEnemies = this.spawnSystem.getAllActive();
    this.playerBulletPool.forEach(bullet => {
      bullet.updateHoming(dt, allEnemies);
    });

    // Update enemy bullets
    this.enemyBulletPool.update(dt, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Update spawn system
    this.spawnSystem.update(dt);

    // Update all enemies
    this.spawnSystem.updatePools(dt, this.player.position, this.enemyBulletPool, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Update void system
    this.voidSystem.update(dt);

    // Update crystal system (with magnet multiplier)
    this.crystalSystem.update(dt, this.player.position, this.crystalMagnetMultiplier);

    // Update level-up system
    this.levelUpSystem.update(dt);

    // Update particle system
    this.particleSystem.update(dt);

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
      this.audio.playGraze();

      // Spawn spark at each graze position
      for (const pos of grazeResult.grazePositions) {
        this.particleSystem.spark(pos.x, pos.y, 0x00ffff, 4);
      }
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

  updateEndlessDifficulty() {
    // Continuous difficulty scaling for endless mode
    const difficulty = getEndlessDifficulty(this.runStats.timeSurvived);
    const weights = getEndlessEnemyWeights(this.runStats.timeSurvived);

    this.spawnSystem.enemyTypes = difficulty.enemyTypes;
    this.spawnSystem.enemyWeights = weights;
    this.spawnSystem.eliteChance = difficulty.eliteChance;
    this.spawnSystem.spawnScaling[0].interval = difficulty.spawnInterval;
    this.voidSystem.setBaseRate(difficulty.voidRate);
  }

  checkCollisions() {
    // Get all active enemies from all pools
    const allEnemies = this.spawnSystem.getAllActive();

    // Player bullets vs enemies
    this.collisionSystem.checkBulletsVsEnemies(
      this.playerBulletPool.getActive(),
      allEnemies,
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

    // Track kill in zone stats
    if (this.zoneSystem) {
      this.zoneSystem.recordKill(enemy.echoValue);
    }

    // Add echoes
    this.echoSystem.addEchoes(enemy.echoValue);

    // Push back void
    this.voidSystem.onKill(enemy.isElite);

    // Play death sound
    this.audio.playEnemyDeath();

    // Spawn explosion particles
    const color = enemy.isElite ? 0xffd700 : 0xff3333;
    this.particleSystem.explosion(enemy.position.x, enemy.position.y, color, enemy.isElite ? 20 : 12);

    // Spawn crystal on elite kill
    if (enemy.isElite) {
      this.crystalSystem.spawn(enemy.position.x, enemy.position.y);
    }

    // Remove enemy
    enemy.deactivate();
  }

  onPlayerHit() {
    this.player.takeDamage();
    this.grazeSystem.onPlayerHit();
    this.hud.onDamage();
    this.audio.playPlayerHit();

    // Screen shake
    this.renderer.shake(10);

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
    if (this.runStats.zone > this.bestZone) {
      this.bestZone = this.runStats.zone;
      localStorage.setItem('voidrunner_bestzone', this.bestZone.toString());
    }

    // Add to leaderboard
    const stats = {
      zone: this.runStats.zone,
      time: Math.floor(this.runStats.timeSurvived),
      kills: this.runStats.enemiesKilled,
      echoes: this.runStats.echoesEarned
    };
    const rank = this.leaderboard.addEntry(this.currentMode?.id || 'campaign', stats);

    // Show death screen
    this.showDeathScreen(cause, rank);
  }

  showDeathScreen(cause, rank = 0) {
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
