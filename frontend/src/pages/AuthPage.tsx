import { ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthTabs } from '../components/auth/AuthTabs'
import { LoginForm } from '../components/auth/LoginForm'
import { SignupForm } from '../components/auth/SignupForm'
import { OtpVerificationForm } from '../components/auth/OtpVerificationForm'
import type { AuthFlowState } from '../types'

type Props = {
  auth: AuthFlowState
}

export function AuthPage({ auth }: Props) {
  const {
    authMode,
    authName,
    authEmail,
    authOtp,
    isAuthLoading,
    otpExpiryTimer,
    resendCooldown,
    setAuthMode,
    setAuthName,
    setAuthEmail,
    setAuthOtp,
    handleSignup,
    handleLogin,
    handleVerifyOtp,
    handleResendOtp,
  } = auth

  return (
    <main className="app-shell auth-shell">
      <motion.section
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="auth-brand">
          <div className="auth-logo-glow">
            <ShieldCheck size={38} />
          </div>
          <p className="eyebrow">Secure PDF Workspace</p>
          <motion.h1
            key={authMode}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {authMode === 'login'
              ? 'Login to continue.'
              : authMode === 'signup'
              ? 'Create your account.'
              : 'Verify your email.'}
          </motion.h1>
        </div>

        {authMode !== 'verify' && (
          <AuthTabs authMode={authMode} setAuthMode={(mode) => {
            setAuthMode(mode)
            setAuthOtp('')
          }} />
        )}

        <div className="auth-form-container">
          <AnimatePresence mode="wait">
            {authMode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <LoginForm
                  authEmail={authEmail}
                  setAuthEmail={setAuthEmail}
                  onSubmit={handleLogin}
                  isLoading={isAuthLoading}
                />
              </motion.div>
            )}

            {authMode === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <SignupForm
                  authName={authName}
                  setAuthName={setAuthName}
                  authEmail={authEmail}
                  setAuthEmail={setAuthEmail}
                  onSubmit={handleSignup}
                  isLoading={isAuthLoading}
                />
              </motion.div>
            )}

            {authMode === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <OtpVerificationForm
                  authEmail={authEmail}
                  authOtp={authOtp}
                  setAuthOtp={setAuthOtp}
                  otpExpiryTimer={otpExpiryTimer}
                  resendCooldown={resendCooldown}
                  isAuthLoading={isAuthLoading}
                  handleVerifyOtp={handleVerifyOtp}
                  handleResendOtp={handleResendOtp}
                  onBack={() => {
                    setAuthMode('login')
                    setAuthOtp('')
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </main>
  )
}
