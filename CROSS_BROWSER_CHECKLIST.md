# Cross-Browser Validation Checklist (WO-012)

Manual smoke-test pass to confirm the game works across the four PRD-target browsers.
Run `npm run dev` and open `http://localhost:5173` in each browser, then walk through
every row below.

## Automated checks (already verified in CI)

| Check | Status | Notes |
|---|---|---|
| `tsc --noEmit` | passing | 0 errors |
| `eslint src/` | passing | 0 errors, 0 warnings |
| `vitest run` | passing | 162 / 162 |
| `vite build` | passing | ~225 ms |
| Bundle size | passing | `dist/` ~201 KB total, JS gzip ~63 KB |
| Source file count (non-test) | passing | 15 production files in `src/` plus 1 test setup + 1 type declaration |

## Manual cross-browser matrix

For each browser, follow steps 1–8 and tick the box. **Mark FAIL with a note if anything misbehaves.**

| Browser | Step 1 load | Step 2 ready overlay | Step 3 start (Space) | Step 4 jump (Space mid-play) | Step 5 collide | Step 6 game-over overlay shows score | Step 7 restart (Space) | Step 8 no console errors |
|---|---|---|---|---|---|---|---|---|
| Chrome (latest) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Firefox (latest) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Edge (latest) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Safari (latest) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

## Performance — Chrome + Firefox DevTools Performance panel

1. Open DevTools Performance tab.
2. Start a recording.
3. Click Start, play for ~10 seconds (dodge a few obstacles).
4. Stop the recording.
5. Confirm **frame rate stays at ~60 fps** (red bars or jank should be sparse).
6. Confirm jump response lands within 1 frame of keypress (look for the keydown event lining up with the first physics tick).

| Browser | 60 fps sustained? | Input latency ≤ 16 ms? |
|---|---|---|
| Chrome | ☐ | ☐ |
| Firefox | ☐ | ☐ |

## Accessibility — keyboard-only

1. Tab to the page (do NOT click). The Start button should already have focus (autoFocus + role=application).
2. Press Space → game starts.
3. Press Space mid-air → dino does NOT double-jump.
4. Hit a cactus → game-over overlay appears.
5. Press Space → game restarts.

| Step | Pass? |
|---|---|
| Initial focus on Start button | ☐ |
| Space → playing | ☐ |
| No double-jump on hold | ☐ |
| Game-over shows | ☐ |
| Space → restart | ☐ |

## Accessibility — screen reader (VoiceOver on macOS / NVDA on Windows)

1. Enable the screen reader.
2. Navigate to the game.
3. Confirm announcements:
   - "Dino Jump game" application label
   - "Game ready. Press Space to start." on load
   - "Game started." after Space
   - "Game over. Final score: N." after collision
   - Restart button announces final score in its accessible name

| Announcement | Pass? |
|---|---|
| Application label | ☐ |
| Ready state | ☐ |
| Started state | ☐ |
| Game over with score | ☐ |
| Restart button label includes score | ☐ |

## Responsive — DevTools device toolbar / window resize

1. Resize window to widths 1024 px, 1280 px, 1600 px, 1920 px.
2. Confirm no horizontal scrollbar at any width.
3. Confirm obstacles still spawn at the right edge after resize (WO-011 ResizeObserver).
4. Set browser zoom to 100 %, 125 %, 150 %.
5. Confirm game is still playable at each zoom level.

| Width / Zoom | Pass? |
|---|---|
| 1024 px | ☐ |
| 1280 px | ☐ |
| 1600 px | ☐ |
| 1920 px | ☐ |
| Zoom 100 % | ☐ |
| Zoom 125 % | ☐ |
| Zoom 150 % | ☐ |

## Tab visibility edge cases

1. Start game → switch to another tab for ~10 seconds → come back.
2. Confirm dino has NOT teleported and obstacles have NOT skipped past it.
3. Repeat with browser window minimized + restored.
4. Repeat with rapid Alt+Tab (focus lost/regained).

| Edge case | Pass? |
|---|---|
| Tab away + return: no teleport | ☐ |
| Minimize + restore: no teleport | ☐ |
| Alt+Tab focus cycles: no erratic behavior | ☐ |

---

**If anything fails**, note it inline with browser + exact reproduction steps, then fix
in a follow-up commit before merging WO-012.
