import { useEffect, useRef } from 'react';
import type { GameState } from '../engine/gameState';

export type Intent = 'START' | 'JUMP' | 'RESTART';

export type IntentDispatcher = (intent: Intent) => void;

const ACTIVATION_KEYS: ReadonlySet<string> = new Set(['Space', 'ArrowUp']);

export function intentForState(state: GameState): Intent {
  switch (state) {
    case 'ready':
      return 'START';
    case 'playing':
      return 'JUMP';
    case 'game_over':
      return 'RESTART';
  }
}

export function useInputController(state: GameState, onIntent: IntentDispatcher): void {
  const stateRef = useRef<GameState>(state);
  const onIntentRef = useRef<IntentDispatcher>(onIntent);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    onIntentRef.current = onIntent;
  }, [onIntent]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.repeat) return;
      if (!ACTIVATION_KEYS.has(event.code)) return;
      event.preventDefault();
      onIntentRef.current(intentForState(stateRef.current));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}
