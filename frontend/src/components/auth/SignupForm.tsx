import { Loader2 } from 'lucide-react'

type Props = {
  authName: string
  setAuthName: (name: string) => void
  authEmail: string
  setAuthEmail: (email: string) => void
  onSubmit: () => Promise<void>
  isLoading: boolean
}

export function SignupForm({
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  onSubmit,
  isLoading,
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void onSubmit()
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Name</span>
        <input
          id="auth-name"
          type="text"
          value={authName}
          onChange={(e) => setAuthName(e.target.value)}
          placeholder="Your full name"
          required
          autoComplete="name"
          disabled={isLoading}
        />
      </label>

      <label className="field" style={{ marginTop: 12 }}>
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
        disabled={isLoading || !authName || !authEmail}
        style={{ marginTop: 16 }}
      >
        {isLoading ? (
          <>
            <Loader2 className="spin" size={18} />
            Creating Account...
          </>
        ) : (
          'Create Account & Send Code'
        )}
      </button>
    </form>
  )
}
