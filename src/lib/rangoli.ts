import { seededRng } from './seeded'

export const PETAL_COLORS = ['#D97E00', '#7A1E2E', '#C9A227', '#3E7A45']

/** Daily pattern parameters — shared by the SVG rangoli and the canvas share card. */
export function rangoliParams(seed: string, petals: number) {
  const rng = seededRng(seed + ':rangoli')
  const colorStart = Math.floor(rng() * PETAL_COLORS.length)
  const rx = 14 + rng() * 8
  const ry = 26 + rng() * 10
  const dots = 8 + Math.floor(rng() * 5) * 2
  return {
    rx,
    ry,
    dots,
    colors: Array.from(
      { length: petals },
      (_, i) => PETAL_COLORS[(colorStart + i) % PETAL_COLORS.length],
    ),
  }
}
