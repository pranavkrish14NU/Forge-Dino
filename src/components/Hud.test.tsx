import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hud } from './Hud';

describe('Hud component', () => {
  it('renders a SCORE label and the score value', () => {
    render(<Hud score={42} />);
    expect(screen.getByText('SCORE')).toBeInTheDocument();
    expect(screen.getByTestId('hud-score')).toBeInTheDocument();
  });

  it('formats score as integer (no decimal places)', () => {
    render(<Hud score={42.7} />);
    expect(screen.getByTestId('hud-score').textContent).toBe('0042');
  });

  it('pads the score to at least 4 digits with leading zeros', () => {
    render(<Hud score={7} />);
    expect(screen.getByTestId('hud-score').textContent).toBe('0007');
  });

  it('clamps negative scores to 0', () => {
    render(<Hud score={-100} />);
    expect(screen.getByTestId('hud-score').textContent).toBe('0000');
  });

  it('handles large scores without truncation', () => {
    render(<Hud score={12345} />);
    expect(screen.getByTestId('hud-score').textContent).toBe('12345');
  });

  it('exposes an aria-label so screen readers can identify the score', () => {
    render(<Hud score={10} />);
    expect(screen.getByTestId('hud')).toHaveAttribute('aria-label', 'Score');
  });

  it('uses aria-live=off so the score does not spam screen readers each tick', () => {
    render(<Hud score={10} />);
    expect(screen.getByTestId('hud')).toHaveAttribute('aria-live', 'off');
  });

  it('is hidden when hidden=true', () => {
    render(<Hud score={10} hidden />);
    expect(screen.getByTestId('hud')).toHaveStyle({ visibility: 'hidden' });
  });
});
