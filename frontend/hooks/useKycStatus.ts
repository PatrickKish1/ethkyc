/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { kycService } from '@/lib/kyc/service'
import { kycStorage } from '@/lib/ens/resolver'
import { ensResolver } from '@/lib/ens/resolver'
import type { KycStatus, KycRecord } from '@/lib/kyc/types'

export interface UseKycStatusReturn {
  kycStatus: KycStatus | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  checkStatus: (identifier: string) => Promise<KycStatus>
}

export function useKycStatus(identifier?: string): UseKycStatusReturn {
  const { address, isConnected } = useAccount()
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = useCallback(async (checkIdentifier: string): Promise<KycStatus> => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Check if identifier is ENS name or address
      let kycResult
      if (checkIdentifier.endsWith('.eth')) {
        // Direct ENS lookup
        kycResult = await kycStorage.checkKycStatus(checkIdentifier)
      } else {
        // Address lookup - resolve ENS first
        kycResult = await kycStorage.getKycRecordByAddress(checkIdentifier as `0x${string}`)
        if (kycResult) {
          kycResult = {
            hasKyc: true,
            status: kycResult.status,
            record: kycResult
          }
        } else {
          kycResult = { hasKyc: false }
        }
      }
      
      const status: KycStatus = {
        hasKyc: kycResult.hasKyc,
        status: kycResult.status || 'none',
        record: kycResult.record ? {
          ...kycResult.record,
          status: kycResult.record.status === 'approved' ? 'active' : 
                  kycResult.record.status === 'expired' ? 'expired' : 'revoked',
          verificationData: {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            nationality: '',
            address: {
              street: '',
              city: '',
              state: '',
              country: '',
              postalCode: ''
            },
            documents: [],
            verificationStatus: kycResult.record.status as 'pending' | 'approved' | 'rejected' | 'expired',
            verificationDate: kycResult.record.createdAt,
            expiryDate: kycResult.record.verificationData.expiryDate,
            kycProvider: 'manual',
            providerReference: kycResult.record.id
          },
          thresholdScheme: {
            totalKeys: 5,
            requiredKeys: 3,
            keys: [],
            encryptedData: '',
            createdAt: kycResult.record.createdAt
          },
          blocklockData: kycResult.record.blocklockData ? {
            ...kycResult.record.blocklockData,
            chainId: 1 // Default to mainnet
          } : undefined,
          updatedAt: kycResult.record.createdAt,
          metadata: {
            version: '1.0.0',
            schema: 'kyc-v1',
            tags: ['kyc', 'verification']
          }
        } : undefined
      }
      
      setKycStatus(status)
      return status
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check KYC status'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    if (!identifier) return
    
    try {
      await checkStatus(identifier)
    } catch (err) {
      // Error already set in checkStatus
    }
  }, [identifier, checkStatus])

  // Auto-check status when identifier changes
  useEffect(() => {
    if (!identifier) {
      setKycStatus(null)
      return
    }

    checkStatus(identifier).catch(() => {
      // Error already handled
    })
  }, [identifier, checkStatus])

  // Auto-check status when wallet connects/disconnects
  useEffect(() => {
    if (!isConnected || !address) {
      setKycStatus(null)
      return
    }

    // If no specific identifier provided, check by address
    if (!identifier) {
      checkStatus(address).catch(() => {
        // Error already handled
      })
    }
  }, [isConnected, address, identifier, checkStatus])

  return {
    kycStatus,
    isLoading,
    error,
    refetch,
    checkStatus,
  }
}

// Hook for checking KYC status by ENS name
export function useKycStatusByEns(ensName?: string): UseKycStatusReturn {
  return useKycStatus(ensName)
}

// Hook for checking KYC status by address
export function useKycStatusByAddress(address?: string): UseKycStatusReturn {
  return useKycStatus(address)
}

// Hook for checking KYC status of connected wallet
export function useConnectedKycStatus(): UseKycStatusReturn {
  const { address, isConnected } = useAccount()
  
  // Always call the hook unconditionally
  const kycStatusResult = useKycStatus(address)
  
  // Return empty state if not connected
  if (!isConnected || !address) {
    return {
      kycStatus: null,
      isLoading: false,
      error: null,
      refetch: async () => {},
      checkStatus: async () => ({ hasKyc: false, status: 'none' }),
    }
  }
  
  return kycStatusResult
}
