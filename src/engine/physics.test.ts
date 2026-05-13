import { describe, expect, it } from 'vitest';
import {
  applyJump,
  GRAVITY,
  GROUND_Y,
  initDino,
  JUMP_VELOCITY,
  updateDino,
  type DinoState,
} from './physics';

describe('initDino', () => {
  it('returns a grounded state at GROUND_Y with zero velocity', () => {
    const s = initDino();
    expect(s.y).toBe(GROUND_Y);
    expect(s.velocityY).toBe(0);
    expect(s.isGrounded).toBe(true);
  });
});

describe('applyJump', () => {
  it('sets velocity to JUMP_VELOCITY and unsets grounded when called from ground', () => {
    const s = applyJump(initDino());
    expect(s.velocityY).toBe(JUMP_VELOCITY);
    expect(s.isGrounded).toBe(false);
    expect(s.y).toBe(GROUND_Y);
  });

  it('is a no-op when called while airborne (mid-jump)', () => {
    const airborne: DinoState = { y: 100, velocityY: 200, isGrounded: false };
    const result = applyJump(airborne);
    expect(result).toEqual(airborne);
  });

  it('accepts a custom jump velocity', () => {
    const s = applyJump(initDino(), 1000);
    expect(s.velocityY).toBe(1000);
    expect(s.isGrounded).toBe(false);
  });
});

describe('updateDino — grounded fast-path', () => {
  it('returns the input state unchanged when already grounded', () => {
    const grounded = initDino();
    expect(updateDino(grounded, 0.016)).toBe(grounded);
  });
});

describe('updateDino — airborne motion', () => {
  it('rises immediately after jump (positive y after first frame)', () => {
    const afterJump = applyJump(initDino());
    const oneFrame = updateDino(afterJump, 0.016);
    expect(oneFrame.y).toBeGreaterThan(0);
    expect(oneFrame.isGrounded).toBe(false);
  });

  it('decelerates upward velocity due to gravity (parabolic arc)', () => {
    const afterJump = applyJump(initDino());
    const frame1 = updateDino(afterJump, 0.016);
    const frame2 = updateDino(frame1, 0.016);
    expect(frame2.velocityY).toBeLessThan(frame1.velocityY);
    const dvExpected = -GRAVITY * 0.016;
    expect(frame1.velocityY - afterJump.velocityY).toBeCloseTo(dvExpected, 6);
  });

  it('eventually reaches apex (velocity ≈ 0) then descends', () => {
    let s = applyJump(initDino());
    const dt = 0.01;
    let maxY = s.y;
    let saw_negative_velocity = false;
    for (let i = 0; i < 1000 && !s.isGrounded; i++) {
      s = updateDino(s, dt);
      maxY = Math.max(maxY, s.y);
      if (s.velocityY < 0) saw_negative_velocity = true;
    }
    expect(maxY).toBeGreaterThan(50);
    expect(saw_negative_velocity).toBe(true);
  });

  it('lands back on the ground (clamps y to 0, zeros velocity, sets grounded)', () => {
    let s = applyJump(initDino());
    const dt = 0.01;
    for (let i = 0; i < 1000 && !s.isGrounded; i++) {
      s = updateDino(s, dt);
    }
    expect(s.isGrounded).toBe(true);
    expect(s.y).toBe(GROUND_Y);
    expect(s.velocityY).toBe(0);
  });
});

describe('updateDino — symmetry of arc', () => {
  it('total airtime is approximately 2 * JUMP_VELOCITY / GRAVITY', () => {
    let s = applyJump(initDino());
    const dt = 0.001;
    let airtime = 0;
    while (!s.isGrounded && airtime < 5) {
      s = updateDino(s, dt);
      airtime += dt;
    }
    const expected = (2 * JUMP_VELOCITY) / GRAVITY;
    expect(airtime).toBeCloseTo(expected, 1);
  });
});

describe('updateDino — custom gravity', () => {
  it('uses provided gravity instead of default GRAVITY', () => {
    const afterJump = applyJump(initDino());
    const lowG = updateDino(afterJump, 0.016, GRAVITY / 2);
    const normalG = updateDino(afterJump, 0.016, GRAVITY);
    expect(lowG.velocityY).toBeGreaterThan(normalG.velocityY);
  });
});
