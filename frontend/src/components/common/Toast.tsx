import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, X } from 'lucide-react'
import type { ToastTone } from '../../types'

type Props = {
  message: string
  tone: ToastTone
  onClose: () => void
}

export function Toast({ message, tone, onClose }: Props) {
  const Icon = tone === 'success' ? CheckCircle : AlertTriangle

  return (
    <motion.div
      className={`toast ${tone}`}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      role="alert"
    >
      <div className="toast-content">
        <Icon size={18} className="toast-icon" />
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" type="button" onClick={onClose} aria-label="Dismiss">
        <X size={15} />
      </button>
    </motion.div>
  )
}
