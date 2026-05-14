import type { JSX, ReactNode } from 'react';

export type OverlayVariant = 'ready' | 'game_over';

interface OverlayProps {
  readonly variant: OverlayVariant;
  readonly score?: number;
  readonly onAction: () => void;
}

interface VariantContent {
  readonly heading: string;
  readonly instructions: string;
  readonly actionLabel: string;
  readonly actionAriaLabel: string;
  readonly extra?: ReactNode;
}

function getContent(variant: OverlayVariant, score: number): VariantContent {
  if (variant === 'ready') {
    return {
      heading: 'Dino Jump',
      instructions: 'Press Space to Start',
      actionLabel: 'Start',
      actionAriaLabel: 'Start the Dino Jump game',
    };
  }
  return {
    heading: 'Game Over',
    instructions: 'Press Space to Restart',
    actionLabel: 'Restart',
    actionAriaLabel: `Restart the game. Final score was ${score}.`,
    extra: (
      <p className="overlay__score" data-testid="overlay-score">
        Final Score: <span>{score}</span>
      </p>
    ),
  };
}

export function Overlay({ variant, score = 0, onAction }: OverlayProps): JSX.Element {
  const content = getContent(variant, score);
  const testId = variant === 'ready' ? 'ready-overlay' : 'game-over-overlay';

  return (
    <div
      className={`overlay overlay--${variant}`}
      data-testid={testId}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${variant}-heading`}
    >
      <div className="overlay__content">
        <h1 id={`${variant}-heading`} className="overlay__heading">
          {content.heading}
        </h1>
        {content.extra}
        <p className="overlay__instructions">{content.instructions}</p>
        <button
          type="button"
          className="overlay__button"
          onClick={onAction}
          aria-label={content.actionAriaLabel}
          autoFocus
        >
          {content.actionLabel}
        </button>
      </div>
    </div>
  );
}

export default Overlay;
