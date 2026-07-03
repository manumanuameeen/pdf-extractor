import type { SavedPdf } from '../../types'

type Props = {
  pdf: SavedPdf
  onLoad: (pdf: SavedPdf) => void
  onDelete: (id: string) => void
}

export function LibraryCard({ pdf, onLoad, onDelete }: Props) {
  return (
    <article className="library-card">
      <div className="library-info">
        <strong>{pdf.name}</strong>
        <span className="library-meta">
          {pdf.pageCount} pages · {Math.round(pdf.size / 1024)} KB
          <br />
          Saved {new Date(pdf.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="library-actions">
        <button type="button" className="ghost-button" onClick={() => onLoad(pdf)}>
          Load
        </button>
        <button type="button" className="ghost-button" onClick={() => onDelete(pdf.id)}>
          Delete
        </button>
      </div>
    </article>
  )
}
