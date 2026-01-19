export class HUD {
  constructor() {
    // DOM elements (will be populated in init)
    this.shields = null;
    this.echoCounter = null;
    this.grazeCombo = null;
    this.voidBar = null;
    this.voidFill = null;
    this.voidIndicator = null;
    this.zoneFill = null;
    this.zoneLabel = null;
    this.zoneTime = null;
    this.modeTag = null;
    this.dashRing = null;
    this.mutationPips = null;

    // State tracking for animations
    this.lastEchoes = 0;
    this.comboTimeout = null;
    this.lastVoidState = 'normal';
  }

  init() {
    // Get DOM elements
    this.shields = document.querySelectorAll('#shields .shield');
    this.echoCounter = document.getElementById('echo-counter');
    this.grazeCombo = document.getElementById('graze-combo');
    this.voidBar = document.getElementById('void-bar');
    this.voidFill = document.getElementById('void-fill');
    this.voidIndicator = document.getElementById('void-indicator');
    this.zoneFill = document.getElementById('zone-fill');
    this.zoneLabel = document.getElementById('zone-label');
    this.zoneTime = document.getElementById('zone-time');
    this.modeTag = document.querySelector('.mode-tag');
    this.dashRing = document.querySelector('.dash-ring');
    this.mutationPips = document.querySelectorAll('.mutation-pip');
  }

  reset() {
    // Reset shields
    this.shields.forEach((shield) => {
      shield.classList.remove('empty', 'damaged');
    });

    // Reset echoes
    this.echoCounter.textContent = '0';
    this.lastEchoes = 0;

    // Reset combo
    this.grazeCombo.classList.remove('active');
    this.grazeCombo.textContent = 'x1';

    // Reset void bar
    this.voidFill.style.height = '0%';
    this.voidBar.classList.remove('warning', 'danger', 'accelerating');

    // Reset void indicator
    if (this.voidIndicator) {
      this.updateVoidIndicator('normal');
    }

    // Reset zone progress
    this.zoneFill.style.width = '0%';

    // Reset dash
    this.dashRing.classList.add('ready');

    // Reset mutations
    this.mutationPips.forEach(pip => {
      pip.style.backgroundColor = 'transparent';
      pip.classList.remove('active');
    });

    this.lastVoidState = 'normal';
  }

  update(health, echoes, voidPercentage, combo, dashCooldown, dashMaxCooldown, voidState = 'normal') {
    // Update shields
    this.updateShields(health);

    // Update echoes (with animation)
    this.updateEchoes(echoes);

    // Update void bar
    this.updateVoidBar(voidPercentage, voidState);

    // Update combo display
    this.updateCombo(combo);

    // Update dash cooldown
    this.updateDash(dashCooldown, dashMaxCooldown);
  }

  updateShields(health) {
    this.shields.forEach((shield, index) => {
      if (index < health) {
        shield.classList.remove('empty');
      } else {
        shield.classList.add('empty');
      }
    });
  }

  updateEchoes(echoes) {
    const displayValue = Math.floor(echoes);

    if (displayValue !== this.lastEchoes) {
      this.echoCounter.textContent = displayValue;
      this.lastEchoes = displayValue;

      // Pulse animation
      this.echoCounter.classList.add('pulse');
      setTimeout(() => {
        this.echoCounter.classList.remove('pulse');
      }, 300);
    }
  }

  updateVoidBar(percentage, state) {
    this.voidFill.style.height = `${percentage}%`;

    // Update warning/danger classes based on state
    this.voidBar.classList.remove('warning', 'danger', 'accelerating');

    if (state === 'danger') {
      this.voidBar.classList.add('danger');
    } else if (state === 'accelerating') {
      this.voidBar.classList.add('accelerating');
    } else if (percentage >= 70) {
      this.voidBar.classList.add('danger');
    } else if (percentage >= 50) {
      this.voidBar.classList.add('warning');
    }

    // Update void indicator text
    if (state !== this.lastVoidState) {
      this.updateVoidIndicator(state);
      this.lastVoidState = state;
    }
  }

  updateVoidIndicator(state) {
    if (!this.voidIndicator) return;

    const statusEl = this.voidIndicator.querySelector('.void-state-status');
    if (!statusEl) return;

    // Remove all state classes
    this.voidIndicator.classList.remove('normal', 'accelerating', 'danger');
    this.voidIndicator.classList.add(state);

    switch (state) {
      case 'danger':
        statusEl.textContent = 'HUNTING';
        break;
      case 'accelerating':
        statusEl.textContent = 'RISING';
        break;
      default:
        statusEl.textContent = 'CALM';
    }
  }

  updateCombo(combo) {
    if (combo > 0) {
      const multiplier = this.getComboMultiplier(combo);
      this.grazeCombo.textContent = `x${multiplier}`;
      this.grazeCombo.classList.add('active');

      // Scale based on combo level
      const scale = 1 + (multiplier - 1) * 0.2;
      this.grazeCombo.style.transform = `scale(${scale})`;
    }
  }

  updateDash(cooldown, maxCooldown) {
    if (cooldown <= 0) {
      this.dashRing.classList.add('ready');
      this.dashRing.style.background = '';
    } else {
      this.dashRing.classList.remove('ready');
      const progress = 1 - (cooldown / maxCooldown);
      // Create a conic gradient for the cooldown indicator
      this.dashRing.style.background = `conic-gradient(#00ffff ${progress * 360}deg, #333 ${progress * 360}deg)`;
    }
  }

  getComboMultiplier(combo) {
    if (combo >= 20) return 3;
    if (combo >= 10) return 2;
    if (combo >= 5) return 1.5;
    return 1;
  }

  onGraze(combo) {
    // Clear existing timeout
    if (this.comboTimeout) {
      clearTimeout(this.comboTimeout);
    }

    // Show combo
    const multiplier = this.getComboMultiplier(combo);
    this.grazeCombo.textContent = `x${multiplier}`;
    this.grazeCombo.classList.add('active');

    // Hide after 2 seconds of no graze
    this.comboTimeout = setTimeout(() => {
      this.grazeCombo.classList.remove('active');
    }, 2000);
  }

  onDamage() {
    // Flash the damaged shield
    const activeShields = Array.from(this.shields).filter(s => !s.classList.contains('empty'));
    const lastActive = activeShields[activeShields.length - 1];

    if (lastActive) {
      lastActive.classList.add('damaged');
      setTimeout(() => {
        lastActive.classList.remove('damaged');
      }, 300);
    }

    // Reset combo display
    this.grazeCombo.classList.remove('active');
  }

  // Show void pushback feedback
  onVoidPushback(amount) {
    // Flash the void bar green briefly
    this.voidFill.classList.add('pushback');
    setTimeout(() => {
      this.voidFill.classList.remove('pushback');
    }, 200);
  }

  // Update zone progress (0-1)
  setZoneProgress(progress) {
    this.zoneFill.style.width = `${progress * 100}%`;
  }

  // Update zone info display
  setZoneInfo(zoneNum, zoneName, timeRemaining) {
    if (this.zoneLabel) {
      const numEl = this.zoneLabel.querySelector('.zone-num');
      const nameEl = this.zoneLabel.querySelector('.zone-name');
      if (numEl) numEl.textContent = zoneNum;
      if (nameEl) nameEl.textContent = zoneName;
    }
    if (this.zoneTime) {
      this.zoneTime.textContent = `${Math.ceil(timeRemaining)}s`;
    }
  }

  // Set game mode indicator
  setMode(modeId) {
    if (!this.modeTag) return;

    // Remove previous mode classes
    this.modeTag.classList.remove('campaign', 'voidrush', 'endless');

    switch (modeId) {
      case 'voidrush':
        this.modeTag.textContent = 'VOID RUSH';
        this.modeTag.classList.add('voidrush');
        break;
      case 'endless':
        this.modeTag.textContent = 'ENDLESS';
        this.modeTag.classList.add('endless');
        break;
      default:
        this.modeTag.textContent = 'CAMPAIGN';
        this.modeTag.classList.add('campaign');
    }
  }

  // Update mutation pips display
  updateMutations(stacks) {
    const types = ['fury', 'scatter', 'pierce', 'seeker'];

    let pipIndex = 0;
    for (const type of types) {
      for (let i = 0; i < stacks[type]; i++) {
        if (pipIndex < this.mutationPips.length) {
          // Remove all type classes first
          this.mutationPips[pipIndex].classList.remove('fury', 'scatter', 'pierce', 'seeker');
          // Add the correct type class
          this.mutationPips[pipIndex].classList.add(type);
          pipIndex++;
        }
      }
    }

    // Clear remaining pips
    for (let i = pipIndex; i < this.mutationPips.length; i++) {
      this.mutationPips[i].classList.remove('fury', 'scatter', 'pierce', 'seeker');
    }
  }

  // Show/hide HUD
  show() {
    document.getElementById('hud').style.display = 'block';
  }

  hide() {
    document.getElementById('hud').style.display = 'none';
  }
}
