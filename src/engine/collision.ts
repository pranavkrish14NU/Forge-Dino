/**
 * AABB (axis-aligned bounding box) collision detection.
 *
 * Pure module — no React, no DOM. Hitboxes are inset on every side by
 * {@link HITBOX_INSET} pixels so that visually-grazing-but-not-touching
 * boxes don't count as a collision; this gives the player a small
 * forgiveness margin that makes near-misses feel fair instead of
 * frustrating.
 */

/**
 * Default inset (in px) applied to every box on every side before the
 * intersection test. Tuned so a ~2px visual graze does NOT trigger a hit,
 * but anything noticeably overlapping does.
 */
export const HITBOX_INSET = 3;

export interface AABB {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Returns true if boxes `a` and `b` overlap after both have been inset by
 * `inset` pixels on every side. Uses strict less-than at the corners so
 * boxes that share an edge are NOT considered overlapping.
 *
 * @param a      first box
 * @param b      second box
 * @param inset  px to shrink each box on every side; default {@link HITBOX_INSET}
 */
export function intersectsAABB(a: AABB, b: AABB, inset: number = HITBOX_INSET): boolean {
  const ax1 = a.x + inset;
  const ay1 = a.y + inset;
  const ax2 = a.x + a.width - inset;
  const ay2 = a.y + a.height - inset;

  const bx1 = b.x + inset;
  const by1 = b.y + inset;
  const bx2 = b.x + b.width - inset;
  const by2 = b.y + b.height - inset;

  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

/**
 * Scan `obstacles` for any AABB overlap with `dino`. Short-circuits on the
 * first hit. Returns false for an empty list (the architecture requires
 * graceful handling so the caller can blindly invoke this every frame).
 *
 * @param dino       the dino's current AABB
 * @param obstacles  active obstacles' AABBs
 * @param inset      forgiveness margin; default {@link HITBOX_INSET}
 */
export function checkCollision(
  dino: AABB,
  obstacles: readonly AABB[],
  inset: number = HITBOX_INSET,
): boolean {
  for (let i = 0; i < obstacles.length; i++) {
    if (intersectsAABB(dino, obstacles[i], inset)) return true;
  }
  return false;
}
