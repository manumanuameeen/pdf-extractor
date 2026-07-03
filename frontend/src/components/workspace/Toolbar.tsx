import { Check, X, Scissors, Download } from 'lucide-react'

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
          <a className="download-button" href={downloadUrl} download={extractedFileName}>
            <Download size={18} />Download
          </a>
        )}
      </div>
    </section>
  )
}
