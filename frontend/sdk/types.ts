export interface UniKycConfig {
  /** Base URL of the deployed UniKYC service */
  baseUrl: string
  /** API key for authentication */
  apiKey?: string
  /** Chain configuration */
  chains: {
    baseSepolia?: string
    filecoinCalibration?: string
    polygon?: string
  }
  /** iProov configuration */
  iproov?: {
    baseUrl: string
    apiKey: string
    apiSecret: string
  }
  /** Custom styling */
  theme?: {
    primaryColor?: string
    borderRadius?: string
    fontFamily?: string
  }
}

export type DocumentType = 
  | 'passport' 
  | 'drivers_license' 
  | 'national_id' 
  | 'utility_bill' 
  | 'bank_statement'

export type VerificationStep = 
  | 'connect_wallet'
  | 'personal_info'
  | 'document_upload'
  | 'face_verification'
  | 'biometric_verification'
  | 'processing'
  | 'complete'

export interface UniKycStatus {
  hasKyc: boolean
  status: 'none' | 'pending' | 'approved' | 'expired' | 'rejected'
  lastVerified?: string
  expiryDate?: string
  ensName?: string
  address?: string
}

export interface UniKycResult {
  success: boolean
  status: UniKycStatus
  recordId?: string
  message?: string
  errors?: string[]
}

export interface UniKycError {
  code: string
  message: string
  details?: any
}

export interface DocumentFile {
  file: File
  type: DocumentType
  preview: string
  cid?: string
}

export interface PersonalInfo {
  firstName: string
  lastName: string
  dateOfBirth: string
  nationality: string
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
}
