"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { UniKycConfig } from '../types'

interface UniKycContextType {
  config: UniKycConfig
}

const UniKycContext = createContext<UniKycContextType | null>(null)

interface UniKycProviderProps {
  config: UniKycConfig
  children: ReactNode
}

export function UniKycProvider({ config, children }: UniKycProviderProps) {
  return (
    <UniKycContext.Provider value={{ config }}>
      {children}
    </UniKycContext.Provider>
  )
}

export function useUniKycContext() {
  const context = useContext(UniKycContext)
  if (!context) {
    throw new Error('useUniKycContext must be used within a UniKycProvider')
  }
  return context
}
