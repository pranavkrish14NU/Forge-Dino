import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ObstacleList } from './ObstacleList';

describe('ObstacleList', () => {
  it('renders one div per obstacle id', () => {
    render(<ObstacleList obstacleIds={[1, 2, 3]} registerEl={() => undefined} />);
    expect(screen.getByTestId('obstacle-1')).toBeInTheDocument();
    expect(screen.getByTestId('obstacle-2')).toBeInTheDocument();
    expect(screen.getByTestId('obstacle-3')).toBeInTheDocument();
  });

  it('renders an empty container when there are no obstacles', () => {
    render(<ObstacleList obstacleIds={[]} registerEl={() => undefined} />);
    const container = screen.getByTestId('obstacles');
    expect(container.children.length).toBe(0);
  });

  it('marks the container aria-hidden so decorative shapes are skipped by screen readers', () => {
    render(<ObstacleList obstacleIds={[1]} registerEl={() => undefined} />);
    expect(screen.getByTestId('obstacles')).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls registerEl with the DOM node when mounting an obstacle', () => {
    const registerEl = vi.fn();
    render(<ObstacleList obstacleIds={[7]} registerEl={registerEl} />);
    expect(registerEl).toHaveBeenCalled();
    const lastCall = registerEl.mock.calls[registerEl.mock.calls.length - 1];
    expect(lastCall[0]).toBe(7);
    expect(lastCall[1]).not.toBeNull();
    expect((lastCall[1] as HTMLDivElement).tagName).toBe('DIV');
  });

  it('calls registerEl(id, null) when an obstacle is removed from the list', () => {
    const registerEl = vi.fn();
    const { rerender } = render(
      <ObstacleList obstacleIds={[1, 2]} registerEl={registerEl} />,
    );
    registerEl.mockClear();
    rerender(<ObstacleList obstacleIds={[1]} registerEl={registerEl} />);
    const calls = registerEl.mock.calls;
    const sawCleanupForTwo = calls.some(
      (c) => c[0] === 2 && c[1] === null,
    );
    expect(sawCleanupForTwo).toBe(true);
  });

  it('applies will-change: transform on each obstacle for GPU compositing', () => {
    render(<ObstacleList obstacleIds={[1]} registerEl={() => undefined} />);
    expect(screen.getByTestId('obstacle-1')).toHaveStyle({ willChange: 'transform' });
  });
});
