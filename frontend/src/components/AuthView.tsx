import { useMemo, useState } from 'react';
import type { AuthMode } from '../types';
import type { AuthResponse } from '../services/authService';
import { UI_MESSAGES } from '../constants/messages';

type Props = {
  onLogin: (email: string, password: string) => Promise<AuthResponse>;
  onSignup: (name: string, email: string, password: string) => Promise<AuthResponse>;
  onVerifyOtp: (email: string, otp: string) => Promise<AuthResponse>;
  onResendOtp: (email: string) => Promise<AuthResponse>;
  showToast: (message: string, tone: 'success' | 'error') => void;
};

export function AuthView({ onLogin, onSignup, onVerifyOtp, onResendOtp, showToast }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const canVerify = Boolean(pendingEmail);

  const isEmailValid = (value: string) => /^\S+@\S+\.\S+$/.test(value.trim());
  const isPasswordValid = (value: string) => value.trim().length >= 8;
  const isNameValid = (value: string) => value.trim().length >= 2;
  const isOtpValid = (value: string) => /^\d{6}$/.test(value.trim());

  const validateForm = (): boolean => {
    const normalizedEmail = email.trim();

    if (!isEmailValid(normalizedEmail)) {
      showToast('Please enter a valid email address.', 'error');
      return false;
    }

    if (mode === 'signup') {
      if (!isNameValid(name)) {
        showToast('Please enter your full name.', 'error');
        return false;
      }

      if (!isPasswordValid(password)) {
        showToast('Password must be at least 8 characters.', 'error');
        return false;
      }
    }

    if (mode === 'login') {
      if (!isPasswordValid(password)) {
        showToast('Password must be at least 8 characters.', 'error');
        return false;
      }
    }

    if (mode === 'verify') {
      if (!canVerify) {
        showToast('Start signup first to receive a verification code.', 'error');
        return false;
      }

      if (!isOtpValid(otp)) {
        showToast('Please enter the 6-digit code sent to your email.', 'error');
        return false;
      }
    }

    return true;
  };

  const formTitle = useMemo(() => {
    switch (mode) {
      case 'signup':
        return 'Create your account';
      case 'verify':
        return 'Verify your email';
      default:
        return 'Sign in to continue';
    }
  }, [mode]);

  const submitLabel = useMemo(() => {
    if (mode === 'signup') return 'Create account';
    if (mode === 'verify') return 'Verify OTP';
    return 'Sign in';
  }, [mode]);

  const submitForm = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(email, password);
        showToast('Signed in successfully.', 'success');
      }

      if (mode === 'signup') {
        const response = await onSignup(name, email, password);
        setPendingEmail(email);
        setPassword('');
        setOtp('');
        setMode('verify');
        showToast(response.message, 'success');
      }

      if (mode === 'verify') {
        await onVerifyOtp(pendingEmail || email, otp);
        showToast('Your account is verified.', 'success');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : UI_MESSAGES.LOGIN_FAILED;
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) {
      showToast('Start signup first to receive an OTP.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await onResendOtp(pendingEmail);
      showToast(response.message, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : UI_MESSAGES.RESEND_OTP_FAILED;
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-headline">
          <span className="eyebrow">Secure Access</span>
          <h2>{formTitle}</h2>
          <p>Use your email and password to sign in, or create a new account in seconds.</p>
        </div>

        <div className="tab-row">
          <button
            className={mode === 'login' ? 'tab active' : 'tab'}
            type="button"
            onClick={() => {
              setMode('login');
              setPendingEmail('');
              setOtp('');
            }}
          >
            Login
          </button>

          <button
            className={mode === 'signup' ? 'tab active' : 'tab'}
            type="button"
            onClick={() => {
              setMode('signup');
              setPendingEmail('');
              setOtp('');
            }}
          >
            Signup
          </button>

          {canVerify && (
            <button
              className={mode === 'verify' ? 'tab active' : 'tab'}
              type="button"
              onClick={() => setMode('verify')}
            >
              Verify
            </button>
          )}
        </div>

        <div className="form-grid">
          {mode === 'signup' && (
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              value={email}
              placeholder="you@example.com"
              type="email"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          {mode !== 'verify' && (
            <label className="field">
              <span>Password</span>
              <input
                value={password}
                type="password"
                placeholder="At least 8 characters"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}

          {mode === 'verify' && (
            <label className="field">
              <span>OTP Code</span>
              <input
                value={otp}
                placeholder="Enter your OTP"
                onChange={(event) => setOtp(event.target.value)}
              />
            </label>
          )}
        </div>

        {mode === 'verify' && pendingEmail && (
          <div className="notification-panel">
            Verification code sent to <strong>{pendingEmail}</strong>
          </div>
        )}

        <div className="action-group">
          <button className="btn-primary" type="button" onClick={submitForm} disabled={isLoading}>
            {isLoading ? 'Processing...' : submitLabel}
          </button>
          {mode === 'verify' && (
            <button className="btn-secondary" type="button" onClick={handleResend} disabled={isLoading}>
              Resend OTP
            </button>
          )}
        </div>

        {mode === 'signup' && (
          <p className="footnote">
            After signup, you will receive a verification code by email. Each address can be registered only once.
          </p>
        )}
      </div>
    </div>
  );
}
