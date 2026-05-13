import { useCallback, useEffect, useMemo, useRef, type JSX } from 'react';
import { Overlay } from './Overlay';
import { useGameState } from '../hooks/useGameState';
import { useGameLoop, type GameLoopUpdate } from '../hooks/useGameLoop';
import {
  intentForState,
  useInputController,
  type Intent,
} from '../hooks/useInputController';

interface GameScreenProps {
  readonly testEndGame?: (endGame: (score: number) => boolean) => void;
  readonly testLoopUpdate?: GameLoopUpdate;
  readonly testOnIntent?: (intent: Intent) => void;
}

export function GameScreen({
  testEndGame,
  testLoopUpdate,
  testOnIntent,
}: GameScreenProps = {}): JSX.Element {
  const { state, score, start, endGame, restart } = useGameState();
  const elapsedRef = useRef<number>(0);

  const onLoopUpdate = useCallback<GameLoopUpdate>(
    (deltaTime) => {
      elapsedRef.current += deltaTime;
      testLoopUpdate?.(deltaTime);
    },
    [testLoopUpdate],
  );

  useGameLoop(state, onLoopUpdate);

  const dispatchIntent = useCallback(
    (intent: Intent) => {
      testOnIntent?.(intent);
      switch (intent) {
        case 'START':
          start();
          break;
        case 'RESTART':
          restart();
          break;
        case 'JUMP':
          // Consumed by WO-005 physics. No state change here.
          break;
      }
    },
    [start, restart, testOnIntent],
  );

  useInputController(state, dispatchIntent);

  const announcement = useMemo(() => {
    switch (state) {
      case 'ready':
        return 'Game ready. Press Space to start.';
      case 'playing':
        return 'Game started.';
      case 'game_over':
        return `Game over. Final score: ${score}.`;
    }
  }, [state, score]);

  const handleButtonClick = useCallback(() => {
    dispatchIntent(intentForState(state));
  }, [state, dispatchIntent]);

  useEffect(() => {
    if (testEndGame) testEndGame(endGame);
  }, [testEndGame, endGame]);

  return (
    <main className="game-screen" data-testid="game-screen" data-state={state}>
      <div
        className="game-screen__aria-live"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="aria-live"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {announcement}
      </div>

      <div className="game-screen__playfield" data-testid="playfield" aria-hidden={state !== 'playing'}>
        <div className="game-screen__ground" />
      </div>

      {state === 'ready' && <Overlay variant="ready" onAction={handleButtonClick} />}
      {state === 'game_over' && (
        <Overlay variant="game_over" score={score} onAction={handleButtonClick} />
      )}
    </main>
  );
}

export default GameScreen;
