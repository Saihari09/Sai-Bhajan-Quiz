import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface InstallState {
  promptDismissedAt: string | null
  installAcceptedAt: string | null
  visitCount: number
  notifPromptDismissedAt: string | null
}

interface InstallActions {
  incrementVisit: () => void
  dismissPrompt: () => void
  acceptInstall: () => void
  dismissNotifPrompt: () => void
}

type InstallStore = InstallState & InstallActions

export const useInstallStore = create<InstallStore>()(
  persist(
    (set) => ({
      promptDismissedAt: null,
      installAcceptedAt: null,
      visitCount: 0,
      notifPromptDismissedAt: null,

      incrementVisit: () =>
        set((s) => ({ visitCount: s.visitCount + 1 })),

      dismissPrompt: () =>
        set({ promptDismissedAt: new Date().toISOString() }),

      acceptInstall: () =>
        set({ installAcceptedAt: new Date().toISOString() }),

      dismissNotifPrompt: () =>
        set({ notifPromptDismissedAt: new Date().toISOString() }),
    }),
    {
      name: 'sai-bhajan-install',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
