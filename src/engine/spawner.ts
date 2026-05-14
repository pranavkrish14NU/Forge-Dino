/**
 * Obstacle factory and per-frame motion for Dino Jump.
 *
 * Spawns cactus-like obstacles at the right edge, moves them left at a
 * gradually-increasing speed, and culls them once they're fully off-screen.
 * All randomness is injected (`nextSpawnInterval` takes an `rng` parameter)
 * so tests are deterministic. No React or DOM dependencies.
 *
 * Two independent difficulty curves:
 *   - Speed ramps linearly from 300 → 600 px/s over {@link SPEED_RAMP_SECONDS}.
 *   - Spawn-interval range ramps from [1.5, 2.5] → [0.8, 1.5] over
 *     {@link DIFFICULTY_RAMP_SECONDS}.
 */

export const BASE_SPEED = 300;
export const MAX_SPEED = 600;
export const SPEED_INCREMENT_PER_SECOND = 2;
export const SPEED_RAMP_SECONDS = (MAX_SPEED - BASE_SPEED) / SPEED_INCREMENT_PER_SECOND;
export const DIFFICULTY_RAMP_SECONDS = 60;

export const INITIAL_INTERVAL_MIN = 1.5;
export const INITIAL_INTERVAL_MAX = 2.5;
export const FINAL_INTERVAL_MIN = 0.8;
export const FINAL_INTERVAL_MAX = 1.5;

export const DEFAULT_OBSTACLE_WIDTH = 22;
export const DEFAULT_OBSTACLE_HEIGHT = 44;

export interface Obstacle {
  readonly id: number;
  readonly x: number;
  readonly width: number;
  readonly height: number;
}

let nextObstacleId = 1;

/** Reset the obstacle-id counter — used by tests so id assertions are stable. */
export function resetObstacleIds(): void {
  nextObstacleId = 1;
}

/**
 * Create a new obstacle positioned at the right edge of the play area.
 *
 * @param gameAreaWidth  current playfield width in px (live-measured by GameScreen via ResizeObserver)
 * @param width  obstacle width (default {@link DEFAULT_OBSTACLE_WIDTH})
 * @param height obstacle height (default {@link DEFAULT_OBSTACLE_HEIGHT})
 */
export function createObstacle(
  gameAreaWidth: number,
  width: number = DEFAULT_OBSTACLE_WIDTH,
  height: number = DEFAULT_OBSTACLE_HEIGHT,
): Obstacle {
  return { id: nextObstacleId++, x: gameAreaWidth, width, height };
}

/**
 * Returns the current scroll speed in px/sec for the given elapsed play time.
 * Linear ramp from BASE_SPEED to MAX_SPEED over SPEED_RAMP_SECONDS; clamped
 * at both ends so negative times yield BASE_SPEED and long sessions yield MAX_SPEED.
 */
export function getCurrentSpeed(elapsedTime: number): number {
  const ramp = Math.max(0, Math.min(elapsedTime, SPEED_RAMP_SECONDS));
  return Math.min(BASE_SPEED + ramp * SPEED_INCREMENT_PER_SECOND, MAX_SPEED);
}

/**
 * Returns the spawn-interval range {min, max} (in seconds) for the given
 * elapsed time. Linearly interpolates from the INITIAL_* range to the
 * tighter FINAL_* range over DIFFICULTY_RAMP_SECONDS so spawns get more
 * frequent as the game gets harder.
 */
export function getSpawnIntervalRange(elapsedTime: number): {
  readonly min: number;
  readonly max: number;
} {
  const t = Math.max(0, Math.min(elapsedTime / DIFFICULTY_RAMP_SECONDS, 1));
  return {
    min: INITIAL_INTERVAL_MIN + (FINAL_INTERVAL_MIN - INITIAL_INTERVAL_MIN) * t,
    max: INITIAL_INTERVAL_MAX + (FINAL_INTERVAL_MAX - INITIAL_INTERVAL_MAX) * t,
  };
}

/**
 * Draw a single spawn-interval (seconds) from the current range. The `rng`
 * parameter is injectable so tests can produce deterministic spawn timings.
 */
export function nextSpawnInterval(
  elapsedTime: number,
  rng: () => number = Math.random,
): number {
  const { min, max } = getSpawnIntervalRange(elapsedTime);
  return min + rng() * (max - min);
}

/**
 * Advance every obstacle's x by `-speed * deltaTime` and drop any that have
 * fully scrolled off the left edge (`x + width < 0`). Returns a new array;
 * the input is not mutated. The caller is responsible for the spawn step.
 */
export function updateObstacles(
  obstacles: readonly Obstacle[],
  deltaTime: number,
  speed: number,
): Obstacle[] {
  const result: Obstacle[] = [];
  const distance = speed * deltaTime;
  for (const obs of obstacles) {
    const newX = obs.x - distance;
    if (newX + obs.width < 0) continue;
    result.push({ ...obs, x: newX });
  }
  return result;
}
