import type { SavedPdf } from '../../types'
import { LibraryCard } from './LibraryCard'

type Props = {
  userName: string
  userPdfs: SavedPdf[]
  libraryLoading: boolean
  onLoadPdf: (pdf: SavedPdf) => void
  onDeletePdf: (id: string) => void
}

export function LibraryPanel({ userName, userPdfs, libraryLoading, onLoadPdf, onDeletePdf }: Props) {
  return (
    <section className="library-panel">
      <header>
        <div>
          <p className="eyebrow">My PDF Library</p>
          <h2>Saved files for {userName}</h2>
        </div>
      </header>

      {libraryLoading ? (
        <div className="library-empty">Loading your saved PDFs…</div>
      ) : userPdfs.length === 0 ? (
        <div className="library-empty">
          No saved PDFs yet. Every uploaded or extracted file appears here once the server stores it.
        </div>
      ) : (
        <div className="library-grid">
          {userPdfs.map((pdf) => (
            <LibraryCard key={pdf.id} pdf={pdf} onLoad={onLoadPdf} onDelete={onDeletePdf} />
          ))}
        </div>
      )}
    </section>
  )
}
