/**
 * Google Analytics 4 event tracking wrapper.
 * Fire-and-forget — silently no-ops if gtag is blocked or not loaded.
 *
 * Events tracked:
 *   game_start        { date }
 *   round_1_correct   { date }
 *   round_2_partial   { date }
 *   round_3_incorrect { date }
 *   game_complete     { date }
 *   share_score       {}
 *   donate_click      {}
 *   install_app       {}
 *   notification_enable {}
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(event: string, date?: string): void {
  try {
    window.gtag?.('event', event, {
      ...(date ? { puzzle_date: date } : {}),
    })
  } catch {
    // Silently ignore — analytics should never break the app
  }
}
