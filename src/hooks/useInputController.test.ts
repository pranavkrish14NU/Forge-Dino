import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  intentForState,
  useInputController,
  type Intent,
} from './useInputController';
import type { GameState } from '../engine/gameState';

function pressKey(code: string, repeat = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { code, repeat, cancelable: true, bubbles: true });
  fireEvent(window, event);
  return event;
}

describe('intentForState — pure mapping', () => {
  it('maps ready → START', () => {
    expect(intentForState('ready')).toBe('START');
  });
  it('maps playing → JUMP', () => {
    expect(intentForState('playing')).toBe('JUMP');
  });
  it('maps game_over → RESTART', () => {
    expect(intentForState('game_over')).toBe('RESTART');
  });
});

describe('useInputController — keyboard → intent dispatch', () => {
  it('dispatches START when Space is pressed in ready state', () => {
    const onIntent = vi.fn<(i: Intent) => void>();
    renderHook(() => useInputController('ready' as GameState, onIntent));
    pressKey('Space');
    expect(onIntent).toHaveBeenCalledWith('START');
  });

  it('dispatches START when ArrowUp is pressed in ready state', () => {
    const onIntent = vi.fn<(i: Intent) => void>();
    renderHook(() => useInputController('ready' as GameState, onIntent));
    pressKey('ArrowUp');
    expect(onIntent).toHaveBeenCalledWith('START');
  });

  it('dispatches JUMP when Space is pressed in playing state', () => {
    const onIntent = vi.fn<(i: Intent) => void>();
    renderHook(() => useInputController('playing' as GameState, onIntent));
    pressKey('Space');
    expect(onIntent).toHaveBeenCalledWith('JUMP');
  });

  it('dispatches JUMP when ArrowUp is pressed in playing state', () => {
    const onIntent = vi.fn<(i: Intent) => void>();
    renderHook(() => useInputController('playing' as GameState, onIntent));
    pressKey('ArrowUp');
    expect(onIntent).toHaveBeenCalledWith('JUMP');
  });

  it('dispatches RESTART when Space is pressed in game_over state', () => {
    const onIntent = vi.fn<(i: Intent) => void>();
    renderHook(() => useInputController('game_over' as GameState, onIntent));
    pressKey('Space');
    expect(onIntent).toHaveBeenCalledWith('RESTART');
  });
});

describe('useInputController — auto-repeat filtering', () => {
  it('ignores keydown events with event.repeat === true', () => {
    const onIntent = vi.fn<(i: Intent) => void>();
    renderHook(() => useInputController('playing' as GameState, onIntent));
    pressKey('Space', true);
    pressKey('Space', true);
    pressKey('Space', true);
    expect(onIntent).not.toHaveBeenCalled();
  });

  it('still dispatches one intent per non-repeat keydown', () => {
    const onIntent = vi.fn<(i: Intent) => void>();
    renderHook(() => useInputController('playing' as GameState, onIntent));
    pressKey('Space');
    pressKey('Space', true);
    pressKey('Space');
    expect(onIntent).toHaveBeenCalledTimes(2);
  });
});

describe('useInputController — key filtering', () => {
  it('ignores non-activation keys (Enter, KeyA)', () => {
    const onIntent = vi.fn<(i: Intent) => void>();
    renderHook(() => useInputController('ready' as GameState, onIntent));
    pressKey('Enter');
    pressKey('KeyA');
    pressKey('Escape');
    expect(onIntent).not.toHaveBeenCalled();
  });
});

describe('useInputController — preventDefault on activation keys', () => {
  it('calls preventDefault on Space to suppress page scroll', () => {
    const onIntent = vi.fn<(i: Intent) => void>();
    renderHook(() => useInputController('playing' as GameState, onIntent));
    const evt = pressKey('Space');
    expect(evt.defaultPrevented).toBe(true);
  });
});

describe('useInputController — state changes mid-mount', () => {
  it('dispatches the intent matching the current state at keypress time, not at mount time', () => {
    const onIntent = vi.fn<(i: Intent) => void>();
    const { rerender } = renderHook(
      ({ state }: { state: GameState }) => useInputController(state, onIntent),
      { initialProps: { state: 'ready' as GameState } },
    );
    pressKey('Space');
    expect(onIntent).toHaveBeenLastCalledWith('START');
    rerender({ state: 'playing' });
    pressKey('Space');
    expect(onIntent).toHaveBeenLastCalledWith('JUMP');
    rerender({ state: 'game_over' });
    pressKey('Space');
    expect(onIntent).toHaveBeenLastCalledWith('RESTART');
  });
});

describe('useInputController — cleanup', () => {
  it('removes the keydown listener on unmount (no orphaned listeners)', () => {
    const onIntent = vi.fn<(i: Intent) => void>();
    const { unmount } = renderHook(() =>
      useInputController('ready' as GameState, onIntent),
    );
    pressKey('Space');
    expect(onIntent).toHaveBeenCalledTimes(1);
    unmount();
    pressKey('Space');
    expect(onIntent).toHaveBeenCalledTimes(1);
  });
});

describe('useInputController — callback swap', () => {
  it('uses the latest onIntent callback without re-binding the listener', () => {
    const first = vi.fn<(i: Intent) => void>();
    const second = vi.fn<(i: Intent) => void>();
    const { rerender } = renderHook(
      ({ cb }: { cb: (i: Intent) => void }) =>
        useInputController('ready' as GameState, cb),
      { initialProps: { cb: first } },
    );
    pressKey('Space');
    expect(first).toHaveBeenCalledTimes(1);
    rerender({ cb: second });
    pressKey('Space');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
