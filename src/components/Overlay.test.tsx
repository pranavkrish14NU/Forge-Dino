import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Overlay } from './Overlay';

describe('Overlay (ready variant)', () => {
  it('renders the ready instructions and Start button', () => {
    render(<Overlay variant="ready" onAction={() => undefined} />);
    expect(screen.getByText('Press Space to Start')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
  });

  it('uses a semantic <button> element (not div-with-onClick)', () => {
    render(<Overlay variant="ready" onAction={() => undefined} />);
    const btn = screen.getByRole('button', { name: 'Start' });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('does not render a score on the ready overlay', () => {
    render(<Overlay variant="ready" onAction={() => undefined} />);
    expect(screen.queryByTestId('overlay-score')).not.toBeInTheDocument();
  });

  it('invokes onAction when Start is clicked', () => {
    const onAction = vi.fn();
    render(<Overlay variant="ready" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe('Overlay (game_over variant)', () => {
  it('renders Game Over heading, placeholder score, and Restart button', () => {
    render(<Overlay variant="game_over" score={0} onAction={() => undefined} />);
    expect(screen.getByRole('heading', { name: 'Game Over' })).toBeInTheDocument();
    expect(screen.getByTestId('overlay-score')).toHaveTextContent('Final Score: 0');
    expect(screen.getByRole('button', { name: 'Restart' })).toBeInTheDocument();
  });

  it('displays the provided score', () => {
    render(<Overlay variant="game_over" score={123} onAction={() => undefined} />);
    expect(screen.getByTestId('overlay-score')).toHaveTextContent('Final Score: 123');
  });

  it('defaults score to 0 when not supplied', () => {
    render(<Overlay variant="game_over" onAction={() => undefined} />);
    expect(screen.getByTestId('overlay-score')).toHaveTextContent('Final Score: 0');
  });

  it('invokes onAction when Restart is clicked', () => {
    const onAction = vi.fn();
    render(<Overlay variant="game_over" score={5} onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
