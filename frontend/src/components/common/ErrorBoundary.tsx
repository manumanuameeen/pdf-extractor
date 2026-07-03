import { Component, type ErrorInfo, type ReactNode } from 'react'
import { FileText } from 'lucide-react'
import { UI_MESSAGES } from '../../constants/messages'

type ErrorBoundaryState = {
  hasError: boolean
}

type Props = {
  children: ReactNode
}

export class ErrorBoundary extends Component<Props, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell">
          <section className="empty-state">
            <FileText size={42} />
            <h1>Something went wrong</h1>
            <p>{UI_MESSAGES.REFRESH_AND_RETRY}</p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
