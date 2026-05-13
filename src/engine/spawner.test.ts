import { beforeEach, describe, expect, it } from 'vitest';
import {
  BASE_SPEED,
  createObstacle,
  DEFAULT_OBSTACLE_HEIGHT,
  DEFAULT_OBSTACLE_WIDTH,
  DIFFICULTY_RAMP_SECONDS,
  FINAL_INTERVAL_MAX,
  FINAL_INTERVAL_MIN,
  getCurrentSpeed,
  getSpawnIntervalRange,
  INITIAL_INTERVAL_MAX,
  INITIAL_INTERVAL_MIN,
  MAX_SPEED,
  nextSpawnInterval,
  resetObstacleIds,
  SPEED_INCREMENT_PER_SECOND,
  SPEED_RAMP_SECONDS,
  updateObstacles,
  type Obstacle,
} from './spawner';

beforeEach(() => {
  resetObstacleIds();
});

describe('createObstacle', () => {
  it('produces an obstacle at the right edge with default size', () => {
    const o = createObstacle(960);
    expect(o.x).toBe(960);
    expect(o.width).toBe(DEFAULT_OBSTACLE_WIDTH);
    expect(o.height).toBe(DEFAULT_OBSTACLE_HEIGHT);
    expect(o.id).toBe(1);
  });

  it('assigns sequential ids across calls', () => {
    const a = createObstacle(960);
    const b = createObstacle(960);
    const c = createObstacle(960);
    expect([a.id, b.id, c.id]).toEqual([1, 2, 3]);
  });

  it('accepts custom width and height', () => {
    const o = createObstacle(960, 30, 60);
    expect(o.width).toBe(30);
    expect(o.height).toBe(60);
  });

  it('resetObstacleIds restarts the id counter', () => {
    createObstacle(960);
    createObstacle(960);
    resetObstacleIds();
    expect(createObstacle(960).id).toBe(1);
  });
});

describe('getCurrentSpeed', () => {
  it('returns BASE_SPEED at t=0', () => {
    expect(getCurrentSpeed(0)).toBe(BASE_SPEED);
  });

  it('increases linearly during the ramp', () => {
    expect(getCurrentSpeed(10)).toBe(BASE_SPEED + 10 * SPEED_INCREMENT_PER_SECOND);
  });

  it('caps at MAX_SPEED past the ramp end', () => {
    expect(getCurrentSpeed(SPEED_RAMP_SECONDS + 1)).toBe(MAX_SPEED);
    expect(getCurrentSpeed(SPEED_RAMP_SECONDS * 5)).toBe(MAX_SPEED);
  });

  it('30s of play is measurably faster than start (AC: difficulty increase by 30s)', () => {
    expect(getCurrentSpeed(30)).toBeGreaterThan(BASE_SPEED);
    expect(getCurrentSpeed(30) - getCurrentSpeed(0)).toBeGreaterThanOrEqual(20);
  });

  it('never returns a negative time effect', () => {
    expect(getCurrentSpeed(-5)).toBe(BASE_SPEED);
  });
});

describe('getSpawnIntervalRange', () => {
  it('returns the initial range at t=0', () => {
    const r = getSpawnIntervalRange(0);
    expect(r.min).toBe(INITIAL_INTERVAL_MIN);
    expect(r.max).toBe(INITIAL_INTERVAL_MAX);
  });

  it('returns the final tighter range at full ramp', () => {
    const r = getSpawnIntervalRange(DIFFICULTY_RAMP_SECONDS);
    expect(r.min).toBeCloseTo(FINAL_INTERVAL_MIN, 6);
    expect(r.max).toBeCloseTo(FINAL_INTERVAL_MAX, 6);
  });

  it('spawn cadence is faster after 30 seconds than at start (AC: difficulty increase by 30s)', () => {
    const r0 = getSpawnIntervalRange(0);
    const r30 = getSpawnIntervalRange(30);
    expect(r30.min).toBeLessThan(r0.min);
    expect(r30.max).toBeLessThan(r0.max);
  });

  it('clamps to final range past the ramp', () => {
    const r = getSpawnIntervalRange(DIFFICULTY_RAMP_SECONDS * 2);
    expect(r.min).toBeCloseTo(FINAL_INTERVAL_MIN, 6);
    expect(r.max).toBeCloseTo(FINAL_INTERVAL_MAX, 6);
  });
});

describe('nextSpawnInterval', () => {
  it('returns a value within the current range', () => {
    const v = nextSpawnInterval(0, () => 0.5);
    const r = getSpawnIntervalRange(0);
    expect(v).toBeGreaterThanOrEqual(r.min);
    expect(v).toBeLessThanOrEqual(r.max);
  });

  it('rng=0 yields the range min', () => {
    expect(nextSpawnInterval(0, () => 0)).toBe(INITIAL_INTERVAL_MIN);
  });

  it('rng=1 yields the range max', () => {
    expect(nextSpawnInterval(0, () => 1)).toBe(INITIAL_INTERVAL_MAX);
  });
});

describe('updateObstacles', () => {
  it('moves each obstacle left by speed * deltaTime', () => {
    const obs: Obstacle = { id: 1, x: 100, width: 20, height: 40 };
    const result = updateObstacles([obs], 0.1, 200);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBeCloseTo(80, 6);
  });

  it('culls obstacles fully off the left edge (x + width < 0)', () => {
    const onScreen: Obstacle = { id: 1, x: 100, width: 20, height: 40 };
    const justGone: Obstacle = { id: 2, x: -25, width: 20, height: 40 };
    const result = updateObstacles([onScreen, justGone], 0.016, 100);
    expect(result.map((o) => o.id)).toEqual([1]);
  });

  it('keeps obstacles whose width still overlaps the viewport edge', () => {
    const partial: Obstacle = { id: 3, x: -10, width: 20, height: 40 };
    const result = updateObstacles([partial], 0.016, 0);
    expect(result).toHaveLength(1);
  });

  it('returns an empty array for an empty input', () => {
    expect(updateObstacles([], 0.016, 300)).toEqual([]);
  });

  it('handles a long simulation without leaking obstacles (bounded count)', () => {
    let obs: Obstacle[] = [];
    for (let i = 0; i < 100; i++) {
      obs.push({ id: i + 1, x: 960, width: 22, height: 44 });
      obs = updateObstacles(obs, 0.5, 300);
    }
    expect(obs.length).toBeLessThanOrEqual(8);
  });
});
