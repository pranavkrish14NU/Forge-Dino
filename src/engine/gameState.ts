/**
 * Pure-TypeScript game state machine for Dino Jump.
 *
 * Three states only — `ready`, `playing`, `game_over` — with three valid
 * transitions: ready → playing, playing → game_over, game_over → playing.
 * Every other transition is rejected as a no-op via {@link TransitionResult}.
 *
 * This module has zero React dependencies on purpose: every transition is
 * a state-in / state-out pure function and is unit-tested without rendering.
 * The React adapter lives in `src/hooks/useGameState.ts`.
 */

export type GameState = 'ready' | 'playing' | 'game_over';

export interface GameSession {
  readonly state: GameState;
  readonly score: number;
  readonly startTime: number | null;
}

/** Initial session — what {@link useGameState} renders on first mount. */
export const initialSession: GameSession = {
  state: 'ready',
  score: 0,
  startTime: null,
};

/**
 * Result of a transition attempt. `ok: true` carries the new session;
 * `ok: false` carries the unchanged session plus a human-readable reason.
 * Callers should use this discriminated union to decide whether to apply
 * a state update rather than blindly trusting the returned session.
 */
export type TransitionResult =
  | { ok: true; session: GameSession }
  | { ok: false; session: GameSession; reason: string };

const allowedTransitions: Record<GameState, readonly GameState[]> = {
  ready: ['playing'],
  playing: ['game_over'],
  game_over: ['playing'],
};

/** Returns true if `from → to` is a valid state-machine transition. */
export function canTransition(from: GameState, to: GameState): boolean {
  return allowedTransitions[from].includes(to);
}

/**
 * Transition `ready → playing`. Resets score to 0 and stamps `startTime = now`.
 * Returns a failed result (with the input session unchanged) if the current
 * state isn't `ready` — startGame is intentionally NOT the same as restartGame.
 */
export function startGame(session: GameSession, now: number = Date.now()): TransitionResult {
  if (session.state !== 'ready') {
    return {
      ok: false,
      session,
      reason: `Cannot start from state '${session.state}'`,
    };
  }
  return {
    ok: true,
    session: { state: 'playing', score: 0, startTime: now },
  };
}

/**
 * Transition `playing → game_over`. Freezes the supplied `finalScore` into
 * the session so that the game-over overlay can display it. Preserves the
 * original `startTime` for any future "session duration" features. Returns
 * a failed result if not currently in `playing`.
 */
export function endGame(session: GameSession, finalScore: number): TransitionResult {
  if (session.state !== 'playing') {
    return {
      ok: false,
      session,
      reason: `Cannot end from state '${session.state}'`,
    };
  }
  return {
    ok: true,
    session: { state: 'game_over', score: finalScore, startTime: session.startTime },
  };
}

/**
 * Transition `game_over → playing`. Resets score and start-time exactly like
 * startGame. Distinct from startGame because the *source* state is different
 * — restart is only legal after a game-over.
 */
export function restartGame(session: GameSession, now: number = Date.now()): TransitionResult {
  if (session.state !== 'game_over') {
    return {
      ok: false,
      session,
      reason: `Cannot restart from state '${session.state}'`,
    };
  }
  return {
    ok: true,
    session: { state: 'playing', score: 0, startTime: now },
  };
}
