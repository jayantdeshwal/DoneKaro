import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </I18nextProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

// Coordinated Vite preload-error recovery listener
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    let alreadyReloaded = false
    try {
      alreadyReloaded = !!sessionStorage.getItem('donekaro_chunk_reload')
    } catch {
      alreadyReloaded = false
    }

    if (!alreadyReloaded) {
      try {
        sessionStorage.setItem('donekaro_chunk_reload', String(Date.now()))
      } catch {
        // Ignore storage access failures
      }
      window.location.reload()
    }
  })
}

// Register PWA Service Worker
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        if (import.meta.env.DEV) {
          console.log('PWA Service Worker registered:', reg.scope)
        }
      })
      .catch(err => {
        console.warn('PWA Service Worker registration failed:', err)
      })
  })
}