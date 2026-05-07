export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function clampInteger(value: number, min: number, max: number): number {
  return Math.trunc(clamp(value, min, max))
}
