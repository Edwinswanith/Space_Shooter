export class GrazeSystem {
  constructor() {
    // Graze detection
    this.grazeRadius = 40;    // Pixels (20px from edge of 16px hitbox = 40px from center)
    this.hitRadius = 8;       // Player hitbox radius

    // Tracking
    this.grazedBullets = new Set();

    // Combo
    this.combo = 0;
    this.comboTimer = 0;
    this.comboTimeout = 2;    // Seconds to maintain combo

    // Echo rewards
    this.baseEchoReward = 0.5;

    // Combo multipliers
    this.comboMultipliers = [
      { threshold: 20, multiplier: 3 },
      { threshold: 10, multiplier: 2 },
      { threshold: 5, multiplier: 1.5 },
      { threshold: 1, multiplier: 1 }
    ];
  }

  reset() {
    this.grazedBullets.clear();
    this.combo = 0;
    this.comboTimer = 0;
  }

  update(dt, player, enemyBullets) {
    // Update combo timer
    this.comboTimer += dt;
    if (this.comboTimer > this.comboTimeout) {
      this.combo = 0;
    }

    // Result to return
    const result = {
      grazed: false,
      echoes: 0,
      combo: this.combo,
      grazePositions: []
    };

    // Skip if player is invincible (dashing)
    if (player.isInvincible) {
      return result;
    }

    const playerPos = player.position;

    // Check each enemy bullet
    for (const bullet of enemyBullets) {
      if (!bullet.active || bullet.shouldRemove) continue;

      // Skip already grazed bullets
      const bulletId = `${bullet.position.x.toFixed(0)}_${bullet.position.y.toFixed(0)}_${bullet.velocity.x.toFixed(0)}_${bullet.velocity.y.toFixed(0)}`;
      if (this.grazedBullets.has(bulletId)) continue;

      // Calculate distance
      const dx = playerPos.x - bullet.position.x;
      const dy = playerPos.y - bullet.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if within graze range but not hit range
      if (dist < this.grazeRadius && dist > this.hitRadius) {
        // Register graze
        this.grazedBullets.add(bulletId);
        this.combo++;
        this.comboTimer = 0;

        // Calculate echo reward
        const multiplier = this.getMultiplier();
        const echoes = this.baseEchoReward * multiplier;

        result.grazed = true;
        result.echoes += echoes;
        result.combo = this.combo;
        result.grazePositions.push({ x: bullet.position.x, y: bullet.position.y });
      }
    }

    // Clean up old grazed bullets (remove if bullet is far from player)
    // This prevents memory buildup
    if (this.grazedBullets.size > 100) {
      this.grazedBullets.clear();
    }

    return result;
  }

  getMultiplier() {
    for (const tier of this.comboMultipliers) {
      if (this.combo >= tier.threshold) {
        return tier.multiplier;
      }
    }
    return 1;
  }

  onPlayerHit() {
    this.combo = 0;
    this.comboTimer = 0;
  }
}
