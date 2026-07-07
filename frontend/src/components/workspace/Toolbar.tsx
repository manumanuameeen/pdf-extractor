import { Check, X, Scissors, Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

type Props = {
  selectedCount: number
  selectedSummary: string
  isExtracting: boolean
  extractedFileName?: string
  downloadUrl?: string
  onSelectAll: () => void
  onClearSelection: () => void
  onExtract: () => void
}

export function Toolbar({
  selectedCount,
  selectedSummary,
  isExtracting,
  extractedFileName,
  downloadUrl,
  onSelectAll,
  onClearSelection,
  onExtract,
}: Props) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!downloadUrl || !extractedFileName || isDownloading) return

    try {
      setIsDownloading(true)
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = extractedFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Failed to download PDF:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="toolbar">
      <div>
        <strong>{selectedCount} selected</strong>
        <span>{selectedSummary}</span>
      </div>
      <div className="toolbar-actions">
        <button type="button" className="ghost-button" onClick={onSelectAll}><Check size={17} />All</button>
        <button type="button" className="ghost-button" onClick={onClearSelection}><X size={17} />Clear</button>
        <button className="primary-button" type="button" onClick={onExtract} disabled={isExtracting}>
          {isExtracting ? <span className="spin" /> : <Scissors size={18} />}Extract
        </button>
        {downloadUrl && extractedFileName && (
          <button type="button" className="download-button" onClick={handleDownload} disabled={isDownloading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isDownloading ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        )}
      </div>
    </section>
  )
}
