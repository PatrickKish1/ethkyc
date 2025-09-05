"use client"

import { KycButton } from '@/components/kyc/KycButton'
import { useKycStatus } from '@/hooks/useKycStatus'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Shield, User, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import Header from '@/components/Header'

export default function DemoPage() {
  const { address, isConnected } = useAccount()
  const [ensName, setEnsName] = useState('')
  const { kycStatus, isLoading, refetch } = useKycStatus(ensName)

  const handleKycComplete = (status: any) => {
    console.log('KYC completed:', status)
    // Refresh status
    refetch()
  }

  const handleKycError = (error: string) => {
    console.error('KYC error:', error)
    // Could show a toast notification here
  }

  const getStatusIcon = () => {
    if (!kycStatus) return <User className="w-5 h-5" />
    if (kycStatus.status === 'approved') return <CheckCircle className="w-5 h-5 text-green-600" />
    if (kycStatus.status === 'pending') return <Clock className="w-5 h-5 text-yellow-600" />
    if (kycStatus.status === 'expired') return <AlertCircle className="w-5 h-5 text-red-600" />
    return <User className="w-5 h-5" />
  }

  const getStatusColor = () => {
    if (!kycStatus) return 'outline'
    if (kycStatus.status === 'approved') return 'default'
    if (kycStatus.status === 'pending') return 'secondary'
    if (kycStatus.status === 'expired') return 'destructive'
    return 'outline'
  }

  return (
    <main>
      <Header className="bg-gray-300" />
      <div className="container mx-auto px-4 py-8 max-w-4xl mt-14">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">UniKYC Demo</h1>
          <p className="text-xl text-muted-foreground">
            Decentralized KYC verification using ENS names and threshold cryptography
          </p>
        </div>

        {/* Wallet Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Wallet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Connected Address:</p>
                <code className="block p-2 bg-muted rounded text-sm font-mono">
                  {address}
                </code>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">Please connect your wallet to continue</p>
                <ConnectWallet />
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC Status Checker */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              KYC Status Checker
            </CardTitle>
            <CardDescription>
              Check KYC status for any ENS name or Ethereum address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ensName">ENS Name or Address</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="ensName"
                  placeholder="Enter ENS name (e.g., alice.eth) or address"
                  value={ensName}
                  onChange={(e) => setEnsName(e.target.value)}
                />
                <Button onClick={() => refetch()} disabled={!ensName || isLoading}>
                  Check Status
                </Button>
              </div>
            </div>

            {ensName && (
              <div className="space-y-2">
                <Label>Current Status</Label>
                {isLoading ? (
                  <div className="flex items-center gap-2 p-4 bg-muted rounded">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Checking KYC status...</span>
                  </div>
                ) : kycStatus ? (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon()}
                      <Badge variant={getStatusColor()}>
                        {kycStatus.hasKyc ? kycStatus.status.toUpperCase() : 'NO KYC'}
                      </Badge>
                    </div>
                    
                    {kycStatus.hasKyc && kycStatus.record && (
                      <div className="space-y-2 text-sm">
                        <p><strong>ENS Name:</strong> {kycStatus.record.ensName}</p>
                        <p><strong>Address:</strong> {kycStatus.record.address}</p>
                        <p><strong>Created:</strong> {new Date(kycStatus.record.createdAt).toLocaleDateString()}</p>
                        {kycStatus.record.lastVerifiedAt && (
                          <p><strong>Last Verified:</strong> {new Date(kycStatus.record.lastVerifiedAt).toLocaleDateString()}</p>
                        )}
                        {kycStatus.record.verificationData.expiryDate && (
                          <p><strong>Expires:</strong> {new Date(kycStatus.record.verificationData.expiryDate).toLocaleDateString()}</p>
                        )}
                        {kycStatus.record.randomnessId && (
                          <p><strong>Random ID:</strong> {kycStatus.record.randomnessId.slice(0, 8)}...</p>
                        )}
                        {kycStatus.record.blocklockData && (
                          <p><strong>Blocklock:</strong> Encrypted until block {kycStatus.record.blocklockData.unlockBlockHeight}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg text-muted-foreground">
                    No KYC record found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC Verification Button */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              KYC Verification
            </CardTitle>
            <CardDescription>
              Complete your KYC verification using the button below
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isConnected ? (
              <KycButton
                onKycComplete={handleKycComplete}
                onKycError={handleKycError}
                size="lg"
                className="mx-auto"
              >
                Start KYC Verification
              </KycButton>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">Connect your wallet to start KYC verification</p>
                <ConnectWallet />
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-4">
              This will open a modal where you can complete your KYC verification process
            </p>
          </CardContent>
        </Card>

        {/* System Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                ENS Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Uses ENS names as unique identifiers for KYC records, providing human-readable addresses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Threshold Cryptography
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Implements 5-of-5, 3-of-5, and 2-of-5 threshold schemes for secure data encryption
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Biometric Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Supports Face ID, fingerprint, and passkey verification for secure access
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
            <CardDescription>
              This demo showcases the complete UniKYC system architecture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Backend Services</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• ENS Resolution Service</li>
                  <li>• Threshold Cryptography</li>
                  <li>• Biometric Verification</li>
                  <li>• Filecoin Storage (Storacha)</li>
                  <li>• SIWE Authentication</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Frontend Components</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• KYC Button Component</li>
                  <li>• Status Checking Hooks</li>
                  <li>• Verification Flow</li>
                  <li>• Biometric Integration</li>
                  <li>• Threshold Decryption</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">How It Works</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>User connects wallet and ENS name is auto-detected</li>
                <li>System checks existing KYC status</li>
                <li>If no KYC: User completes verification form and uploads documents</li>
                <li>Documents are encrypted with threshold cryptography and stored on Filecoin</li>
                <li>If KYC exists: User completes biometric verification</li>
                <li>Threshold decryption provides access to verified KYC data</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
