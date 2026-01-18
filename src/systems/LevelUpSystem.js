import { getRandomUpgrades, UPGRADES } from '../data/UpgradeData.js';

export class LevelUpSystem {
  constructor() {
    this.levelUpInterval = 45; // seconds
    this.timeSinceLastLevel = 0;
    this.currentLevel = 0;
    this.pendingLevelUp = false;

    this.selectedUpgrades = [];
    this.appliedUpgradeCounts = {}; // Track stacks per upgrade id

    // Callbacks
    this.onLevelUp = null;       // (upgrades, level) => show UI
    this.onUpgradeSelected = null; // (upgrade) => resume game
  }

  update(dt) {
    if (this.pendingLevelUp) return; // Paused during selection

    this.timeSinceLastLevel += dt;

    if (this.timeSinceLastLevel >= this.levelUpInterval) {
      this.triggerLevelUp();
    }
  }

  triggerLevelUp() {
    this.currentLevel++;
    this.timeSinceLastLevel = 0;
    this.pendingLevelUp = true;

    // Get excluded upgrades (those at max stacks)
    const excludeIds = [];
    for (const [id, count] of Object.entries(this.appliedUpgradeCounts)) {
      const upgrade = UPGRADES.find(u => u.id === id);
      if (upgrade && upgrade.maxStacks && count >= upgrade.maxStacks) {
        excludeIds.push(id);
      }
    }

    // Get 3 random upgrades
    this.selectedUpgrades = getRandomUpgrades(3, excludeIds);

    if (this.onLevelUp) {
      this.onLevelUp(this.selectedUpgrades, this.currentLevel);
    }
  }

  selectUpgrade(index, player, game) {
    const upgrade = this.selectedUpgrades[index];
    if (!upgrade) return;

    // Apply upgrade
    upgrade.apply(player, game);

    // Track for max stacks
    this.appliedUpgradeCounts[upgrade.id] =
      (this.appliedUpgradeCounts[upgrade.id] || 0) + 1;

    this.pendingLevelUp = false;

    if (this.onUpgradeSelected) {
      this.onUpgradeSelected(upgrade);
    }
  }

  reset() {
    this.timeSinceLastLevel = 0;
    this.currentLevel = 0;
    this.pendingLevelUp = false;
    this.selectedUpgrades = [];
    this.appliedUpgradeCounts = {};
  }
}
