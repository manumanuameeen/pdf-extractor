import { Loader2 } from 'lucide-react'

type Props = {
  authEmail: string
  setAuthEmail: (email: string) => void
  onSubmit: () => Promise<void>
  isLoading: boolean
}

export function LoginForm({ authEmail, setAuthEmail, onSubmit, isLoading }: Props) {
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

      <button
        id="auth-submit"
        className="primary-button wide"
        type="submit"
        disabled={isLoading || !authEmail}
        style={{ marginTop: 8 }}
      >
        {isLoading ? (
          <>
            <Loader2 className="spin" size={18} />
            Sending Code...
          </>
        ) : (
          'Send Verification Code'
        )}
      </button>
    </form>
  )
}
