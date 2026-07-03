import { API_BASE_URL } from '../constants/api'

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const getAssetUrl = (path: string) => {
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}${path}`
}
