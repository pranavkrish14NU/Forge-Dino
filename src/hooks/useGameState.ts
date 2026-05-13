import { useCallback, useState } from 'react';
import {
  endGame as endGameTransition,
  initialSession,
  restartGame as restartGameTransition,
  startGame as startGameTransition,
  type GameSession,
  type GameState,
} from '../engine/gameState';

export interface UseGameStateApi {
  readonly state: GameState;
  readonly score: number;
  readonly session: GameSession;
  readonly start: () => boolean;
  readonly endGame: (finalScore: number) => boolean;
  readonly restart: () => boolean;
}

export function useGameState(initial: GameSession = initialSession): UseGameStateApi {
  const [session, setSession] = useState<GameSession>(initial);

  const start = useCallback((): boolean => {
    const result = startGameTransition(session);
    if (result.ok) {
      setSession(result.session);
      return true;
    }
    return false;
  }, [session]);

  const endGame = useCallback(
    (finalScore: number): boolean => {
      const result = endGameTransition(session, finalScore);
      if (result.ok) {
        setSession(result.session);
        return true;
      }
      return false;
    },
    [session],
  );

  const restart = useCallback((): boolean => {
    const result = restartGameTransition(session);
    if (result.ok) {
      setSession(result.session);
      return true;
    }
    return false;
  }, [session]);

  return {
    state: session.state,
    score: session.score,
    session,
    start,
    endGame,
    restart,
  };
}
