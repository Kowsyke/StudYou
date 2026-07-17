import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

// Catches render errors anywhere below it so a broken component shows a
// calm recovery screen instead of a white page.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center text-center px-8 gap-4">
          <h1 className="text-lg font-bold text-ink">Something went wrong</h1>
          <p className="text-body text-ink-secondary max-w-sm leading-relaxed">
            An unexpected application error occurred. Reloading the interface usually fixes it.
          </p>
          <span className="font-mono text-caption text-ink-secondary bg-surface-secondary border border-hairline rounded-xs px-3 py-1.5">
            Reference: render error caught at the application root
          </span>
          <Button onClick={() => window.location.reload()}>Reload application</Button>
        </div>
      )
    }
    return this.props.children
  }
}
