import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { OpenSupportOptions, SupportTab } from '../types'

interface SupportContextType {
  isOpen: boolean
  activeTab: SupportTab
  selectedBookingId: string | null
  initialReason: string
  openSupport: (options?: OpenSupportOptions) => void
  closeSupport: () => void
  switchTab: (tab: SupportTab) => void
  setSelectedBookingId: (id: string | null) => void
}

const SupportContext = createContext<SupportContextType | null>(null)

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<SupportTab>('complaint')
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [initialReason, setInitialReason] = useState('')

  const openSupport = useCallback((options?: OpenSupportOptions) => {
    setSelectedBookingId(options?.bookingId || null)
    setActiveTab(options?.defaultTab || 'complaint')
    setInitialReason(options?.initialReason || '')
    setIsOpen(true)
  }, [])

  const closeSupport = useCallback(() => {
    setIsOpen(false)
  }, [])

  const switchTab = useCallback((tab: SupportTab) => {
    setActiveTab(tab)
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      activeTab,
      selectedBookingId,
      initialReason,
      openSupport,
      closeSupport,
      switchTab,
      setSelectedBookingId,
    }),
    [isOpen, activeTab, selectedBookingId, initialReason, openSupport, closeSupport, switchTab]
  )

  return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>
}

export function useSupport(): SupportContextType {
  const context = useContext(SupportContext)
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider')
  }
  return context
}
