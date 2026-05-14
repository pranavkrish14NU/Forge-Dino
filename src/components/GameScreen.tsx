import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { Overlay } from './Overlay';
import { Dino } from './Dino';
import { Hud } from './Hud';
import { ObstacleList } from './ObstacleList';
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
import {
  createObstacle,
  getCurrentSpeed,
  nextSpawnInterval,
  updateObstacles,
  type Obstacle,
} from '../engine/spawner';
import { checkCollision, type AABB } from '../engine/collision';

const DEFAULT_GAME_AREA_WIDTH = 1280;
const DINO_LEFT = 64;
const DINO_WIDTH = 36;
const DINO_HEIGHT = 48;
const SCORE_RATE = 10;
const SCORE_THROTTLE_SECONDS = 0.1;

function dinoToAABB(dino: DinoState): AABB {
  return { x: DINO_LEFT, y: dino.y, width: DINO_WIDTH, height: DINO_HEIGHT };
}

function obstacleToAABB(obs: Obstacle): AABB {
  return { x: obs.x, y: 0, width: obs.width, height: obs.height };
}

interface GameScreenProps {
  readonly testEndGame?: (endGame: (score: number) => boolean) => void;
  readonly testLoopUpdate?: GameLoopUpdate;
  readonly testOnIntent?: (intent: Intent) => void;
  readonly testGetDinoState?: (get: () => DinoState) => void;
  readonly testGetObstacles?: (get: () => readonly Obstacle[]) => void;
  readonly testRng?: () => number;
  readonly testSpawnIntervalOverride?: number;
}

function applyDinoTransform(el: HTMLElement | null, dino: DinoState): void {
  if (!el) return;
  el.style.transform = `translate3d(0px, ${-dino.y}px, 0)`;
}

function applyObstacleTransform(el: HTMLElement | null, obstacle: Obstacle): void {
  if (!el) return;
  el.style.transform = `translate3d(${obstacle.x}px, 0px, 0)`;
}

function sameIds(a: readonly number[], b: readonly Obstacle[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i].id) return false;
  }
  return true;
}

export function GameScreen({
  testEndGame,
  testLoopUpdate,
  testOnIntent,
  testGetDinoState,
  testGetObstacles,
  testRng,
  testSpawnIntervalOverride,
}: GameScreenProps = {}): JSX.Element {
  const { state, score, start, endGame, restart } = useGameState();
  const elapsedRef = useRef<number>(0);

  const dinoStateRef = useRef<DinoState>(initDino());
  const dinoElRef = useRef<HTMLDivElement>(null);

  const obstaclesRef = useRef<Obstacle[]>([]);
  const obstacleElsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const timeSinceSpawnRef = useRef<number>(0);
  const nextSpawnIntervalRef = useRef<number>(
    testSpawnIntervalOverride ?? nextSpawnInterval(0, testRng),
  );
  const [obstacleIds, setObstacleIds] = useState<number[]>([]);
  const playfieldRef = useRef<HTMLDivElement>(null);
  const gameAreaWidthRef = useRef<number>(DEFAULT_GAME_AREA_WIDTH);

  useEffect(() => {
    const el = playfieldRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) gameAreaWidthRef.current = w;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scoreRef = useRef<number>(0);
  const lastScoreFlushRef = useRef<number>(0);
  const [displayedScore, setDisplayedScore] = useState<number>(0);

  const registerObstacleEl = useCallback((id: number, el: HTMLDivElement | null) => {
    if (el === null) {
      obstacleElsRef.current.delete(id);
    } else {
      obstacleElsRef.current.set(id, el);
      const obs = obstaclesRef.current.find((o) => o.id === id);
      if (obs) applyObstacleTransform(el, obs);
    }
  }, []);

  const resetWorld = useCallback(() => {
    elapsedRef.current = 0;
    dinoStateRef.current = initDino();
    applyDinoTransform(dinoElRef.current, dinoStateRef.current);
    obstaclesRef.current = [];
    timeSinceSpawnRef.current = 0;
    nextSpawnIntervalRef.current = testSpawnIntervalOverride ?? nextSpawnInterval(0, testRng);
    setObstacleIds([]);
    scoreRef.current = 0;
    lastScoreFlushRef.current = 0;
    setDisplayedScore(0);
  }, [testRng, testSpawnIntervalOverride]);

  const onLoopUpdate = useCallback<GameLoopUpdate>(
    (deltaTime) => {
      elapsedRef.current += deltaTime;
      dinoStateRef.current = updateDino(dinoStateRef.current, deltaTime);
      applyDinoTransform(dinoElRef.current, dinoStateRef.current);

      const speed = getCurrentSpeed(elapsedRef.current);
      obstaclesRef.current = updateObstacles(obstaclesRef.current, deltaTime, speed);

      timeSinceSpawnRef.current += deltaTime;
      if (timeSinceSpawnRef.current >= nextSpawnIntervalRef.current) {
        obstaclesRef.current = [
          ...obstaclesRef.current,
          createObstacle(gameAreaWidthRef.current),
        ];
        timeSinceSpawnRef.current = 0;
        nextSpawnIntervalRef.current =
          testSpawnIntervalOverride ?? nextSpawnInterval(elapsedRef.current, testRng);
      }

      for (const obs of obstaclesRef.current) {
        applyObstacleTransform(obstacleElsRef.current.get(obs.id) ?? null, obs);
      }

      setObstacleIds((prev) => {
        if (sameIds(prev, obstaclesRef.current)) return prev;
        return obstaclesRef.current.map((o) => o.id);
      });

      scoreRef.current += deltaTime * SCORE_RATE;
      if (elapsedRef.current - lastScoreFlushRef.current >= SCORE_THROTTLE_SECONDS) {
        lastScoreFlushRef.current = elapsedRef.current;
        const flushed = Math.floor(scoreRef.current);
        setDisplayedScore((prev) => (prev === flushed ? prev : flushed));
      }

      const dinoBox = dinoToAABB(dinoStateRef.current);
      const obstacleBoxes = obstaclesRef.current.map(obstacleToAABB);
      if (checkCollision(dinoBox, obstacleBoxes)) {
        const finalScore = Math.floor(scoreRef.current);
        setDisplayedScore(finalScore);
        endGame(finalScore);
      }

      testLoopUpdate?.(deltaTime);
    },
    [endGame, testLoopUpdate, testRng, testSpawnIntervalOverride],
  );

  useGameLoop(state, onLoopUpdate);

  const dispatchIntent = useCallback(
    (intent: Intent) => {
      testOnIntent?.(intent);
      switch (intent) {
        case 'START':
          resetWorld();
          start();
          break;
        case 'RESTART':
          resetWorld();
          restart();
          break;
        case 'JUMP':
          dinoStateRef.current = applyJump(dinoStateRef.current);
          break;
      }
    },
    [start, restart, resetWorld, testOnIntent],
  );

  useInputController(state, dispatchIntent);

  useEffect(() => {
    if (testGetDinoState) testGetDinoState(() => dinoStateRef.current);
  }, [testGetDinoState]);

  useEffect(() => {
    if (testGetObstacles) testGetObstacles(() => obstaclesRef.current);
  }, [testGetObstacles]);

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

  const gameAreaRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (state === 'playing') {
      gameAreaRef.current?.focus({ preventScroll: true });
    }
  }, [state]);

  return (
    <main
      ref={gameAreaRef}
      className="game-screen"
      data-testid="game-screen"
      data-state={state}
      role="application"
      aria-label="Dino Jump game"
      tabIndex={-1}
    >
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

      <div
        ref={playfieldRef}
        className="game-screen__playfield"
        data-testid="playfield"
        aria-hidden={state !== 'playing'}
      >
        <div className="game-screen__ground" />
        <Dino ref={dinoElRef} hidden={state !== 'playing'} />
        {state === 'playing' && (
          <ObstacleList obstacleIds={obstacleIds} registerEl={registerObstacleEl} />
        )}
        {state === 'playing' && <Hud score={displayedScore} />}
      </div>

      {state === 'ready' && <Overlay variant="ready" onAction={handleButtonClick} />}
      {state === 'game_over' && (
        <Overlay variant="game_over" score={score} onAction={handleButtonClick} />
      )}
    </main>
  );
}

export default GameScreen;
