import { getZoneConfig, MAX_ZONE } from '../data/ZoneConfig.js';

export class ZoneSystem {
  constructor() {
    this.currentZone = 1;
    this.zoneTimer = 0;
    this.zoneDuration = 90; // Default, overridden by mode config
    this.state = 'playing'; // 'playing', 'checkpoint', 'intro', 'boss'

    // Mode config reference
    this.modeConfig = null;

    // Zone stats for current zone
    this.zoneStats = {
      kills: 0,
      echoesEarned: 0,
      startTime: 0
    };

    // Callbacks
    this.onZoneComplete = null;   // (zone, stats) => show checkpoint
    this.onZoneStart = null;      // (zone, config) => update systems
    this.onIntroStart = null;     // (zone, config) => show intro UI
    this.onIntroEnd = null;       // () => resume play
    this.onBossSpawn = null;      // (bossType) => spawn boss
  }

  setModeConfig(config) {
    this.modeConfig = config;
    if (config.zoneDuration) {
      this.zoneDuration = config.zoneDuration;
    }
  }

  update(dt) {
    if (this.state !== 'playing') return;
    if (!this.modeConfig?.hasZones) return; // Endless mode has no zones

    this.zoneTimer += dt;

    // Check for boss spawn in Zone 4
    const zoneConfig = this.getConfig();
    if (zoneConfig.boss && zoneConfig.bossSpawnTime) {
      if (this.zoneTimer >= zoneConfig.bossSpawnTime && this.state === 'playing') {
        // Boss spawn logic would go here
        // this.onBossSpawn?.(zoneConfig.boss);
      }
    }

    // Check zone completion
    if (this.zoneTimer >= this.zoneDuration) {
      this.completeZone();
    }
  }

  completeZone() {
    this.state = 'checkpoint';

    const stats = {
      zone: this.currentZone,
      time: Math.floor(this.zoneTimer),
      kills: this.zoneStats.kills,
      echoesEarned: this.zoneStats.echoesEarned
    };

    if (this.onZoneComplete) {
      this.onZoneComplete(this.currentZone, stats);
    }
  }

  // Called when checkpoint is dismissed
  advanceToNextZone() {
    this.currentZone++;
    this.zoneTimer = 0;
    this.state = 'intro';

    // Reset zone stats
    this.zoneStats = {
      kills: 0,
      echoesEarned: 0,
      startTime: performance.now()
    };

    const config = this.getConfig();

    if (this.onIntroStart) {
      this.onIntroStart(this.currentZone, config);
    }
  }

  // Called when intro finishes
  startZone() {
    this.state = 'playing';
    const config = this.getConfig();

    if (this.onZoneStart) {
      this.onZoneStart(this.currentZone, config);
    }

    if (this.onIntroEnd) {
      this.onIntroEnd();
    }
  }

  getConfig() {
    return getZoneConfig(this.currentZone);
  }

  getProgress() {
    if (!this.modeConfig?.hasZones || this.zoneDuration <= 0) {
      return 0;
    }
    return Math.min(1, this.zoneTimer / this.zoneDuration);
  }

  // Track kills for zone stats
  recordKill(echoValue) {
    this.zoneStats.kills++;
    this.zoneStats.echoesEarned += echoValue;
  }

  reset() {
    this.currentZone = 1;
    this.zoneTimer = 0;
    this.state = 'playing';
    this.zoneStats = {
      kills: 0,
      echoesEarned: 0,
      startTime: performance.now()
    };
  }

  // Skip directly to playing state (for initial run start)
  skipIntro() {
    this.state = 'playing';
    const config = this.getConfig();

    if (this.onZoneStart) {
      this.onZoneStart(this.currentZone, config);
    }
  }

  isPlaying() {
    return this.state === 'playing';
  }

  isInCheckpoint() {
    return this.state === 'checkpoint';
  }

  isInIntro() {
    return this.state === 'intro';
  }
}
