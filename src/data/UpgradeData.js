export const UPGRADES = [
  {
    id: 'damage_up',
    name: 'KINETIC BOOST',
    description: '+25% bullet damage',
    icon: '⚡',
    maxStacks: null,
    apply: (player, game) => {
      player.damageMultiplier = (player.damageMultiplier || 1) + 0.25;
    }
  },
  {
    id: 'fire_rate_up',
    name: 'RAPID CYCLE',
    description: '+15% fire rate',
    icon: '🔥',
    maxStacks: null,
    apply: (player, game) => {
      player.fireInterval *= 0.85;
    }
  },
  {
    id: 'health_up',
    name: 'SHIELD CELL',
    description: '+1 max shield',
    icon: '🛡️',
    maxStacks: 2,
    apply: (player, game) => {
      player.maxHealth++;
      player.health++;
    }
  },
  {
    id: 'void_resist',
    name: 'VOID ANCHOR',
    description: 'Void rises 20% slower',
    icon: '⚓',
    maxStacks: 3,
    apply: (player, game) => {
      game.voidSystem.baseRiseRate *= 0.8;
    }
  },
  {
    id: 'graze_range',
    name: 'PROXIMITY FIELD',
    description: '+30% graze radius',
    icon: '✨',
    maxStacks: 3,
    apply: (player, game) => {
      game.grazeSystem.grazeRadius *= 1.3;
    }
  },
  {
    id: 'dash_cooldown',
    name: 'PHASE CAPACITOR',
    description: '-25% dash cooldown',
    icon: '💨',
    maxStacks: 3,
    apply: (player, game) => {
      player.dashMaxCooldown *= 0.75;
    }
  },
  {
    id: 'magnet',
    name: 'CRYSTAL MAGNET',
    description: '+50% crystal pickup range',
    icon: '🧲',
    maxStacks: 3,
    apply: (player, game) => {
      game.crystalMagnetMultiplier = (game.crystalMagnetMultiplier || 1) + 0.5;
    }
  },
  {
    id: 'echo_boost',
    name: 'ECHO AMPLIFIER',
    description: '+20% echo gains',
    icon: '📡',
    maxStacks: null,
    apply: (player, game) => {
      game.echoSystem.echoMultiplier = (game.echoSystem.echoMultiplier || 1) + 0.2;
    }
  }
];

export function getRandomUpgrades(count, excludeIds = []) {
  const available = UPGRADES.filter(u => !excludeIds.includes(u.id));

  // Shuffle
  const shuffled = [...available].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count);
}
