import { LogOut, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageCard } from '../components/workspace/PageCard'
import { UploadZone } from '../components/workspace/UploadZone'
import { FileStatus } from '../components/workspace/FileStatus'
import { LibraryPanel } from '../components/workspace/LibraryPanel'
import { Toolbar } from '../components/workspace/Toolbar'
import { EmptyState } from '../components/workspace/EmptyState'
import { getAssetUrl } from '../utils/formatters'
import type { PublicUser } from '../types'
import type { AuthFlowState, PdfWorkspaceState } from '../types'

type Props = {
  user: PublicUser
  auth: Pick<AuthFlowState, 'handleLogout'>
  workspace: PdfWorkspaceState
}

export function WorkspacePage({ user, auth, workspace }: Props) {
  const {
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
  } = workspace

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
          <button className="ghost-button" type="button" onClick={auth.handleLogout}>
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
