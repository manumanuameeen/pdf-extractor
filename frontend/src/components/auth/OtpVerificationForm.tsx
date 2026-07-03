import { Loader2, ArrowLeft } from 'lucide-react'

type Props = {
  authEmail: string
  authOtp: string
  setAuthOtp: (otp: string) => void
  otpExpiryTimer: number | null
  resendCooldown: number | null
  isAuthLoading: boolean
  handleVerifyOtp: () => Promise<void>
  handleResendOtp: () => Promise<void>
  onBack: () => void
}

export function OtpVerificationForm({
  authEmail,
  authOtp,
  setAuthOtp,
  otpExpiryTimer,
  resendCooldown,
  isAuthLoading,
  handleVerifyOtp,
  handleResendOtp,
  onBack,
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (authOtp.length === 6) {
      void handleVerifyOtp()
    }
  }

  const isResendDisabled = isAuthLoading || (resendCooldown !== null && resendCooldown > 0)

  return (
    <form className="auth-form otp-verify-form" onSubmit={handleSubmit}>
      <p className="otp-instruction">
        We sent a verification code to <strong>{authEmail}</strong>
      </p>

      <label className="field">
        <span>Verification Code</span>
        <input
          id="auth-otp"
          className="otp-input-field"
          value={authOtp}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '')
            if (val.length <= 6) setAuthOtp(val)
          }}
          placeholder="0 0 0 0 0 0"
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]*"
          required
          disabled={isAuthLoading}
          autoFocus
        />
      </label>

      <div className="otp-timer-row">
        {otpExpiryTimer !== null && otpExpiryTimer > 0 && (
          <span className="otp-timer">Code expires in {otpExpiryTimer}s</span>
        )}
        {otpExpiryTimer === 0 && (
          <span className="otp-timer expired">Code expired</span>
        )}
      </div>

      <button
        id="auth-submit"
        className="primary-button wide"
        type="submit"
        disabled={isAuthLoading || authOtp.length < 6}
        style={{ marginTop: 16 }}
      >
        {isAuthLoading ? (
          <>
            <Loader2 className="spin" size={18} />
            Verifying Code...
          </>
        ) : (
          'Verify OTP Code'
        )}
      </button>

      <div className="otp-action-buttons">
        <button
          id="resend-otp"
          className="ghost-button"
          type="button"
          disabled={isResendDisabled}
          onClick={() => void handleResendOtp()}
        >
          {resendCooldown && resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
        </button>

        <button className="ghost-button back-btn" type="button" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    </form>
  )
}
