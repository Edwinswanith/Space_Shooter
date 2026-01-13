# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Void Runner is a 2D space shooter built with Three.js where players escape a rising death boundary called "The Void". The core mechanic punishes passive play and rewards aggressive risk-taking.

## Technology Stack

- **Rendering**: Three.js
- **Audio**: Howler.js
- **Build**: Vite
- **State Management**: Plain JS classes (no framework)
- **Persistence**: localStorage

## Build Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server
npm run build    # Production build
```

## Architecture

### State Machine
The game uses a state machine pattern with states:
- MAIN_MENU → HANGAR → RUN_INIT → ZONE_INTRO → ZONE_PLAY → CHECKPOINT → BOSS_INTRO → BOSS_FIGHT → DEATH_SUMMARY → RUN_VICTORY

### Planned File Structure
```
src/
├── Game.js              # Main game controller
├── states/              # Game state classes (StateMachine, RunState, BossState, etc.)
├── entities/            # Player, Bullet, Enemy types (Swarmer, Drifter, Turret, HiveQueen)
├── systems/             # InputManager, CollisionSystem, VoidSystem, GrazeSystem, etc.
├── zones/               # ZoneManager, ZoneData
├── ui/                  # HUD, MenuUI, ScreenTransitions
├── audio/               # AudioManager
├── graphics/            # Renderer, ParticleSystem
└── data/                # ShipData, UpgradeData, SaveManager
```

## Core Game Mechanics

### The Void
- Rising purple boundary from screen bottom (base: 2% screen height/second)
- Rises faster when player hasn't killed enemies (3-4%/sec after 3-6 seconds idle)
- Touching Void = instant death (ignores shields)
- Pushed back by grazing bullets (-0.5%) and killing elites (-2%)

### Combat
- Mouse position controls ship movement (lerp factor: 0.12)
- Left click holds to auto-fire (6 shots/sec, 5 damage)
- Right click/Shift = dash (80px, 0.15s invincibility, 2.5s cooldown)
- 3 hit points (shields), +1 restored at checkpoints

### Graze System
- Bullets passing within 20px without hitting reward +0.5 echoes
- Combo multiplier: 1x (1-4), 1.5x (5-9), 2x (10-19), 3x (20+)
- Getting hit resets combo

### Economy
- **Echoes**: Persistent currency (target: 20/minute)
- **Banking**: At checkpoints, choose BANK (safe) or CARRY (1.3x bonus, 60% loss on death)
- **Crystals**: Drop from elites, mutate weapons (Fury/Scatter/Pierce/Seeker, max 6 stacks)

## Enemy Types (MVP)

| Enemy | Health | Behavior | First Zone |
|-------|--------|----------|------------|
| Swarmer | 5 | Sine wave toward player, single shot/2s | Zone 1 |
| Drifter | 12 | Horizontal bounce, triple spread/2.5s | Zone 2 |
| Turret | 20 | Stationary, tracks player, 4-bullet burst/3s | Zone 3 |
| Elite | 2.5x base | Gold glow, guaranteed crystal drop | Zone 2+ (10% chance) |

## Balance Constants

- Zone duration: 90 seconds
- Level-up trigger: every 45 seconds
- Carry multiplier: 1.3x
- Death echo loss: 60% of carried
- Ship unlock prices: Striker 400, Phantom 800 echoes
