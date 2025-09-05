# UniKYC Setup Guide

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- WalletConnect Project ID (get from [WalletConnect Cloud](https://cloud.walletconnect.com/))

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd unikyc
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp env.example .env.local
```

4. **Configure environment variables**
Edit `.env.local` and set:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your WalletConnect Project ID
- Other required variables as needed

## WalletConnect Setup

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Add it to your `.env.local` file

## Development

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Production Build

```bash
pnpm build
pnpm start
```

## Key Features Fixed

### ✅ Wallet Connection
- Replaced deprecated MiniKit with ConnectKit
- Proper Wagmi/Viem configuration
- Multi-chain support (Base, Polygon, Filecoin)

### ✅ SIWE Authentication
- Proper Sign-In with Ethereum implementation
- Session management with Redis fallback
- Secure nonce generation and verification

### ✅ Performance
- Fixed webpack Buffer serialization issues
- Optimized package imports
- Proper caching configuration

### ✅ Production Ready
- Environment variable configuration
- Error handling and validation
- Responsive design and accessibility

## Architecture

```
Frontend (Next.js) → Wagmi/Viem → ConnectKit → Wallet Connection
                    ↓
                SIWE Authentication → Session Management
                    ↓
                KYC Service → Threshold Cryptography
                    ↓
                Blockchain Integration → Smart Contracts
```

## Supported Networks

- **Base Sepolia** (Testnet)
- **Filecoin Calibration** (Testnet)  
- **Polygon** (Mainnet)

## Troubleshooting

### Webpack Errors
- Clear `.next` cache: `rm -rf .next`
- Restart development server

### Wallet Connection Issues
- Verify WalletConnect Project ID
- Check browser console for errors
- Ensure wallet extension is installed

### Build Errors
- Verify all dependencies are installed
- Check TypeScript compilation
- Ensure environment variables are set

## Next Steps

1. Deploy smart contracts to testnets
2. Update contract addresses in environment
3. Configure production Redis instance
4. Set up monitoring and analytics
5. Deploy to production hosting

## Support

For issues and questions:
- Check the console for error messages
- Review the browser network tab
- Verify environment configuration
- Check wallet connection status
