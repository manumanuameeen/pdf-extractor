import { Loader2 } from 'lucide-react'

type Props = {
  authEmail: string
  setAuthEmail: (email: string) => void
  authPassword?: string
  setAuthPassword?: (password: string) => void
  onSubmit: () => Promise<void>
  isLoading: boolean
}

export function LoginForm({ authEmail, setAuthEmail, authPassword = '', setAuthPassword, onSubmit, isLoading }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void onSubmit()
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email Address</span>
        <input
          id="auth-email"
          type="email"
          value={authEmail}
          onChange={(e) => setAuthEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          id="auth-password"
          type="password"
          value={authPassword}
          onChange={(e) => setAuthPassword?.(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={isLoading}
        />
      </label>

      <button
        id="auth-submit"
        className="primary-button wide"
        type="submit"
        disabled={isLoading || !authEmail || !authPassword}
        style={{ marginTop: 8 }}
      >
        {isLoading ? (
          <>
            <Loader2 className="spin" size={18} />
            Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  )
}
