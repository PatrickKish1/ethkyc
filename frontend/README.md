# UniKYC - Decentralized KYC Unified Manager

A next-generation, decentralized, privacy-preserving identity system that combines KYC credentials with blockchain technology, threshold cryptography, and the dcipher network for secure, verifiable, and reusable identity verification.

## 🚀 Features

### Core KYC System
- **ENS Integration**: Uses Ethereum Name Service (ENS) as unique identifiers for KYC records
- **Threshold Cryptography**: Implements 5-of-5, 3-of-5, and 2-of-5 threshold schemes for secure data encryption
- **Biometric Verification**: Supports Face ID, fingerprint, and passkey verification via WebAuthn
- **Filecoin Storage**: Decentralized storage using Storacha for KYC documents and data
- **SIWE Authentication**: Sign-In with Ethereum for wallet-based authentication

### Dcipher Network Integration
- **Verifiable Randomness**: Generates cryptographically secure random IDs using the dcipher network
- **Blocklock Encryption**: Conditional encryption where data is decrypted only when specific on-chain conditions are met
- **Multi-Chain Support**: Base Sepolia, Filecoin Calibration, and Polygon networks
- **Smart Contract Integration**: Solidity contracts for on-chain KYC data management

### Privacy & Security
- **Zero-Knowledge Proofs**: Privacy-preserving identity verification
- **Selective Disclosure**: Share only necessary information with relying parties
- **Self-Sovereign Identity**: Users maintain full control over their identity data
- **Portable Credentials**: KYC verification that works across different services

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   React Hooks   │    │  KYC Services   │
│   (Next.js)     │◄──►│   (Custom)      │◄──►│   (TypeScript)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Smart        │    │   Dcipher       │    │   Filecoin      │
│   Contracts    │    │   Network       │    │   Storage       │
│   (Solidity)   │    │   (Blocklock)   │    │   (Storacha)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Wagmi**: React hooks for Ethereum
- **Viem**: TypeScript interface for Ethereum

### Backend & Infrastructure
- **ENS Resolution**: Ethereum Name Service integration
- **Threshold Cryptography**: Multi-key encryption schemes
- **WebAuthn**: Biometric authentication
- **Filecoin/IPFS**: Decentralized storage via Storacha

### Blockchain & Cryptography
- **Dcipher Network**: Verifiable randomness and conditional encryption
- **Blocklock**: Time-based and condition-based data release
- **Smart Contracts**: Solidity contracts for on-chain operations
- **Multi-Chain**: Support for multiple blockchain networks

### Authentication & Identity
- **SIWE**: Sign-In with Ethereum (EIP-4361)
- **ENS Names**: Human-readable identifiers
- **Verifiable Credentials**: W3C standard implementation
- **DIDs**: Decentralized identifiers

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/unikyc.git
cd unikyc
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Run the development server**
```bash
npm run dev
```

## 🔧 Configuration

### Dcipher Network Addresses
```typescript
const dcipherConfig = {
  randomness: {
    baseSepolia: '0xf4e080Db4765C856c0af43e4A8C4e31aA3b48779',
    filecoinCalibration: '0x94C5774DEa83a921244BF362a98c12A5aAD18c87',
    polygon: '0xf4e080Db4765C856c0af43e4A8C4e31aA3b48779'
  },
  blocklock: {
    baseSepolia: '0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e',
    filecoinCalibration: '0xF00aB3B64c81b6Ce51f8220EB2bFaa2D469cf702',
    polygon: '0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e'
  }
}
```

### Supported Networks
- **Base Sepolia** (Chain ID: 84532) - Testnet
- **Filecoin Calibration** (Chain ID: 314159) - Testnet  
- **Polygon** (Chain ID: 137) - Mainnet

## 🚀 Usage

### Basic KYC Verification
```typescript
import { KycButton } from '@/components/kyc/KycButton'

function App() {
  return (
    <KycButton
      onKycComplete={(status) => console.log('KYC completed:', status)}
      onKycError={(error) => console.error('KYC error:', error)}
    >
      Verify KYC
    </KycButton>
  )
}
```

### Using Dcipher Network
```typescript
import { useDcipherNetwork } from '@/hooks/useDcipherNetwork'

function MyComponent() {
  const { generateRandomId, encryptData, getSupportedChains } = useDcipherNetwork()
  
  const handleEncryption = async () => {
    const randomId = await generateRandomId(84532) // Base Sepolia
    const encrypted = await encryptData('sensitive data', 1000, 84532)
  }
}
```

### Smart Contract Integration
```typescript
import { ethers } from 'ethers'
import UniKycBlocklockABI from './UniKycBlocklock.json'

const contract = new ethers.Contract(
  contractAddress,
  UniKycBlocklockABI,
  signer
)

// Encrypt KYC data
const tx = await contract.encryptKycData(
  gasLimit,
  'alice.eth',
  unlockBlockHeight,
  encryptedData
)
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Smart contract tests (Foundry)
forge test

# Specific test
forge test --match-test "UniKycBlocklock"
```

### Test Coverage
```bash
# Frontend coverage
npm run test:coverage

# Smart contract coverage
forge coverage
```

## 📚 API Reference

### KYC Service
- `checkKycStatus(identifier: string)`: Check KYC status by ENS name or address
- `initiateKycVerification(request: KycVerificationRequest)`: Start KYC verification process
- `verifyBiometric(request: BiometricVerificationRequest)`: Verify user identity with biometrics
- `decryptKycData(request: ThresholdDecryptionRequest)`: Decrypt KYC data using threshold cryptography

### Dcipher Network Hook
- `generateRandomId(chainId: number)`: Generate verifiable random ID
- `encryptData(data: string, unlockBlockHeight: number, chainId: number)`: Encrypt data with blocklock
- `getSupportedChains()`: Get list of supported blockchain networks
- `getChainConfig(chainId: number)`: Get configuration for specific network

### Smart Contract Functions
- `encryptKycData(callbackGasLimit, ensName, unlockBlockHeight, encryptedData)`: Encrypt KYC data
- `getKycDataByEns(ensName)`: Retrieve KYC data by ENS name
- `canDecryptKycData(ensName)`: Check if KYC data can be decrypted
- `getUnlockEstimate(ensName)`: Estimate time until unlock

## 🔐 Security Features

### Threshold Cryptography
- **5-of-5 Scheme**: Maximum security, requires all keys
- **3-of-5 Scheme**: High security, requires 3 out of 5 keys
- **2-of-3 Scheme**: Balanced security, requires 2 out of 3 keys

### Blocklock Encryption
- **Time-based Release**: Data unlocks at specific block height
- **Condition-based Release**: Data unlocks when on-chain conditions are met
- **Verifiable Encryption**: Cryptographic proofs of encryption

### Biometric Security
- **WebAuthn Standard**: Industry-standard biometric authentication
- **Device-level Security**: Uses device's secure enclave
- **Challenge-response**: Cryptographic verification of identity

## 🌐 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Deploy to other platforms
npm run export
```

### Smart Contract Deployment
```bash
# Deploy to testnet
npx hardhat run scripts/deploy-blocklock.ts --network base-sepolia

# Deploy to mainnet
npx hardhat run scripts/deploy-blocklock.ts --network polygon
```

### Environment Setup
```bash
# Copy deployment config
cp deployment-config.json .env.local

# Update with deployed addresses
BLOCKLOCK_CONTRACT_ADDRESS=0x...
RANDOMNESS_CONTRACT_ADDRESS=0x...
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ENS Team**: For Ethereum Name Service integration
- **Dcipher Network**: For blocklock and randomness services
- **Filecoin Foundation**: For decentralized storage infrastructure
- **Ethereum Foundation**: For SIWE and Web3 standards

## 📞 Support

- **Documentation**: [docs.unikyc.io](https://docs.unikyc.io)
- **Discord**: [discord.gg/unikyc](https://discord.gg/unikyc)
- **Twitter**: [@unikyc](https://twitter.com/unikyc)
- **Email**: support@unikyc.io

## 🔮 Roadmap

### Phase 1: Core Infrastructure ✅
- [x] KYC service implementation
- [x] ENS integration
- [x] Threshold cryptography
- [x] Biometric verification
- [x] Filecoin storage integration

### Phase 2: Dcipher Network ✅
- [x] Randomness service integration
- [x] Blocklock encryption
- [x] Smart contract deployment
- [x] Multi-chain support

### Phase 3: Advanced Features 🚧
- [ ] Zero-knowledge proofs
- [ ] Cross-chain KYC verification
- [ ] Advanced privacy controls
- [ ] Enterprise features

### Phase 4: Ecosystem 🚧
- [ ] SDK for developers
- [ ] API marketplace
- [ ] Governance token
- [ ] DAO structure

---

**UniKYC** - Building the future of decentralized identity verification 🚀
