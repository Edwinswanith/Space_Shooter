export class InputManager {
  constructor(canvas, camera, gameWidth, gameHeight) {
    this.canvas = canvas;
    this.camera = camera;
    this.GAME_WIDTH = gameWidth;
    this.GAME_HEIGHT = gameHeight;

    // Mouse state
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseGameX = 0;
    this.mouseGameY = 0;

    // Button states
    this.isLeftMouseDown = false;
    this.isRightMouseDown = false;
    this.isShiftDown = false;

    // Dash trigger (fires once per press)
    this.dashTriggered = false;
    this.dashConsumed = false;

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse movement
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // Mouse buttons
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Keyboard
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Handle focus loss
    window.addEventListener('blur', () => this.onBlur());
  }

  onMouseMove(e) {
    // Get mouse position relative to canvas
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;

    // Convert to game coordinates
    this.updateGameCoordinates();
  }

  updateGameCoordinates() {
    // Convert screen coordinates to normalized device coordinates
    const rect = this.canvas.getBoundingClientRect();
    const ndcX = (this.mouseX / rect.width) * 2 - 1;
    const ndcY = -(this.mouseY / rect.height) * 2 + 1;

    // Convert NDC to game coordinates using camera bounds
    const viewWidth = this.camera.right - this.camera.left;
    const viewHeight = this.camera.top - this.camera.bottom;

    this.mouseGameX = ndcX * (viewWidth / 2);
    this.mouseGameY = ndcY * (viewHeight / 2);

    // Clamp to game bounds
    this.mouseGameX = Math.max(-this.GAME_WIDTH / 2 + 20, Math.min(this.GAME_WIDTH / 2 - 20, this.mouseGameX));
    this.mouseGameY = Math.max(-this.GAME_HEIGHT / 2 + 90, Math.min(this.GAME_HEIGHT / 2 - 20, this.mouseGameY));
  }

  onMouseDown(e) {
    if (e.button === 0) {
      // Left click - fire
      this.isLeftMouseDown = true;
    } else if (e.button === 2) {
      // Right click - dash
      this.isRightMouseDown = true;
      if (!this.dashConsumed) {
        this.dashTriggered = true;
      }
    }
  }

  onMouseUp(e) {
    if (e.button === 0) {
      this.isLeftMouseDown = false;
    } else if (e.button === 2) {
      this.isRightMouseDown = false;
      this.dashConsumed = false;
    }
  }

  onKeyDown(e) {
    if (e.key === 'Shift') {
      this.isShiftDown = true;
      if (!this.dashConsumed) {
        this.dashTriggered = true;
      }
    }
  }

  onKeyUp(e) {
    if (e.key === 'Shift') {
      this.isShiftDown = false;
      this.dashConsumed = false;
    }
  }

  onBlur() {
    // Reset all inputs when window loses focus
    this.isLeftMouseDown = false;
    this.isRightMouseDown = false;
    this.isShiftDown = false;
    this.dashTriggered = false;
    this.dashConsumed = false;
  }

  update() {
    // Called each frame - nothing to do currently
  }

  // Get current mouse position in game coordinates
  getMousePosition() {
    return {
      x: this.mouseGameX,
      y: this.mouseGameY
    };
  }

  // Check if fire button is held
  isFireHeld() {
    return this.isLeftMouseDown;
  }

  // Check if dash was triggered (consumes the trigger)
  isDashTriggered() {
    if (this.dashTriggered) {
      this.dashTriggered = false;
      this.dashConsumed = true;
      return true;
    }
    return false;
  }
}
