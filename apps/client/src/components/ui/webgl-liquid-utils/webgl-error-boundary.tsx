import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
}

interface State {
  hasError: boolean
}

export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL liquid error caught:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

export function WebGLFallback({ className }: { className?: string }) {
  return (
    <div className={`absolute inset-0 bg-[#02040b] overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#134d93_0%,transparent_50%)] opacity-40 animate-pulse"
        style={{ animationDuration: '6s' }}
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,#8cecff_0%,transparent_40%)] opacity-20 animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.8),transparent)]" />
    </div>
  )
}
