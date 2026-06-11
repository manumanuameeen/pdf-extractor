import { useEffect, useRef, useState } from 'react';
import './App.css';
import { AuthView } from './components/AuthView';
import { PdfWorkspace } from './components/PdfWorkspace';
import { Toast } from './components/Toast';
import { clearAuthSession, getProfile, login, refreshAccessToken, resendOtp, signup, verifyOtp } from './services/authService';
import type { PublicUser } from './types';

function App() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toastTimeout = useRef<number | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await refreshAccessToken();
      } catch {
        // no refresh token yet or token refresh failed
      }

      const storedToken = localStorage.getItem('pdf_extractor_token');

      if (!storedToken) {
        clearAuthSession();
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getProfile();
        setUser(profile);
      } catch {
        clearAuthSession();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const showToast = (message: string, tone: 'success' | 'error') => {
    setToast({ message, tone });

    if (toastTimeout.current) {
      window.clearTimeout(toastTimeout.current);
    }

    toastTimeout.current = window.setTimeout(() => {
      setToast(null);
      toastTimeout.current = null;
    }, 4000);
  };

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    setUser(result.user);
    return result;
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    return signup(name, email, password);
  };

  const handleVerifyOtp = async (email: string, otp: string) => {
    const result = await verifyOtp(email, otp);
    setUser(result.user);
    return result;
  };

  const handleResendOtp = async (email: string) => {
    return resendOtp(email);
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
  };

  if (isLoading) {
    return (
      <main className="app-shell">
        <div className="loader-card">
          <span className="loader-ring" />
          <p>Starting PDF Extractor...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="app-grid">
        <aside className="brand-panel">
          <div>
            <span className="eyebrow">PDF Extractor</span>
            <h1>Smart page extraction, fast workflow.</h1>
            <p>Upload a PDF, choose pages, and download your trimmed document instantly.</p>
          </div>
          <div className="brand-features">
            <div>
              <strong>Fast extraction</strong>
              <p>Pick pages using ranges, comma lists, or full-document selection.</p>
            </div>
            <div>
              <strong>Secure auth</strong>
              <p>JWT + refresh token flow keeps your session active safely.</p>
            </div>
            <div>
              <strong>Polished interface</strong>
              <p>A clean control panel for uploading and downloading extracted files.</p>
            </div>
          </div>
        </aside>

        <section className="content-panel">
          {toast && <Toast message={toast.message} tone={toast.tone} />}
          {user ? (
            <PdfWorkspace user={user} onUpdateUser={setUser} onLogout={handleLogout} showToast={showToast} />
          ) : (
            <AuthView
              onLogin={handleLogin}
              onSignup={handleSignup}
              onVerifyOtp={handleVerifyOtp}
              onResendOtp={handleResendOtp}
              showToast={showToast}
            />
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
