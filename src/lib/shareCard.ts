import { rangoliParams } from './rangoli'

interface CardOpts {
  dateLabel: string
  quote: string
  author: string
  points: number
  petals: number
  seed: string
  appUrl: string
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = probe
    }
  }
  if (line) lines.push(line)
  return lines
}

/** WhatsApp-ready share image: the day's rangoli, score, and quote. */
export async function generateShareCard(opts: CardOpts): Promise<Blob | null> {
  try {
    const W = 1080
    const H = 1080
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Ivory paper with a turmeric crown
    ctx.fillStyle = '#FBF3DF'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#D97E00'
    ctx.fillRect(0, 0, W, 14)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#7A1E2E'
    ctx.font = 'bold 72px Georgia, serif'
    ctx.fillText('🪔 Bhajan Bodh', W / 2, 120)
    ctx.fillStyle = '#77603F'
    ctx.font = '40px Georgia, serif'
    ctx.fillText(opts.dateLabel, W / 2, 180)

    // Quote
    ctx.fillStyle = '#3B2712'
    ctx.font = 'italic 44px Georgia, serif'
    const quoteLines = wrapText(ctx, `“${opts.quote}”`, W - 220)
    quoteLines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, 260 + i * 56))
    ctx.fillStyle = '#77603F'
    ctx.font = '36px Georgia, serif'
    ctx.fillText(`— ${opts.author}`, W / 2, 260 + Math.min(quoteLines.length, 3) * 56 + 20)

    // Rangoli (same daily pattern as in the app)
    const p = rangoliParams(opts.seed, opts.petals)
    const cx = W / 2
    const cy = 640
    const scale = 3.4
    for (let i = 0; i < p.dots; i++) {
      const a = (i / p.dots) * 2 * Math.PI
      ctx.beginPath()
      ctx.arc(cx + 54 * scale * Math.cos(a), cy + 54 * scale * Math.sin(a), 2.2 * scale, 0, 2 * Math.PI)
      ctx.fillStyle = '#E8D9B8'
      ctx.fill()
    }
    for (let i = 0; i < opts.petals; i++) {
      const angle = ((i / opts.petals) * 360 - 90 + 90) * (Math.PI / 180)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.ellipse(0, -28 * scale, p.rx * scale, p.ry * scale, 0, 0, 2 * Math.PI)
      ctx.fillStyle = p.colors[i]
      ctx.globalAlpha = 0.9
      ctx.fill()
      ctx.restore()
    }
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.arc(cx, cy, 16 * scale, 0, 2 * Math.PI)
    ctx.fillStyle = '#C9A227'
    ctx.fill()
    ctx.fillStyle = '#7A1E2E'
    ctx.font = `bold ${18 * scale}px Georgia, serif`
    ctx.fillText('ॐ', cx, cy + 7 * scale)

    // Score + invitation
    ctx.fillStyle = '#3B2712'
    ctx.font = 'bold 64px Georgia, serif'
    ctx.fillText(`${opts.points} points 🌸`, W / 2, 920)
    ctx.fillStyle = '#A85E00'
    ctx.font = '38px Georgia, serif'
    ctx.fillText('Play the daily bhajan games:', W / 2, 985)
    ctx.font = 'bold 38px Georgia, serif'
    ctx.fillText(opts.appUrl.replace('https://', ''), W / 2, 1035)

    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  } catch {
    return null
  }
}
