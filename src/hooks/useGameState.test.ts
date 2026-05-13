import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useGameState } from './useGameState';

describe('useGameState', () => {
  it('initializes in ready state with zero score', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.state).toBe('ready');
    expect(result.current.score).toBe(0);
  });

  it('starts the game', () => {
    const { result } = renderHook(() => useGameState());
    let started = false;
    act(() => {
      started = result.current.start();
    });
    expect(started).toBe(true);
    expect(result.current.state).toBe('playing');
  });

  it('ignores start when already playing', () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.start();
    });
    let started: boolean | undefined;
    act(() => {
      started = result.current.start();
    });
    expect(started).toBe(false);
    expect(result.current.state).toBe('playing');
  });

  it('ends the game with a final score', () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.start();
    });
    let ended = false;
    act(() => {
      ended = result.current.endGame(77);
    });
    expect(ended).toBe(true);
    expect(result.current.state).toBe('game_over');
    expect(result.current.score).toBe(77);
  });

  it('rejects endGame when in ready state', () => {
    const { result } = renderHook(() => useGameState());
    let ended: boolean | undefined;
    act(() => {
      ended = result.current.endGame(10);
    });
    expect(ended).toBe(false);
    expect(result.current.state).toBe('ready');
  });

  it('restarts from game_over and resets score', () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.endGame(55);
    });
    let restarted = false;
    act(() => {
      restarted = result.current.restart();
    });
    expect(restarted).toBe(true);
    expect(result.current.state).toBe('playing');
    expect(result.current.score).toBe(0);
  });

  it('rejects restart when not in game_over', () => {
    const { result } = renderHook(() => useGameState());
    let restarted: boolean | undefined;
    act(() => {
      restarted = result.current.restart();
    });
    expect(restarted).toBe(false);
    expect(result.current.state).toBe('ready');
  });
});
