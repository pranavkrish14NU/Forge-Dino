import { useCallback, useEffect, useMemo, type JSX } from 'react';
import { Overlay } from './Overlay';
import { useGameState } from '../hooks/useGameState';

const ACTIVATION_KEYS: ReadonlySet<string> = new Set(['Space', 'ArrowUp']);

interface GameScreenProps {
  readonly testEndGame?: (endGame: (score: number) => boolean) => void;
}

export function GameScreen({ testEndGame }: GameScreenProps = {}): JSX.Element {
  const { state, score, start, endGame, restart } = useGameState();

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

  const handleActivation = useCallback(() => {
    if (state === 'ready') {
      start();
    } else if (state === 'game_over') {
      restart();
    }
  }, [state, start, restart]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.repeat) return;
      if (!ACTIVATION_KEYS.has(event.code)) return;
      if (state === 'ready' || state === 'game_over') {
        event.preventDefault();
        handleActivation();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state, handleActivation]);

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

      {state === 'ready' && <Overlay variant="ready" onAction={handleActivation} />}
      {state === 'game_over' && (
        <Overlay variant="game_over" score={score} onAction={handleActivation} />
      )}
    </main>
  );
}

export default GameScreen;
