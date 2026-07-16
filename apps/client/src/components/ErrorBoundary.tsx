import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

// Catches render errors anywhere below it so a broken component shows a
// calm recovery card instead of a white screen.
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
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="bg-surface rounded-card border border-hairline shadow-card px-8 py-10 text-center max-w-sm">
            <h1 className="text-base font-semibold">Something went wrong</h1>
            <p className="text-sm text-ink-muted mt-1.5">
              An unexpected error stopped this page. Reloading usually fixes it.
            </p>
            <Button className="mt-5" onClick={() => window.location.reload()}>
              Reload the app
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
