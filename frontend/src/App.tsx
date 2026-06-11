import { Component, type ChangeEvent, type DragEvent, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import * as pdfjsLib from 'pdfjs-dist'
import { ArrowDown, ArrowUp, Check, Download, FileText, Loader2, LogOut, RotateCcw, Scissors, ShieldCheck, UploadCloud, X } from 'lucide-react'
import { API_BASE_URL, API_ENDPOINTS, HTTP_HEADERS, STORAGE_KEYS } from './constants/api'
import { UI_MESSAGES } from './constants/messages'
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

type User = {
  id: string
  name: string
  email: string
  isVerified: boolean
  createdAt: string
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

type AuthResponse = {
  message: string
  user: User
  token?: string
  refreshToken?: string
  devOtp?: string
  otpExpiresInSeconds?: number
  resendAvailableInSeconds?: number
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
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const getAssetUrl = (path: string) => {
  if (path.startsWith('http')) {
    return path
  }

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

      if (!canvas || !context) {
        return
      }

      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        httpHeaders: {
          [HTTP_HEADERS.AUTHORIZATION]: `${HTTP_HEADERS.BEARER} ${token}`,
        },
      })
      const pdf = await loadingTask.promise
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 0.45 })

      if (cancelled) {
        return
      }

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

    return () => {
      cancelled = true
    }
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
          <button type="button" onClick={() => onMove(pageNumber, -1)} title="Move earlier">
            <ArrowUp size={16} />
          </button>
          <button type="button" onClick={() => onMove(pageNumber, 1)} title="Move later">
            <ArrowDown size={16} />
          </button>
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
  const [authPassword, setAuthPassword] = useState('')
  const [authOtp, setAuthOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
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

  useEffect(() => {
    if (otpExpiryTimer === null && resendCooldown === null) return

    const interval = window.setInterval(() => {
      setOtpExpiryTimer((prev) => (prev === null ? null : Math.max(0, prev - 1)))
      setResendCooldown((prev) => (prev === null ? null : Math.max(0, prev - 1)))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [otpExpiryTimer, resendCooldown])

  useEffect(() => {
    if (!token) {
      return
    }

    axios.get<{ user: User }>(`${API_BASE_URL}${API_ENDPOINTS.AUTH.ME}`, {
      headers: { [HTTP_HEADERS.AUTHORIZATION]: `${HTTP_HEADERS.BEARER} ${token}` },
    })
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        setToken('')
        setUser(null)
      })
  }, [token])

  const saveSession = (nextToken: string, nextUser: User) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, nextToken)
    setToken(nextToken)
    setUser(nextUser)
  }

  const handleSignup = async () => {
    setIsAuthLoading(true)

    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.SIGNUP}`,
        { name: authName, email: authEmail, password: authPassword },
      )

      setAuthMode('verify')
      setDevOtp(response.data.devOtp ?? '')
      showToast(response.data.message, 'success')
      setOtpExpiryTimer(response.data.otpExpiresInSeconds ?? null)
      setResendCooldown(response.data.resendAvailableInSeconds ?? null)
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.SIGNUP_FAILED
        : UI_MESSAGES.SIGNUP_FAILED
      showToast(message, 'error')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setIsAuthLoading(true)

    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_OTP}`,
        { email: authEmail, otp: authOtp },
      )

      if (response.data.token) {
        saveSession(response.data.token, response.data.user)
      }
      showToast(response.data.message, 'success')
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
    setIsAuthLoading(true)

    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.RESEND_OTP}`,
        { email: authEmail },
      )

      setDevOtp(response.data.devOtp ?? '')
      setAuthOtp('')
      showToast(response.data.message, 'success')
      setOtpExpiryTimer(response.data.otpExpiresInSeconds ?? null)
      setResendCooldown(response.data.resendAvailableInSeconds ?? null)
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.RESEND_OTP_FAILED
        : UI_MESSAGES.RESEND_OTP_FAILED
      showToast(message, 'error')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogin = async () => {
    setIsAuthLoading(true)

    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`,
        { email: authEmail, password: authPassword },
      )

      if (response.data.token) {
        saveSession(response.data.token, response.data.user)
      }
      showToast(response.data.message, 'success')
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.LOGIN_FAILED
        : UI_MESSAGES.LOGIN_FAILED
      showToast(message, 'error')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    setToken('')
    setUser(null)
    setUploadedPdf(null)
    setSelectedPages([])
    setExtractedPdf(null)
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
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100))
      }
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

    if (file) {
      uploadPdf(file)
    }
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files[0]

    if (file) {
      uploadPdf(file)
    }
  }

  const togglePage = (pageNumber: number) => {
    setSelectedPages((currentPages) => {
      if (currentPages.includes(pageNumber)) {
        return currentPages.filter((page) => page !== pageNumber)
      }

      return [...currentPages, pageNumber]
    })
    setExtractedPdf(null)
  }

  const movePage = (pageNumber: number, direction: -1 | 1) => {
    setSelectedPages((currentPages) => {
      const index = currentPages.indexOf(pageNumber)
      const targetIndex = index + direction

      if (index === -1 || targetIndex < 0 || targetIndex >= currentPages.length) {
        return currentPages
      }

      const nextPages = [...currentPages]
      nextPages[index] = currentPages[targetIndex]
      nextPages[targetIndex] = pageNumber
      return nextPages
    })
  }

  const selectAllPages = () => {
    if (!uploadedPdf) {
      return
    }

    setSelectedPages(Array.from({ length: uploadedPdf.pageCount }, (_, index) => index + 1))
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

  if (!user) {
    return (
      <ErrorBoundary>
        <main className="app-shell auth-shell">
          <section className="auth-card">
            <div className="auth-brand">
              <ShieldCheck size={38} />
              <p className="eyebrow">Secure PDF Workspace</p>
              <h1>{authMode === 'login' ? 'Login to continue.' : authMode === 'signup' ? 'Create your account.' : 'Verify your email.'}</h1>
            </div>

            <div className="auth-tabs">
              <button className={authMode === 'login' ? 'active' : ''} type="button" onClick={() => setAuthMode('login')}>
                Login
              </button>
              <button className={authMode === 'signup' ? 'active' : ''} type="button" onClick={() => setAuthMode('signup')}>
                Signup
              </button>
            </div>

            {authMode === 'signup' && (
              <label className="field">
                <span>Name</span>
                <input value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Your name" />
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" />
            </label>

            {authMode !== 'verify' && (
              <label className="field">
                <span>Password</span>
                <input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 8 characters" />
              </label>
            )}

            {authMode === 'verify' && (
              <>
                <label className="field">
                  <span>OTP</span>
                  <input value={authOtp} onChange={(event) => setAuthOtp(event.target.value)} placeholder="6 digit code" />
                </label>
                {otpExpiryTimer !== null && otpExpiryTimer > 0 ? (
                  <p className="timer-text" style={{ fontSize: '0.85rem', marginTop: '-10px', marginBottom: '10px', color: '#888' }}>OTP expires in {otpExpiryTimer}s</p>
                ) : otpExpiryTimer !== null && otpExpiryTimer === 0 ? (
                  <p className="timer-text" style={{ fontSize: '0.85rem', marginTop: '-10px', marginBottom: '10px', color: '#e74c3c' }}>OTP has expired</p>
                ) : null}
                {devOtp && <p className="dev-otp">Development OTP: {devOtp}</p>}
              </>
            )}

            <button
              className="primary-button wide"
              type="button"
              disabled={isAuthLoading}
              onClick={authMode === 'login' ? handleLogin : authMode === 'signup' ? handleSignup : handleVerifyOtp}
            >
              {isAuthLoading && <Loader2 className="spin" size={18} />}
              {authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Create account' : 'Verify account'}
            </button>

            {authMode === 'verify' && (
              <button 
                className="ghost-button wide" 
                type="button" 
                disabled={isAuthLoading || (resendCooldown !== null && resendCooldown > 0)} 
                onClick={handleResendOtp}
              >
                {resendCooldown !== null && resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            )}
          </section>

          {toast && <div className={`toast ${toast.tone}`}>{toast.message}</div>}
        </main>
      </ErrorBoundary>
    )
  }

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
                <RotateCcw size={17} />
                New file
              </button>
            )}
            <button className="ghost-button" type="button" onClick={logout}>
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </section>

        <section className="uploader-panel">
          <label
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
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
                  <span>
                    {uploadedPdf.pageCount} pages · {formatFileSize(uploadedPdf.size)}
                  </span>
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
                <button type="button" className="ghost-button" onClick={selectAllPages}>
                  <Check size={17} />
                  All
                </button>
                <button type="button" className="ghost-button" onClick={() => setSelectedPages([])}>
                  <X size={17} />
                  Clear
                </button>
                <button className="primary-button" type="button" onClick={extractPages} disabled={isExtracting}>
                  {isExtracting ? <Loader2 className="spin" size={18} /> : <Scissors size={18} />}
                  Extract
                </button>
                {extractedPdf && (
                  <a className="download-button" href={downloadUrl} download={extractedPdf.fileName}>
                    <Download size={18} />
                    Download
                  </a>
                )}
              </div>
            </section>

            <section className="page-grid" aria-label="PDF pages">
              {Array.from({ length: uploadedPdf.pageCount }, (_, index) => {
                const pageNumber = index + 1
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
