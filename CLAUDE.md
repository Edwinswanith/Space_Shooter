# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Void Runner is a 2D space shooter built with Three.js where players escape a rising death boundary called "The Void". The core mechanic punishes passive play and rewards aggressive risk-taking.

## Technology Stack

- **Rendering**: Three.js (OrthographicCamera for 2D, 800x600 game units)
- **Audio**: Web Audio API (procedural sound generation)
- **Build**: Vite (dev server on port 3000)
- **State Management**: Plain JS classes with object pools
- **Persistence**: localStorage (banked echoes, best zone)

## Build Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
```

## Architecture

### Core Loop
`Game.js` orchestrates all systems via a single game loop:
1. Input → Player → Bullets → Enemies → Void → Crystals → Collisions → HUD

### File Structure
```
src/
├── main.js              # Entry point
├── Game.js              # Main controller, system wiring, game loop
├── entities/
│   ├── Player.js        # Ship movement, firing, dash, mutations
│   ├── Bullet.js        # Player/enemy bullets with pierce & homing
│   ├── Swarmer.js       # Sine-wave enemy type
│   └── Crystal.js       # Mutation pickup with magnet behavior
├── systems/
│   ├── InputManager.js  # Mouse/keyboard to game coordinates
│   ├── ObjectPool.js    # Generic reusable object pool
│   ├── CollisionSystem.js # AABB detection with pierce tracking
│   ├── VoidSystem.js    # Rising boundary with state-based acceleration
│   ├── GrazeSystem.js   # Near-miss detection and combo tracking
│   ├── SpawnSystem.js   # Time-based enemy spawning with elite chance
│   ├── EchoSystem.js    # Currency with bank/carry mechanics
│   ├── CrystalSystem.js # Crystal lifecycle and collection
│   ├── MutationSystem.js # Weapon upgrades (Fury/Scatter/Pierce/Seeker)
│   └── LevelUpSystem.js # Timed upgrade selection trigger
├── ui/
│   ├── HUD.js           # Real-time stats display
│   └── LevelUpUI.js     # Upgrade card selection
├── audio/
│   └── AudioManager.js  # Procedural sounds via Web Audio API
├── graphics/
│   ├── Renderer.js      # Three.js setup, starfield, screen shake
│   └── ParticleSystem.js # Explosion and spark effects
└── data/
    └── UpgradeData.js   # 8 upgrade definitions with apply functions
```

## Core Game Mechanics

### The Void
- Rising purple boundary with three states: `normal`, `accelerating`, `danger`
- Base rise: 1.2%/sec → 2%/sec (5s idle) → 3%/sec (8s idle)
- Pushback: kills (-1.5%), elite kills (-3%), grazes (-0.5%)
- Visual color shifts: purple → reddish-purple → red based on state

### Combat
- Mouse position controls ship movement (lerp factor: 0.12)
- Left click holds to auto-fire (6 shots/sec base, 5 damage)
- Right click/Shift = dash (80px, 0.15s invincibility, 2.5s cooldown)
- 3 shields (health), screen shake and flash on hit

### Graze System
- Bullets within 40px of player center (but not hitting 8px hitbox)
- Base: +0.5 echoes per graze
- Combo multiplier: 1x (1-4), 1.5x (5-9), 2x (10-19), 3x (20+)
- Combo resets on hit, decays after 2s without graze

### Mutations (Weapon Upgrades)
Crystals drop from elite kills. Max 6 total stacks across all types:
- **Fury** (red): +20% fire rate per stack
- **Scatter** (yellow): +1 bullet per stack
- **Pierce** (blue): Bullets pass through N enemies
- **Seeker** (green): +5° homing angle per stack

### Level-Up Upgrades
Every 45 seconds, choose 1 of 3 random upgrades:
- Kinetic Boost (+25% damage), Rapid Cycle (+15% fire rate)
- Shield Cell (+1 max shield, max 2), Void Anchor (-20% void speed, max 3)
- Proximity Field (+30% graze radius), Phase Capacitor (-25% dash cooldown)
- Crystal Magnet (+50% pickup range), Echo Amplifier (+20% echo gains)

### Economy
- **Echoes**: Persistent currency, banked to localStorage
- **Death penalty**: 60% loss of carried echoes
- **Carry multiplier**: 1.3x bonus for unbanked echoes

## Spawn Scaling

Zone time (90s total) affects spawn rate:
- 0-20s: 1 enemy / 1.8s
- 20-45s: 1 enemy / 1.4s
- 45-70s: 1 enemy / 1.0s
- 70-90s: 1 enemy / 0.8s

Elite chance: 10% base + 5% per zone (max 25%)

## Key Patterns

### Object Pooling
All bullets, enemies, and crystals use `ObjectPool.js` for allocation:
```javascript
const pool = new ObjectPool(() => new Bullet(...), 100);
const bullet = pool.acquire();
bullet.deactivate(); // Returns to pool
```

### Mutation Integration
Player firing reads from MutationSystem:
```javascript
this.player.mutations = this.mutationSystem;
// In Player.fire(): checks mutations.getFireRateMultiplier(), getBulletCount(), etc.
```

### Audio Callbacks
Player actions trigger audio via callbacks wired in Game.js:
```javascript
this.player.onShoot = () => this.audio.playShoot();
this.player.onDash = () => this.audio.playDash();
```
