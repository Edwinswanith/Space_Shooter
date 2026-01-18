export class LevelUpUI {
  constructor() {
    this.overlay = null;
    this.container = null;
    this.cardsContainer = null;
    this.currentUpgrades = [];

    this.onSelect = null; // (index) => callback
    this.keyHandler = null;

    this.createDOM();
  }

  createDOM() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'levelup-overlay';
    this.overlay.innerHTML = `
      <div class="levelup-container">
        <div class="levelup-title">LEVEL UP</div>
        <div class="levelup-subtitle">Choose an upgrade</div>
        <div class="levelup-cards"></div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    this.container = this.overlay.querySelector('.levelup-container');
    this.cardsContainer = this.overlay.querySelector('.levelup-cards');
  }

  show(upgrades, level) {
    this.currentUpgrades = upgrades;
    this.cardsContainer.innerHTML = '';

    upgrades.forEach((upgrade, index) => {
      const card = document.createElement('div');
      card.className = 'levelup-card';
      card.innerHTML = `
        <div class="card-icon">${upgrade.icon}</div>
        <div class="card-name">${upgrade.name}</div>
        <div class="card-desc">${upgrade.description}</div>
        <div class="card-key">[${index + 1}]</div>
      `;

      card.addEventListener('click', () => this.selectCard(index));
      this.cardsContainer.appendChild(card);
    });

    // Keyboard listener
    this.keyHandler = (e) => {
      const key = e.key;
      if (key === '1' || key === '2' || key === '3') {
        const index = parseInt(key) - 1;
        if (index < this.currentUpgrades.length) {
          this.selectCard(index);
        }
      }
    };
    document.addEventListener('keydown', this.keyHandler);

    this.overlay.classList.add('visible');
  }

  selectCard(index) {
    if (this.onSelect) {
      this.onSelect(index);
    }
  }

  hide() {
    this.overlay.classList.remove('visible');
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }
}
