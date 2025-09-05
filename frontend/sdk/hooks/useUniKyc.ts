"use client"

import { useState, useCallback } from 'react'
import { UniKycConfig, UniKycStatus, UniKycResult, VerificationStep } from '../types'

export function useUniKyc(config: UniKycConfig, identifier: string) {
  const [status, setStatus] = useState<UniKycStatus | null>(null)
  const [currentStep, setCurrentStep] = useState<VerificationStep>('connect_wallet')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = useCallback(async () => {
    if (!identifier) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${config.baseUrl}/api/kyc/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        },
        body: JSON.stringify({ identifier })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setStatus(data.status)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check KYC status'
      setError(errorMessage)
      console.error('KYC status check failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [config, identifier])

  const startVerification = useCallback(async (): Promise<UniKycResult> => {
    setIsLoading(true)
    setError(null)
    setCurrentStep('personal_info')

    try {
      // Open verification modal/popup pointing to deployed UniKYC app
      const verificationUrl = `${config.baseUrl}/verify?identifier=${encodeURIComponent(identifier)}&return_url=${encodeURIComponent(window.location.href)}`
      
      // Open in popup window
      const popup = window.open(
        verificationUrl,
        'unikyc-verification',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for KYC verification.')
      }

      // Listen for completion message
      return new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== new URL(config.baseUrl).origin) return

          if (event.data.type === 'UNIKYC_COMPLETE') {
            window.removeEventListener('message', messageHandler)
            popup.close()
            
            const result: UniKycResult = event.data.result
            if (result.success) {
              setStatus(result.status)
              setCurrentStep('complete')
            }
            resolve(result)
          } else if (event.data.type === 'UNIKYC_ERROR') {
            window.removeEventListener('message', messageHandler)
            popup.close()
            reject(new Error(event.data.error))
          }
        }

        window.addEventListener('message', messageHandler)

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageHandler)
            reject(new Error('Verification cancelled'))
          }
        }, 1000)
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [config, identifier])

  return {
    status,
    currentStep,
    isLoading,
    error,
    checkStatus,
    startVerification
  }
}
