# UniKYC - Universal KYC with Ethereum

**Solve KYC Once, Use Everywhere**

UniKYC eliminates repetitive identity verification. Complete KYC once, access any platform that requires it.

## Problem Statement

Users repeatedly upload identity documents to Binance, Coinbase, PayPal, and other platforms, losing control over their data. UniKYC solves this with one verification for infinite access.

## Key Features

- **Privacy-First**: Threshold cryptography and blocklock encryption
- **Universal Identity**: ENS-based identity layer
- **Advanced Security**: Biometric + face verification
- **Decentralized Storage**: IPFS/Filecoin via Storacha
- **Multi-Chain**: Base Sepolia, Filecoin, Polygon support

## How It Works

### Users
1. Connect wallet + ENS name
2. Complete KYC verification once
3. Access any participating platform
4. Control data permissions

### Platforms
1. Integrate UniKYC SDK
2. Verify users via ENS/wallet
3. Access verified data with consent
4. Skip KYC infrastructure

## Technical Stack

- **Frontend**: Next.js 15, TypeScript, Wagmi, OnchainKit
- **Blockchain**: ENS, Smart Contracts, dcipher Network
- **Storage**: IPFS/Filecoin (Storacha)
- **Security**: Threshold crypto, iProov, WebAuthn

## Quick Start

```bash
npm install @unikyc/sdk
```

```tsx
import { UniKycButton, createUniKycConfig } from '@unikyc/sdk'

const config = createUniKycConfig({
  baseUrl: 'https://your-unikyc-app.vercel.app'
})

<UniKycButton
  config={config}
  identifier="vitalik.eth"
  onSuccess={(result) => console.log('Verified:', result)}
/>
```

## Architecture

Frontend → React Hooks → Service Layer → Blockchain & Storage

## Getting Started

1. Clone repository
2. Install dependencies: `npm install`
3. Set environment variables
4. Run development server: `npm run dev`

## License

MIT
