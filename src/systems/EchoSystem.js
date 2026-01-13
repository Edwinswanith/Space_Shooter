export class EchoSystem {
  constructor() {
    // Carried echoes (current run)
    this.carried = 0;

    // Banked echoes (persistent)
    this.banked = 0;

    // Multiplier (from carry decision)
    this.multiplier = 1;

    // Death penalty percentage
    this.deathPenalty = 0.6;

    // Carry bonus multiplier
    this.carryBonus = 1.3;

    // Load saved data
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem('voidrunner_echoes');
      if (saved) {
        this.banked = parseInt(saved, 10) || 0;
      }
    } catch (e) {
      console.warn('Could not load echo data:', e);
    }
  }

  save() {
    try {
      localStorage.setItem('voidrunner_echoes', this.banked.toString());
    } catch (e) {
      console.warn('Could not save echo data:', e);
    }
  }

  resetRun() {
    this.carried = 0;
    this.multiplier = 1;
  }

  addEchoes(amount) {
    this.carried += amount * this.multiplier;
  }

  // Bank all carried echoes
  bank() {
    this.banked += Math.floor(this.carried);
    this.carried = 0;
    this.multiplier = 1;
    this.save();
    return this.banked;
  }

  // Choose to carry (apply 1.3x bonus for next zone)
  carry() {
    this.multiplier = this.carryBonus;
  }

  // Apply death penalty (lose 60% of carried)
  applyDeathPenalty() {
    const lost = Math.floor(this.carried * this.deathPenalty);
    const salvaged = Math.floor(this.carried * (1 - this.deathPenalty));

    this.banked += salvaged;
    this.carried = 0;
    this.save();

    return lost;
  }

  // Get total (banked + carried)
  getTotal() {
    return this.banked + Math.floor(this.carried);
  }

  // Can afford a purchase
  canAfford(price) {
    return this.banked >= price;
  }

  // Spend banked echoes
  spend(amount) {
    if (this.banked >= amount) {
      this.banked -= amount;
      this.save();
      return true;
    }
    return false;
  }
}
