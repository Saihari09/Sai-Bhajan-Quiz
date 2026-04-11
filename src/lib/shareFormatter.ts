import type { DayResult } from '../types/game'
import { formatDisplayDate } from './dateUtils'

function roundEmoji(points: number, isCorrect: boolean): string {
  if (!isCorrect) return '❌'
  if (points >= 90) return '🟢'
  if (points >= 70) return '🟡'
  return '🟠'
}

export function generateShareText(result: DayResult, _bhajanTitle: string, streak: number): string {
  const r = result.roundResults
  const lines = [
    `🙏 Om Sai Ram — Bhajan Quiz · ${formatDisplayDate(result.date)}`,
    ``,
    `Round 1 (Deity):      ${roundEmoji(r[0].totalPoints, r[0].isCorrect)} ${r[0].totalPoints} pts`,
    `Round 2 (First line): ${roundEmoji(r[1].totalPoints, r[1].isCorrect)} ${r[1].totalPoints} pts`,
    `Round 3 (Scramble):   ${roundEmoji(r[2].totalPoints, r[2].isCorrect)} ${r[2].totalPoints} pts`,
    ``,
    `Total: ${result.finalScore} / 300${streak >= 3 ? ` 🔥 ${streak}-day streak!` : ''}`,
    `Play today's bhajan → ${window.location.origin}${import.meta.env.BASE_URL}`,
  ]
  return lines.join('\n')
}

export async function shareResult(text: string): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return
    } catch {
      // User cancelled or API unavailable, fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(text)
}
