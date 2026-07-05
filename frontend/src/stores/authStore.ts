import { create } from 'zustand'
import { isAxiosError } from 'axios'
import { login, signup, verifyOtp, resendOtp, getProfile, logout as authLogout } from '../api/auth'
import { UI_MESSAGES } from '../constants/messages'
import { STORAGE_KEYS } from '../constants/api'
import { useToastStore } from './toastStore'
import type { AuthMode, AuthFlowState } from '../types'

type AuthStore = Omit<AuthFlowState, 'setAuthMode'> & {
  setAuthMode: (mode: AuthMode) => void
  initSession: () => Promise<void>
  tickTimers: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => {
  return {
    token: localStorage.getItem(STORAGE_KEYS.TOKEN) ?? '',
    user: null,
    authMode: 'login',
    authName: '',
    authEmail: '',
    authPassword: '',
    authOtp: '',
    isAuthLoading: false,
    otpExpiryTimer: null,
    resendCooldown: null,

    setAuthMode: (authMode) => set({ authMode }),
    setAuthName: (authName) => set({ authName }),
    setAuthEmail: (authEmail) => set({ authEmail }),
    setAuthPassword: (authPassword) => set({ authPassword }),
    setAuthOtp: (authOtp) => set({ authOtp }),

    initSession: async () => {
      const { token } = get()
      if (!token) return
      try {
        const profile = await getProfile()
        set({ user: profile })
      } catch {
        authLogout()
        set({ token: '', user: null })
      }
    },

    tickTimers: () => {
      const { otpExpiryTimer, resendCooldown } = get()
      if (otpExpiryTimer === null && resendCooldown === null) return
      set({
        otpExpiryTimer: otpExpiryTimer === null ? null : Math.max(0, otpExpiryTimer - 1),
        resendCooldown: resendCooldown === null ? null : Math.max(0, resendCooldown - 1),
      })
    },

    handleSignup: async () => {
      const { authName, authEmail, authPassword } = get()
      set({ isAuthLoading: true })
      try {
        const res = await signup(authName, authEmail, authPassword)
        set({
          authMode: 'verify',
          otpExpiryTimer: 300,
          resendCooldown: 60,
        })
        useToastStore.getState().showToast(res.message, 'success')
      } catch (error) {
        const message = isAxiosError(error)
          ? error.response?.data?.error ?? UI_MESSAGES.SIGNUP_FAILED
          : UI_MESSAGES.SIGNUP_FAILED
        useToastStore.getState().showToast(message, 'error')
      } finally {
        set({ isAuthLoading: false })
      }
    },

    handleLogin: async () => {
      const { authEmail, authPassword } = get()
      set({ isAuthLoading: true })
      try {
        const res = await login(authEmail, authPassword)
        if (res.requiresVerification) {
          set({
            authMode: 'verify',
            otpExpiryTimer: 300,
            resendCooldown: 60,
          })
        } else if (res.token && res.user) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, res.token)
          set({
            token: res.token,
            user: res.user,
            authPassword: '',
          })
        }
        useToastStore.getState().showToast(res.message, 'success')
      } catch (error) {
        const message = isAxiosError(error)
          ? error.response?.data?.error ?? UI_MESSAGES.LOGIN_FAILED
          : UI_MESSAGES.LOGIN_FAILED
        useToastStore.getState().showToast(message, 'error')
      } finally {
        set({ isAuthLoading: false })
      }
    },

    handleVerifyOtp: async () => {
      const { authEmail, authOtp } = get()
      set({ isAuthLoading: true })
      try {
        const res = await verifyOtp(authEmail, authOtp)
        if (res.token && res.user) {
          set({
            token: res.token,
            user: res.user,
            authPassword: '',
          })
        }
        useToastStore.getState().showToast(res.message, 'success')
      } catch (error) {
        const message = isAxiosError(error)
          ? error.response?.data?.error ?? UI_MESSAGES.OTP_VERIFICATION_FAILED
          : UI_MESSAGES.OTP_VERIFICATION_FAILED
        useToastStore.getState().showToast(message, 'error')
      } finally {
        set({ isAuthLoading: false })
      }
    },

    handleResendOtp: async () => {
      const { authEmail, resendCooldown } = get()
      if (resendCooldown && resendCooldown > 0) return
      set({ isAuthLoading: true })
      try {
        const res = await resendOtp(authEmail)
        set({
          authOtp: '',
          otpExpiryTimer: 300,
          resendCooldown: 60,
        })
        useToastStore.getState().showToast(res.message, 'success')
      } catch (error) {
        const message = isAxiosError(error)
          ? error.response?.data?.error ?? UI_MESSAGES.RESEND_OTP_FAILED
          : UI_MESSAGES.RESEND_OTP_FAILED
        useToastStore.getState().showToast(message, 'error')
      } finally {
        set({ isAuthLoading: false })
      }
    },

    handleLogout: () => {
      authLogout()
      set({
        token: '',
        user: null,
        authMode: 'login',
        authName: '',
        authEmail: '',
        authPassword: '',
        authOtp: '',
        otpExpiryTimer: null,
        resendCooldown: null,
      })
    },
  }
})
