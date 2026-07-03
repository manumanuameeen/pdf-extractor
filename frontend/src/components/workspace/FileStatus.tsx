import { FileText, ShieldCheck } from 'lucide-react'
import type { UploadedPdf } from '../../types'

type Props = {
  uploadedPdf: UploadedPdf | null
}

export function FileStatus({ uploadedPdf }: Props) {
  return (
    <div className="file-status">
      {uploadedPdf ? (
        <>
          <FileText size={22} />
          <div>
            <strong>{uploadedPdf.name}</strong>
            <span>{uploadedPdf.pageCount} pages · {Math.round(uploadedPdf.size / 1024)} KB</span>
          </div>
        </>
      ) : (
        <>
          <ShieldCheck size={22} />
          <div>
            <strong>Ready for a PDF</strong>
            <span>The preview grid appears after upload.</span>
          </div>
        </>
      )}
    </div>
  )
}
