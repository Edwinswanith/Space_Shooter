export class ObjectPool {
  constructor(factory, initialSize = 50) {
    this.factory = factory;
    this.pool = [];
    this.active = [];

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  acquire() {
    let obj;

    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      // Pool exhausted, create new object
      obj = this.factory();
    }

    obj.active = true;
    this.active.push(obj);
    return obj;
  }

  release(obj) {
    obj.active = false;
    obj.onRelease?.(); // Call cleanup if defined

    const index = this.active.indexOf(obj);
    if (index > -1) {
      this.active.splice(index, 1);
      this.pool.push(obj);
    }
  }

  releaseAll() {
    // Release all active objects back to pool
    while (this.active.length > 0) {
      const obj = this.active.pop();
      obj.active = false;
      obj.onRelease?.();
      this.pool.push(obj);
    }
  }

  releaseInactive() {
    // Release objects marked for removal (shouldRemove = true)
    for (let i = this.active.length - 1; i >= 0; i--) {
      const obj = this.active[i];
      if (obj.shouldRemove) {
        this.release(obj);
      }
    }
  }

  update(dt, ...args) {
    // Update all active objects, release those marked for removal
    for (let i = this.active.length - 1; i >= 0; i--) {
      const obj = this.active[i];

      if (obj.shouldRemove) {
        this.release(obj);
      } else {
        obj.update?.(dt, ...args);
      }
    }
  }

  forEach(callback) {
    this.active.forEach(callback);
  }

  getActive() {
    return this.active;
  }

  getActiveCount() {
    return this.active.length;
  }

  getPoolSize() {
    return this.pool.length;
  }
}
