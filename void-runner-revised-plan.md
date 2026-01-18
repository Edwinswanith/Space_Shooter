# VOID RUNNER: Revised Game Design Document

## Version 2.0 - Scope-Corrected

This document replaces the previous design. Every system here has been stress-tested against one question: does this make the first minute more fun, or is it premature optimization?

---

## Part 1: Core Identity

### 1.1 The One-Sentence Pitch

You are escaping The Void, a rising death boundary that punishes passive play and rewards aggressive risk-taking.

### 1.2 The Core Loop (Must Be Fun in 60 Seconds)

```
SHOOT ENEMIES
     |
     v
COLLECT ECHOES + CRYSTALS
     |
     v
WEAPON MUTATES / YOU LEVEL UP
     |
     v
VOID RISES (faster if passive)
     |
     v
GRAZE BULLETS FOR BONUS
     |
     v
REACH CHECKPOINT
     |
     v
BANK OR CARRY DECISION
     |
     v
REPEAT UNTIL DEATH OR VICTORY
```

If this loop is not addictive with placeholder art and no audio, the game fails. No amount of zones, bosses, or progression will save it.

### 1.3 Session Targets

| Metric | Target |
|--------|--------|
| Single run (death to death) | 6 to 12 minutes |
| Full completion (first time) | 45 to 60 minutes |
| "One more run" sessions | 3 to 5 attempts |

### 1.4 MVP Scope vs Future Scope

**MVP (Ships First)**

- 5 zones (not 10)
- 1 boss (Zone 5 only)
- 4 enemy types
- Weapon mutation system
- Graze system
- Banking system
- 3 ships (1 default, 2 unlockable)
- No cosmetic skins
- No achievements
- No adaptive difficulty

**Future Additions (Only After MVP Works)**

- Zones 6 to 10
- Bosses 2 and 3
- Additional enemy types
- Ship skins
- Achievements
- Challenge modes
- More ships

---

## Part 2: The Void Mechanic (Core Innovation)

### 2.1 What The Void Actually Does

The Void is not lore. It is the primary gameplay driver.

**Visual Representation**

- Purple/black boundary rising from bottom of screen
- Particle effects at the edge (dark tendrils reaching upward)
- Screen edge tints purple as Void gets closer

**Mechanical Behavior**

| Condition | Void Rise Speed |
|-----------|-----------------|
| Base rate | 2% of screen height per second |
| Player has not killed anything in 3 seconds | +50% speed (3% per second) |
| Player has not killed anything in 6 seconds | +100% speed (4% per second) |
| Player grazes a bullet | -0.5% instant drop |
| Player kills elite enemy | -2% instant drop |
| Player kills boss | Void resets to bottom |

**Death Condition**

If player ship touches The Void boundary, instant death. No damage, no warning. The Void is absolute.

### 2.2 Why This Works Psychologically

| Behavior | Void Response | Player Feeling |
|----------|---------------|----------------|
| Camping at top, avoiding enemies | Void rises fast | Pressure, must act |
| Aggressive killing | Void stays low | Reward, breathing room |
| Skilled grazing | Void pushes back | Mastery satisfaction |
| Passive bullet dodging only | Void catches up | Punishment for cowardice |

The Void creates a simple rule: aggression equals survival. Passivity equals death.

### 2.3 Void UI Indicator

- Thin bar on left side of screen shows Void "pressure"
- Bar fills as Void rises
- Color shifts from blue (safe) to yellow (warning) to red (danger)
- When Void is above 70% screen height, audio warning plays

---

## Part 3: Game State Machine

### 3.1 Complete State Flow

```
[BOOT]
   |
   v
[MAIN_MENU]
   |
   +--> [HANGAR] --> (ship select, upgrades) --> [MAIN_MENU]
   |
   +--> [RUN_INIT] --> (reset run variables, select ship)
          |
          v
       [ZONE_INTRO] (1.5 seconds, zone name display)
          |
          v
       [ZONE_PLAY] <--+
          |           |
          +--> [CHECKPOINT] --> (bank/carry decision) --> [ZONE_INTRO] (next zone)
          |
          +--> [BOSS_INTRO] (Zone 5 only, 2 seconds)
          |       |
          |       v
          |    [BOSS_FIGHT]
          |       |
          |       +--> (victory) --> [RUN_VICTORY]
          |       |
          |       +--> (death) --> [DEATH_SUMMARY]
          |
          +--> (death) --> [DEATH_SUMMARY]
                             |
                             +--> [MAIN_MENU]
                             |
                             +--> [RUN_INIT] (retry)

[RUN_VICTORY]
   |
   +--> [CREDITS_ROLL] --> [MAIN_MENU]
```

### 3.2 State Definitions

**MAIN_MENU**

- Display: Title, buttons (Escape, Hangar, Settings)
- Inputs: Button clicks only
- Transitions: To HANGAR, to RUN_INIT, to SETTINGS

**HANGAR**

- Display: Ship selection, upgrade slots, echo wallet
- Inputs: Ship select, upgrade equip, back button
- Transitions: To MAIN_MENU
- Data: Reads/writes localStorage for unlocks

**RUN_INIT**

- Display: Brief loading/transition
- Actions: Reset all run variables (health, echoes carried, mutations, zone index)
- Duration: Instant (under 0.5 seconds)
- Transitions: To ZONE_INTRO

**ZONE_INTRO**

- Display: Zone name, zone number, brief flavor text
- Duration: 1.5 seconds (not skippable)
- Actions: Load zone data, spawn initial enemies
- Transitions: To ZONE_PLAY

**ZONE_PLAY**

- Display: Full gameplay HUD
- Inputs: All gameplay controls active
- Duration: Until checkpoint trigger, boss trigger, or death
- Transitions: To CHECKPOINT, to BOSS_INTRO (Zone 5), to DEATH_SUMMARY

**CHECKPOINT**

- Display: Checkpoint UI (echoes collected, bank/carry choice)
- Inputs: Bank button, Carry button
- Actions: Process banking decision, restore 1 health if damaged
- Transitions: To ZONE_INTRO (next zone)

**BOSS_INTRO**

- Display: Boss name, brief warning
- Duration: 2 seconds
- Actions: Spawn boss entity
- Transitions: To BOSS_FIGHT

**BOSS_FIGHT**

- Display: Boss health bar added to HUD
- Inputs: All gameplay controls active
- Duration: Until boss defeated or player death
- Transitions: To RUN_VICTORY, to DEATH_SUMMARY

**DEATH_SUMMARY**

- Display: Death statistics, near-miss info, echo loss calculation
- Inputs: Retry button, Menu button
- Actions: Update persistent statistics, apply echo loss
- Transitions: To RUN_INIT, to MAIN_MENU

**RUN_VICTORY**

- Display: Victory message, final statistics
- Inputs: Continue button
- Actions: Bank all remaining echoes, unlock New Game Plus flag
- Transitions: To CREDITS_ROLL

---

## Part 4: Economy Math (Constraint-Based)

### 4.1 Design Constraints

| Constraint | Value | Reasoning |
|------------|-------|-----------|
| Target echoes per minute | 20 | Fast enough to feel rewarding |
| First ship unlock | 25 to 30 minutes of play | Early enough to hook, late enough to earn |
| Full ship unlock (all 3) | 3 to 4 hours | Long-term goal |
| Average run length | 8 minutes | Based on 5 zones at 90 seconds each |
| Expected deaths before first completion | 5 to 8 | Learning curve |

### 4.2 Echo Sources (Calculated)

**Per-Minute Breakdown Target: 20 Echoes**

| Source | Frequency per Minute | Echo Value | Echoes per Minute |
|--------|----------------------|------------|-------------------|
| Basic enemy kills | 8 kills | 1 each | 8 |
| Graze rewards | 10 grazes | 0.5 each | 5 |
| Elite kills | 0.5 kills | 8 each | 4 |
| Zone completion bonus | 0.67 zones | 5 each | 3 |
| **Total** | | | **20** |

Note: Values intentionally low per-event. Frequency creates the reward feel, not big numbers.

### 4.3 Echo Loss on Death

- Banked echoes: Safe (never lost)
- Carried echoes: Lose 50%

**Example Run**

```
Zone 1: Earn 30 echoes
Checkpoint: Choose CARRY (1.5x multiplier active)

Zone 2: Earn 45 echoes (30 from play, 1.5x = 45)
Checkpoint: Choose BANK
Banked: 30 + 45 = 75 echoes (safe)
Carried: 0

Zone 3: Earn 35 echoes
Checkpoint: Choose CARRY

Zone 4: Earn 52 echoes (35 from play, 1.5x = 52)
Death in Zone 4.

Loss: 52 * 0.5 = 26 echoes lost
Net gain this run: 75 (banked) + 26 (50% of carried) = 101 echoes
```

### 4.4 Unlock Prices (Calculated from Constraints)

**Ships**

| Ship | Price | Expected Unlock Time |
|------|-------|----------------------|
| Wanderer | Free | Immediate |
| Striker | 400 | 25 to 30 minutes |
| Phantom | 800 | 60 to 75 minutes |

**Starting Upgrades**

| Upgrade | Price | Effect |
|---------|-------|--------|
| Thick Skin | 200 | First hit of run deals no damage |
| Echo Magnet | 300 | +15% echo collection |
| Quick Dash | 250 | Dash cooldown reduced by 0.5 seconds |

Maximum 1 starting upgrade equipped (MVP limitation).

### 4.5 Carry Multiplier Analysis

**Question: Is 1.5x carry with 50% loss balanced?**

Expected value calculation:

- BANK: 100% of echoes, guaranteed
- CARRY: If survive, 150% of echoes. If die, 75% of echoes (50% of 150%).

Break-even point: CARRY is better if survival rate exceeds 50%.

**Analysis**: This favors carrying too heavily for skilled players. 

**Revised Values**:

- Carry multiplier: 1.3x (not 1.5x)
- Death loss: 60% (not 50%)

New expected value:
- CARRY: If survive, 130%. If die, 52% (40% of 130%).
- Break-even: ~62% survival rate

This makes banking more attractive for uncertain situations while still rewarding confident carries.

---

## Part 5: Core Mechanics (Streamlined)

### 5.1 Movement

**Controls**

| Input | Action |
|-------|--------|
| Mouse position | Ship follows cursor with smoothing |
| Right click OR Shift | Dash (short invincible burst) |

**Movement Feel**

- Ship interpolates toward cursor position (lerp factor: 0.12)
- Creates slight "weight" without feeling sluggish
- Ship cannot exit screen boundaries
- Ship cannot enter bottom 15% of screen (Void territory buffer)

**Dash Ability**

| Property | Value |
|----------|-------|
| Distance | 80 pixels in facing direction |
| Duration | 0.15 seconds |
| Invincibility | Full duration |
| Cooldown | 2.5 seconds |
| Visual | Afterimage trail, brief blur |

### 5.2 Combat

**Primary Weapon**

| Property | Base Value |
|----------|------------|
| Fire rate | 6 shots per second |
| Damage per shot | 5 |
| Projectile speed | 600 pixels per second |
| Fire input | Hold left click (automatic) |

**Weapon Mutations**

Crystals drop from elite enemies. Collecting a crystal immediately mutates your weapon.

| Crystal | Color | Effect | Stacks |
|---------|-------|--------|--------|
| Fury | Red | +25% damage, -15% fire rate | Max 3 |
| Scatter | Blue | +1 projectile, -20% damage per projectile | Max 3 |
| Pierce | Green | Projectiles pass through 1 extra enemy | Max 2 |
| Seeker | Yellow | Slight homing (15 degree correction) | Max 2 |

**Stacking Rules**

- Maximum 6 total crystal stacks per run
- Mutations reset on death
- Player can see current mutation loadout in HUD

**Why Only 4 Crystal Types**

Original design had 5. Blast (explosive) removed because:
- Explosion radius requires additional collision logic
- Creates visual noise in already busy screen
- Can be added post-MVP if needed

### 5.3 Health System

**Simple Model**

- Player has 3 hit points (shields)
- Damage removes 1 shield
- Touching Void: instant death (ignores shields)
- Health restored: +1 shield at each checkpoint

**Damage Feedback**

1. Screen flash (white, 0.1 seconds)
2. Ship flicker (invincibility frames, 1.2 seconds)
3. Screen shake (brief)
4. Audio sting (sharp, short)
5. Shield icon animates breaking

### 5.4 Graze System

**Core Mechanic**

When enemy bullets pass within 20 pixels of player ship without hitting:
- +0.5 echoes
- Void boundary drops slightly (-0.5%)
- Visual spark effect
- Audio ping
- Graze combo counter increases

**Combo System**

| Combo | Multiplier | Requirement |
|-------|------------|-------------|
| 1 to 4 | 1x | Base graze value |
| 5 to 9 | 1.5x | Consecutive grazes within 2 seconds |
| 10 to 19 | 2x | Consecutive grazes within 2 seconds |
| 20+ | 3x | Consecutive grazes within 2 seconds |

Getting hit resets combo to 0.

**Psychological Purpose**

- Rewards aggressive positioning
- Creates memorable "clutch" moments
- Directly pushes back The Void (mechanical integration)
- Mastery expression for skilled players

### 5.5 Level-Up System

**Trigger**

Every 45 seconds of zone gameplay, level-up triggers.

**Presentation**

1. Time slows to 30% (not pause)
2. Three upgrade cards appear
3. Player selects one
4. Time resumes

**Upgrade Pool**

| Upgrade | Effect | Category |
|---------|--------|----------|
| Rapid Fire | +20% fire rate for rest of run | Offense |
| Heavy Rounds | +15% damage for rest of run | Offense |
| Void Resistance | Void rises 20% slower for rest of run | Defense |
| Thick Shields | +1 max health (once per run) | Defense |
| Echo Boost | +25% echo collection for rest of run | Economy |
| Graze Master | Graze radius +30% for rest of run | Mastery |
| Dash Reset | Dash cooldown -1 second for rest of run | Mobility |
| Second Wind | Auto-revive once with 1 HP (once per run) | Defense |

**Selection Rules**

- 3 random upgrades from pool
- No duplicates in single selection
- "Once per run" upgrades removed from pool after selection

---

## Part 6: Enemy Design (MVP Set)

### 6.1 Design Philosophy

Each enemy teaches one thing. No enemy exists as filler.

| Enemy | Teaches |
|-------|---------|
| Swarmer | Basic shooting and dodging |
| Drifter | Leading shots, timing |
| Turret | Pattern recognition |
| Elite (any) | Priority targeting |

### 6.2 Enemy Catalog

**Swarmer**

| Property | Value |
|----------|-------|
| First appearance | Zone 1 |
| Health | 5 (1 shot) |
| Speed | 120 pixels per second, downward drift |
| Behavior | Moves toward player in sine wave |
| Attack | Single bullet every 2 seconds, aimed at player |
| Echo value | 1 |
| Visual | Small, angular, insect-like |

**Drifter**

| Property | Value |
|----------|-------|
| First appearance | Zone 2 |
| Health | 12 (2 to 3 shots) |
| Speed | 80 pixels per second, horizontal movement |
| Behavior | Moves left/right across screen, bounces at edges |
| Attack | Triple spread every 2.5 seconds |
| Echo value | 2 |
| Visual | Medium, rounded, floaty |

**Turret**

| Property | Value |
|----------|-------|
| First appearance | Zone 3 |
| Health | 20 (4 shots) |
| Speed | Stationary |
| Behavior | Fixed position, rotates to track player |
| Attack | 4-bullet burst every 3 seconds |
| Echo value | 3 |
| Visual | Mechanical, visible barrel |

**Elite Variants**

Any enemy can spawn as elite (10% chance after Zone 2):
- 2.5x health
- Gold glow effect
- Guaranteed crystal drop on death
- 8 echoes instead of base value

### 6.3 Spawn Patterns

**Zone 1: The Drift**

- Swarmers only
- Spawn rate: 1 every 2 seconds
- No elites
- Purpose: Teach basic combat

**Zone 2: The Swarm**

- Swarmers (70%), Drifters (30%)
- Spawn rate: 1 every 1.5 seconds
- Elites possible (10%)
- Purpose: Increase pressure, introduce leading shots

**Zone 3: The Gauntlet**

- Swarmers (40%), Drifters (30%), Turrets (30%)
- Spawn rate: 1 every 1.2 seconds
- Turrets spawn at fixed screen positions
- Purpose: Pattern recognition, prioritization

**Zone 4: The Storm**

- All enemy types
- Spawn rate: 1 every 1 second
- Elite chance increased to 15%
- Environmental hazard: Lightning lanes (see hazards)
- Purpose: Peak intensity before boss

**Zone 5: The Hive**

- Reduced spawns during boss approach
- Boss encounter at zone midpoint
- Purpose: Culmination

---

## Part 7: Boss Design (One Boss Only)

### 7.1 Hive Queen (Zone 5)

**Design Philosophy**

The boss tests everything learned:
- Dodging (bullet patterns)
- Prioritization (spawned adds)
- Aggression (DPS check phases)
- Spatial awareness (movement patterns)

### 7.2 Phase Breakdown

**Phase 1: Stationary Assault (100% to 70% health)**

| Property | Value |
|----------|-------|
| Position | Top center, stationary |
| Health in phase | 150 HP |
| Attack 1 | Ring of 12 bullets expanding outward, every 3 seconds |
| Attack 2 | Aimed triple shot at player, every 2 seconds |
| Spawns | 2 Swarmers every 5 seconds |

Player learns: Boss attack patterns while managing adds.

**Phase 2: Mobile Aggression (70% to 30% health)**

| Property | Value |
|----------|-------|
| Position | Moves left/right across top third of screen |
| Health in phase | 200 HP |
| Attack 1 | Continuous aimed shots while moving (1 per second) |
| Attack 2 | Charges downward briefly every 8 seconds (telegraphed) |
| Spawns | 3 Swarmers every 6 seconds |

Player learns: Tracking moving target, avoiding charge attacks.

**Phase 3: Desperation (30% to 0% health)**

| Property | Value |
|----------|-------|
| Position | Erratic movement, faster |
| Health in phase | 150 HP |
| Attack 1 | Spiral bullet pattern (bullet hell lite) |
| Attack 2 | Spawns 4 Swarmers immediately, then no more spawns |
| Special | Void rises faster during this phase |

Player learns: Focus fire under pressure, no safe camping.

### 7.3 Boss UI

- Large health bar at top of screen
- Phase indicators (3 segments)
- Boss name displayed at fight start
- Phase transition: brief flash, audio sting

### 7.4 Boss Death

1. All bullets on screen disappear
2. Boss explosion (large particle burst)
3. Screen flash white
4. Victory jingle plays
5. Massive echo drop (50 echoes)
6. Void resets to bottom
7. Transition to RUN_VICTORY state

---

## Part 8: Zone Design (5 Zones Only)

### 8.1 Zone Structure

Each zone:
- 90 seconds of gameplay
- Checkpoint at end (except Zone 5 which has boss)
- Unique visual theme
- Escalating enemy composition

### 8.2 Zone Specifications

**Zone 1: The Drift**

| Property | Value |
|----------|-------|
| Duration | 90 seconds |
| Enemies | Swarmers only |
| Hazards | None |
| Elites | None |
| Visual | Starfield, blue nebula |
| Music | Ambient, 80 BPM |
| Emotional goal | Confidence building |

**Zone 2: The Swarm**

| Property | Value |
|----------|-------|
| Duration | 90 seconds |
| Enemies | Swarmers, Drifters |
| Hazards | None |
| Elites | 10% chance |
| Visual | Darker stars, green particles |
| Music | Building, 100 BPM |
| Emotional goal | Rising tension |

**Zone 3: The Gauntlet**

| Property | Value |
|----------|-------|
| Duration | 90 seconds |
| Enemies | All types |
| Hazards | None |
| Elites | 10% chance |
| Visual | Metallic debris, orange accents |
| Music | Driving, 110 BPM |
| Emotional goal | Challenge |

**Zone 4: The Storm**

| Property | Value |
|----------|-------|
| Duration | 90 seconds |
| Enemies | All types, increased spawn rate |
| Hazards | Lightning lanes |
| Elites | 15% chance |
| Visual | Electric blue, constant flashes |
| Music | Intense, 130 BPM |
| Emotional goal | Peak stress |

**Zone 5: The Hive**

| Property | Value |
|----------|-------|
| Duration | 45 seconds + boss fight |
| Enemies | Reduced spawns, then boss |
| Hazards | None (boss is the hazard) |
| Elites | None |
| Visual | Organic, amber/brown |
| Music | Building to boss theme |
| Emotional goal | Culmination |

### 8.3 Environmental Hazard: Lightning Lanes

**Zone 4 Only**

| Property | Value |
|----------|-------|
| Frequency | Every 5 seconds |
| Warning | 1.5 second telegraph (glowing line appears) |
| Danger zone | Vertical lane, 60 pixels wide |
| Damage | 1 hit point if in lane when lightning strikes |
| Visual | Electric blue line, then bright flash |

Player can see exactly where lightning will strike. Pure reaction test, completely fair.

---

## Part 9: User Interface

### 9.1 In-Game HUD

**Minimal Design Principle**

Only show what player needs RIGHT NOW. Everything else is noise.

**Layout**

| Element | Position | Visual |
|---------|----------|--------|
| Health (3 shields) | Top-left | Shield icons, break animation on damage |
| Echo counter | Top-right | Number with small icon |
| Graze combo | Below echoes | "x3" style, fades when inactive |
| Void pressure | Left edge | Thin vertical bar, color-coded |
| Mutation icons | Bottom-left | Small crystal icons |
| Dash cooldown | Bottom-right | Circular fill indicator |
| Zone progress | Top-center | Thin progress bar |

**Opacity Rules**

- All elements 60% opacity normally
- 100% opacity for 1 second when value changes
- Void pressure bar always 100% when above 50%

### 9.2 Checkpoint Screen

```
ZONE [X] COMPLETE
═══════════════════════════════

Echoes Collected:     [###]
Currently Carrying:   [###]

Your Void pushed back [X] times this zone.

─────────────────────────────

BANK ECHOES               CARRY FORWARD
(Guaranteed safe)         (1.3x bonus, 60% loss risk)

─────────────────────────────

Banked Total: [###]

[CONTINUE]

+ 1 Shield Restored
```

### 9.3 Death Screen

```
THE VOID CONSUMES
═══════════════════════════════

Zone Reached:     [X]
Time Survived:    [M:SS]
Best Graze Combo: [X]x

─────────────────────────────

Echoes Carried:   [###]
Lost to Void:     [###] (60%)
Salvaged:         [###]
Already Banked:   [###]

─────────────────────────────

TOTAL ECHOES GAINED: [###]

─────────────────────────────

>> You were [X.X] seconds from the checkpoint.

[ESCAPE AGAIN]          [RETURN TO HANGAR]
```

**Near-Miss Line**

This line is critical. It shows exactly how close the player was to surviving. This drives "one more try" behavior.

### 9.4 Level-Up Selection Screen

```
LEVEL UP
═══════════════════════════════

   [CARD 1]      [CARD 2]      [CARD 3]
   
   Rapid Fire   Void Resist   Echo Boost
   +20% fire    Void 20%      +25% echo
   rate         slower        collection
   
─────────────────────────────

Time slowed. Void still rising.
Choose quickly.
```

**Design Notes**

- Time slows but does not stop
- Void continues rising (slower)
- Creates urgency in selection
- Cards are click/tap targets

### 9.5 Main Menu

```
VOID RUNNER
═══════════════════════════════

[ESCAPE]        Start new run
[HANGAR]        Ships and upgrades
[SETTINGS]      Audio and controls

─────────────────────────────

Echoes: [###]
Best Zone: [X]
```

### 9.6 Hangar Screen

```
HANGAR
═══════════════════════════════

SHIPS
─────────────────────────────
[Wanderer]     [Striker]      [Phantom]
 Selected       400 Echoes     800 Echoes
                [UNLOCK]       [LOCKED]

STARTING UPGRADE
─────────────────────────────
Slot: [Empty / Equipped upgrade name]

[Thick Skin]   [Echo Magnet]  [Quick Dash]
 200 Echoes     300 Echoes     250 Echoes

─────────────────────────────

Echoes Available: [###]

[BACK]
```

---

## Part 10: Audio Requirements

### 10.1 Sound Effects List

**Player Actions**

| Sound | Trigger | Character |
|-------|---------|-----------|
| shoot_base | Fire weapon | Quick pew, satisfying |
| shoot_powered | Fire with mutations | Deeper, more bass |
| dash | Dash activated | Whoosh, brief |
| damage_taken | Player hit | Sharp impact, alarm |
| death | Player dies | Explosion into silence |
| echo_collect | Collect echo | Soft chime |
| crystal_collect | Collect crystal | Crystalline ring |
| graze | Near-miss bullet | Quick sparkle |
| levelup_appear | Level-up cards show | Magical flourish |
| levelup_select | Card chosen | Confirmation ding |

**Enemy Sounds**

| Sound | Trigger | Character |
|-------|---------|-----------|
| enemy_shoot | Enemy fires | Light pew |
| enemy_death | Enemy destroyed | Pop/burst |
| elite_spawn | Elite appears | Warning tone |
| turret_charge | Turret about to fire | Building whine |

**Boss Sounds**

| Sound | Trigger | Character |
|-------|---------|-----------|
| boss_intro | Boss appears | Dramatic sting |
| boss_phase | Phase transition | Reality shift |
| boss_charge | Boss charges at player | Aggressive roar |
| boss_death | Boss defeated | Massive explosion, triumph |

**Environmental**

| Sound | Trigger | Character |
|-------|---------|-----------|
| lightning_warn | Lightning lane appears | Electric crackle |
| lightning_strike | Lightning hits | Thunder crack |
| void_warning | Void above 70% | Low drone, heartbeat |
| checkpoint | Checkpoint reached | Relief tone |

**UI Sounds**

| Sound | Trigger | Character |
|-------|---------|-----------|
| menu_hover | Button hover | Soft tick |
| menu_select | Button click | Confirmation |
| menu_back | Back button | Soft whoosh |
| unlock | Ship/upgrade unlocked | Triumphant flourish |

### 10.2 Music Requirements

**Approach: Layered Intensity**

Single music track with layers that fade in/out based on game state.

| Layer | Content | Active When |
|-------|---------|-------------|
| Base | Ambient pad, key established | Always |
| Rhythm | Percussion | Zone 2+ |
| Intensity | Synth lead, fuller mix | Zone 4+ or Void above 60% |
| Boss | Unique track | Boss fight only |

**Zone BPM Targets**

| Zone | BPM | Feel |
|------|-----|------|
| Zone 1 | 85 | Calm, mysterious |
| Zone 2 | 100 | Building |
| Zone 3 | 110 | Driving |
| Zone 4 | 125 | Intense |
| Zone 5 | 130 | Climactic |
| Boss | 140 | Epic |

---

## Part 11: Technical Architecture

### 11.1 Technology Stack

| Component | Choice | Reasoning |
|-----------|--------|-----------|
| Rendering | Three.js | Requirement |
| Collision | Custom AABB | Simple, fast, sufficient |
| Audio | Howler.js | Reliable, handles layering |
| Build | Vite | Fast dev server |
| State | Plain JS classes | No framework overhead |
| Save | localStorage | Simple, sufficient |

### 11.2 File Structure

```
void-runner/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js
│   ├── Game.js
│   ├── states/
│   │   ├── StateMachine.js
│   │   ├── MainMenuState.js
│   │   ├── RunState.js
│   │   ├── CheckpointState.js
│   │   ├── BossState.js
│   │   ├── DeathState.js
│   │   └── HangarState.js
│   ├── entities/
│   │   ├── Player.js
│   │   ├── Bullet.js
│   │   ├── Enemy.js
│   │   ├── Swarmer.js
│   │   ├── Drifter.js
│   │   ├── Turret.js
│   │   └── HiveQueen.js
│   ├── systems/
│   │   ├── InputManager.js
│   │   ├── CollisionSystem.js
│   │   ├── SpawnSystem.js
│   │   ├── VoidSystem.js
│   │   ├── GrazeSystem.js
│   │   ├── MutationSystem.js
│   │   └── EchoSystem.js
│   ├── zones/
│   │   ├── ZoneManager.js
│   │   └── ZoneData.js
│   ├── ui/
│   │   ├── HUD.js
│   │   ├── MenuUI.js
│   │   └── ScreenTransitions.js
│   ├── audio/
│   │   └── AudioManager.js
│   ├── graphics/
│   │   ├── Renderer.js
│   │   └── ParticleSystem.js
│   └── data/
│       ├── ShipData.js
│       ├── UpgradeData.js
│       └── SaveManager.js
└── assets/
    ├── audio/
    │   ├── sfx/
    │   └── music/
    └── textures/
```

### 11.3 Save Data Schema

```javascript
{
  version: 1,
  echoes: 0,
  ships: {
    wanderer: { unlocked: true, selected: true },
    striker: { unlocked: false, selected: false },
    phantom: { unlocked: false, selected: false }
  },
  upgrades: {
    thickSkin: { unlocked: false, equipped: false },
    echoMagnet: { unlocked: false, equipped: false },
    quickDash: { unlocked: false, equipped: false }
  },
  stats: {
    totalRuns: 0,
    totalDeaths: 0,
    bossKills: 0,
    bestZone: 0,
    totalPlaytime: 0,
    totalEchoes: 0
  },
  settings: {
    masterVolume: 80,
    musicVolume: 70,
    sfxVolume: 80
  }
}
```

---

## Part 12: Development Milestones

### Milestone A: One-Minute Fun Loop

**Duration**: 2 days

**Goal**: Prove the core is fun with zero polish.

**Deliverables**

1. Ship moves following mouse with smoothing
2. Hold click to fire bullets upward
3. Swarmers spawn from top, drift down, shoot occasionally
4. Collision: bullets kill enemies, enemy bullets damage player
5. Void boundary rises from bottom
6. Void rises faster when no kills in 3 seconds
7. Touching Void equals instant death
8. Graze detection with small echo reward
9. Echo counter displays
10. Death resets game

**Acceptance Test**

Play 5 runs back to back. If you want to play a 6th, core is working. If not, identify what feels bad and fix before proceeding.

**No Art Required**

- Ship: White triangle
- Enemies: Red squares
- Bullets: Small circles
- Void: Purple gradient rectangle

---

### Milestone B: Run Progression

**Duration**: 3 days

**Goal**: Create "one more run" feeling.

**Deliverables**

1. Elite enemies spawn (10% chance, gold outline)
2. Elites drop crystals on death
3. Crystal collection mutates weapon immediately
4. 4 crystal types functional (Fury, Scatter, Pierce, Seeker)
5. Level-up every 45 seconds with 3 card choices
6. 8 upgrade types functional
7. Time-slow during level-up selection

**Acceptance Test**

Does the weapon feel meaningfully different after collecting 3 crystals? Do level-up choices feel impactful? Does any single upgrade feel mandatory (bad) or useless (bad)?

---

### Milestone C: Banking System

**Duration**: 1 day

**Goal**: Add meaningful risk/reward decisions.

**Deliverables**

1. Checkpoint state after 90 seconds
2. Checkpoint UI with bank/carry choice
3. Bank echoes to permanent wallet
4. Carry multiplier (1.3x) applied to next zone earnings
5. Death applies 60% loss to carried echoes
6. localStorage save/load for permanent echoes
7. Hangar shell (view echoes, no purchases yet)

**Acceptance Test**

Play a run where you bank at every checkpoint. Play a run where you carry at every checkpoint. Does the carry run feel more tense? Does banking feel like giving something up?

---

### Milestone D: Zones 1 Through 4

**Duration**: 1 week

**Goal**: Complete first 80% of run content.

**Deliverables**

1. Zone 1: Swarmers only, 90 seconds
2. Zone 2: Swarmers + Drifters, 90 seconds
3. Zone 3: All enemies including Turrets, 90 seconds
4. Zone 4: All enemies + Lightning hazard, 90 seconds
5. Zone intro screens (1.5 second name display)
6. Unique visual themes per zone (even if simple)
7. Music intensity increases per zone
8. Spawn patterns authored, not purely random

**Acceptance Test**

Can you identify which zone you're in within 5 seconds by visuals and enemy composition alone? Does Zone 4 feel significantly harder than Zone 1?

---

### Milestone E: Boss Fight

**Duration**: 1 week

**Goal**: Satisfying culmination of run.

**Deliverables**

1. Zone 5 pre-boss section (45 seconds)
2. Boss intro state (name display, dramatic entrance)
3. Hive Queen Phase 1: Stationary, ring bullets, spawns adds
4. Hive Queen Phase 2: Mobile, charge attacks
5. Hive Queen Phase 3: Desperation, spiral bullets, Void speeds up
6. Boss health bar UI
7. Boss death sequence (explosion, victory screen)
8. Run victory state with final stats
9. All echoes banked on victory

**Acceptance Test**

Fight the boss 10 times. Does each phase feel distinct? Can a player who has never seen the boss learn the patterns and win within 3 to 5 attempts? Does victory feel earned?

---

### Milestone F: Progression Meta

**Duration**: 4 days

**Goal**: Long-term engagement loop.

**Deliverables**

1. Hangar fully functional
2. Ship unlocks (Striker, Phantom) purchasable
3. Ships have different stats (not just cosmetic)
4. Starting upgrades purchasable and equippable
5. Statistics tracking (runs, deaths, best zone, etc.)
6. Death screen shows near-miss information
7. All UI polish (consistent styling)

**Acceptance Test**

After 30 minutes of play, can player afford first ship unlock? Does new ship feel different enough to justify the grind?

---

### Milestone G: Audio and Polish

**Duration**: 4 days

**Goal**: Feel professional, not game jam.

**Deliverables**

1. All sound effects implemented
2. Music with layered intensity
3. Screen shake on impacts
4. Particle effects (explosions, trails, graze sparks)
5. Visual feedback for all player actions
6. Menu transitions (fade/slide)
7. Performance optimization pass

**Acceptance Test**

Turn off music, play with just SFX. Does every action have feedback? Turn off SFX, play with just music. Does intensity match gameplay? Play for 20 minutes. Any performance hitches?

---

### Milestone H: Balance and Release

**Duration**: 3 days

**Goal**: Tuned difficulty curve, no game-breaking issues.

**Deliverables**

1. Playtest with 3 to 5 people unfamiliar with the game
2. Tune spawn rates based on feedback
3. Tune economy based on actual play data
4. Fix all game-breaking bugs
5. Fix all UI/UX confusion points
6. Final performance check

**Acceptance Test**

A new player should:
- Beat Zone 1 on first attempt (95%+)
- Reach Zone 3 within 3 attempts
- Reach Zone 5 within 8 attempts
- Beat boss within 15 attempts

---

## Part 13: Risk Mitigation

### 13.1 Identified Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Core loop isn't fun | Medium | Fatal | Test Milestone A heavily before proceeding |
| Economy breaks (too easy/hard) | High | Major | Use constraint-based math, playtest early |
| Boss too hard/easy | Medium | Major | Playtest with fresh eyes, tune HP and damage |
| Performance issues | Low | Major | Object pooling from start, profile regularly |
| Scope creep | High | Major | Strict milestone boundaries, no features added mid-milestone |

### 13.2 Scope Creep Prevention

**Forbidden Until After Release**

- Zones 6 through 10
- Additional bosses
- Cosmetic skins
- Achievements
- Leaderboards
- Mobile specific UI
- Controller support
- New enemy types
- New crystal types
- New upgrade types

These are not bad ideas. They are later ideas.

---

## Part 14: Definitions and Glossary

| Term | Definition |
|------|------------|
| Echo | Persistent currency, earned during runs, spent in Hangar |
| Crystal | Drop from elite enemies, mutates weapon on collection |
| Mutation | Weapon modification from crystal collection |
| The Void | Rising death boundary from bottom of screen |
| Banking | Choosing to save carried echoes at checkpoint (safe) |
| Carrying | Choosing to keep echoes for multiplier (risky) |
| Graze | Near-miss of enemy bullet, rewards echoes and pushes Void |
| Elite | Stronger enemy variant with guaranteed crystal drop |
| Zone | Distinct 90-second section of run with unique enemies |
| Run | Single playthrough from start until death or victory |
| Hangar | Meta-game hub for ship selection and upgrades |

---

## Document End

Total MVP scope:
- 5 zones
- 1 boss
- 4 enemy types
- 4 crystal types
- 8 level-up upgrades
- 3 ships
- 3 starting upgrades
- ~8 weeks development time

This is buildable. This is testable at every milestone. This is scoped to ship.

Every system connects to the core tension: The Void rises when you're passive. Only aggression survives.

Now build Milestone A.
