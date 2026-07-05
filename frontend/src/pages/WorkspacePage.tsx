import { LogOut, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageCard } from '../components/workspace/PageCard'
import { UploadZone } from '../components/workspace/UploadZone'
import { FileStatus } from '../components/workspace/FileStatus'
import { LibraryPanel } from '../components/workspace/LibraryPanel'
import { Toolbar } from '../components/workspace/Toolbar'
import { EmptyState } from '../components/workspace/EmptyState'
import { getAssetUrl } from '../utils/formatters'
import { useAuthStore } from '../stores/authStore'
import { usePdfStore } from '../stores/pdfStore'

export function WorkspacePage() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const handleLogout = useAuthStore((state) => state.handleLogout)

  const uploadedPdf = usePdfStore((state) => state.uploadedPdf)
  const selectedPages = usePdfStore((state) => state.selectedPages)
  const uploadProgress = usePdfStore((state) => state.uploadProgress)
  const isDragging = usePdfStore((state) => state.isDragging)
  const isUploading = usePdfStore((state) => state.isUploading)
  const isExtracting = usePdfStore((state) => state.isExtracting)
  const extractedPdf = usePdfStore((state) => state.extractedPdf)
  const userPdfs = usePdfStore((state) => state.userPdfs)
  const libraryLoading = usePdfStore((state) => state.libraryLoading)

  const handleFileInput = usePdfStore((state) => state.handleFileInput)
  const handleDrop = usePdfStore((state) => state.handleDrop)
  const selectAllPages = usePdfStore((state) => state.selectAllPages)
  const resetWorkspace = usePdfStore((state) => state.resetWorkspace)
  const extractPages = usePdfStore((state) => state.extractPages)
  const togglePage = usePdfStore((state) => state.togglePage)
  const movePage = usePdfStore((state) => state.movePage)
  const clearSelection = usePdfStore((state) => state.clearSelection)
  const setDraggingState = usePdfStore((state) => state.setDraggingState)
  const handleSelectLibraryPdf = usePdfStore((state) => state.handleSelectLibraryPdf)
  const handleDeleteLibraryPdf = usePdfStore((state) => state.handleDeleteLibraryPdf)

  if (!user) return null

  const previewUrl = uploadedPdf ? getAssetUrl(uploadedPdf.previewUrl) : ''
  const downloadUrl = extractedPdf ? getAssetUrl(extractedPdf.downloadUrl) : ''
  const selectedSummary = selectedPages.length > 0 ? selectedPages.join(', ') : 'No pages selected'

  return (
    <motion.main
      className="app-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
        <UploadZone
          isDragging={isDragging}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          onFileChange={handleFileInput}
          onDragOver={(e) => {
            e.preventDefault()
            setDraggingState(true)
          }}
          onDragLeave={() => setDraggingState(false)}
          onDrop={handleDrop}
        />
        <FileStatus uploadedPdf={uploadedPdf} />
      </section>

      <LibraryPanel
        userName={user.name}
        userPdfs={userPdfs}
        libraryLoading={libraryLoading}
        onLoadPdf={handleSelectLibraryPdf}
        onDeletePdf={handleDeleteLibraryPdf}
      />

      <AnimatePresence mode="wait">
        {uploadedPdf ? (
          <motion.div
            key="workspace-active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <Toolbar
              selectedCount={selectedPages.length}
              selectedSummary={selectedSummary}
              isExtracting={isExtracting}
              extractedFileName={extractedPdf?.fileName}
              downloadUrl={downloadUrl}
              onSelectAll={selectAllPages}
              onClearSelection={clearSelection}
              onExtract={extractPages}
            />

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
          </motion.div>
        ) : (
          <motion.div
            key="workspace-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              title="Upload a PDF to begin"
              description="Every page will render as a thumbnail so you can choose the exact output order."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
