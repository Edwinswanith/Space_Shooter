// Game mode configurations for Void Runner

export const GAME_MODES = {
  campaign: {
    id: 'campaign',
    name: 'CAMPAIGN',
    subtitle: 'Zones & Boss',
    description: 'Fight through 4 zones. Face the Hive Queen.',
    buttonColor: 'cyan',

    // Timing
    zoneDuration: 90,
    levelUpInterval: 45,
    zoneIntroDuration: 3,

    // Checkpoint
    hasCheckpoints: true,
    checkpointType: 'choice', // bank/carry decision

    // Scaling multipliers
    voidRateMultiplier: 1.0,
    spawnRateMultiplier: 1.0,
    pushbackMultiplier: 1.0,
    playerSpeedMultiplier: 1.0,

    // Features
    hasZones: true,
    hasBoss: true,
    bossZone: 4,
    trackHighScore: true
  },

  voidrush: {
    id: 'voidrush',
    name: 'VOID RUSH',
    subtitle: 'Fast & Deadly',
    description: '30 second zones. Triple void speed. No mercy.',
    buttonColor: 'red',

    // Timing
    zoneDuration: 30,
    levelUpInterval: 20,
    zoneIntroDuration: 1,
    checkpointDuration: 1.5, // Auto-dismiss after this

    // Checkpoint
    hasCheckpoints: true,
    checkpointType: 'auto', // auto-bank, brief display

    // Scaling multipliers
    voidRateMultiplier: 3.0,
    spawnRateMultiplier: 1.8,
    pushbackMultiplier: 2.0, // kills/grazes push back more
    playerSpeedMultiplier: 1.2,

    // Features
    hasZones: true,
    hasBoss: true,
    bossZone: 4,
    trackHighScore: true
  },

  endless: {
    id: 'endless',
    name: 'ENDLESS',
    subtitle: 'High Score',
    description: 'No zones. No rest. How long can you last?',
    buttonColor: 'purple',

    // Timing
    zoneDuration: null, // No zones
    levelUpInterval: 30,

    // Checkpoint
    hasCheckpoints: false,

    // Scaling (uses continuous function)
    difficultyScaling: 'continuous',
    voidRateMultiplier: 0.8, // Starts slower
    spawnRateMultiplier: 1.0,
    pushbackMultiplier: 1.0,
    playerSpeedMultiplier: 1.0,

    // Features
    hasZones: false,
    hasBoss: false,
    trackHighScore: true
  }
};

// Get default mode
export function getDefaultMode() {
  return GAME_MODES.campaign;
}

// Get mode by id
export function getMode(modeId) {
  return GAME_MODES[modeId] || GAME_MODES.campaign;
}

// Endless mode difficulty scaling function
export function getEndlessDifficulty(timeElapsed) {
  const minutes = timeElapsed / 60;

  return {
    // Spawn interval: 1.8s -> 0.5s over 3 minutes
    spawnInterval: Math.max(0.5, 1.8 - (minutes * 0.43)),

    // Elite chance: 5% -> 30% over 3 minutes
    eliteChance: Math.min(0.30, 0.05 + (minutes * 0.083)),

    // Void rate: 1.0%/s -> 2.5%/s over 3 minutes
    voidRate: Math.min(2.5, 1.0 + (minutes * 0.5)),

    // Enemy types unlock over time
    enemyTypes: getEndlessEnemyTypes(timeElapsed)
  };
}

// Get unlocked enemy types for endless mode based on time
export function getEndlessEnemyTypes(timeElapsed) {
  const types = ['swarmer'];
  if (timeElapsed >= 60) types.push('drifter');   // 1 minute
  if (timeElapsed >= 120) types.push('turret');   // 2 minutes
  return types;
}

// Get enemy weights for endless mode based on time
export function getEndlessEnemyWeights(timeElapsed) {
  const weights = { swarmer: 1.0 };

  if (timeElapsed >= 60) {
    weights.swarmer = 0.7;
    weights.drifter = 0.3;
  }

  if (timeElapsed >= 120) {
    weights.swarmer = 0.5;
    weights.drifter = 0.3;
    weights.turret = 0.2;
  }

  return weights;
}
