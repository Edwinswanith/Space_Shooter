export class CheckpointUI {
  constructor() {
    this.overlay = null;
    this.mode = 'campaign'; // 'campaign' or 'voidrush'
    this.autoTimer = 0;
    this.autoDuration = 1.5; // For void rush auto-dismiss

    // Callbacks
    this.onComplete = null; // (choice) => 'bank', 'carry', or 'auto'

    this.createDOM();
  }

  createDOM() {
    // Create checkpoint overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'checkpoint-overlay';
    this.overlay.innerHTML = `
      <div class="checkpoint-container">
        <div class="checkpoint-title">ZONE <span class="zone-num">1</span> COMPLETE</div>

        <div class="checkpoint-stats">
          <div class="stat-item">
            <div class="stat-label">TIME</div>
            <div class="stat-value" id="cp-time">0s</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">KILLS</div>
            <div class="stat-value" id="cp-kills">0</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">ECHOES</div>
            <div class="stat-value" id="cp-echoes">0</div>
          </div>
        </div>

        <div class="checkpoint-choices campaign-only">
          <div class="choice-card" id="choice-bank">
            <div class="choice-title">BANK</div>
            <div class="choice-desc">Safe deposit</div>
            <div class="choice-amount" id="bank-amount">+0</div>
          </div>
          <div class="choice-card" id="choice-carry">
            <div class="choice-title">CARRY</div>
            <div class="choice-desc">1.3x next zone</div>
            <div class="choice-risk">60% lost on death</div>
          </div>
        </div>

        <div class="checkpoint-totals campaign-only">
          <div class="total-item">BANKED: <span id="cp-banked">0</span></div>
          <div class="total-item">CARRIED: <span id="cp-carried">0</span></div>
        </div>

        <div class="checkpoint-health">+1 SHIELD RESTORED</div>
      </div>

      <div class="checkpoint-flash voidrush-only">
        <div class="flash-zone">ZONE <span class="zone-num">1</span></div>
        <div class="flash-complete">COMPLETE</div>
        <div class="flash-echoes">+<span id="flash-echoes">0</span> ECHOES BANKED</div>
      </div>
    `;

    document.getElementById('game-container').appendChild(this.overlay);

    // Setup event listeners for campaign mode
    document.getElementById('choice-bank').addEventListener('click', () => {
      if (this.mode === 'campaign') {
        this.selectChoice('bank');
      }
    });

    document.getElementById('choice-carry').addEventListener('click', () => {
      if (this.mode === 'campaign') {
        this.selectChoice('carry');
      }
    });
  }

  show(zone, stats, mode, echoSystem) {
    this.mode = mode;
    this.overlay.classList.add('visible');

    // Update zone number
    this.overlay.querySelectorAll('.zone-num').forEach(el => {
      el.textContent = zone;
    });

    // Update stats
    document.getElementById('cp-time').textContent = stats.time + 's';
    document.getElementById('cp-kills').textContent = stats.kills;
    document.getElementById('cp-echoes').textContent = stats.echoesEarned;

    if (mode === 'campaign' || mode === 'choice') {
      // Show campaign UI
      this.overlay.classList.add('campaign-mode');
      this.overlay.classList.remove('voidrush-mode');

      // Update bank amounts
      document.getElementById('bank-amount').textContent = '+' + stats.echoesEarned;
      document.getElementById('cp-banked').textContent = echoSystem?.banked || 0;
      document.getElementById('cp-carried').textContent = echoSystem?.carried || 0;
    } else {
      // Show void rush flash UI
      this.overlay.classList.remove('campaign-mode');
      this.overlay.classList.add('voidrush-mode');

      document.getElementById('flash-echoes').textContent = stats.echoesEarned;

      // Auto-dismiss after duration
      this.autoTimer = 0;
      this.startAutoTimer();
    }
  }

  startAutoTimer() {
    const tick = () => {
      this.autoTimer += 0.016; // ~60fps
      if (this.autoTimer >= this.autoDuration) {
        this.selectChoice('auto');
      } else if (this.overlay.classList.contains('visible')) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }

  selectChoice(choice) {
    this.hide();
    if (this.onComplete) {
      this.onComplete(choice);
    }
  }

  hide() {
    this.overlay.classList.remove('visible');
  }

  setAutoDuration(duration) {
    this.autoDuration = duration;
  }
}
