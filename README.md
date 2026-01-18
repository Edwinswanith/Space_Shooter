# Void Runner

A fast-paced 2D space shooter built with Three.js where players escape a rising death boundary called "The Void". The core mechanic punishes passive play and rewards aggressive risk-taking.

## Screenshots

### Main Menu
![Main Menu](screenshots/menu.png)

### Death Screen
![Death Screen](screenshots/death.png)

## Game Modes

### Campaign
- 4 zones of 90 seconds each
- Checkpoints between zones with Bank/Carry choice
- Zone 4 boss fight
- Progressive difficulty with new enemy types

### Void Rush
- Fast-paced 30-second zones
- 3x void speed, 2x pushback multiplier
- Auto-bank at checkpoints (no choice)
- For players who want intensity

### Endless
- Continuous scaling difficulty
- No checkpoints
- How long can you survive?
- Leaderboard tracked by time survived

## Gameplay Features

### The Void
- Rising purple boundary from screen bottom
- Rises faster when player hasn't killed enemies (CALM → RISING → HUNTING states)
- Touching the Void = instant death
- Pushed back by grazing bullets and killing enemies (elites give bigger pushback)

### Combat
- Mouse position controls ship movement (smooth lerp)
- Left click holds to auto-fire (6 shots/sec)
- Right click/Shift = dash with invincibility frames (2.5s cooldown)
- 3 shield hit points (+1 restored at checkpoints)

### Graze System
- Bullets passing within 20px without hitting reward echoes
- Combo multiplier increases with consecutive grazes (x1 → x1.5 → x2 → x3)
- Getting hit resets combo
- Graze also pushes back the void

### Economy
- **Echoes**: Persistent currency earned from kills and grazes
- **Bank vs Carry**: At checkpoints, choose to bank echoes (safe) or carry forward (1.3x bonus but 60% loss on death)
- **Crystals**: Drop from elite enemies, used to mutate weapons

### Mutations (Weapon Upgrades)
Collect crystals from elite enemies to power up your weapons:
- **Fury (Red)**: +15% fire rate, +10% damage per stack
- **Scatter (Blue)**: +1 projectile per stack (spread pattern)
- **Pierce (Green)**: Bullets pass through +1 enemy per stack
- **Seeker (Yellow)**: Bullets home toward enemies

### Level-Up System
Every 45 seconds (Campaign) or 20-30 seconds (other modes), choose from 3 upgrade cards:
- Stat boosts (fire rate, damage, void resistance)
- Shield restoration
- Echo multipliers

## Zones & Enemies

### Zone 1: BREACH
- **Swarmer**: Sine-wave movement, single aimed shot every 2s
- 5 HP, 1 echo reward

### Zone 2: SWARM
- Swarmers + **Drifter**: Horizontal bounce, triple spread shot every 2.5s
- Drifter: 12 HP, 2 echo reward
- 10% elite spawn chance

### Zone 3: SIEGE
- All previous + **Turret**: Stationary, rotating barrel, 4-bullet burst every 3s
- Turret: 20 HP, 3 echo reward
- 15% elite spawn chance

### Zone 4: HIVE
- All enemy types
- Boss: Hive Queen (coming soon)
- 20% elite spawn chance

### Elite Enemies
- 2.5x health, gold glow effect
- Guaranteed crystal drop
- Larger void pushback on kill

## Technology Stack

- **Rendering**: Three.js with OrthographicCamera
- **Audio**: Howler.js
- **Build**: Vite
- **State Management**: Plain JS classes
- **Persistence**: localStorage

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Controls

| Action | Input |
|--------|-------|
| Move | Mouse position |
| Fire | Left click (hold) |
| Dash | Right click / Shift |

## Architecture

```
src/
├── Game.js              # Main game controller
├── data/                # Configuration (ZoneConfig, ModeConfig)
├── entities/            # Player, Bullet, Swarmer, Drifter, Turret, Crystal
├── systems/             # Core systems
│   ├── VoidSystem.js    # Rising boundary mechanic
│   ├── GrazeSystem.js   # Near-miss detection
│   ├── SpawnSystem.js   # Enemy spawning
│   ├── ZoneSystem.js    # Zone progression
│   ├── MutationSystem.js # Weapon modifications
│   ├── LevelUpSystem.js # Upgrade cards
│   └── LeaderboardSystem.js # High scores
├── ui/                  # HUD, menus, overlays
└── audio/               # Sound management
```

## UI Features

- **Neon Void aesthetic** with CRT scanline overlay
- **Glitch effect** on title text
- **Corner frame decorations** on HUD elements
- **Dynamic void status indicator** (CALM/RISING/HUNTING)
- **Combo multiplier display**
- **Zone progress tracking**
- **Level-up card selection**
- **Checkpoint bank/carry decision**
- **Zone intro announcements**

## License

MIT
