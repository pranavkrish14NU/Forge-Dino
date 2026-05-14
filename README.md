# Dino Jump

A minimal browser-based endless-runner inspired by Chrome's offline dinosaur game, built with **React 19 + TypeScript + Vite**. The project is intentionally small (~15 source files, ~200 KB JS bundle, 0 production dependencies beyond React) so it doubles as a clean reference implementation for anyone learning React game patterns: a state machine, an `requestAnimationFrame` game loop, pure physics, AABB collision, and DOM-based rendering with CSS transforms.

## Gameplay

- Press **Space** or **ArrowUp** to start, then to jump.
- A dinosaur runs along a ground line. Cactus-shaped obstacles spawn from the right at randomized intervals and scroll left.
- The pace (speed + spawn frequency) ramps up gradually.
- Hitting an obstacle ends the game. Press Space to restart.
- A score counter increments while you play and freezes on game-over.

## Setup

Requires **Node.js 20+** and **npm 10+**.

```bash
git clone https://github.com/pranavkrish14NU/Forge-Dino.git
cd Forge-Dino
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run build        # production build into dist/, ~225 ms
npm run preview      # serve the built bundle locally
npm test             # vitest run, currently 162 tests
npm run typecheck    # tsc --noEmit, strict mode
npm run lint         # eslint src/
```

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build | Vite 8 | Fast HMR, tiny config |
| UI | React 19 | Hooks-only, no class components |
| Language | TypeScript 6 (strict) | No `any`, no unused locals/params, no implicit overrides |
| Test runner | Vitest 4 + @testing-library/react | Same syntax as Jest, native ESM |
| Rendering | DOM + CSS `transform: translate3d` | GPU-accelerated, no Canvas |
| Lint | ESLint v9 flat config + typescript-eslint | Catches `any`, unused vars, hook misuse |

No backend, no router, no state library, no animation framework.

## Module overview (src/)

```
src/
├── App.tsx                       # Renders <GameScreen />
├── main.tsx                      # React 19 createRoot entry
├── styles/global.css             # All CSS — tokens, layout, dino, obstacles, HUD, overlays
├── vite-env.d.ts                 # Vite + CSS module ambient types
├── test/setup.ts                 # vitest + jest-dom global setup
├── engine/                       # Pure TypeScript, zero React deps — testable in isolation
│   ├── gameState.ts              # ready | playing | game_over state machine
│   ├── physics.ts                # Dino jump physics (gravity, velocity, ground clamp)
│   ├── spawner.ts                # Obstacle creation, movement, off-screen culling
│   └── collision.ts              # AABB intersection with configurable inset
├── hooks/                        # React adapters around the engine
│   ├── useGameState.ts           # React state + actions wrapping gameState.ts
│   ├── useGameLoop.ts            # requestAnimationFrame loop, delta-clamped
│   └── useInputController.ts     # Keyboard → domain intents (START/JUMP/RESTART)
└── components/                   # Presentational DOM components
    ├── GameScreen.tsx            # Top-level container — wires hooks + engine modules
    ├── Dino.tsx                  # forwardRef styled <div>
    ├── ObstacleList.tsx          # Renders one <div> per active obstacle id
    ├── Hud.tsx                   # Score display (top-right, ~10 Hz throttled)
    └── Overlay.tsx               # Ready / Game Over overlays with semantic buttons
```

15 production files. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the data flow.

## Performance characteristics

- **60 fps** sustained on a 60 Hz display — position state lives in `useRef`, so per-frame motion does **not** trigger React re-renders. Only spawn/cull/score changes cause re-renders.
- **Input latency < 16 ms** — keydown → intent → physics is synchronous, applied on the next rAF tick.
- **Bundle size 198.90 kB raw / 62.86 kB gzip** — well under most CDN-cached page weights.

## Accessibility

- WCAG 2.1 AA: all colors checked against contrast targets (body text 16.78:1, button 5.04:1, dino vs sky 11.8:1).
- ARIA live region (`role="status"` `aria-live="polite"`) announces "Game started", "Game over. Final score: N".
- Game container has `role="application"` to signal it owns keyboard events.
- All buttons are semantic `<button>` elements with descriptive `aria-label`.
- Keyboard-only play-through is fully supported.
- Respects `prefers-reduced-motion` (disables the button hover transition).

## Cross-browser

Targets the latest Chrome, Firefox, Edge, and Safari. See [CROSS_BROWSER_CHECKLIST.md](./CROSS_BROWSER_CHECKLIST.md) for the manual smoke-test procedure. No polyfills or vendor shims required.

## License

MIT.
