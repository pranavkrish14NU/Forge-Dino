import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameScreen } from './GameScreen';
import type { DinoState } from '../engine/physics';
import type { Obstacle } from '../engine/spawner';
import { resetObstacleIds } from '../engine/spawner';

function pressKey(code: string, repeat = false): void {
  fireEvent.keyDown(window, { code, repeat });
}

describe('GameScreen — initial render', () => {
  it('shows the ready overlay on first render', () => {
    render(<GameScreen />);
    expect(screen.getByTestId('ready-overlay')).toBeInTheDocument();
    expect(screen.queryByTestId('game-over-overlay')).not.toBeInTheDocument();
  });

  it('exposes an ARIA live region announcing the ready state', () => {
    render(<GameScreen />);
    const live = screen.getByTestId('aria-live');
    expect(live).toHaveAttribute('role', 'status');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent(/ready/i);
  });
});

describe('GameScreen — ready → playing', () => {
  it('transitions when Start button is clicked', () => {
    render(<GameScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    expect(screen.queryByTestId('ready-overlay')).not.toBeInTheDocument();
    expect(screen.getByTestId('game-screen')).toHaveAttribute('data-state', 'playing');
  });

  it('transitions when Space is pressed', () => {
    render(<GameScreen />);
    pressKey('Space');
    expect(screen.queryByTestId('ready-overlay')).not.toBeInTheDocument();
    expect(screen.getByTestId('game-screen')).toHaveAttribute('data-state', 'playing');
  });

  it('transitions when ArrowUp is pressed', () => {
    render(<GameScreen />);
    pressKey('ArrowUp');
    expect(screen.getByTestId('game-screen')).toHaveAttribute('data-state', 'playing');
  });

  it('announces "Game started" via the ARIA live region', () => {
    render(<GameScreen />);
    pressKey('Space');
    expect(screen.getByTestId('aria-live')).toHaveTextContent(/game started/i);
  });

  it('ignores keys other than Space/ArrowUp', () => {
    render(<GameScreen />);
    pressKey('Enter');
    pressKey('KeyA');
    expect(screen.getByTestId('ready-overlay')).toBeInTheDocument();
  });

  it('ignores auto-repeat keydown events', () => {
    render(<GameScreen />);
    pressKey('Space', true);
    expect(screen.getByTestId('ready-overlay')).toBeInTheDocument();
  });
});

describe('GameScreen — playing → game_over (programmatic endGame)', () => {
  it('shows the game-over overlay with placeholder score 0 when endGame is invoked', () => {
    let endGameFn: ((score: number) => boolean) | undefined;
    render(<GameScreen testEndGame={(fn) => (endGameFn = fn)} />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));

    expect(endGameFn).toBeDefined();
    act(() => {
      endGameFn?.(0);
    });

    expect(screen.getByTestId('game-over-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-score')).toHaveTextContent('Final Score: 0');
    expect(screen.getByRole('button', { name: /Restart/i })).toBeInTheDocument();
  });

  it('announces "Game over. Final score: N" via the ARIA live region', () => {
    let endGameFn: ((score: number) => boolean) | undefined;
    render(<GameScreen testEndGame={(fn) => (endGameFn = fn)} />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    act(() => {
      endGameFn?.(42);
    });
    expect(screen.getByTestId('aria-live')).toHaveTextContent(/game over\.?\s*final score:\s*42/i);
  });
});

describe('GameScreen — game_over → playing (restart)', () => {
  function getToGameOver(): void {
    let endGameFn: ((score: number) => boolean) | undefined;
    render(<GameScreen testEndGame={(fn) => (endGameFn = fn)} />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    act(() => {
      endGameFn?.(7);
    });
    expect(screen.getByTestId('game-over-overlay')).toBeInTheDocument();
  }

  it('restarts when the Restart button is clicked', () => {
    getToGameOver();
    fireEvent.click(screen.getByRole('button', { name: /Restart/i }));
    expect(screen.queryByTestId('game-over-overlay')).not.toBeInTheDocument();
    expect(screen.getByTestId('game-screen')).toHaveAttribute('data-state', 'playing');
  });

  it('restarts when Space is pressed', () => {
    getToGameOver();
    pressKey('Space');
    expect(screen.getByTestId('game-screen')).toHaveAttribute('data-state', 'playing');
  });

  it('restarts when ArrowUp is pressed', () => {
    getToGameOver();
    pressKey('ArrowUp');
    expect(screen.getByTestId('game-screen')).toHaveAttribute('data-state', 'playing');
  });
});

describe('GameScreen — invalid input gating', () => {
  it('ignores Space during playing state (no jump physics yet — would only transition state)', () => {
    render(<GameScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    pressKey('Space');
    expect(screen.getByTestId('game-screen')).toHaveAttribute('data-state', 'playing');
    expect(screen.queryByTestId('game-over-overlay')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ready-overlay')).not.toBeInTheDocument();
  });
});

describe('GameScreen — intent dispatch (WO-004)', () => {
  it('dispatches START intent when Space is pressed from ready', () => {
    const intents: string[] = [];
    render(<GameScreen testOnIntent={(i) => intents.push(i)} />);
    pressKey('Space');
    expect(intents).toEqual(['START']);
  });

  it('dispatches JUMP intent when Space is pressed from playing', () => {
    const intents: string[] = [];
    render(<GameScreen testOnIntent={(i) => intents.push(i)} />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    intents.length = 0;
    pressKey('Space');
    expect(intents).toEqual(['JUMP']);
    expect(screen.getByTestId('game-screen')).toHaveAttribute('data-state', 'playing');
  });

  it('dispatches RESTART intent when Space is pressed from game_over', () => {
    let endGameFn: ((score: number) => boolean) | undefined;
    const intents: string[] = [];
    render(
      <GameScreen
        testOnIntent={(i) => intents.push(i)}
        testEndGame={(fn) => (endGameFn = fn)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    act(() => {
      endGameFn?.(0);
    });
    intents.length = 0;
    pressKey('Space');
    expect(intents).toEqual(['RESTART']);
  });

  it('button click dispatches the same intent as the matching keyboard input', () => {
    const intents: string[] = [];
    render(<GameScreen testOnIntent={(i) => intents.push(i)} />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    expect(intents).toEqual(['START']);
  });
});

describe('GameScreen — dino physics integration (WO-005)', () => {
  function getStartedScreen(): { getDino: () => DinoState } {
    let getDino!: () => DinoState;
    render(
      <GameScreen
        testGetDinoState={(g) => {
          getDino = g;
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    return { getDino };
  }

  it('initializes the dino in a grounded state when entering playing', () => {
    const { getDino } = getStartedScreen();
    const s = getDino();
    expect(s.y).toBe(0);
    expect(s.velocityY).toBe(0);
    expect(s.isGrounded).toBe(true);
  });

  it('applies JUMP intent to the physics state (Space during playing sets jump velocity)', () => {
    const { getDino } = getStartedScreen();
    pressKey('Space');
    const s = getDino();
    expect(s.isGrounded).toBe(false);
    expect(s.velocityY).toBeGreaterThan(0);
  });

  it('ignores Space when already airborne (no double-jump)', () => {
    const { getDino } = getStartedScreen();
    pressKey('Space');
    const afterFirst = getDino();
    pressKey('Space');
    const afterSecond = getDino();
    expect(afterSecond.velocityY).toBe(afterFirst.velocityY);
    expect(afterSecond.y).toBe(afterFirst.y);
  });

  it('renders the dino element while in playing state', () => {
    getStartedScreen();
    expect(screen.getByTestId('dino')).toBeInTheDocument();
    expect(screen.getByTestId('dino')).toHaveStyle({ visibility: 'visible' });
  });

  it('hides the dino while in ready or game_over state', () => {
    render(<GameScreen />);
    expect(screen.getByTestId('dino')).toHaveStyle({ visibility: 'hidden' });
  });

  it('resets dino state when transitioning into playing (START re-inits dino)', () => {
    let getDino!: () => DinoState;
    let endGameFn: ((score: number) => boolean) | undefined;
    render(
      <GameScreen
        testGetDinoState={(g) => (getDino = g)}
        testEndGame={(fn) => (endGameFn = fn)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    pressKey('Space');
    expect(getDino().isGrounded).toBe(false);
    act(() => {
      endGameFn?.(0);
    });
    pressKey('Space');
    const afterRestart = getDino();
    expect(afterRestart.isGrounded).toBe(true);
    expect(afterRestart.y).toBe(0);
    expect(afterRestart.velocityY).toBe(0);
  });
});

describe('GameScreen — obstacle spawning + movement (WO-006)', () => {
  function setupWithObstacles(spawnEverySec = 0.1): {
    getObstacles: () => readonly Obstacle[];
  } {
    resetObstacleIds();
    let getObstacles!: () => readonly Obstacle[];
    render(
      <GameScreen
        testSpawnIntervalOverride={spawnEverySec}
        testLoopUpdate={() => undefined}
        testGetObstacles={(g) => (getObstacles = g)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    return { getObstacles };
  }

  it('starts with no obstacles when entering playing', () => {
    const { getObstacles } = setupWithObstacles();
    expect(getObstacles()).toHaveLength(0);
  });

  it('renders the obstacles container only while playing', () => {
    render(<GameScreen />);
    expect(screen.queryByTestId('obstacles')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    expect(screen.getByTestId('obstacles')).toBeInTheDocument();
  });

  it('removes the obstacles container after game_over', () => {
    let endGameFn: ((s: number) => boolean) | undefined;
    render(<GameScreen testEndGame={(fn) => (endGameFn = fn)} />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    expect(screen.getByTestId('obstacles')).toBeInTheDocument();
    act(() => {
      endGameFn?.(0);
    });
    expect(screen.queryByTestId('obstacles')).not.toBeInTheDocument();
  });

  it('resets obstacles on restart (no leak across runs)', () => {
    let endGameFn: ((s: number) => boolean) | undefined;
    let getObstacles!: () => readonly Obstacle[];
    resetObstacleIds();
    render(
      <GameScreen
        testEndGame={(fn) => (endGameFn = fn)}
        testGetObstacles={(g) => (getObstacles = g)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    act(() => {
      endGameFn?.(0);
    });
    pressKey('Space');
    expect(getObstacles()).toHaveLength(0);
  });
});

describe('GameScreen — score HUD (WO-008)', () => {
  it('renders the HUD only while playing', () => {
    render(<GameScreen />);
    expect(screen.queryByTestId('hud')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    expect(screen.getByTestId('hud')).toBeInTheDocument();
  });

  it('starts the displayed score at 0000', () => {
    render(<GameScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    expect(screen.getByTestId('hud-score').textContent).toBe('0000');
  });

  it('removes the HUD when transitioning to game_over', () => {
    let endGameFn: ((s: number) => boolean) | undefined;
    render(<GameScreen testEndGame={(fn) => (endGameFn = fn)} />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    expect(screen.getByTestId('hud')).toBeInTheDocument();
    act(() => {
      endGameFn?.(123);
    });
    expect(screen.queryByTestId('hud')).not.toBeInTheDocument();
  });

  it('displays the final score on the game-over overlay (frozen at endGame time)', () => {
    let endGameFn: ((s: number) => boolean) | undefined;
    render(<GameScreen testEndGame={(fn) => (endGameFn = fn)} />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    act(() => {
      endGameFn?.(123);
    });
    expect(screen.getByTestId('overlay-score')).toHaveTextContent('Final Score: 123');
  });

  it('resets the HUD score to 0000 on restart', () => {
    let endGameFn: ((s: number) => boolean) | undefined;
    render(<GameScreen testEndGame={(fn) => (endGameFn = fn)} />);
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    act(() => {
      endGameFn?.(99);
    });
    pressKey('Space');
    expect(screen.getByTestId('hud-score').textContent).toBe('0000');
  });
});

describe('GameScreen — ARIA accessibility (WO-010)', () => {
  it('has role=application and aria-label', () => {
    render(<GameScreen />);
    const screenEl = screen.getByTestId('game-screen');
    expect(screenEl).toHaveAttribute('role', 'application');
    expect(screenEl).toHaveAttribute('aria-label', 'Dino Jump game');
  });

  it('is programmatically focusable (tabIndex=-1)', () => {
    render(<GameScreen />);
    expect(screen.getByTestId('game-screen')).toHaveAttribute('tabindex', '-1');
  });

  it('moves focus to the game area when state transitions to playing', () => {
    render(<GameScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    expect(document.activeElement).toBe(screen.getByTestId('game-screen'));
  });
});
