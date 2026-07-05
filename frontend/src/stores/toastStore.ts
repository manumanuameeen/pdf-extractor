import { create } from 'zustand'
import type { ToastState, ToastTone } from '../types'

type ToastStore = {
  toast: ToastState | null
  showToast: (message: string, tone: ToastTone) => void
  dismissToast: () => void
}

export const useToastStore = create<ToastStore>((set) => {
  let timerId: number | null = null

  return {
    toast: null,
    showToast: (message, tone) => {
      if (timerId) window.clearTimeout(timerId)
      set({ toast: { message, tone } })
      timerId = window.setTimeout(() => {
        set({ toast: null })
      }, 3600)
    },
    dismissToast: () => {
      if (timerId) window.clearTimeout(timerId)
      set({ toast: null })
    },
  }
})
