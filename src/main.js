import { Game } from './Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Create and start the game
  const game = new Game();
  game.init();
});
