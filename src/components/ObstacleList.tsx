import { useEffect, useRef, type JSX } from 'react';

interface ObstacleListProps {
  readonly obstacleIds: readonly number[];
  readonly registerEl: (id: number, el: HTMLDivElement | null) => void;
}

export function ObstacleList({ obstacleIds, registerEl }: ObstacleListProps): JSX.Element {
  const seenIdsRef = useRef<ReadonlySet<number>>(new Set());

  useEffect(() => {
    const seen = seenIdsRef.current;
    const current = new Set(obstacleIds);
    for (const id of seen) {
      if (!current.has(id)) registerEl(id, null);
    }
    seenIdsRef.current = current;
  }, [obstacleIds, registerEl]);

  return (
    <div className="obstacles" data-testid="obstacles" aria-hidden="true">
      {obstacleIds.map((id) => (
        <div
          key={id}
          ref={(el) => registerEl(id, el)}
          className="obstacle"
          data-testid={`obstacle-${id}`}
          style={{ willChange: 'transform' }}
        />
      ))}
    </div>
  );
}

export default ObstacleList;
