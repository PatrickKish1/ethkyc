"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, CheckCircle, XCircle } from 'lucide-react'
import { UniKycConfig, UniKycStatus, UniKycResult, VerificationStep } from '../types'
import { useUniKyc } from '../hooks/useUniKyc'

interface UniKycButtonProps {
  /** Configuration for the UniKYC service */
  config: UniKycConfig
  /** Wallet address or ENS name to verify */
  identifier: string
  /** Called when KYC verification completes successfully */
  onSuccess?: (result: UniKycResult) => void
  /** Called when KYC verification fails */
  onError?: (error: string) => void
  /** Custom button text */
  buttonText?: string
  /** Custom button variant */
  variant?: 'default' | 'outline' | 'secondary'
  /** Button size */
  size?: 'sm' | 'default' | 'lg'
  /** Show detailed status card instead of just button */
  showCard?: boolean
}

export function UniKycButton({
  config,
  identifier,
  onSuccess,
  onError,
  buttonText = "Verify KYC",
  variant = "default",
  size = "default",
  showCard = false
}: UniKycButtonProps) {
  const {
    status,
    currentStep,
    isLoading,
    error,
    checkStatus,
    startVerification
  } = useUniKyc(config, identifier)

  useEffect(() => {
    if (identifier) {
      checkStatus()
    }
  }, [identifier, checkStatus])

  const handleVerificationClick = async () => {
    try {
      const result = await startVerification()
      if (result.success) {
        onSuccess?.(result)
      } else {
        onError?.(result.message || 'Verification failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      onError?.(errorMessage)
    }
  }

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
      default:
        return <Shield className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = () => {
    if (!status) return 'Unknown'
    
    switch (status.status) {
      case 'approved':
        return 'KYC Verified'
      case 'rejected':
        return 'KYC Rejected'
      case 'pending':
        return 'KYC Pending'
      case 'expired':
        return 'KYC Expired'
      default:
        return 'No KYC'
    }
  }

  const getButtonText = () => {
    if (isLoading) return 'Checking...'
    if (!status) return buttonText
    
    switch (status.status) {
      case 'approved':
        return 'KYC Verified ✓'
      case 'pending':
        return 'KYC Pending...'
      case 'rejected':
      case 'expired':
        return 'Retry KYC'
      default:
        return buttonText
    }
  }

  const isButtonDisabled = () => {
    return isLoading || status?.status === 'pending'
  }

  if (showCard) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            KYC Status
          </CardTitle>
          <CardDescription>
            Identity verification for {identifier}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <span className={`text-sm font-semibold ${
              status?.status === 'approved' ? 'text-green-600' :
              status?.status === 'rejected' ? 'text-red-600' :
              status?.status === 'pending' ? 'text-yellow-600' :
              'text-gray-600'
            }`}>
              {getStatusText()}
            </span>
          </div>

          {status?.lastVerified && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Verified:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(status.lastVerified).toLocaleDateString()}
              </span>
            </div>
          )}

          {status?.expiryDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Expires:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(status.expiryDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status?.status !== 'approved' && (
            <Button
              onClick={handleVerificationClick}
              disabled={isButtonDisabled()}
              variant={variant}
              size={size}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {getButtonText()}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Button
      onClick={handleVerificationClick}
      disabled={isButtonDisabled()}
      variant={variant}
      size={size}
      className={status?.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {getStatusIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </Button>
  )
}
