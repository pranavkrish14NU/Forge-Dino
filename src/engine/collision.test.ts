import { describe, expect, it } from 'vitest';
import {
  checkCollision,
  HITBOX_INSET,
  intersectsAABB,
  type AABB,
} from './collision';

const box = (x: number, y: number, w = 20, h = 20): AABB => ({
  x,
  y,
  width: w,
  height: h,
});

describe('intersectsAABB — basic overlap (inset=0)', () => {
  it('returns true for clearly overlapping boxes', () => {
    expect(intersectsAABB(box(0, 0, 20, 20), box(10, 10, 20, 20), 0)).toBe(true);
  });

  it('returns false for boxes separated horizontally', () => {
    expect(intersectsAABB(box(0, 0), box(100, 0), 0)).toBe(false);
  });

  it('returns false for boxes separated vertically', () => {
    expect(intersectsAABB(box(0, 0), box(0, 100), 0)).toBe(false);
  });

  it('returns false for edge-touching boxes (strict less-than)', () => {
    expect(intersectsAABB(box(0, 0, 20, 20), box(20, 0, 20, 20), 0)).toBe(false);
  });
});

describe('intersectsAABB — inset behavior', () => {
  it('default inset is HITBOX_INSET (3px)', () => {
    const a = box(0, 0, 20, 20);
    const justGrazing = box(15, 0, 20, 20);
    expect(intersectsAABB(a, justGrazing)).toBe(intersectsAABB(a, justGrazing, HITBOX_INSET));
  });

  it('inset shrinks the effective box (overlap becomes no-overlap when inset is large)', () => {
    const a = box(0, 0, 20, 20);
    const b = box(15, 0, 20, 20);
    expect(intersectsAABB(a, b, 0)).toBe(true);
    expect(intersectsAABB(a, b, 10)).toBe(false);
  });

  it('a near-miss within the inset margin does NOT trigger collision (forgiveness)', () => {
    const dino = box(60, 0, 36, 48);
    const obs = box(60 + 36 - 2, 0, 22, 44);
    expect(intersectsAABB(dino, obs, 0)).toBe(true);
    expect(intersectsAABB(dino, obs, HITBOX_INSET)).toBe(false);
  });

  it('a clear overlap inside the inset margin still triggers collision', () => {
    const dino = box(60, 0, 36, 48);
    const heavyOverlap = box(70, 0, 22, 44);
    expect(intersectsAABB(dino, heavyOverlap, HITBOX_INSET)).toBe(true);
  });
});

describe('intersectsAABB — vertical separation (dino jump clears obstacles)', () => {
  it('returns false when the dino is fully above a short obstacle', () => {
    const dino = box(60, 100, 36, 48);
    const cactus = box(60, 0, 22, 44);
    expect(intersectsAABB(dino, cactus)).toBe(false);
  });

  it('returns true when the dino is grounded and the obstacle overlaps horizontally', () => {
    const dino = box(60, 0, 36, 48);
    const cactus = box(80, 0, 22, 44);
    expect(intersectsAABB(dino, cactus)).toBe(true);
  });
});

describe('checkCollision — list scan', () => {
  it('returns false for an empty obstacle list', () => {
    expect(checkCollision(box(0, 0), [])).toBe(false);
  });

  it('returns true when any obstacle in the list overlaps the dino', () => {
    const dino = box(60, 0, 36, 48);
    const far = box(500, 0, 22, 44);
    const hit = box(70, 0, 22, 44);
    expect(checkCollision(dino, [far, hit])).toBe(true);
  });

  it('returns false when all obstacles are safely separated', () => {
    const dino = box(60, 0, 36, 48);
    const a = box(500, 0, 22, 44);
    const b = box(800, 0, 22, 44);
    expect(checkCollision(dino, [a, b])).toBe(false);
  });

  it('short-circuits on the first colliding obstacle (correctness only — does not assert iteration count)', () => {
    const dino = box(60, 0, 36, 48);
    const hit = box(70, 0, 22, 44);
    const farTwo = box(900, 0, 22, 44);
    expect(checkCollision(dino, [hit, farTwo])).toBe(true);
  });

  it('respects a custom inset', () => {
    const dino = box(60, 0, 36, 48);
    const grazing = box(60 + 36 - 2, 0, 22, 44);
    expect(checkCollision(dino, [grazing], 0)).toBe(true);
    expect(checkCollision(dino, [grazing], HITBOX_INSET)).toBe(false);
  });
});
