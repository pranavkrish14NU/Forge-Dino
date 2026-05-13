export type GameState = 'ready' | 'playing' | 'game_over';

export interface GameSession {
  readonly state: GameState;
  readonly score: number;
  readonly startTime: number | null;
}

export const initialSession: GameSession = {
  state: 'ready',
  score: 0,
  startTime: null,
};

export type TransitionResult =
  | { ok: true; session: GameSession }
  | { ok: false; session: GameSession; reason: string };

const allowedTransitions: Record<GameState, readonly GameState[]> = {
  ready: ['playing'],
  playing: ['game_over'],
  game_over: ['playing'],
};

export function canTransition(from: GameState, to: GameState): boolean {
  return allowedTransitions[from].includes(to);
}

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
