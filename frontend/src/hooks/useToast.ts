import { useCallback, useState } from 'react'
import type { ToastState, ToastTone } from '../types'

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)

  const dismissToast = useCallback(() => {
    setToast(null)
  }, [])

  const showToast = useCallback((message: string, tone: ToastTone) => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3600)
  }, [])

  return { toast, showToast, dismissToast }
}

