import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type TextScale = 0 | 1 | 2 // A / A+ / A++

const SCALE_PERCENT: Record<TextScale, number> = { 0: 100, 1: 115, 2: 130 }

interface SettingsState {
  textScale: TextScale
  soundOn: boolean
  displayName: string
  setTextScale: (s: TextScale) => void
  cycleTextScale: () => void
  setSoundOn: (on: boolean) => void
  setDisplayName: (name: string) => void
}

export function applyTextScale(scale: TextScale) {
  document.documentElement.style.fontSize = `${SCALE_PERCENT[scale]}%`
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      textScale: 0,
      soundOn: true,
      displayName: '',
      setTextScale: (textScale) => {
        set({ textScale })
        applyTextScale(textScale)
      },
      cycleTextScale: () => {
        const next = ((get().textScale + 1) % 3) as TextScale
        get().setTextScale(next)
      },
      setSoundOn: (soundOn) => set({ soundOn }),
      setDisplayName: (displayName) => set({ displayName: displayName.slice(0, 20) }),
    }),
    {
      name: 'bhajan-bodh-settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) applyTextScale(state.textScale)
      },
    },
  ),
)
