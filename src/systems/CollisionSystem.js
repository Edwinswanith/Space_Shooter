export class CollisionSystem {
  constructor() {
    // Nothing to initialize
  }

  // AABB collision check
  checkAABB(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // Check bullets against enemies (with pierce support)
  checkBulletsVsEnemies(bullets, enemies, onHit) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      if (!bullet.active || bullet.shouldRemove) continue;

      const bulletBox = bullet.getHitbox();

      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (!enemy.active || enemy.shouldRemove) continue;

        // Skip if already hit (pierce)
        if (bullet.hitEnemies && bullet.hitEnemies.has(enemy)) continue;

        const enemyBox = enemy.getHitbox();

        if (this.checkAABB(bulletBox, enemyBox)) {
          // Track hit for pierce
          if (bullet.hitEnemies) {
            bullet.hitEnemies.add(enemy);
          }

          onHit(bullet, enemy);

          // Pierce logic: only break if no pierce remaining
          if (!bullet.pierceRemaining || bullet.pierceRemaining <= 0) {
            break; // Normal behavior - stop on first hit
          }
          // else continue checking other enemies (pierce through)
          bullet.pierceRemaining--;
        }
      }
    }
  }

  // Check bullets against player
  checkBulletsVsPlayer(bullets, player, onHit) {
    const playerBox = player.getHitbox();

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      if (!bullet.active || bullet.shouldRemove) continue;

      const bulletBox = bullet.getHitbox();

      if (this.checkAABB(bulletBox, playerBox)) {
        onHit(bullet);
        return; // Player can only be hit once per frame
      }
    }
  }

  // Check distance (for graze detection)
  checkDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
