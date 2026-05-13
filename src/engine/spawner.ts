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

export function resetObstacleIds(): void {
  nextObstacleId = 1;
}

export function createObstacle(
  gameAreaWidth: number,
  width: number = DEFAULT_OBSTACLE_WIDTH,
  height: number = DEFAULT_OBSTACLE_HEIGHT,
): Obstacle {
  return { id: nextObstacleId++, x: gameAreaWidth, width, height };
}

export function getCurrentSpeed(elapsedTime: number): number {
  const ramp = Math.max(0, Math.min(elapsedTime, SPEED_RAMP_SECONDS));
  return Math.min(BASE_SPEED + ramp * SPEED_INCREMENT_PER_SECOND, MAX_SPEED);
}

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

export function nextSpawnInterval(
  elapsedTime: number,
  rng: () => number = Math.random,
): number {
  const { min, max } = getSpawnIntervalRange(elapsedTime);
  return min + rng() * (max - min);
}

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
