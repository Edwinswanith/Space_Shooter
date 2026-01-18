import { ObjectPool } from './ObjectPool.js';
import { Crystal } from '../entities/Crystal.js';

const CRYSTAL_TYPES = ['fury', 'scatter', 'pierce', 'seeker'];

export class CrystalSystem {
  constructor(scene, gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    this.crystalPool = new ObjectPool(
      () => new Crystal(scene),
      20
    );

    // Callback fired on collection
    this.onCollect = null;
  }

  spawn(x, y, type = null) {
    const crystal = this.crystalPool.acquire();
    crystal.init({
      x,
      y,
      type: type || CRYSTAL_TYPES[Math.floor(Math.random() * CRYSTAL_TYPES.length)]
    });
  }

  update(dt, playerPos, magnetMultiplier = 1) {
    // Update all crystals
    this.crystalPool.forEach(crystal => {
      crystal.update(dt, playerPos, this.gameWidth, this.gameHeight, magnetMultiplier);
    });

    // Release crystals marked for removal
    this.crystalPool.releaseInactive();

    // Check collection
    this.crystalPool.forEach(crystal => {
      if (crystal.isColliding(playerPos)) {
        if (this.onCollect) {
          this.onCollect(crystal.type);
        }
        crystal.deactivate();
      }
    });
  }

  clear() {
    this.crystalPool.releaseAll();
  }

  reset() {
    this.clear();
  }
}
