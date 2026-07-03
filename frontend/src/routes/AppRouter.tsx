import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useToast } from '../hooks/useToast'
import { useAuthFlow } from '../hooks/useAuthFlow'
import { usePdfWorkspace } from '../hooks/usePdfWorkspace'
import { AuthPage } from '../pages/AuthPage'
import { WorkspacePage } from '../pages/WorkspacePage'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { Toast } from '../components/common/Toast'

export function AppRouter() {
  const { toast, showToast, dismissToast } = useToast()
  const auth = useAuthFlow({ showToast })
  const workspace = usePdfWorkspace({ token: auth.token, showToast })

  useEffect(() => {
    if (auth.user) {
      void workspace.loadUserPdfs()
    }
  }, [auth.user, workspace.loadUserPdfs])

  return (
    <ErrorBoundary>
      {auth.user ? (
        <WorkspacePage user={auth.user} auth={auth} workspace={workspace} />
      ) : (
        <AuthPage auth={auth} />
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

