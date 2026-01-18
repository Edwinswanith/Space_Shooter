// Zone configurations for Void Runner
// Each zone has distinct enemy compositions and difficulty

export const ZONE_CONFIGS = {
  1: {
    id: 1,
    name: 'BREACH',
    subtitle: 'They found you',
    enemies: ['swarmer'],
    enemyWeights: { swarmer: 1.0 },
    spawnInterval: 1.8,
    eliteChance: 0.10,
    voidRate: 1.2,
    color: 0x8800ff,
    bgColor: '#8800ff'
  },
  2: {
    id: 2,
    name: 'SWARM',
    subtitle: 'Nowhere to hide',
    enemies: ['swarmer', 'drifter'],
    enemyWeights: { swarmer: 0.7, drifter: 0.3 },
    spawnInterval: 1.4,
    eliteChance: 0.15,
    voidRate: 1.5,
    color: 0xff4488,
    bgColor: '#ff4488'
  },
  3: {
    id: 3,
    name: 'SIEGE',
    subtitle: 'Hold the line',
    enemies: ['swarmer', 'drifter', 'turret'],
    enemyWeights: { swarmer: 0.5, drifter: 0.3, turret: 0.2 },
    spawnInterval: 1.0,
    eliteChance: 0.20,
    voidRate: 1.8,
    color: 0xff8800,
    bgColor: '#ff8800'
  },
  4: {
    id: 4,
    name: 'HIVE',
    subtitle: 'Face the queen',
    enemies: ['swarmer', 'drifter', 'turret'],
    enemyWeights: { swarmer: 0.4, drifter: 0.35, turret: 0.25 },
    spawnInterval: 0.8,
    eliteChance: 0.25,
    voidRate: 2.0,
    color: 0xff0044,
    bgColor: '#ff0044',
    boss: 'hivequeen',
    bossSpawnTime: 60 // Boss spawns at 60 seconds into zone
  }
};

// Get zone config with fallback for endless mode
export function getZoneConfig(zoneNumber) {
  if (ZONE_CONFIGS[zoneNumber]) {
    return ZONE_CONFIGS[zoneNumber];
  }
  // For zones beyond 4, use zone 4 config with scaling
  const baseConfig = { ...ZONE_CONFIGS[4] };
  const scaleFactor = 1 + (zoneNumber - 4) * 0.15;

  return {
    ...baseConfig,
    id: zoneNumber,
    name: `ZONE ${zoneNumber}`,
    subtitle: 'Beyond the hive',
    spawnInterval: Math.max(0.5, baseConfig.spawnInterval / scaleFactor),
    eliteChance: Math.min(0.35, baseConfig.eliteChance + (zoneNumber - 4) * 0.03),
    voidRate: baseConfig.voidRate + (zoneNumber - 4) * 0.2
  };
}

// Total number of defined zones
export const MAX_ZONE = 4;
