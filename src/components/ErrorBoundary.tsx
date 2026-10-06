import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { sanitizeErrorMessage, safeLogError } from '@/utils/errors'
import { isChunkLoadError } from '@/utils/lazyWithRetry'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Root/Global Error Boundary.
 * Catches unhandled errors that escape the entire React component tree.
 */
export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    safeLogError('RootErrorBoundary', error, {
      componentStack: errorInfo?.componentStack,
    })
  }

  private handleReload = () => {
    try {
      sessionStorage.removeItem('donekaro_chunk_reload')
    } catch {
      // Ignore storage access failures
    }
    window.location.reload()
  }

  private handleGoHome = () => {
    try {
      sessionStorage.removeItem('donekaro_chunk_reload')
    } catch {
      // Ignore storage access failures
    }
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      const isChunk = isChunkLoadError(this.state.error)
      const safeMessage = sanitizeErrorMessage(
        this.state.error,
        isChunk
          ? 'Network or asset update issue. Please reload the page.'
          : 'An unexpected issue occurred. We apologize for the inconvenience.'
      )

      return (
        <div className="min-h-screen bg-semantic-bg-primary flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-100 border border-semantic-border-light rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-semantic-text-primary mb-1">
              कुछ गड़बड़ हो गई / Something went wrong
            </h1>
            <p className="text-sm text-semantic-text-secondary mb-4">
              {isChunk
                ? 'नेटवर्क समस्या या नया अपडेट उपलब्ध है। कृपया पेज पुनः लोड करें। / A network interruption or update occurred. Please reload.'
                : 'An unexpected issue occurred. We apologize for the inconvenience. Please reload or return to the homepage.'}
            </p>

            <div className="mb-6 p-3 bg-surface-200/80 rounded-lg text-left text-xs text-semantic-text-tertiary font-mono overflow-auto max-h-28 border border-semantic-border-light">
              {safeMessage}
            </div>

            {import.meta.env.DEV && this.state.error?.stack && (
              <details className="mb-6 text-left text-xs text-semantic-text-tertiary">
                <summary className="cursor-pointer font-medium text-red-400 mb-1">
                  Development stack trace
                </summary>
                <pre className="p-2 bg-black/40 rounded text-[11px] overflow-auto max-h-36">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 py-2.5 px-4 bg-surface-200 hover:bg-surface-300 text-semantic-text-primary text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors border border-semantic-border-light cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface RouteErrorBoundaryProps {
  children: ReactNode
  resetKey?: string
}

interface RouteErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Route-Level Error Boundary.
 * Catches page/component failures within the main application layout,
 * keeping Header, BottomNavigation, Drawer, and NotificationToast operational.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  public state: RouteErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    safeLogError('RouteErrorBoundary', error, {
      componentStack: errorInfo?.componentStack,
      resetKey: this.props.resetKey,
    })
  }

  public componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    // If route/location changed, automatically reset the error state to allow clean navigation
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  private handleRetry = () => {
    try {
      sessionStorage.removeItem('donekaro_chunk_reload')
    } catch {
      // Ignore storage access failures
    }
    this.setState({ hasError: false, error: null })
  }

  private handleReload = () => {
    try {
      sessionStorage.removeItem('donekaro_chunk_reload')
    } catch {
      // Ignore storage access failures
    }
    window.location.reload()
  }

  private handleGoHome = () => {
    try {
      sessionStorage.removeItem('donekaro_chunk_reload')
    } catch {
      // Ignore storage access failures
    }
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      const isChunk = isChunkLoadError(this.state.error)
      const safeMessage = sanitizeErrorMessage(
        this.state.error,
        isChunk
          ? 'Network or asset update issue. Please retry or reload.'
          : 'Unable to display this section. Please try again.'
      )

      return (
        <div className="max-w-xl mx-auto px-4 py-12 text-center animate-fade-in">
          <div className="bg-surface-100 border border-semantic-border-light rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="w-14 h-14 mx-auto mb-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-semantic-text-primary mb-1">
              इस भाग को लोड करने में समस्या आई / Unable to load this section
            </h2>
            <p className="text-xs sm:text-sm text-semantic-text-secondary mb-4 max-w-md mx-auto">
              {isChunk
                ? 'इंटरनेट कनेक्शन या नए संस्करण के कारण यह पेज लोड नहीं हो सका। कृपया पुनः प्रयास करें। / Network drop or updated app version detected. Please retry or reload.'
                : 'An unexpected issue occurred while rendering this page. You can retry or return to the main directory.'}
            </p>

            <div className="mb-6 p-3 bg-surface-200/70 rounded-lg text-left text-xs text-semantic-text-tertiary font-mono overflow-auto max-h-24 border border-semantic-border-light">
              {safeMessage}
            </div>

            {import.meta.env.DEV && this.state.error?.stack && (
              <details className="mb-6 text-left text-xs text-semantic-text-tertiary">
                <summary className="cursor-pointer font-medium text-amber-500 mb-1">
                  Development stack trace
                </summary>
                <pre className="p-2 bg-black/40 rounded text-[11px] overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={this.handleRetry}
                className="py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again / पुनः प्रयास</span>
              </button>

              {isChunk && (
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="py-2.5 px-4 bg-surface-200 hover:bg-surface-300 text-semantic-text-primary text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-semantic-border-light cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Page</span>
                </button>
              )}

              <button
                type="button"
                onClick={this.handleGoHome}
                className="py-2.5 px-4 bg-surface-200 hover:bg-surface-300 text-semantic-text-primary text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-semantic-border-light cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Home / मुख्य पृष्ठ</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
