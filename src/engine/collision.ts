export const HITBOX_INSET = 3;

export interface AABB {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

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
