/**
 * Pure jump physics for the dinosaur.
 *
 * Convention used throughout: `y` is "height above the ground line" with
 * positive = up. `velocityY > 0` means moving up. Gravity is a positive
 * magnitude that's subtracted from velocity each frame. The rendering layer
 * negates y when applying the CSS transform (`translate3d(0, -y, 0)`)
 * because CSS Y is down-positive.
 *
 * No React or DOM dependencies — testable in isolation.
 */

/** Initial upward velocity, in pixels per second, applied at jump start. */
export const JUMP_VELOCITY = 600;

/** Downward acceleration in pixels per second squared. */
export const GRAVITY = 1800;

/** Ground line height (y) — the dino's resting position. */
export const GROUND_Y = 0;

export interface DinoState {
  readonly y: number;
  readonly velocityY: number;
  readonly isGrounded: boolean;
}

/** Returns the resting state — used on mount and on every START/RESTART. */
export function initDino(): DinoState {
  return { y: GROUND_Y, velocityY: 0, isGrounded: true };
}

/**
 * Apply a jump impulse. The `isGrounded` guard is what enforces the
 * "no double-jump" requirement: if the dino is already airborne, the input
 * is silently dropped (we return the input state unchanged so callers can
 * always write `state = applyJump(state)` without an extra branch).
 *
 * @param state         current dino state
 * @param jumpVelocity  override (mostly for tests); defaults to {@link JUMP_VELOCITY}
 */
export function applyJump(state: DinoState, jumpVelocity: number = JUMP_VELOCITY): DinoState {
  if (!state.isGrounded) return state;
  return { y: state.y, velocityY: jumpVelocity, isGrounded: false };
}

/**
 * Advance physics by `deltaTime` seconds. Decelerates the upward velocity
 * by `gravity * deltaTime`, then advances position. If the dino's new y
 * crosses the ground, we clamp to y=0, zero velocity, and flip grounded
 * back to true.
 *
 * The grounded fast-path returns the input identity — important for keeping
 * `updateDino(grounded, ...) === grounded` true so that GameScreen's per-
 * frame work is allocation-free while the dino is resting.
 *
 * @param state      current dino state
 * @param deltaTime  seconds since last frame (already clamped to ≤ 0.05s by useGameLoop)
 * @param gravity    override (mostly for tests); defaults to {@link GRAVITY}
 */
export function updateDino(
  state: DinoState,
  deltaTime: number,
  gravity: number = GRAVITY,
): DinoState {
  if (state.isGrounded) return state;

  const nextVelocity = state.velocityY - gravity * deltaTime;
  const nextY = state.y + nextVelocity * deltaTime;

  if (nextY <= GROUND_Y) {
    return { y: GROUND_Y, velocityY: 0, isGrounded: true };
  }
  return { y: nextY, velocityY: nextVelocity, isGrounded: false };
}
