import { useMemo } from 'react'
import { rangoliParams } from '../../lib/rangoli'

interface Props {
  petals: number
  filled: number
  seed: string
  size?: number
}

/**
 * Date-seeded rangoli: one petal per scheduled game, filling as games
 * complete. Every day's pattern is a little different (plan §A2.9).
 */
export function Rangoli({ petals, filled, seed, size = 120 }: Props) {
  const { petalShapes, colorOrder, ringDots } = useMemo(() => {
    const p = rangoliParams(seed, petals)
    return { petalShapes: { rx: p.rx, ry: p.ry }, colorOrder: p.colors, ringDots: p.dots }
  }, [seed, petals])

  const complete = filled >= petals && petals > 0
  const c = 60

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Rangoli: ${filled} of ${petals} petals filled`}
    >
      {/* outer dotted ring */}
      {Array.from({ length: ringDots }, (_, i) => {
        const a = (i / ringDots) * 2 * Math.PI
        return (
          <circle
            key={i}
            cx={c + 54 * Math.cos(a)}
            cy={c + 54 * Math.sin(a)}
            r={2.2}
            fill="#E8D9B8"
          />
        )
      })}
      {/* petals */}
      {Array.from({ length: petals }, (_, i) => {
        const angle = (i / petals) * 360 - 90
        const isFilled = i < filled
        return (
          <ellipse
            key={i}
            cx={c}
            cy={c - 28}
            rx={petalShapes.rx}
            ry={petalShapes.ry}
            transform={`rotate(${angle + 90} ${c} ${c})`}
            fill={isFilled ? colorOrder[i] : '#FFFBF0'}
            stroke={isFilled ? colorOrder[i] : '#E8D9B8'}
            strokeWidth={2}
            opacity={isFilled ? 0.9 : 1}
          />
        )
      })}
      {/* center */}
      <circle cx={c} cy={c} r={16} fill={complete ? '#C9A227' : '#FFFBF0'} stroke="#E8D9B8" strokeWidth={2} />
      {complete && (
        <text
          x={c}
          y={c + 6}
          textAnchor="middle"
          fontSize={16}
          fill="#7A1E2E"
          fontFamily="serif"
        >
          ॐ
        </text>
      )}
    </svg>
  )
}
