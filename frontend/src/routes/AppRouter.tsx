import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { usePdfStore } from '../stores/pdfStore'
import { useToastStore } from '../stores/toastStore'
import { AuthPage } from '../pages/AuthPage'
import { WorkspacePage } from '../pages/WorkspacePage'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { Toast } from '../components/common/Toast'

export function AppRouter() {
  const user = useAuthStore((state) => state.user)
  const initSession = useAuthStore((state) => state.initSession)
  const tickTimers = useAuthStore((state) => state.tickTimers)
  
  const loadUserPdfs = usePdfStore((state) => state.loadUserPdfs)
  
  const toast = useToastStore((state) => state.toast)
  const dismissToast = useToastStore((state) => state.dismissToast)

  // Initialize session on mount
  useEffect(() => {
    void initSession()
  }, [initSession])

  // Timer interval tick for OTP cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      tickTimers()
    }, 1000)
    return () => clearInterval(interval)
  }, [tickTimers])

  // Load user PDFs when authenticated user changes
  useEffect(() => {
    if (user) {
      void loadUserPdfs()
    }
  }, [user, loadUserPdfs])

  return (
    <ErrorBoundary>
      {user ? (
        <WorkspacePage />
      ) : (
        <AuthPage />
      )}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            tone={toast.tone}
            onClose={dismissToast}
          />
        )}
      </AnimatePresence>
    </ErrorBoundary>
  )
}

