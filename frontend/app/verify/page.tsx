"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { KycButton } from '@/components/kyc/KycButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const [identifier, setIdentifier] = useState<string>('')
  const [returnUrl, setReturnUrl] = useState<string>('')

  useEffect(() => {
    const id = searchParams.get('identifier')
    const url = searchParams.get('return_url')
    
    if (id) setIdentifier(id)
    if (url) setReturnUrl(url)
  }, [searchParams])

  const handleSuccess = (result: any) => {
    // Send success message to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'UNIKYC_COMPLETE',
        result: {
          success: true,
          status: result.status,
          recordId: result.recordId,
          message: 'KYC verification completed successfully'
        }
      }, '*')
      window.close()
    }
  }

  const handleError = (error: string) => {
    // Send error message to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'UNIKYC_ERROR',
        error
      }, '*')
      window.close()
    }
  }

  const handleCancel = () => {
    if (window.opener) {
      window.opener.postMessage({
        type: 'UNIKYC_ERROR',
        error: 'Verification cancelled'
      }, '*')
      window.close()
    } else if (returnUrl) {
      window.location.href = returnUrl
    }
  }

  if (!identifier) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>
              No identifier provided for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCancel} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
          <CardDescription>
            Complete identity verification for {identifier}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <KycButton
            identifier={identifier}
            onSuccess={handleSuccess}
            onError={handleError}
            showFullFlow={true}
          />
          
          <Button 
            onClick={handleCancel} 
            variant="outline" 
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
