import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameLoop } from './useGameLoop';
import type { GameState } from '../engine/gameState';

interface RafFrame {
  readonly id: number;
  readonly cb: FrameRequestCallback;
}

let frames: RafFrame[] = [];
let nextId = 1;
let cancelledIds: number[] = [];

beforeEach(() => {
  frames = [];
  cancelledIds = [];
  nextId = 1;

  vi.stubGlobal(
    'requestAnimationFrame',
    (cb: FrameRequestCallback): number => {
      const id = nextId++;
      frames.push({ id, cb });
      return id;
    },
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number): void => {
    cancelledIds.push(id);
    frames = frames.filter((f) => f.id !== id);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function flushFrame(time: number): void {
  const next = frames.shift();
  if (!next) return;
  act(() => next.cb(time));
}

describe('useGameLoop — lifecycle gating', () => {
  it('does not start the loop while state is ready', () => {
    const onUpdate = vi.fn();
    renderHook(({ state }: { state: GameState }) => useGameLoop(state, onUpdate), {
      initialProps: { state: 'ready' as GameState },
    });
    expect(frames.length).toBe(0);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('starts the loop when state becomes playing', () => {
    const onUpdate = vi.fn();
    const { rerender } = renderHook(
      ({ state }: { state: GameState }) => useGameLoop(state, onUpdate),
      { initialProps: { state: 'ready' as GameState } },
    );
    rerender({ state: 'playing' });
    expect(frames.length).toBe(1);
  });

  it('cancels the rAF when state transitions back to ready', () => {
    const onUpdate = vi.fn();
    const { rerender } = renderHook(
      ({ state }: { state: GameState }) => useGameLoop(state, onUpdate),
      { initialProps: { state: 'playing' as GameState } },
    );
    expect(frames.length).toBe(1);
    rerender({ state: 'ready' });
    expect(cancelledIds.length).toBeGreaterThanOrEqual(1);
  });

  it('cancels the rAF when state transitions to game_over', () => {
    const onUpdate = vi.fn();
    const { rerender } = renderHook(
      ({ state }: { state: GameState }) => useGameLoop(state, onUpdate),
      { initialProps: { state: 'playing' as GameState } },
    );
    expect(frames.length).toBe(1);
    rerender({ state: 'game_over' });
    expect(cancelledIds.length).toBeGreaterThanOrEqual(1);
  });

  it('cancels the rAF on component unmount', () => {
    const onUpdate = vi.fn();
    const { unmount } = renderHook(
      ({ state }: { state: GameState }) => useGameLoop(state, onUpdate),
      { initialProps: { state: 'playing' as GameState } },
    );
    expect(frames.length).toBe(1);
    unmount();
    expect(cancelledIds.length).toBeGreaterThanOrEqual(1);
  });
});

describe('useGameLoop — update callback', () => {
  it('calls the update callback on each frame after the first calibration frame', () => {
    const onUpdate = vi.fn();
    renderHook(() => useGameLoop('playing' as GameState, onUpdate));
    flushFrame(0);
    expect(onUpdate).not.toHaveBeenCalled();
    flushFrame(16);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    flushFrame(32);
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });

  it('passes deltaTime in seconds (positive float < 0.05)', () => {
    const onUpdate = vi.fn();
    renderHook(() => useGameLoop('playing' as GameState, onUpdate));
    flushFrame(0);
    flushFrame(16);
    const [dt] = onUpdate.mock.calls[0] as [number];
    expect(dt).toBeGreaterThan(0);
    expect(dt).toBeLessThanOrEqual(0.05);
    expect(dt).toBeCloseTo(0.016, 3);
  });

  it('clamps deltaTime to 0.05 (50ms) when raw delta exceeds the cap', () => {
    const onUpdate = vi.fn();
    renderHook(() => useGameLoop('playing' as GameState, onUpdate));
    flushFrame(0);
    flushFrame(5000);
    const [dt] = onUpdate.mock.calls[0] as [number];
    expect(dt).toBe(0.05);
  });

  it('keeps requesting frames while playing (continuous loop)', () => {
    const onUpdate = vi.fn();
    renderHook(() => useGameLoop('playing' as GameState, onUpdate));
    flushFrame(0);
    flushFrame(16);
    flushFrame(32);
    flushFrame(48);
    expect(frames.length).toBeGreaterThan(0);
  });
});

describe('useGameLoop — ref-stable callback', () => {
  it('uses the latest callback without resubscribing the rAF loop', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ cb }: { cb: (dt: number) => void }) => useGameLoop('playing' as GameState, cb),
      { initialProps: { cb: first } },
    );
    flushFrame(0);
    flushFrame(16);
    expect(first).toHaveBeenCalledTimes(1);
    rerender({ cb: second });
    flushFrame(32);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1);
    expect(cancelledIds.length).toBe(0);
  });
});
