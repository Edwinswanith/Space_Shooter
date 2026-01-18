export class MutationSystem {
  constructor() {
    this.stacks = {
      fury: 0,
      scatter: 0,
      pierce: 0,
      seeker: 0
    };
    this.maxTotalStacks = 6;

    // Callback for HUD update
    this.onMutationChange = null;
  }

  getTotalStacks() {
    return this.stacks.fury + this.stacks.scatter +
           this.stacks.pierce + this.stacks.seeker;
  }

  addStack(type) {
    if (this.getTotalStacks() >= this.maxTotalStacks) {
      return false; // At max
    }

    this.stacks[type]++;

    if (this.onMutationChange) {
      this.onMutationChange(this.getStacks());
    }

    return true;
  }

  getStacks() {
    return { ...this.stacks };
  }

  // Weapon modifiers
  getFireRateMultiplier() {
    return 1 + (this.stacks.fury * 0.20); // +20% per stack
  }

  getBulletCount() {
    return 1 + this.stacks.scatter; // +1 bullet per stack
  }

  getPierceCount() {
    return this.stacks.pierce; // Pierce through N enemies
  }

  getHomingAngle() {
    // Degrees per frame (converted to radians)
    return (this.stacks.seeker * 5) * (Math.PI / 180);
  }

  reset() {
    this.stacks = { fury: 0, scatter: 0, pierce: 0, seeker: 0 };
    if (this.onMutationChange) {
      this.onMutationChange(this.getStacks());
    }
  }
}
