import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dino } from './Dino';

describe('Dino component', () => {
  it('renders a div element with data-testid="dino"', () => {
    render(<Dino />);
    const el = screen.getByTestId('dino');
    expect(el.tagName).toBe('DIV');
  });

  it('is hidden when hidden=true', () => {
    render(<Dino hidden />);
    expect(screen.getByTestId('dino')).toHaveStyle({ visibility: 'hidden' });
  });

  it('is visible by default', () => {
    render(<Dino />);
    expect(screen.getByTestId('dino')).toHaveStyle({ visibility: 'visible' });
  });

  it('sets aria-hidden so screen readers skip the decorative sprite', () => {
    render(<Dino />);
    expect(screen.getByTestId('dino')).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes the underlying div via forwardRef', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Dino ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('DIV');
  });

  it('uses will-change: transform to hint at GPU compositing', () => {
    render(<Dino />);
    expect(screen.getByTestId('dino')).toHaveStyle({ willChange: 'transform' });
  });
});
