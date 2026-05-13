import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameScreen } from './GameScreen';

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
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(endGameFn).toBeDefined();
    act(() => {
      endGameFn?.(0);
    });

    expect(screen.getByTestId('game-over-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-score')).toHaveTextContent('Final Score: 0');
    expect(screen.getByRole('button', { name: 'Restart' })).toBeInTheDocument();
  });

  it('announces "Game over. Final score: N" via the ARIA live region', () => {
    let endGameFn: ((score: number) => boolean) | undefined;
    render(<GameScreen testEndGame={(fn) => (endGameFn = fn)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => {
      endGameFn?.(7);
    });
    expect(screen.getByTestId('game-over-overlay')).toBeInTheDocument();
  }

  it('restarts when the Restart button is clicked', () => {
    getToGameOver();
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(intents).toEqual(['START']);
  });
});
