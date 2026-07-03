import { Scissors } from 'lucide-react'

type Props = {
  isDragging: boolean
  isUploading: boolean
  uploadProgress: number
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDragOver: (event: React.DragEvent<HTMLLabelElement>) => void
  onDragLeave: () => void
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void
}

export function UploadZone({
  isDragging,
  isUploading,
  uploadProgress,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
}: Props) {
  return (
    <label
      className={`upload-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input type="file" accept="application/pdf,.pdf" onChange={onFileChange} />
      <Scissors size={34} />
      <span>{isUploading ? 'Uploading your PDF...' : 'Drop a PDF here or choose a file'}</span>
      <small>Only PDF files are accepted. Maximum backend limit is 50 MB.</small>

      {isUploading && (
        <span className="progress-track">
          <span style={{ width: `${uploadProgress}%` }} />
        </span>
      )}
    </label>
  )
}
