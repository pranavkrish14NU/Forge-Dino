# Architecture

This document describes how the modules in `src/` fit together, the data flow during one frame of gameplay, and the rationale for the major design decisions.

## Layering

The codebase has three concentric layers. Each inner layer is pure — it can be reasoned about and tested without touching the outer ones.

```
┌─────────────────────────────────────────────────────────────────────┐
│  components/         (DOM rendering — React JSX)                    │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │  hooks/          (React adapters — useState, useRef, useEffect)│ │
│   │   ┌────────────────────────────────────────────────────────┐ │ │
│   │   │  engine/      (pure TypeScript — no React, no DOM)     │ │ │
│   │   │  gameState.ts │ physics.ts │ spawner.ts │ collision.ts │ │ │
│   │   └────────────────────────────────────────────────────────┘ │ │
│   └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

- `engine/` modules are deterministic state-in/state-out functions. They never import React, never read the DOM, never call `Math.random()` directly without an injectable `rng` parameter.
- `hooks/` are the only place where React lifecycle (`useRef`, `useEffect`, `useState`) meets the engine. Each hook wraps one engine concern.
- `components/` is the thinnest layer — it renders the current state and dispatches user actions back through hooks. The only component that wires multiple subsystems is `GameScreen.tsx`.

## State machine

`engine/gameState.ts` defines the only state machine in the app:

```
        ┌─────────┐  start    ┌──────────┐  endGame     ┌────────────┐
init ──▶│ ready   │──────────▶│ playing  │─────────────▶│ game_over  │
        └─────────┘           └──────────┘              └────────────┘
             ▲                                                │
             │                  restart                       │
             └────────────────────────────────────────────────┘
```

Every transition function (`startGame`, `endGame`, `restartGame`) checks the source state explicitly and returns the original state if the transition is invalid. There are no other valid states.

## Per-frame data flow during 'playing'

Once the user presses Space on the ready overlay, the loop runs every animation frame:

```
keydown event
      │
      ▼
useInputController (filters event.repeat, gates to Space/ArrowUp)
      │
      ▼
GameScreen.dispatchIntent(intent)
      │
      ├─ START   → useGameState.start()    + resetWorld()
      ├─ JUMP    → physics.applyJump(dinoStateRef.current)
      └─ RESTART → useGameState.restart()  + resetWorld()

requestAnimationFrame tick (driven by useGameLoop)
      │
      ▼
GameScreen.onLoopUpdate(deltaTime)         // deltaTime clamped to ≤ 0.05s
      │
      ├─ physics.updateDino(dinoStateRef.current, deltaTime)
      │     → write transform: translate3d(0, -y, 0) on dino DOM node
      │
      ├─ spawner.updateObstacles(obstaclesRef.current, deltaTime, getCurrentSpeed(elapsed))
      │     → cull off-screen, return new array
      │     → maybe spawn new obstacle if elapsedSinceSpawn ≥ nextSpawnInterval
      │     → write transform: translate3d(x, 0, 0) on each obstacle DOM node
      │
      ├─ scoreRef.current += deltaTime * SCORE_RATE
      │     → throttled flush to displayedScore state at ~10 Hz
      │
      └─ collision.checkCollision(dinoAABB, obstacleAABBs, HITBOX_INSET=3)
            → if true: useGameState.endGame(Math.floor(scoreRef.current))
                       (loop halts on next state change because useGameLoop is keyed on state)
```

Key invariant: **all per-frame state lives in refs** (`dinoStateRef`, `obstaclesRef`, `obstacleElsRef` Map, `scoreRef`, `elapsedRef`, `timeSinceSpawnRef`, `nextSpawnIntervalRef`, `gameAreaWidthRef`). Position is applied to the DOM by direct `el.style.transform` writes, not via React. The only `useState` values in `GameScreen` are `obstacleIds` (updates only on spawn/cull, not movement) and `displayedScore` (throttled to ~10 Hz). React reconciliation never runs at 60 fps.

## Module responsibilities

| Module | Responsibility | Touched by |
|---|---|---|
| `engine/gameState.ts` | State union + 3 guarded transitions | `useGameState`, `GameScreen` (indirectly) |
| `engine/physics.ts`   | Dino position update under gravity, jump initiation gated on isGrounded | `GameScreen.onLoopUpdate`, `dispatchIntent` |
| `engine/spawner.ts`   | Obstacle factory, speed/interval ramps, immutable list update with culling | `GameScreen.onLoopUpdate` |
| `engine/collision.ts` | AABB intersection with configurable inset, list scan with short-circuit | `GameScreen.onLoopUpdate` |
| `hooks/useGameState.ts`     | React state + memoized action callbacks wrapping the state machine | `GameScreen` |
| `hooks/useGameLoop.ts`      | rAF lifecycle, delta-clamp, ref-stable callback, dev FPS log | `GameScreen` |
| `hooks/useInputController.ts` | window keydown listener, intent mapping per current state | `GameScreen` |
| `components/Dino.tsx` | Styled `<div>` exposing its DOM node via forwardRef | `GameScreen` |
| `components/ObstacleList.tsx` | One styled `<div>` per active obstacle id, registers each into a parent-owned ref Map | `GameScreen` |
| `components/Overlay.tsx` | Ready and game-over overlays with semantic buttons + ARIA labels | `GameScreen` |
| `components/Hud.tsx` | Top-right score display, padded 4-digit, tabular-nums | `GameScreen` |
| `components/GameScreen.tsx` | Top-level orchestrator. Wires every hook + engine module. The only large component. | `App` |

## Design decisions and trade-offs

- **DOM + CSS transforms vs. Canvas.** DOM is simpler to read and learn from, and works fine at low entity counts (< 20 active DOM nodes). CSS `translate3d` is GPU-composited so position changes don't trigger layout. Canvas would be required only if the scene had hundreds of moving sprites.
- **Refs for per-frame state.** A React `useState` setter at 60 Hz would cause reconciliation 60 times per second. Using refs keeps the loop allocation-free and avoids React re-renders entirely during steady gameplay.
- **State machine as a pure module.** `gameState.ts` is testable without React. The hook is a thin adapter. This split makes the state-machine logic provable in isolation (16 unit tests cover every transition + every illegal transition).
- **Delta-time clamp at 50 ms.** When a tab is hidden, rAF pauses; on resume the first frame can have a delta of seconds, which would teleport the dino through obstacles. Clamping to 50 ms turns that into one frame of slow-motion, then the loop continues normally.
- **Hitbox inset (3 px).** Visual rectangles touching is not the same as "you hit the cactus" from the player's perspective. Insetting both hitboxes by 3 px gives a small forgiveness margin that makes near-misses feel fair.
- **ResizeObserver for game area width.** The hardcoded 960 px was correct only at one viewport width. Observing the playfield's actual width means obstacles always spawn at the visible right edge, regardless of how the user resized.
- **Score throttling at 10 Hz.** The score accumulates at 10 points/second, so the displayed integer changes ~10 times per second. Updating React state at 10 Hz instead of 60 Hz cuts HUD reconciliation work by 6× without any visible loss of fidelity.
- **Intent-based input layer.** Keyboard events and button clicks both produce domain intents (`START` / `JUMP` / `RESTART`). The same `dispatchIntent` routes both. This means future input sources (gamepad, touch) plug in by emitting intents — no changes needed in physics or state.

## Testing strategy

- Engine modules: pure unit tests. Inject `rng` for spawner, custom gravity for physics, custom inset for collision.
- Hooks: `renderHook` from `@testing-library/react`, with rAF and ResizeObserver mocked / feature-detected.
- Components: render + fire events + assert DOM and ARIA. No browser screenshot tests.
- Integration: `GameScreen.test.tsx` covers full-cycle flows (ready → start → jump → endGame → restart) through test-only props like `testEndGame`, `testGetDinoState`, `testGetObstacles`, `testOnIntent` that expose internal refs and dispatchers without polluting production behavior.

162 tests across 13 files cover the engine, hooks, components, and the App entry. tsc strict, eslint flat config, vitest, vite build — all clean.
