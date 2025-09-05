# UniKYC SDK

A React SDK for integrating UniKYC decentralized identity verification into your applications.

## Installation

```bash
npm install @unikyc/sdk
# or
yarn add @unikyc/sdk
```

## Quick Start

### 1. Basic Setup

```tsx
import { UniKycButton, createUniKycConfig } from '@unikyc/sdk'

const config = createUniKycConfig({
  baseUrl: 'https://your-unikyc-deployment.vercel.app',
  apiKey: 'your-api-key' // Optional
})

function App() {
  const handleSuccess = (result) => {
    console.log('KYC verified:', result)
  }

  const handleError = (error) => {
    console.error('KYC failed:', error)
  }

  return (
    <UniKycButton
      config={config}
      identifier="0x1234...abcd" // wallet address or ENS name
      onSuccess={handleSuccess}
      onError={handleError}
    />
  )
}
```

### 2. With Provider (Recommended)

```tsx
import { UniKycProvider, UniKycButton, createUniKycConfig } from '@unikyc/sdk'

const config = createUniKycConfig({
  baseUrl: 'https://your-unikyc-deployment.vercel.app',
  chains: {
    baseSepolia: 'https://sepolia.base.org',
    polygon: 'https://polygon-rpc.com'
  },
  theme: {
    primaryColor: '#3b82f6',
    borderRadius: '0.5rem'
  }
})

function App() {
  return (
    <UniKycProvider config={config}>
      <YourApp />
    </UniKycProvider>
  )
}

function YourApp() {
  return (
    <UniKycButton
      identifier="vitalik.eth"
      showCard={true} // Shows detailed status card
      onSuccess={(result) => {
        // Handle successful verification
        console.log('User verified:', result.status)
      }}
    />
  )
}
```

## API Reference

### UniKycButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `UniKycConfig` | - | Configuration object |
| `identifier` | `string` | - | Wallet address or ENS name |
| `onSuccess` | `(result: UniKycResult) => void` | - | Success callback |
| `onError` | `(error: string) => void` | - | Error callback |
| `buttonText` | `string` | "Verify KYC" | Custom button text |
| `variant` | `'default' \| 'outline' \| 'secondary'` | "default" | Button style |
| `size` | `'sm' \| 'default' \| 'lg'` | "default" | Button size |
| `showCard` | `boolean` | `false` | Show detailed status card |

### UniKycConfig

```typescript
interface UniKycConfig {
  baseUrl: string // Your deployed UniKYC service URL
  apiKey?: string // Optional API key
  chains: {
    baseSepolia?: string
    filecoinCalibration?: string
    polygon?: string
  }
  iproov?: {
    baseUrl: string
    apiKey: string
    apiSecret: string
  }
  theme?: {
    primaryColor?: string
    borderRadius?: string
    fontFamily?: string
  }
}
```

### UniKycStatus

```typescript
interface UniKycStatus {
  hasKyc: boolean
  status: 'none' | 'pending' | 'approved' | 'expired' | 'rejected'
  lastVerified?: string
  expiryDate?: string
  ensName?: string
  address?: string
}
```

## Hooks

### useUniKyc

```tsx
import { useUniKyc } from '@unikyc/sdk'

function MyComponent() {
  const { status, isLoading, error, checkStatus, startVerification } = useUniKyc(config, identifier)

  // Check status programmatically
  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <div>
      {status?.status === 'approved' ? (
        <p>✅ KYC Verified</p>
      ) : (
        <button onClick={startVerification}>
          Start KYC
        </button>
      )}
    </div>
  )
}
```

## Verification Flow

1. **Status Check**: SDK checks if the identifier already has valid KYC
2. **Popup Window**: Opens UniKYC verification flow in popup
3. **User Verification**: User completes KYC steps (documents, biometrics, etc.)
4. **Result**: Popup sends result back to parent window
5. **Callback**: Your `onSuccess` or `onError` callback is triggered

## Styling

The SDK uses Tailwind CSS classes. Ensure your project has Tailwind CSS configured, or the components may not display correctly.

### Custom Theme

```tsx
const config = createUniKycConfig({
  baseUrl: 'https://your-deployment.vercel.app',
  theme: {
    primaryColor: '#10b981', // Custom green
    borderRadius: '0.75rem',
    fontFamily: 'Inter, sans-serif'
  }
})
```

## Error Handling

```tsx
<UniKycButton
  config={config}
  identifier="user.eth"
  onError={(error) => {
    switch (error) {
      case 'Popup blocked. Please allow popups for KYC verification.':
        // Handle popup blocker
        break
      case 'Verification cancelled':
        // User closed popup
        break
      default:
        // Other errors
        console.error('KYC Error:', error)
    }
  }}
/>
```

## Development

To use this SDK in development:

1. Deploy your UniKYC service
2. Configure the `baseUrl` to point to your deployment
3. Test with various wallet addresses and ENS names

## License

MIT
