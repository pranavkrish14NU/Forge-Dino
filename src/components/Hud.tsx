import type { JSX } from 'react';

interface HudProps {
  readonly score: number;
  readonly hidden?: boolean;
}

function formatScore(score: number): string {
  return Math.floor(Math.max(0, score)).toString().padStart(4, '0');
}

export function Hud({ score, hidden = false }: HudProps): JSX.Element {
  return (
    <div
      className="hud"
      data-testid="hud"
      role="status"
      aria-live="off"
      aria-label="Score"
      style={{ visibility: hidden ? 'hidden' : 'visible' }}
    >
      <span className="hud__label">SCORE</span>
      <span className="hud__value" data-testid="hud-score">
        {formatScore(score)}
      </span>
    </div>
  );
}

export default Hud;
