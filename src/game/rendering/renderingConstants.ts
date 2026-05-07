export const BASE_SCREEN_WIDTH = 160
export const BASE_SCREEN_HEIGHT = 144
export const SCREEN_WIDTH = 785
export const SCREEN_HEIGHT = 707
export const PET_FRAME_SIZE = 314
export const RENDER_SCALE = PET_FRAME_SIZE / 64

export const PET_BASELINE = {
  centerX: Math.round(BASE_SCREEN_WIDTH * RENDER_SCALE * 0.5),
  defaultY: Math.round(112 * RENDER_SCALE),
  eggY: Math.round(106 * RENDER_SCALE),
  lowY: Math.round(116 * RENDER_SCALE),
} as const
