import { UniKycConfig } from '../types'

export function createUniKycConfig(options: Partial<UniKycConfig>): UniKycConfig {
  return {
    baseUrl: options.baseUrl || 'https://unikyc.vercel.app',
    apiKey: options.apiKey,
    chains: {
      baseSepolia: options.chains?.baseSepolia || 'https://sepolia.base.org',
      filecoinCalibration: options.chains?.filecoinCalibration || 'https://api.calibration.node.glif.io/rpc/v1',
      polygon: options.chains?.polygon || 'https://polygon-rpc.com',
      ...options.chains
    },
    iproov: options.iproov,
    theme: {
      primaryColor: '#3b82f6',
      borderRadius: '0.5rem',
      fontFamily: 'system-ui, sans-serif',
      ...options.theme
    }
  }
}
