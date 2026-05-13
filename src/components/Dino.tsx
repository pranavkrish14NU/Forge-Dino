import { forwardRef, type JSX } from 'react';

interface DinoProps {
  readonly hidden?: boolean;
}

export const Dino = forwardRef<HTMLDivElement, DinoProps>(function Dino(
  { hidden = false },
  ref,
): JSX.Element {
  return (
    <div
      ref={ref}
      className="dino"
      data-testid="dino"
      aria-hidden="true"
      style={{
        visibility: hidden ? 'hidden' : 'visible',
        willChange: 'transform',
      }}
    />
  );
});

export default Dino;
