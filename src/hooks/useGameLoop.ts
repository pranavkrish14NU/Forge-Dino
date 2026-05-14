import { useEffect, useRef } from 'react';
import type { GameState } from '../engine/gameState';

export type GameLoopUpdate = (deltaTime: number) => void;

const MAX_DELTA_SECONDS = 0.05;
const FPS_LOG_INTERVAL_SECONDS = 1;

export function useGameLoop(state: GameState, onUpdate: GameLoopUpdate): void {
  const callbackRef = useRef<GameLoopUpdate>(onUpdate);
  useEffect(() => {
    callbackRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (state !== 'playing') return;

    let rafId = 0;
    let previousTime: number | null = null;
    let frameCount = 0;
    let lastLogTime = 0;
    const isDev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

    const tick = (currentTime: number): void => {
      if (previousTime === null) {
        previousTime = currentTime;
        lastLogTime = currentTime;
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      const rawDelta = (currentTime - previousTime) / 1000;
      const deltaTime = Math.min(rawDelta, MAX_DELTA_SECONDS);
      previousTime = currentTime;

      callbackRef.current(deltaTime);

      if (isDev) {
        frameCount += 1;
        const elapsedSinceLog = (currentTime - lastLogTime) / 1000;
        if (elapsedSinceLog >= FPS_LOG_INTERVAL_SECONDS) {
          const fps = Math.round(frameCount / elapsedSinceLog);
          console.debug(`[useGameLoop] ~${fps} fps`);
          frameCount = 0;
          lastLogTime = currentTime;
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [state]);
}
