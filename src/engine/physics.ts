export const JUMP_VELOCITY = 600;
export const GRAVITY = 1800;
export const GROUND_Y = 0;

export interface DinoState {
  readonly y: number;
  readonly velocityY: number;
  readonly isGrounded: boolean;
}

export function initDino(): DinoState {
  return { y: GROUND_Y, velocityY: 0, isGrounded: true };
}

export function applyJump(state: DinoState, jumpVelocity: number = JUMP_VELOCITY): DinoState {
  if (!state.isGrounded) return state;
  return { y: state.y, velocityY: jumpVelocity, isGrounded: false };
}

export function updateDino(
  state: DinoState,
  deltaTime: number,
  gravity: number = GRAVITY,
): DinoState {
  if (state.isGrounded) return state;

  const nextVelocity = state.velocityY - gravity * deltaTime;
  const nextY = state.y + nextVelocity * deltaTime;

  if (nextY <= GROUND_Y) {
    return { y: GROUND_Y, velocityY: 0, isGrounded: true };
  }
  return { y: nextY, velocityY: nextVelocity, isGrounded: false };
}
