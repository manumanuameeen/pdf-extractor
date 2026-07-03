import type { AuthMode } from '../../types'

type Props = {
  authMode: AuthMode
  setAuthMode: (mode: 'login' | 'signup') => void
}

export function AuthTabs({ authMode, setAuthMode }: Props) {
  return (
    <div className="auth-tabs" role="tablist">
      <button
        className={authMode === 'login' ? 'active' : ''}
        type="button"
        role="tab"
        aria-selected={authMode === 'login'}
        onClick={() => setAuthMode('login')}
      >
        Login
      </button>
      <button
        className={authMode === 'signup' ? 'active' : ''}
        type="button"
        role="tab"
        aria-selected={authMode === 'signup'}
        onClick={() => setAuthMode('signup')}
      >
        Signup
      </button>
    </div>
  )
}
