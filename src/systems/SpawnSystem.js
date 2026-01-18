export class SpawnSystem {
  constructor(gameWidth, gameHeight) {
    this.GAME_WIDTH = gameWidth;
    this.GAME_HEIGHT = gameHeight;

    // Enemy pools by type
    this.enemyPools = {};

    // Spawn timing
    this.spawnTimer = 0;
    this.zoneTimer = 0;

    // Spawn rate scaling over time
    this.spawnScaling = [
      { time: 0, interval: 1.8 },
      { time: 20, interval: 1.4 },
      { time: 45, interval: 1.0 },
      { time: 70, interval: 0.8 },
    ];

    // Current spawn interval
    this.spawnInterval = 1.8;
    this.spawnRateMultiplier = 1.0;

    // Enemy type configuration
    this.enemyTypes = ['swarmer'];
    this.enemyWeights = { swarmer: 1.0 };

    // Elite configuration
    this.eliteChance = 0;

    // Total spawned
    this.totalSpawned = 0;
  }

  // Register an enemy pool for a type
  registerPool(type, pool) {
    this.enemyPools[type] = pool;
  }

  reset() {
    this.spawnTimer = 0;
    this.zoneTimer = 0;
    this.totalSpawned = 0;
    this.spawnInterval = 1.8;
    this.eliteChance = 0;
    this.enemyTypes = ['swarmer'];
    this.enemyWeights = { swarmer: 1.0 };
    this.spawnRateMultiplier = 1.0;
  }

  // Configure for a zone
  configureZone(config) {
    if (config.enemies) {
      this.enemyTypes = config.enemies;
    }
    if (config.enemyWeights) {
      this.enemyWeights = config.enemyWeights;
    }
    if (config.eliteChance !== undefined) {
      this.eliteChance = config.eliteChance;
    }
    if (config.spawnInterval !== undefined) {
      this.spawnScaling[0].interval = config.spawnInterval;
    }
  }

  // Set spawn rate multiplier (for different modes)
  setSpawnRateMultiplier(multiplier) {
    this.spawnRateMultiplier = multiplier;
  }

  configure(spawnInterval, eliteChance) {
    this.spawnScaling[0].interval = spawnInterval;
    this.eliteChance = eliteChance;
  }

  update(dt) {
    this.spawnTimer += dt;
    this.zoneTimer += dt;

    this.updateSpawnRate();

    const effectiveInterval = this.spawnInterval / this.spawnRateMultiplier;

    if (this.spawnTimer >= effectiveInterval) {
      this.spawnTimer = 0;
      this.spawn();
    }
  }

  updateSpawnRate() {
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
    // Select enemy type based on weights
    const type = this.selectEnemyType();
    const pool = this.enemyPools[type];

    if (!pool) {
      console.warn(`No pool registered for enemy type: ${type}`);
      return;
    }

    // Calculate spawn position
    let x, margin;

    // Turrets spawn more centered
    if (type === 'turret') {
      margin = 150;
      x = (Math.random() - 0.5) * (this.GAME_WIDTH - margin * 2);
    } else {
      margin = 100;
      x = (Math.random() - 0.5) * (this.GAME_WIDTH - margin);
    }

    const y = this.GAME_HEIGHT / 2 + 50;

    // Determine if elite (only after 30 seconds)
    const isElite = this.zoneTimer > 30 && Math.random() < this.eliteChance;

    // Spawn enemy
    const enemy = pool.acquire();
    if (enemy) {
      enemy.init({
        x: x,
        y: y,
        isElite: isElite
      });
      this.totalSpawned++;
    }
  }

  selectEnemyType() {
    // If only one type, return it
    if (this.enemyTypes.length === 1) {
      return this.enemyTypes[0];
    }

    // Weighted random selection
    let totalWeight = 0;
    for (const type of this.enemyTypes) {
      totalWeight += this.enemyWeights[type] || 0;
    }

    if (totalWeight === 0) {
      return this.enemyTypes[0];
    }

    let random = Math.random() * totalWeight;
    for (const type of this.enemyTypes) {
      const weight = this.enemyWeights[type] || 0;
      random -= weight;
      if (random <= 0) {
        return type;
      }
    }

    return this.enemyTypes[0];
  }

  spawnAt(x, y, type = 'swarmer', isElite = false) {
    const pool = this.enemyPools[type];
    if (!pool) return null;

    const enemy = pool.acquire();
    if (enemy) {
      enemy.init({
        x: x,
        y: y,
        isElite: isElite
      });
      this.totalSpawned++;
    }
    return enemy;
  }

  setSpawnRate(rate) {
    this.spawnInterval = 1 / rate;
  }

  setSpawnScaling(scaling) {
    this.spawnScaling = scaling;
  }

  getActiveCount() {
    let count = 0;
    for (const type in this.enemyPools) {
      count += this.enemyPools[type].getActiveCount();
    }
    return count;
  }

  getAllActive() {
    const enemies = [];
    for (const type in this.enemyPools) {
      enemies.push(...this.enemyPools[type].getActive());
    }
    return enemies;
  }

  getZoneTime() {
    return this.zoneTimer;
  }

  getCurrentSpawnInterval() {
    return this.spawnInterval / this.spawnRateMultiplier;
  }

  // Update all enemy pools
  updatePools(dt, playerPos, bulletPool, gameWidth, gameHeight) {
    for (const type in this.enemyPools) {
      this.enemyPools[type].forEach((enemy) => {
        enemy.update(dt, playerPos, bulletPool, gameWidth, gameHeight);
      });
    }
  }

  // Release all enemies from all pools
  releaseAll() {
    for (const type in this.enemyPools) {
      this.enemyPools[type].releaseAll();
    }
  }
}
