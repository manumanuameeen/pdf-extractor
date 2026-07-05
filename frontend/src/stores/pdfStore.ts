import { create } from 'zustand'
import { isAxiosError } from 'axios'
import { getUserPdfs, deletePdf, uploadPdf as uploadPdfService, extractPdf as extractPdfService } from '../api/pdf'
import { UI_MESSAGES } from '../constants/messages'
import { useToastStore } from './toastStore'
import { useAuthStore } from './authStore'
import type { PdfWorkspaceState } from '../types'

type PdfStore = Omit<PdfWorkspaceState, 'token'> & {
  uploadPdf: (file: File) => Promise<void>
}

export const usePdfStore = create<PdfStore>((set, get) => {
  return {
    uploadedPdf: null,
    selectedPages: [],
    uploadProgress: 0,
    isDragging: false,
    isUploading: false,
    isExtracting: false,
    extractedPdf: null,
    userPdfs: [],
    libraryLoading: false,

    loadUserPdfs: async () => {
      const token = useAuthStore.getState().token
      if (!token) return
      set({ libraryLoading: true })
      try {
        const pdfs = await getUserPdfs()
        set({ userPdfs: pdfs })
      } catch {
        useToastStore.getState().showToast(UI_MESSAGES.LIBRARY_LOAD_FAILED, 'error')
      } finally {
        set({ libraryLoading: false })
      }
    },

    resetWorkspace: () => {
      set({
        uploadedPdf: null,
        selectedPages: [],
        uploadProgress: 0,
        extractedPdf: null,
      })
    },

    selectAllPages: () => {
      const { uploadedPdf } = get()
      if (!uploadedPdf) return
      set({
        selectedPages: Array.from({ length: uploadedPdf.pageCount }, (_, index) => index + 1),
        extractedPdf: null,
      })
    },

    clearSelection: () => {
      set({
        selectedPages: [],
        extractedPdf: null,
      })
    },

    setDraggingState: (isDragging) => set({ isDragging }),

    togglePage: (pageNumber) => {
      const { selectedPages } = get()
      set({
        selectedPages: selectedPages.includes(pageNumber)
          ? selectedPages.filter((page) => page !== pageNumber)
          : [...selectedPages, pageNumber],
        extractedPdf: null,
      })
    },

    movePage: (pageNumber, direction) => {
      const { selectedPages } = get()
      const index = selectedPages.indexOf(pageNumber)
      const nextIndex = index + direction
      if (index === -1 || nextIndex < 0 || nextIndex >= selectedPages.length) return
      
      const next = [...selectedPages]
      next[index] = selectedPages[nextIndex]
      next[nextIndex] = pageNumber
      
      set({ selectedPages: next })
    },

    uploadPdf: async (file: File) => {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        useToastStore.getState().showToast(UI_MESSAGES.INVALID_PDF, 'error')
        return
      }

      set({
        isUploading: true,
        uploadProgress: 0,
        extractedPdf: null,
      })

      try {
        const uploaded = await uploadPdfService(file, (progress) => set({ uploadProgress: progress }))
        set({
          uploadedPdf: uploaded,
          selectedPages: [],
          uploadProgress: 100,
        })
        useToastStore.getState().showToast(UI_MESSAGES.PDF_UPLOADED, 'success')
        await get().loadUserPdfs()
      } catch (error) {
        const message = isAxiosError(error)
          ? error.response?.data?.error ?? UI_MESSAGES.UPLOAD_FAILED
          : UI_MESSAGES.UPLOAD_FAILED
        useToastStore.getState().showToast(message, 'error')
      } finally {
        set({ isUploading: false })
      }
    },

    handleFileInput: (event) => {
      const file = event.target.files?.[0]
      if (!file) return
      void get().uploadPdf(file)
    },

    handleDrop: (event) => {
      event.preventDefault()
      set({ isDragging: false })
      const file = event.dataTransfer.files[0]
      if (file) void get().uploadPdf(file)
    },

    extractPages: async () => {
      const { uploadedPdf, selectedPages } = get()
      if (!uploadedPdf || selectedPages.length === 0) {
        useToastStore.getState().showToast(UI_MESSAGES.SELECT_PAGE_FIRST, 'error')
        return
      }

      set({ isExtracting: true })
      try {
        const extracted = await extractPdfService(uploadedPdf.id, selectedPages)
        set({ extractedPdf: extracted })
        useToastStore.getState().showToast(UI_MESSAGES.EXTRACTION_SUCCESS, 'success')
        await get().loadUserPdfs()
      } catch (error) {
        const message = isAxiosError(error)
          ? error.response?.data?.error ?? UI_MESSAGES.EXTRACTION_FAILED
          : UI_MESSAGES.EXTRACTION_FAILED
        useToastStore.getState().showToast(message, 'error')
      } finally {
        set({ isExtracting: false })
      }
    },

    handleSelectLibraryPdf: (pdf) => {
      set({
        uploadedPdf: pdf,
        selectedPages: [],
        extractedPdf: null,
      })
    },

    handleDeleteLibraryPdf: async (pdfId) => {
      try {
        await deletePdf(pdfId)
        useToastStore.getState().showToast(UI_MESSAGES.PDF_DELETED, 'success')
        set((current) => ({
          uploadedPdf: current.uploadedPdf?.id === pdfId ? null : current.uploadedPdf,
        }))
        await get().loadUserPdfs()
      } catch {
        useToastStore.getState().showToast(UI_MESSAGES.PDF_DELETE_FAILED, 'error')
      }
    },
  }
})
