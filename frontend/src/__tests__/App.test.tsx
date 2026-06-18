import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => ({
    promise: Promise.resolve({
      getPage: async () => ({
        getViewport: () => ({ width: 100, height: 140 }),
        render: () => ({ promise: Promise.resolve() }),
      }),
    }),
  }),
}))

vi.mock('../services/authService', () => ({
  signup: vi.fn(),
  login: vi.fn(),
  verifyOtp: vi.fn(),
  resendOtp: vi.fn(),
  getProfile: vi.fn().mockRejectedValue(new Error('no session')),
  logout: vi.fn(),
}))

vi.mock('../services/pdfService', () => ({
  getUserPdfs: vi.fn().mockResolvedValue([]),
  deletePdf: vi.fn().mockResolvedValue(undefined),
}))

describe('App', () => {
  it('renders login screen by default', () => {
    render(<App />)
    expect(screen.getByText(/login to continue/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument()
  })
})
