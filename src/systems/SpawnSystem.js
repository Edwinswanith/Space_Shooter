export class SpawnSystem {
  constructor(enemyPool, gameWidth, gameHeight) {
    this.enemyPool = enemyPool;
    this.GAME_WIDTH = gameWidth;
    this.GAME_HEIGHT = gameHeight;

    // Spawn timing
    this.spawnTimer = 0;
    this.zoneTimer = 0;  // Track time in zone for scaling

    // Spawn rate scaling over time - BALANCED for more action
    // Time thresholds and spawn intervals
    this.spawnScaling = [
      { time: 0, interval: 1.8 },   // 0-20s: 1 enemy every 1.8 seconds (was 2.5)
      { time: 20, interval: 1.4 },  // 20-45s: 1 enemy every 1.4 seconds
      { time: 45, interval: 1.0 },  // 45-70s: 1 enemy every 1.0 seconds
      { time: 70, interval: 0.8 },  // 70-90s: 1 enemy every 0.8 seconds
    ];

    // Current spawn interval (calculated from scaling)
    this.spawnInterval = 1.8;

    // Spawn configuration
    this.eliteChance = 0;       // Percentage (0-1)

    // Total spawned (for tracking)
    this.totalSpawned = 0;
  }

  reset() {
    this.spawnTimer = 0;
    this.zoneTimer = 0;
    this.totalSpawned = 0;
    this.spawnInterval = 1.8;
    this.eliteChance = 0;
  }

  configure(spawnInterval, eliteChance) {
    // This can override the base interval if needed
    this.spawnScaling[0].interval = spawnInterval;
    this.eliteChance = eliteChance;
  }

  update(dt) {
    this.spawnTimer += dt;
    this.zoneTimer += dt;

    // FIX 5: Update spawn interval based on zone time
    this.updateSpawnRate();

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawn();
    }
  }

  // FIX 5: Calculate spawn rate based on time in zone
  updateSpawnRate() {
    // Find the appropriate spawn interval for current zone time
    let interval = this.spawnScaling[0].interval;

    for (let i = this.spawnScaling.length - 1; i >= 0; i--) {
      if (this.zoneTimer >= this.spawnScaling[i].time) {
        interval = this.spawnScaling[i].interval;
        break;
      }
    }

    this.spawnInterval = interval;
  }

  spawn() {
    // Calculate spawn position
    const margin = 100;
    const x = (Math.random() - 0.5) * (this.GAME_WIDTH - margin);
    const y = this.GAME_HEIGHT / 2 + 50; // Above screen

    // Determine if elite (only after 30 seconds to give player time to learn)
    const isElite = this.zoneTimer > 30 && Math.random() < this.eliteChance;

    // Spawn enemy
    const enemy = this.enemyPool.acquire();
    enemy.init({
      x: x,
      y: y,
      isElite: isElite
    });

    this.totalSpawned++;
  }

  // Spawn at specific position (for boss spawns, etc.)
  spawnAt(x, y, isElite = false) {
    const enemy = this.enemyPool.acquire();
    enemy.init({
      x: x,
      y: y,
      isElite: isElite
    });

    this.totalSpawned++;
    return enemy;
  }

  // Set spawn rate directly (enemies per second)
  setSpawnRate(rate) {
    this.spawnInterval = 1 / rate;
  }

  // Set custom spawn scaling for different zones
  setSpawnScaling(scaling) {
    this.spawnScaling = scaling;
  }

  getActiveCount() {
    return this.enemyPool.getActiveCount();
  }

  getZoneTime() {
    return this.zoneTimer;
  }

  getCurrentSpawnInterval() {
    return this.spawnInterval;
  }
}
