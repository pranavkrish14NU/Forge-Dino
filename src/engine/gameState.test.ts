import { describe, expect, it } from 'vitest';
import {
  canTransition,
  endGame,
  initialSession,
  restartGame,
  startGame,
  type GameSession,
} from './gameState';

const playing: GameSession = { state: 'playing', score: 0, startTime: 1000 };
const gameOver: GameSession = { state: 'game_over', score: 42, startTime: 1000 };

describe('canTransition', () => {
  it('allows ready → playing', () => {
    expect(canTransition('ready', 'playing')).toBe(true);
  });
  it('allows playing → game_over', () => {
    expect(canTransition('playing', 'game_over')).toBe(true);
  });
  it('allows game_over → playing', () => {
    expect(canTransition('game_over', 'playing')).toBe(true);
  });
  it('rejects ready → game_over', () => {
    expect(canTransition('ready', 'game_over')).toBe(false);
  });
  it('rejects game_over → ready', () => {
    expect(canTransition('game_over', 'ready')).toBe(false);
  });
  it('rejects same-state transitions', () => {
    expect(canTransition('playing', 'playing')).toBe(false);
    expect(canTransition('ready', 'ready')).toBe(false);
  });
});

describe('initialSession', () => {
  it('starts in ready state with zero score', () => {
    expect(initialSession).toEqual({ state: 'ready', score: 0, startTime: null });
  });
});

describe('startGame', () => {
  it('transitions ready → playing and resets score', () => {
    const result = startGame(initialSession, 5000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session).toEqual({ state: 'playing', score: 0, startTime: 5000 });
    }
  });

  it('refuses to start from playing state', () => {
    const result = startGame(playing);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.session).toBe(playing);
      expect(result.reason).toMatch(/playing/);
    }
  });

  it('refuses to start from game_over state', () => {
    const result = startGame(gameOver);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.session).toBe(gameOver);
    }
  });
});

describe('endGame', () => {
  it('transitions playing → game_over and stores final score', () => {
    const result = endGame(playing, 123);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.state).toBe('game_over');
      expect(result.session.score).toBe(123);
      expect(result.session.startTime).toBe(playing.startTime);
    }
  });

  it('refuses to end from ready state', () => {
    const result = endGame(initialSession, 50);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.session).toBe(initialSession);
    }
  });

  it('refuses to end from game_over state', () => {
    const result = endGame(gameOver, 99);
    expect(result.ok).toBe(false);
  });
});

describe('restartGame', () => {
  it('transitions game_over → playing and resets score', () => {
    const result = restartGame(gameOver, 9999);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session).toEqual({ state: 'playing', score: 0, startTime: 9999 });
    }
  });

  it('refuses to restart from ready state', () => {
    const result = restartGame(initialSession);
    expect(result.ok).toBe(false);
  });

  it('refuses to restart from playing state', () => {
    const result = restartGame(playing);
    expect(result.ok).toBe(false);
  });
});
