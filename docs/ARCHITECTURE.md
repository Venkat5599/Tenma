# Tenma Architecture

## System Overview

Tenma is a privacy-preserving sovereign infrastructure for autonomous AI agents on 0G Network.

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI AGENT / USER                          │
│              (GPT-4, Claude, AutoGPT, or Direct Call)           │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TENMA FRONTEND (React)                      │
│                    http://localhost:5175                         │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Privacy         │  │ MEV Analytics   │  │ Cross-Chain     │ │
│  │ Dashboard       │  │                 │  │ Bridge          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TENMA SMART CONTRACTS (0G Network)             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CommitRevealContract                                     │   │
│  │  0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d              │   │
│  │  - Commit phase (hide transaction details)               │   │
│  │  - 5-minute delay (MEV protection)                       │   │
│  │  - Reveal phase (execute transaction)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  TenmaFirewall                                           │   │
│  │  0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9              │   │
│  │  - Policy enforcement (amount limits, whitelists)        │   │
│  │  - Risk score validation                                 │   │
│  │  - Time restrictions                                     │   │
│  │  - Manual approval flow                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      0G STORAGE (Decentralized)                  │
│  - Encrypted transaction payloads                               │
│  - Policy rules                                                 │
│  - Audit trail                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Smart Contracts

#### CommitRevealContract
- **Address**: `0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d`
- **Purpose**: MEV protection via commit-reveal mechanism
- **Features**:
  - Commit phase: Hide transaction details
  - 5-minute delay: Prevent front-running
  - Reveal phase: Execute after delay
  - Expiry window: 24 hours

#### TenmaFirewall
- **Address**: `0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9`
- **Purpose**: On-chain policy enforcement
- **Features**:
  - Amount limits (per transaction and daily)
  - Contract whitelist/blacklist
  - Risk score validation
  - Time-based restrictions
  - Gas price limits
  - Manual approval flow
  - Emergency pause

### 2. Frontend Application

Built with:
- React 18
- TypeScript
- Vite
- TailwindCSS
- ethers.js v6

Pages:
- Dashboard: Overview and quick actions
- Privacy Dashboard: Privacy metrics and MEV risk
- MEV Analytics: Attack prevention statistics
- Cross-Chain Bridge: Multi-chain operations
- AI Trading Chat: Interactive AI agent demo
- Live Demo: Real-time blocking visualization
- Policy Config: Policy management

### 3. SDK (Developer Tool)

TypeScript SDK for integrating Tenma firewall into applications.

Components:
- `TenmaFirewall`: Main firewall class
- `GrokAgent`: AI agent with Grok API
- `PolicyManager`: Policy configuration
- `TransactionGuard`: Transaction validation
- `StorageClient`: 0G Storage integration
- `utils`: Encryption and helpers

## Data Flow

### Transaction Execution Flow

1. **User/AI Agent** initiates transaction
2. **Frontend** encrypts transaction details
3. **Commit Phase**:
   - Generate commitment hash
   - Submit to CommitRevealContract
   - Transaction details hidden from mempool
4. **Wait Period** (5 minutes):
   - MEV bots cannot see transaction
   - Front-running prevented
5. **Policy Validation**:
   - Check amount limits
   - Validate whitelist/blacklist
   - Check risk score
   - Verify time restrictions
6. **Reveal Phase**:
   - Submit transaction details
   - Verify commitment hash
   - Execute if policies pass
7. **Execution**:
   - Transaction executed on blockchain
   - Event emitted
   - Audit trail updated

### Policy Enforcement Flow

1. **User** sets policies via TenmaFirewall
2. **Policies stored** on-chain
3. **Transaction attempt**:
   - Firewall validates against policies
   - If violation: Transaction reverted
   - If pass: Transaction executed
4. **Daily limits** automatically reset
5. **Statistics** tracked on-chain

## Security Model

### MEV Protection
- Commit-reveal hides transaction details
- 5-minute delay prevents front-running
- Encrypted payloads on 0G Storage
- No mempool visibility

### Policy Enforcement
- On-chain validation (cannot be bypassed)
- Smart contract guarantees
- Trustless execution
- Immutable rules

### Privacy
- Client-side encryption (AES-256-GCM)
- Zero-knowledge of transaction details during commit
- Encrypted storage on 0G Network
- Privacy-preserving analytics

## Network Information

- **Network**: 0G Newton Testnet
- **Chain ID**: 16602
- **RPC URL**: https://evmrpc-testnet.0g.ai
- **Explorer**: https://chainscan-newton.0g.ai
- **Currency**: A0GI (test 0G)

## Technology Stack

### Smart Contracts
- Solidity 0.8.24
- Hardhat
- OpenZeppelin Contracts
- ethers.js

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Lenis (smooth scroll)
- GSAP (animations)

### Backend/SDK
- TypeScript
- ethers.js v6
- Grok API
- 0G Storage SDK
- Zod (validation)

## Deployment

### Smart Contracts
- Deployed on 0G Newton Testnet
- Verified on block explorer
- Immutable (no upgrades)

### Frontend
- Development: http://localhost:5175
- Production: Deploy to Vercel/Netlify

### SDK
- Local development
- Can be published to NPM

## Future Enhancements

1. **Multi-chain support**: Deploy to multiple networks
2. **Advanced risk scoring**: ML-based risk assessment
3. **Governance**: DAO-controlled policy updates
4. **Analytics**: Advanced privacy analytics
5. **Mobile app**: Native mobile application
