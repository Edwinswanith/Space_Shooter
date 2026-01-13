import * as THREE from 'three';

export class VoidSystem {
  constructor(gameHeight, scene) {
    this.GAME_HEIGHT = gameHeight;
    this.scene = scene;

    // Void height as percentage (0-100)
    this.height = 0;

    // Rise rates (percentage per second) - BALANCED for better gameplay
    this.baseRiseRate = 1.2;        // Was 2, now slower to give breathing room
    this.acceleratedRate1 = 2;      // After 5 seconds no kill (1.5x)
    this.acceleratedRate2 = 3;      // After 8 seconds no kill (2x)

    // Timing - more forgiving thresholds
    this.timeSinceKill = 0;
    this.killStreakThreshold1 = 5;  // seconds (was 3)
    this.killStreakThreshold2 = 8;  // seconds (was 6)

    // Pushback amounts - FIX 1 & 3
    this.killPushback = 1.5;      // Normal kills push back 1.5%
    this.eliteKillPushback = 3;   // Elite kills push back 3%
    this.grazePushback = 0.5;     // Graze pushes back 0.5%

    // Speed multiplier (for boss phase 3)
    this.speedMultiplier = 1;

    // Visual state
    this.currentState = 'normal'; // 'normal', 'accelerating', 'danger'
    this.pulseTimer = 0;
    this.pushbackFlashTimer = 0;

    // Callbacks for effects
    this.onPushbackCallback = null;
  }

  reset() {
    this.height = 0;
    this.timeSinceKill = 0;
    this.speedMultiplier = 1;
    this.currentState = 'normal';
    this.pulseTimer = 0;
    this.pushbackFlashTimer = 0;
    this.updateVisual();
  }

  update(dt) {
    this.timeSinceKill += dt;
    this.pulseTimer += dt;

    if (this.pushbackFlashTimer > 0) {
      this.pushbackFlashTimer -= dt;
    }

    // Calculate rise rate based on time since last kill - FIX 2
    let riseRate = this.baseRiseRate;
    let newState = 'normal';

    if (this.timeSinceKill > this.killStreakThreshold2) {
      riseRate = this.acceleratedRate2;  // 4%/sec (2x speed)
      newState = 'danger';
    } else if (this.timeSinceKill > this.killStreakThreshold1) {
      riseRate = this.acceleratedRate1;  // 3%/sec (1.5x speed)
      newState = 'accelerating';
    }

    // Update state for visual feedback
    if (newState !== this.currentState) {
      this.currentState = newState;
      this.updateVoidColor();
    }

    // Apply speed multiplier
    riseRate *= this.speedMultiplier;

    // Rise the void
    this.height += riseRate * dt;
    this.height = Math.min(100, this.height);

    // Update visual
    this.updateVisual();
  }

  updateVisual() {
    const voidY = -this.GAME_HEIGHT / 2 + (this.height / 100) * this.GAME_HEIGHT;

    const voidPlane = this.scene.getObjectByName('voidPlane');
    const voidEdge = this.scene.getObjectByName('voidEdge');

    if (voidPlane) {
      voidPlane.position.y = voidY - this.GAME_HEIGHT / 2;
    }

    if (voidEdge) {
      voidEdge.position.y = voidY;

      // Pulse effect when accelerating - FIX 4
      if (this.currentState === 'danger') {
        const pulse = 0.6 + Math.sin(this.pulseTimer * 8) * 0.4;
        voidEdge.material.opacity = pulse;
      } else if (this.currentState === 'accelerating') {
        const pulse = 0.5 + Math.sin(this.pulseTimer * 4) * 0.2;
        voidEdge.material.opacity = pulse;
      } else {
        voidEdge.material.opacity = 0.6;
      }

      // Green flash on pushback - FIX 4
      if (this.pushbackFlashTimer > 0) {
        const flashIntensity = this.pushbackFlashTimer / 0.3;
        voidEdge.material.color.setHex(this.lerpColor(0x00ff00, this.getStateColor(), 1 - flashIntensity));
      }
    }
  }

  updateVoidColor() {
    const voidPlane = this.scene.getObjectByName('voidPlane');
    const voidEdge = this.scene.getObjectByName('voidEdge');

    const color = this.getStateColor();
    const edgeColor = this.getEdgeColor();

    if (voidPlane) {
      voidPlane.material.color.setHex(color);
    }

    if (voidEdge) {
      voidEdge.material.color.setHex(edgeColor);
    }
  }

  getStateColor() {
    switch (this.currentState) {
      case 'danger':
        return 0x800020;  // Dark red
      case 'accelerating':
        return 0x601040;  // Reddish purple
      default:
        return 0x4a0080;  // Normal purple
    }
  }

  getEdgeColor() {
    switch (this.currentState) {
      case 'danger':
        return 0xff2222;  // Bright red
      case 'accelerating':
        return 0xcc44ff;  // Lighter purple/pink
      default:
        return 0x8b00ff;  // Normal purple glow
    }
  }

  lerpColor(color1, color2, t) {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
  }

  // FIX 1: Void reacts to kills with pushback and visual pulse
  onKill(isElite) {
    this.timeSinceKill = 0;

    // All kills push back the void
    const pushback = isElite ? this.eliteKillPushback : this.killPushback;
    this.height = Math.max(0, this.height - pushback);

    // Trigger visual pulse (green flash)
    this.pushbackFlashTimer = 0.3;

    // Update state since we just got a kill
    this.currentState = 'normal';
    this.updateVoidColor();
    this.updateVisual();

    // Return pushback amount for audio/particle feedback
    return pushback;
  }

  // FIX 3: Graze pushes void back
  onGraze() {
    this.height = Math.max(0, this.height - this.grazePushback);

    // Brief flash on graze (shorter than kill)
    this.pushbackFlashTimer = Math.max(this.pushbackFlashTimer, 0.15);

    this.updateVisual();
    return this.grazePushback;
  }

  // Check if player Y position is in the void
  isPlayerInVoid(playerY) {
    const voidY = -this.GAME_HEIGHT / 2 + (this.height / 100) * this.GAME_HEIGHT;
    return playerY < voidY;
  }

  getPercentage() {
    return this.height;
  }

  // Get current state for UI feedback
  getState() {
    return this.currentState;
  }

  // Get the rise rate multiplier for UI feedback
  getRiseRateMultiplier() {
    if (this.timeSinceKill > this.killStreakThreshold2) {
      return 2;
    } else if (this.timeSinceKill > this.killStreakThreshold1) {
      return 1.5;
    }
    return 1;
  }

  getTimeSinceKill() {
    return this.timeSinceKill;
  }

  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
  }
}
