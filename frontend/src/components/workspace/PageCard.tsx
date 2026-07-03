import { ArrowDown, ArrowUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { HTTP_HEADERS } from '../../constants/api'

type Props = {
  pdfUrl: string
  token: string
  pageNumber: number
  selectedOrder: number | null
  onToggle: (pageNumber: number) => void
  onMove: (pageNumber: number, direction: -1 | 1) => void
}

export function PageCard({ pdfUrl, token, pageNumber, selectedOrder, onToggle, onMove }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let cancelled = false

    const renderPage = async () => {
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (!canvas || !context) return

      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url,
      ).toString()

      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        httpHeaders: { [HTTP_HEADERS.AUTHORIZATION]: `${HTTP_HEADERS.BEARER} ${token}` },
      })
      const pdf = await loadingTask.promise
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 0.45 })

      if (cancelled) return

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
          <button type="button" onClick={() => onMove(pageNumber, -1)} title="Move earlier"><ArrowUp size={16} /></button>
          <button type="button" onClick={() => onMove(pageNumber, 1)} title="Move later"><ArrowDown size={16} /></button>
        </div>
      )}
    </motion.article>
  )
}
