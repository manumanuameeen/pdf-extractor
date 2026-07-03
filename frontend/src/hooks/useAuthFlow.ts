import { useCallback, useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { login, signup, verifyOtp, resendOtp, getProfile, logout as authLogout, type User } from '../api/auth'
import { UI_MESSAGES } from '../constants/messages'
import { STORAGE_KEYS } from '../constants/api'
import type { AuthMode, AuthFlowState } from '../types'
type UseAuthFlowOptions = {
  showToast: (message: string, tone: 'success' | 'error') => void
}

export function useAuthFlow({ showToast }: UseAuthFlowOptions): AuthFlowState {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.TOKEN) ?? '')
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authOtp, setAuthOtp] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [otpExpiryTimer, setOtpExpiryTimer] = useState<number | null>(null)
  const [resendCooldown, setResendCooldown] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    getProfile()
      .then((profile) => setUser(profile))
      .catch(() => {
        authLogout()
        setToken('')
        setUser(null)
      })
  }, [token])

  useEffect(() => {
    if (otpExpiryTimer === null && resendCooldown === null) return

    const interval = window.setInterval(() => {
      setOtpExpiryTimer((prev) => (prev === null ? null : Math.max(0, prev - 1)))
      setResendCooldown((prev) => (prev === null ? null : Math.max(0, prev - 1)))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [otpExpiryTimer, resendCooldown])

  const handleSignup = useCallback(async () => {
    setIsAuthLoading(true)
    try {
      const res = await signup(authName, authEmail)
      setAuthMode('verify')
      setOtpExpiryTimer(300)
      setResendCooldown(60)
      showToast(res.message, 'success')
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.SIGNUP_FAILED
        : UI_MESSAGES.SIGNUP_FAILED
      showToast(message, 'error')
    } finally {
      setIsAuthLoading(false)
    }
  }, [authName, authEmail, showToast])

  const handleLogin = useCallback(async () => {
    setIsAuthLoading(true)
    try {
      const res = await login(authEmail)
      setAuthMode('verify')
      setOtpExpiryTimer(300)
      setResendCooldown(60)
      showToast(res.message, 'success')
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.LOGIN_FAILED
        : UI_MESSAGES.LOGIN_FAILED
      showToast(message, 'error')
    } finally {
      setIsAuthLoading(false)
    }
  }, [authEmail, showToast])

  const handleVerifyOtp = useCallback(async () => {
    setIsAuthLoading(true)
    try {
      const res = await verifyOtp(authEmail, authOtp)
      if (res.token && res.user) {
        setToken(res.token)
        setUser(res.user)
      }
      showToast(res.message, 'success')
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.OTP_VERIFICATION_FAILED
        : UI_MESSAGES.OTP_VERIFICATION_FAILED
      showToast(message, 'error')
    } finally {
      setIsAuthLoading(false)
    }
  }, [authEmail, authOtp, showToast])

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown && resendCooldown > 0) return
    setIsAuthLoading(true)
    try {
      const res = await resendOtp(authEmail)
      setAuthOtp('')
      setOtpExpiryTimer(300)
      setResendCooldown(60)
      showToast(res.message, 'success')
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.RESEND_OTP_FAILED
        : UI_MESSAGES.RESEND_OTP_FAILED
      showToast(message, 'error')
    } finally {
      setIsAuthLoading(false)
    }
  }, [authEmail, resendCooldown, showToast])

  const handleLogout = useCallback(() => {
    authLogout()
    setToken('')
    setUser(null)
    setAuthMode('login')
    setAuthName('')
    setAuthEmail('')
    setAuthOtp('')
    setOtpExpiryTimer(null)
    setResendCooldown(null)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout()
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [handleLogout])

  return {
    token,
    user,
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
    handleLogout,
  }
}
