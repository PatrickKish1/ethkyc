import { NextRequest, NextResponse } from 'next/server'
import { KycService } from '@/lib/kyc/service'

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json()

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifier is required' },
        { status: 400 }
      )
    }

    const kycService = new KycService()
    const status = await kycService.checkKycStatus(identifier)

    return NextResponse.json({
      success: true,
      status: {
        hasKyc: status.hasKyc,
        status: status.status,
        lastVerified: status.lastVerified,
        expiryDate: status.expiryDate,
        ensName: status.record?.ensName,
        address: status.record?.address
      }
    })
  } catch (error) {
    console.error('KYC status check failed:', error)
    return NextResponse.json(
      { error: 'Failed to check KYC status' },
      { status: 500 }
    )
  }
}
