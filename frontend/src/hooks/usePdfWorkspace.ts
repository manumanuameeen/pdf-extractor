import { useCallback, useState } from 'react'
import { isAxiosError } from 'axios'
import { getUserPdfs, deletePdf, uploadPdf as uploadPdfService, extractPdf as extractPdfService } from '../api/pdf'
import { UI_MESSAGES } from '../constants/messages'
import type { ExtractedPdf, SavedPdf, UploadedPdf, PdfWorkspaceState } from '../types'

type UsePdfWorkspaceOptions = {
  token: string
  showToast: (message: string, tone: 'success' | 'error') => void
}

export function usePdfWorkspace({ token, showToast }: UsePdfWorkspaceOptions): PdfWorkspaceState {
  const [uploadedPdf, setUploadedPdf] = useState<UploadedPdf | null>(null)
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedPdf, setExtractedPdf] = useState<ExtractedPdf | null>(null)
  const [userPdfs, setUserPdfs] = useState<SavedPdf[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)

  const loadUserPdfs = useCallback(async () => {
    if (!token) return
    setLibraryLoading(true)
    try {
      const pdfs = await getUserPdfs()
      setUserPdfs(pdfs)
    } catch {
      showToast(UI_MESSAGES.LIBRARY_LOAD_FAILED, 'error')
    } finally {
      setLibraryLoading(false)
    }
  }, [showToast, token])

  const resetWorkspace = useCallback(() => {
    setUploadedPdf(null)
    setSelectedPages([])
    setUploadProgress(0)
    setExtractedPdf(null)
  }, [])

  const selectAllPages = useCallback(() => {
    if (!uploadedPdf) return
    setSelectedPages(Array.from({ length: uploadedPdf.pageCount }, (_value, index) => index + 1))
    setExtractedPdf(null)
  }, [uploadedPdf])

  const clearSelection = useCallback(() => {
    setSelectedPages([])
    setExtractedPdf(null)
  }, [])

  const setDraggingState = useCallback((value: boolean) => {
    setIsDragging(value)
  }, [])

  const togglePage = useCallback((pageNumber: number) => {
    setSelectedPages((prev) => {
      return prev.includes(pageNumber)
        ? prev.filter((page) => page !== pageNumber)
        : [...prev, pageNumber]
    })
    setExtractedPdf(null)
  }, [])

  const movePage = useCallback((pageNumber: number, direction: -1 | 1) => {
    setSelectedPages((prev) => {
      const index = prev.indexOf(pageNumber)
      const nextIndex = index + direction
      if (index === -1 || nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      next[index] = prev[nextIndex]
      next[nextIndex] = pageNumber
      return next
    })
  }, [])

  const uploadPdf = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showToast(UI_MESSAGES.INVALID_PDF, 'error')
        return
      }

      setIsUploading(true)
      setUploadProgress(0)
      setExtractedPdf(null)

      try {
        const uploaded = await uploadPdfService(file, (progress) => setUploadProgress(progress))
        setUploadedPdf(uploaded)
        setSelectedPages([])
        setUploadProgress(100)
        showToast(UI_MESSAGES.PDF_UPLOADED, 'success')
        await loadUserPdfs()
      } catch (error) {
        const message = isAxiosError(error)
          ? error.response?.data?.error ?? UI_MESSAGES.UPLOAD_FAILED
          : UI_MESSAGES.UPLOAD_FAILED
        showToast(message, 'error')
      } finally {
        setIsUploading(false)
      }
    },
    [loadUserPdfs, showToast],
  )

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      uploadPdf(file)
    },
    [uploadPdf],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      setIsDragging(false)
      const file = event.dataTransfer.files[0]
      if (file) uploadPdf(file)
    },
    [uploadPdf],
  )

  const extractPages = useCallback(async () => {
    if (!uploadedPdf || selectedPages.length === 0) {
      showToast(UI_MESSAGES.SELECT_PAGE_FIRST, 'error')
      return
    }

    setIsExtracting(true)
    try {
      const extracted = await extractPdfService(uploadedPdf.id, selectedPages)
      setExtractedPdf(extracted)
      showToast(UI_MESSAGES.EXTRACTION_SUCCESS, 'success')
      await loadUserPdfs()
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.error ?? UI_MESSAGES.EXTRACTION_FAILED
        : UI_MESSAGES.EXTRACTION_FAILED
      showToast(message, 'error')
    } finally {
      setIsExtracting(false)
    }
  }, [uploadedPdf, selectedPages, loadUserPdfs, showToast])

  const handleSelectLibraryPdf = useCallback((pdf: SavedPdf) => {
    setUploadedPdf(pdf)
    setSelectedPages([])
    setExtractedPdf(null)
  }, [])

  const handleDeleteLibraryPdf = useCallback(
    async (pdfId: string) => {
      try {
        await deletePdf(pdfId)
        showToast(UI_MESSAGES.PDF_DELETED, 'success')
        setUploadedPdf((current) => (current?.id === pdfId ? null : current))
        await loadUserPdfs()
      } catch {
        showToast(UI_MESSAGES.PDF_DELETE_FAILED, 'error')
      }
    },
    [loadUserPdfs, showToast],
  )

  return {
    token,
    uploadedPdf,
    selectedPages,
    uploadProgress,
    isDragging,
    isUploading,
    isExtracting,
    extractedPdf,
    userPdfs,
    libraryLoading,
    loadUserPdfs,
    handleFileInput,
    handleDrop,
    selectAllPages,
    resetWorkspace,
    extractPages,
    togglePage,
    movePage,
    clearSelection,
    setDraggingState,
    handleSelectLibraryPdf,
    handleDeleteLibraryPdf,
  }
}
