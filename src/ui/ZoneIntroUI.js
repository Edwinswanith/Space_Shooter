export class ZoneIntroUI {
  constructor() {
    this.overlay = null;
    this.duration = 3; // Default for campaign
    this.timer = 0;
    this.countdownValue = 3;
    this.animationFrame = null;

    // Callbacks
    this.onComplete = null; // () => start zone

    this.createDOM();
  }

  createDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'zoneintro-overlay';
    this.overlay.innerHTML = `
      <div class="intro-container">
        <div class="intro-zone">ZONE <span class="zone-num">1</span></div>
        <div class="intro-name">BREACH</div>
        <div class="intro-subtitle">They found you</div>
        <div class="intro-enemies">
          <div class="enemy-icon swarmer" title="Swarmer"></div>
          <div class="enemy-icon drifter" title="Drifter"></div>
          <div class="enemy-icon turret" title="Turret"></div>
        </div>
        <div class="intro-countdown">3</div>
      </div>
    `;

    document.getElementById('game-container').appendChild(this.overlay);
  }

  show(zone, config, duration = 3) {
    this.duration = duration;
    this.timer = 0;
    this.countdownValue = duration <= 1 ? 1 : 3;

    // Update zone info
    this.overlay.querySelector('.zone-num').textContent = zone;
    this.overlay.querySelector('.intro-name').textContent = config.name || `ZONE ${zone}`;
    this.overlay.querySelector('.intro-subtitle').textContent = config.subtitle || '';

    // Update enemy icons
    const enemyContainer = this.overlay.querySelector('.intro-enemies');
    enemyContainer.innerHTML = '';

    const enemies = config.enemies || ['swarmer'];
    enemies.forEach(enemy => {
      const icon = document.createElement('div');
      icon.className = `enemy-icon ${enemy}`;
      icon.title = enemy.charAt(0).toUpperCase() + enemy.slice(1);
      enemyContainer.appendChild(icon);
    });

    // Set zone color
    if (config.bgColor) {
      this.overlay.querySelector('.intro-name').style.color = config.bgColor;
      this.overlay.querySelector('.intro-name').style.textShadow = `0 0 20px ${config.bgColor}`;
    }

    // Initialize countdown display
    const countdownEl = this.overlay.querySelector('.intro-countdown');
    countdownEl.textContent = this.duration <= 1 ? 'GO' : '3';

    // Show overlay
    this.overlay.classList.add('visible');

    // Start animation sequence
    this.startAnimation();
  }

  startAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startTime = performance.now();
    const isFast = this.duration <= 1;

    const animate = (currentTime) => {
      const elapsed = (currentTime - startTime) / 1000;
      this.timer = elapsed;

      // Update countdown
      const countdownEl = this.overlay.querySelector('.intro-countdown');

      if (isFast) {
        // Void Rush: just show "GO" briefly
        countdownEl.textContent = 'GO';
        countdownEl.classList.add('go');
      } else {
        // Campaign: show 3, 2, 1 countdown
        const timeLeft = this.duration - elapsed;
        if (timeLeft > 2) {
          countdownEl.textContent = '3';
          countdownEl.className = 'intro-countdown';
        } else if (timeLeft > 1) {
          countdownEl.textContent = '2';
          countdownEl.className = 'intro-countdown pulse';
        } else if (timeLeft > 0) {
          countdownEl.textContent = '1';
          countdownEl.className = 'intro-countdown pulse';
        } else {
          countdownEl.textContent = 'GO';
          countdownEl.className = 'intro-countdown go';
        }
      }

      // Check if animation complete
      if (elapsed >= this.duration) {
        this.complete();
        return;
      }

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  complete() {
    this.hide();
    if (this.onComplete) {
      this.onComplete();
    }
  }

  hide() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.overlay.classList.remove('visible');
  }

  setDuration(duration) {
    this.duration = duration;
  }
}
