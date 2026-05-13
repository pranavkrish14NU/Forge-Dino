import { useCallback, useEffect, useMemo, useRef, type JSX } from 'react';
import { Overlay } from './Overlay';
import { Dino } from './Dino';
import { useGameState } from '../hooks/useGameState';
import { useGameLoop, type GameLoopUpdate } from '../hooks/useGameLoop';
import {
  intentForState,
  useInputController,
  type Intent,
} from '../hooks/useInputController';
import {
  applyJump,
  initDino,
  updateDino,
  type DinoState,
} from '../engine/physics';

interface GameScreenProps {
  readonly testEndGame?: (endGame: (score: number) => boolean) => void;
  readonly testLoopUpdate?: GameLoopUpdate;
  readonly testOnIntent?: (intent: Intent) => void;
  readonly testGetDinoState?: (get: () => DinoState) => void;
}

function applyDinoTransform(el: HTMLElement | null, dino: DinoState): void {
  if (!el) return;
  el.style.transform = `translate3d(0px, ${-dino.y}px, 0)`;
}

export function GameScreen({
  testEndGame,
  testLoopUpdate,
  testOnIntent,
  testGetDinoState,
}: GameScreenProps = {}): JSX.Element {
  const { state, score, start, endGame, restart } = useGameState();
  const elapsedRef = useRef<number>(0);
  const dinoStateRef = useRef<DinoState>(initDino());
  const dinoElRef = useRef<HTMLDivElement>(null);

  const onLoopUpdate = useCallback<GameLoopUpdate>(
    (deltaTime) => {
      elapsedRef.current += deltaTime;
      dinoStateRef.current = updateDino(dinoStateRef.current, deltaTime);
      applyDinoTransform(dinoElRef.current, dinoStateRef.current);
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
          dinoStateRef.current = initDino();
          applyDinoTransform(dinoElRef.current, dinoStateRef.current);
          start();
          break;
        case 'RESTART':
          dinoStateRef.current = initDino();
          applyDinoTransform(dinoElRef.current, dinoStateRef.current);
          restart();
          break;
        case 'JUMP':
          dinoStateRef.current = applyJump(dinoStateRef.current);
          break;
      }
    },
    [start, restart, testOnIntent],
  );

  useInputController(state, dispatchIntent);

  useEffect(() => {
    if (testGetDinoState) testGetDinoState(() => dinoStateRef.current);
  }, [testGetDinoState]);

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
        <Dino ref={dinoElRef} hidden={state !== 'playing'} />
      </div>

      {state === 'ready' && <Overlay variant="ready" onAction={handleButtonClick} />}
      {state === 'game_over' && (
        <Overlay variant="game_over" score={score} onAction={handleButtonClick} />
      )}
    </main>
  );
}

export default GameScreen;
