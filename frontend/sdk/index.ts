// UniKYC SDK - Main Entry Point
export { UniKycButton } from './components/UniKycButton'
export { UniKycProvider } from './providers/UniKycProvider'
export { useUniKyc } from './hooks/useUniKyc'

// Types
export type {
  UniKycConfig,
  UniKycStatus,
  UniKycResult,
  UniKycError,
  DocumentType,
  VerificationStep
} from './types'

// Utils
export { createUniKycConfig } from './utils/config'
