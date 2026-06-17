import { Component, type ChangeEvent, type DragEvent, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import * as pdfjsLib from 'pdfjs-dist'
import { ArrowDown, ArrowUp, Check, Download, FileText, Loader2, LogOut, RotateCcw, Scissors, ShieldCheck, UploadCloud, X } from 'lucide-react'
import { API_BASE_URL, API_ENDPOINTS, HTTP_HEADERS, STORAGE_KEYS } from './constants/api'
import { UI_MESSAGES } from './constants/messages'
import { signup, login, verifyOtp, resendOtp, getProfile, logout as logoutService, type User } from './services/authService'
import './App.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

type UploadedPdf = {
  id: string
  name: string
  size: number
  pageCount: number
  previewUrl: string
}

type ExtractedPdf = {
  fileName: string
  pageCount: number
  downloadUrl: string
}

type ToastState = {
  tone: 'success' | 'error'
  message: string
}

type AuthMode = 'login' | 'signup' | 'verify'

type ErrorBoundaryState = {
  hasError: boolean
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell">
          <section className="empty-state">
            <FileText size={42} />
            <h1>Something went wrong</h1>
            <p>{UI_MESSAGES.REFRESH_AND_RETRY}</p>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const getAssetUrl = (path: string) => {
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}${path}`
}

function PageCard({
  pdfUrl,
  token,
  pageNumber,
  selectedOrder,
  onToggle,
  onMove,
}: {
  pdfUrl: string
  token: string
  pageNumber: number
  selectedOrder: number | null
  onToggle: (pageNumber: number) => void
  onMove: (pageNumber: number, direction: -1 | 1) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let cancelled = false

    const renderPage = async () => {
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (!canvas || !context) return

      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        httpHeaders: { [HTTP_HEADERS.AUTHORIZATION]: `${HTTP_HEADERS.BEARER} ${token}` },
      })
      const pdf = await loadingTask.promise
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 0.45 })

      if (cancelled) return

      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvas, canvasContext: context, viewport }).promise
    }

    renderPage().catch(() => {
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (canvas && context) {
        context.fillStyle = '#151926'
        context.fillRect(0, 0, canvas.width || 220, canvas.height || 300)
      }
    })

    return () => { cancelled = true }
  }, [pdfUrl, pageNumber, token])

  const isSelected = selectedOrder !== null

  return (
    <motion.article
      layout
      className={`page-card ${isSelected ? 'selected' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <button className="page-toggle" type="button" onClick={() => onToggle(pageNumber)}>
        <span className="page-preview">
          <canvas ref={canvasRef} aria-label={`Preview of page ${pageNumber}`} />
        </span>
        <span className="page-meta">
          <span>Page {pageNumber}</span>
          {isSelected && <strong>#{selectedOrder}</strong>}
        </span>
      </button>
      {isSelected && (
        <div className="page-actions" aria-label={`Reorder page ${pageNumber}`}>
          <button type="button" onClick={() => onMove(pageNumber, -1)} title="Move earlier"><ArrowUp size={16} /></button>
          <button type="button" onClick={() => onMove(pageNumber, 1)} title="Move later"><ArrowDown size={16} /></button>
        </div>
      )}
    </motion.article>
  )
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.TOKEN) ?? '')
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authOtp, setAuthOtp] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [uploadedPdf, setUploadedPdf] = useState<UploadedPdf | null>(null)
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedPdf, setExtractedPdf] = useState<ExtractedPdf | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [otpExpiryTimer, setOtpExpiryTimer] = useState<number | null>(null)
  const [resendCooldown, setResendCooldown] = useState<number | null>(null)

  const showToast = (message: string, tone: ToastState['tone']) => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3600)
  }

  // OTP countdown timers
  useEffect(() => {
    if (otpExpiryTimer === null && resendCooldown === null) return
    const interval = window.setInterval(() => {
      setOtpExpiryTimer((prev) => (prev === null ? null : Math.max(0, prev - 1)))
      setResendCooldown((prev) => (prev === null ? null : Math.max(0, prev - 1)))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [otpExpiryTimer, resendCooldown])

  // Restore session on mount
  useEffect(() => {
    if (!token) return
    getProfile()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        setToken('')
        setUser(null)
      })
  }, [token])

  const handleSignup = async () => {
    setIsAuthLoading(true)
    try {
      const res = await signup(authName, authEmail)
      setAuthMode('verify')
      setOtpExpiryTimer(300)      // 5 min
      setResendCooldown(60)       // 60s cooldown
      showToast(res.message, 'success')
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.SIGNUP_FAILED
        : UI_MESSAGES.SIGNUP_FAILED
      showToast(message, 'error')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogin = async () => {
    setIsAuthLoading(true)
    try {
      const res = await login(authEmail)
      setAuthMode('verify')
      setOtpExpiryTimer(300)
      setResendCooldown(60)
      showToast(res.message, 'success')
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.LOGIN_FAILED
        : UI_MESSAGES.LOGIN_FAILED
      showToast(message, 'error')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setIsAuthLoading(true)
    try {
      const res = await verifyOtp(authEmail, authOtp)
      if (res.token && res.user) {
        setToken(res.token)
        setUser(res.user)
      }
      showToast(res.message, 'success')
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.OTP_VERIFICATION_FAILED
        : UI_MESSAGES.OTP_VERIFICATION_FAILED
      showToast(message, 'error')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown && resendCooldown > 0) return
    setIsAuthLoading(true)
    try {
      const res = await resendOtp(authEmail)
      setAuthOtp('')
      setOtpExpiryTimer(300)
      setResendCooldown(60)
      showToast(res.message, 'success')
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.RESEND_OTP_FAILED
        : UI_MESSAGES.RESEND_OTP_FAILED
      showToast(message, 'error')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogout = () => {
    logoutService()
    setToken('')
    setUser(null)
    setUploadedPdf(null)
    setSelectedPages([])
    setExtractedPdf(null)
    setAuthMode('login')
    setAuthEmail('')
    setAuthOtp('')
  }

  const uploadPdf = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast(UI_MESSAGES.INVALID_PDF, 'error')
      return
    }

    const formData = new FormData()
    formData.append('pdf', file)

    const request = new XMLHttpRequest()
    request.open('POST', `${API_BASE_URL}${API_ENDPOINTS.PDFS.UPLOAD}`)
    request.setRequestHeader(HTTP_HEADERS.AUTHORIZATION, `${HTTP_HEADERS.BEARER} ${token}`)
    setIsUploading(true)
    setUploadProgress(0)
    setExtractedPdf(null)

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100))
    }

    request.onload = () => {
      setIsUploading(false)
      try {
        const response = JSON.parse(request.responseText)
        if (request.status >= 400) {
          showToast(response.error ?? UI_MESSAGES.UPLOAD_FAILED, 'error')
          return
        }
        setUploadedPdf(response)
        setSelectedPages([])
        setUploadProgress(100)
        showToast(UI_MESSAGES.PDF_UPLOADED, 'success')
      } catch {
        showToast(UI_MESSAGES.UPLOAD_UNEXPECTED_RESPONSE, 'error')
      }
    }

    request.onerror = () => {
      setIsUploading(false)
      showToast(UI_MESSAGES.BACKEND_UNREACHABLE, 'error')
    }

    request.send(formData)
  }

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) uploadPdf(file)
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) uploadPdf(file)
  }

  const togglePage = (pageNumber: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNumber) ? prev.filter((p) => p !== pageNumber) : [...prev, pageNumber]
    )
    setExtractedPdf(null)
  }

  const movePage = (pageNumber: number, direction: -1 | 1) => {
    setSelectedPages((prev) => {
      const index = prev.indexOf(pageNumber)
      const targetIndex = index + direction
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev
      const next = [...prev]
      next[index] = prev[targetIndex]
      next[targetIndex] = pageNumber
      return next
    })
  }

  const selectAllPages = () => {
    if (!uploadedPdf) return
    setSelectedPages(Array.from({ length: uploadedPdf.pageCount }, (_, i) => i + 1))
    setExtractedPdf(null)
  }

  const resetWorkspace = () => {
    setUploadedPdf(null)
    setSelectedPages([])
    setExtractedPdf(null)
    setUploadProgress(0)
  }

  const extractPages = async () => {
    if (!uploadedPdf || selectedPages.length === 0) {
      showToast(UI_MESSAGES.SELECT_PAGE_FIRST, 'error')
      return
    }
    setIsExtracting(true)
    try {
      const response = await axios.post<ExtractedPdf>(
        `${API_BASE_URL}${API_ENDPOINTS.PDFS.EXTRACT(uploadedPdf.id)}`,
        { pages: selectedPages },
        { headers: { [HTTP_HEADERS.AUTHORIZATION]: `${HTTP_HEADERS.BEARER} ${token}` } },
      )
      setExtractedPdf(response.data)
      showToast(UI_MESSAGES.EXTRACTION_SUCCESS, 'success')
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.EXTRACTION_FAILED
        : UI_MESSAGES.EXTRACTION_FAILED
      showToast(message, 'error')
    } finally {
      setIsExtracting(false)
    }
  }

  const previewUrl = uploadedPdf ? getAssetUrl(uploadedPdf.previewUrl) : ''
  const downloadUrl = extractedPdf ? getAssetUrl(extractedPdf.downloadUrl) : ''
  const selectedSummary = selectedPages.length > 0 ? selectedPages.join(', ') : 'No pages selected'

  // ── Auth Screen ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <ErrorBoundary>
        <main className="app-shell auth-shell">
          <section className="auth-card">
            <div className="auth-brand">
              <ShieldCheck size={38} />
              <p className="eyebrow">Secure PDF Workspace</p>
              <h1>
                {authMode === 'login'
                  ? 'Login to continue.'
                  : authMode === 'signup'
                  ? 'Create your account.'
                  : 'Verify your email.'}
              </h1>
            </div>

            {authMode !== 'verify' && (
              <div className="auth-tabs">
                <button className={authMode === 'login' ? 'active' : ''} type="button" onClick={() => setAuthMode('login')}>Login</button>
                <button className={authMode === 'signup' ? 'active' : ''} type="button" onClick={() => setAuthMode('signup')}>Signup</button>
              </div>
            )}

            {authMode === 'signup' && (
              <label className="field">
                <span>Name</span>
                <input id="auth-name" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Your name" />
              </label>
            )}

            {authMode !== 'verify' && (
              <label className="field">
                <span>Email</span>
                <input id="auth-email" type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" />
              </label>
            )}

            {authMode === 'verify' && (
              <>
                <p style={{ marginBottom: 8, color: '#aaa', fontSize: '0.9rem' }}>
                  We sent a code to <strong>{authEmail}</strong>
                </p>
                <label className="field">
                  <span>OTP Code</span>
                  <input
                    id="auth-otp"
                    value={authOtp}
                    onChange={(e) => setAuthOtp(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    inputMode="numeric"
                  />
                </label>
                {otpExpiryTimer !== null && otpExpiryTimer > 0 && (
                  <p className="timer-text" style={{ fontSize: '0.85rem', color: '#888', margin: '-8px 0 10px' }}>
                    Code expires in {otpExpiryTimer}s
                  </p>
                )}
                {otpExpiryTimer === 0 && (
                  <p className="timer-text" style={{ fontSize: '0.85rem', color: '#e74c3c', margin: '-8px 0 10px' }}>
                    Code expired — please resend
                  </p>
                )}
              </>
            )}

            <button
              id="auth-submit"
              className="primary-button wide"
              type="button"
              disabled={isAuthLoading}
              onClick={authMode === 'login' ? handleLogin : authMode === 'signup' ? handleSignup : handleVerifyOtp}
            >
              {isAuthLoading && <Loader2 className="spin" size={18} />}
              {authMode === 'login' ? 'Send OTP' : authMode === 'signup' ? 'Create account & Send OTP' : 'Verify code'}
            </button>

            {authMode === 'verify' && (
              <button
                id="resend-otp"
                className="ghost-button wide"
                type="button"
                disabled={isAuthLoading || (resendCooldown !== null && resendCooldown > 0)}
                onClick={handleResendOtp}
                style={{ marginTop: 10 }}
              >
                {resendCooldown && resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            )}

            {authMode === 'verify' && (
              <button
                className="ghost-button wide"
                type="button"
                style={{ marginTop: 6 }}
                onClick={() => { setAuthMode('login'); setAuthOtp(''); }}
              >
                ← Back
              </button>
            )}
          </section>

          {toast && <div className={`toast ${toast.tone}`}>{toast.message}</div>}
        </main>
      </ErrorBoundary>
    )
  }

  // ── Workspace Screen ──────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <main className="app-shell">
        <section className="workspace-header">
          <div>
            <p className="eyebrow">PDF Page Extractor</p>
            <h1>Select, reorder, and extract pages into a new PDF.</h1>
            <p className="user-line">Signed in as {user.name} · {user.email}</p>
          </div>
          <div className="header-actions">
            {uploadedPdf && (
              <button className="ghost-button" type="button" onClick={resetWorkspace}>
                <RotateCcw size={17} />New file
              </button>
            )}
            <button className="ghost-button" type="button" onClick={handleLogout}>
              <LogOut size={17} />Logout
            </button>
          </div>
        </section>

        <section className="uploader-panel">
          <label
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input type="file" accept="application/pdf,.pdf" onChange={handleFileInput} />
            <UploadCloud size={34} />
            <span>{isUploading ? 'Uploading your PDF...' : 'Drop a PDF here or choose a file'}</span>
            <small>Only PDF files are accepted. Maximum backend limit is 50 MB.</small>
            {isUploading && (
              <span className="progress-track">
                <span style={{ width: `${uploadProgress}%` }} />
              </span>
            )}
          </label>

          <div className="file-status">
            {uploadedPdf ? (
              <>
                <FileText size={22} />
                <div>
                  <strong>{uploadedPdf.name}</strong>
                  <span>{uploadedPdf.pageCount} pages · {formatFileSize(uploadedPdf.size)}</span>
                </div>
              </>
            ) : (
              <>
                <Scissors size={22} />
                <div>
                  <strong>Ready for a PDF</strong>
                  <span>The preview grid appears after upload.</span>
                </div>
              </>
            )}
          </div>
        </section>

        {uploadedPdf ? (
          <>
            <section className="toolbar">
              <div>
                <strong>{selectedPages.length} selected</strong>
                <span>{selectedSummary}</span>
              </div>
              <div className="toolbar-actions">
                <button type="button" className="ghost-button" onClick={selectAllPages}><Check size={17} />All</button>
                <button type="button" className="ghost-button" onClick={() => setSelectedPages([])}><X size={17} />Clear</button>
                <button className="primary-button" type="button" onClick={extractPages} disabled={isExtracting}>
                  {isExtracting ? <Loader2 className="spin" size={18} /> : <Scissors size={18} />}Extract
                </button>
                {extractedPdf && (
                  <a className="download-button" href={downloadUrl} download={extractedPdf.fileName}>
                    <Download size={18} />Download
                  </a>
                )}
              </div>
            </section>

            <section className="page-grid" aria-label="PDF pages">
              {Array.from({ length: uploadedPdf.pageCount }, (_, i) => {
                const pageNumber = i + 1
                const selectedIndex = selectedPages.indexOf(pageNumber)
                return (
                  <PageCard
                    key={pageNumber}
                    pdfUrl={previewUrl}
                    token={token}
                    pageNumber={pageNumber}
                    selectedOrder={selectedIndex === -1 ? null : selectedIndex + 1}
                    onToggle={togglePage}
                    onMove={movePage}
                  />
                )
              })}
            </section>
          </>
        ) : (
          <section className="empty-state">
            <FileText size={42} />
            <h2>Upload a PDF to begin</h2>
            <p>Every page will render as a thumbnail so you can choose the exact output order.</p>
          </section>
        )}

        {toast && <div className={`toast ${toast.tone}`}>{toast.message}</div>}
      </main>
    </ErrorBoundary>
  )
}

export default App
