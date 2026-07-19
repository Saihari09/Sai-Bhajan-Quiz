import { create } from 'zustand'

interface ToastState {
  message: string | null
  show: (message: string) => void
  clear: () => void
}

let timer: ReturnType<typeof setTimeout> | undefined

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    clearTimeout(timer)
    set({ message })
    timer = setTimeout(() => set({ message: null }), 3500)
  },
  clear: () => {
    clearTimeout(timer)
    set({ message: null })
  },
}))
