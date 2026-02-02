# GameTauri: Low Poly Rocket League Clone

## 🎯 Goal
Create a fast-paced, low-poly arcade driving soccer game playable locally.
- **Style**: Low Poly, Vibrant, Arcade.
- **Gameplay**: 2v2 (User + AI vs 2 AI). Cars jump, boost, and hit a giant ball into a goal.
- **Tech Stack**: Tauri (Rust), React (TypeScript), Three.js (Graphics), Rapier/Cannon (Physics), SQLite (Data).

## 🛠 Architecture

### 1. Rendering Engine (Frontend - TypeScript)
We will leverage the M1's GPU using WebGL/WebGPU via **Three.js** driven by **React Three Fiber (R3F)**.
- **Graphics**: Low poly meshes (cars, stadium, ball).
- **Shaders**: Custom shaders for "boost" trails, goal explosions, and shielding effects.
- **Performance**: 
    - InstanceMesh for crowd/arena parts.
    - Post-processing (Bloom, Motion Blur) for that "premium" feel.

### 2. Physics Engine
Physics must be deterministic and fast.
- **Library**: **Rapier.js (WASM)** or **Cannon-es**. Rapier is preferred for performance on M1.
- **Vehicle Controller**: Raycast vehicle controller implementation for arcade-y suspension and grip.

### 3. Input System
Unified Input Manager supporting:
- **Keyboard**: WASD / Arrows + Space (Jump) + Shift (Boost).
- **Gamepad**: Gamepad API for USB controllers (Xbox/PS/Generic).
- **Mapping**: Abstract "Actions" (Accelerate, Steer, Jump) to decouple hardware.

### 4. Data & Persistence (SQLite) 💾
Per user requirements, **SQLite** is the core data backbone.

#### A. In-Memory SQLite (`file::memory:`)
Used for high-speed temporary state management and "Black Box" recording.
- **ReplayBuffer**: Stores compressed frame snapshots (Position/Rotation/Velocity) every tick.
- **GameState**: Tables for `Entities`, `Scores`, `Events`.
- **Querying**: AI agents can query the in-memory DB to find "Ball Position" or "Nearest Opponent" (experimental/hybrid approach).

#### B. Persistent SQLite (`game.db`)
- **UserProfile**: Wins, Losses, Goals Scored.
- **MatchHistory**: Logs of played matches.
- **Settings**: Keybinds, Graphics Quality, Audio Levels.

### 5. Artificial Intelligence
- **Roles**: Striker vs Goalie.
- **Logic**: State Machine (FSM).
    - *Seek Ball*: Drive towards predicted ball position.
    - *Align*: Align car vector with goal vector.
    - *Boost*: Use boost if distant or need power.

## 📅 Roadmap

### Phase 1: Engine & Physics Setup
- [ ] Initialize R3F canvas and scene.
- [ ] Integrate Rapier physics world.
- [ ] Create a drivable car (Raycast Vehicle) with keyboard controls.
- [ ] Add the Ball and dynamic physics boundaries (Arena).

### Phase 2: Core Gameplay Loop
- [ ] Implement Gamepad support.
- [ ] Add "Boost" mechanic and "Jump" physics (forces).
- [ ] Goal detection and Score reset.
- [ ] basic HUD (Score, Time, Boost Meter).

### Phase 3: AI & SQLite Integration
- [ ] Implement `sqlite-memory` layer for game state tracking.
- [ ] Update AI to query state and drive cars.
- [ ] Persistent Stats (Save match result to disk).

### Phase 4: Polish & Juice
- [ ] Low poly assets (Car models, Stadium).
- [ ] Particle systems (Explosions, Trails).
- [ ] Sound FX.
