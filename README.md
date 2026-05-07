# Tenma - Privacy & Sovereignty Layer for Autonomous AI Agents

**Privacy-Preserving Sovereign Infrastructure for Web 4.0 on 0G Network**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![0G Network](https://img.shields.io/badge/0G-Newton%20Testnet-green)](https://0g.ai/)
[![Track 5](https://img.shields.io/badge/Track-Privacy%20%26%20Sovereign%20Infrastructure-purple)](https://0g.ai/)

---

## 🎯 What is Tenma?

**Tenma** (天魔 - Heavenly Demon) is an **on-chain firewall** that protects autonomous AI agents from making unauthorized transactions. It provides privacy-preserving sovereign infrastructure with MEV protection, policy enforcement, and user-controlled security - all enforced at the blockchain level.

### The Problem

- AI agents can make payments autonomously
- If hacked or compromised, they could drain all funds
- Traditional security can be bypassed
- No privacy protection from MEV bots

### The Solution

Tenma enforces security policies **at the smart contract level** - meaning the blockchain itself blocks unauthorized transactions. Even if your AI agent is compromised, it **cannot** violate your policies.

```
WITHOUT Tenma:
AI Agent → Blockchain
❌ If AI is hacked → All funds drained

WITH Tenma:
AI Agent → Tenma Firewall → Policy Check → Blockchain
✅ If AI is hacked → Firewall blocks unauthorized transactions
```

---

## 🚀 Live Deployment

### Smart Contracts on 0G Newton Testnet

| Contract | Address | Status |
|----------|---------|--------|
| **CommitRevealContract** | `0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d` | ✅ Deployed & Verified |
| **TenmaFirewall** | `0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9` | ✅ Deployed & Verified |

### Network Details

```
Network:     0G Newton Testnet
Chain ID:    16602
RPC URL:     https://evmrpc-testnet.0g.ai
Explorer:    https://chainscan-newton.0g.ai
Currency:    A0GI (test 0G)
```

---

## ✨ Key Features

### 🔐 1. Privacy-Preserving Protocols

- **Commit-Reveal Mechanism**: Transaction details hidden until reveal
- **End-to-End Encryption**: AES-256-GCM for all transactions
- **MEV Protection**: 5-minute delay prevents front-running
- **Zero-Knowledge**: No transaction visibility during commit phase

### 👑 2. Sovereign Infrastructure

- **User-Defined Policies**: You set the rules
- **On-Chain Enforcement**: Blockchain enforces policies (cannot be bypassed)
- **Trustless Execution**: No central authority
- **Immutable Rules**: Policies cannot be changed without your consent

### 🛡️ 3. MEV-Resistant Architecture

- **Time-Delayed Execution**: 5-minute mandatory delay
- **Encrypted Mempool**: Transaction details hidden from MEV bots
- **Sandwich Attack Prevention**: Protected from value extraction
- **Front-Running Protection**: Bots cannot see transactions in advance

### 🌐 4. Cross-Chain Abstraction

- **Unified Interface**: Single SDK for multiple chains
- **Consistent Policies**: Same rules across all chains
- **Seamless Bridging**: Cross-chain asset transfers
- **Aggregated Liquidity**: Access liquidity everywhere

---

## 🎬 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/tenma-firewall.git
cd tenma-firewall
```

### 2. Install Dependencies

```bash
# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install SDK dependencies
cd ../sdk
npm install
```

### 3. Set Up Environment

```bash
# In contracts folder
cp .env.example .env
# Edit .env with your PRIVATE_KEY

# In frontend folder
cp .env.example .env
# Edit .env with contract addresses
```

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5175

---

## 📖 Documentation

- **[Architecture](./docs/ARCHITECTURE.md)** - System design and components
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - How to deploy contracts and frontend
- **[SDK Documentation](./docs/SDK.md)** - Complete API reference

---

## 🏗️ Project Structure

```
tenma-firewall/
├── contracts/              # Smart contracts
│   ├── contracts/
│   │   ├── CommitRevealContract.sol
│   │   └── TenmaFirewall.sol
│   ├── scripts/
│   │   └── deploy-tenma-firewall-full.ts
│   └── test/
│
├── frontend/               # React UI
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PrivacyDashboard.tsx
│   │   │   ├── MEVAnalytics.tsx
│   │   │   ├── CrossChainBridge.tsx
│   │   │   ├── AITradingChat.tsx
│   │   │   └── LiveDemo.tsx
│   │   └── components/
│   └── package.json
│
├── sdk/                    # Developer SDK
│   ├── src/
│   │   ├── TenmaFirewall.ts
│   │   ├── TenmaAgent.ts
│   │   └── types.ts
│   └── examples/
│
└── docs/                   # Documentation
    ├── ARCHITECTURE.md
    ├── DEPLOYMENT.md
    └── SDK.md
```

---

## 💡 How It Works

### Commit-Reveal Flow

```
1. COMMIT PHASE
   User → Encrypt transaction → Submit commitment hash
   ↓
   Blockchain stores hash (details hidden)
   ↓
   MEV bots cannot see transaction

2. WAIT PERIOD (5 minutes)
   ↓
   MEV opportunity window passes

3. REVEAL PHASE
   User → Submit transaction details + secret
   ↓
   Firewall validates commitment hash
   ↓
   Policy check (amount, whitelist, risk score)
   ↓
   Execute if policies pass

4. EXECUTION
   Transaction executed on blockchain
   ✅ Protected from MEV
   ✅ Policy enforced
```

### Policy Enforcement

```typescript
// Set policies
await firewall.setPolicy({
  maxTransactionAmount: '10.0',      // Max 10 ETH per transaction
  maxDailyAmount: '50.0',            // Max 50 ETH per day
  whitelistedContracts: [            // Only these contracts allowed
    '0xUniswapRouter...',
  ],
  maxRiskScore: 50,                  // Max risk score 50/100
});

// Try to send 100 ETH
await firewall.executeTransaction({
  to: '0xRecipient...',
  value: '100.0',                    // Exceeds limit!
  data: '0x',
});

// Result: ❌ BLOCKED - Amount exceeds limit
```

---

## 🎯 Use Cases

### 1. AI Trading Bots
- Set spending limits
- Whitelist DEX contracts
- Prevent unauthorized trades
- MEV protection for trades

### 2. DAO Treasury Management
- Enforce spending policies
- Multi-sig with AI agents
- Automated payments with limits
- Audit trail on-chain

### 3. Subscription Services
- Recurring payment limits
- Time-based restrictions
- Automatic renewals with caps
- User sovereignty

### 4. DeFi Automation
- Yield farming with limits
- Automated rebalancing
- Risk-controlled strategies
- MEV-protected swaps

---

## 🏆 Built for 0G Network Hackathon 2025

### Track: Privacy & Sovereign Infrastructure

**Why Tenma Perfectly Aligns**:

#### 1. Privacy-Preserving Protocols ✅
- Commit-reveal mechanism (zero-knowledge)
- End-to-end encryption (AES-256-GCM)
- Encrypted storage on 0G Network
- Privacy-preserving analytics

#### 2. Sovereign Infrastructure ✅
- User-controlled policies
- On-chain enforcement (trustless)
- No central authority
- Immutable rules

#### 3. MEV-Resistant Infrastructure ✅
- Time-delayed execution
- Encrypted mempool
- Front-running prevention
- $1.4B MEV problem solved

#### 4. Cross-Chain Solutions ✅
- Unified interface
- Multi-chain support
- Consistent policies
- Seamless bridging

#### 5. Confidentiality Rails for Web 4.0 ✅
- Privacy by default
- User sovereignty
- Trustless execution
- Decentralized infrastructure

---

## 🛠️ Tech Stack

### Smart Contracts
- Solidity 0.8.24
- Hardhat
- OpenZeppelin Contracts
- ethers.js v6

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- ethers.js v6

### SDK
- TypeScript
- ethers.js v6
- Grok API
- 0G Storage SDK
- Zod validation

---

## 📊 Features Comparison

| Feature | Traditional Security | Tenma |
|---------|---------------------|-------|
| **Enforcement** | Off-chain (bypassable) | On-chain (guaranteed) ✅ |
| **AI Integration** | Manual | Autonomous ✅ |
| **Real-Time Blocking** | No | Yes ✅ |
| **MEV Protection** | No | Yes (commit-reveal) ✅ |
| **Privacy** | No | End-to-end encryption ✅ |
| **User Sovereignty** | No | Complete control ✅ |
| **Cross-Chain** | No | Unified interface ✅ |

---

## 🧪 Testing

### Run Smart Contract Tests

```bash
cd contracts
npm test
```

### Run Frontend

```bash
cd frontend
npm run dev
```

### Test SDK

```bash
cd sdk
npx ts-node examples/basic-firewall.ts
```

---

## 📝 Examples

### Basic Usage

```typescript
import { TenmaFirewall } from '@tenma/firewall-sdk';

const firewall = new TenmaFirewall({
  contractAddress: '0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9',
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  privateKey: process.env.PRIVATE_KEY!,
});

await firewall.initialize();

await firewall.setPolicy({
  maxTransactionAmount: '10.0',
  maxDailyAmount: '50.0',
});

const result = await firewall.executeTransaction({
  to: '0xRecipient...',
  value: '1.0',
  data: '0x',
});
```

### AI Agent with Grok

```typescript
import { TenmaAgent } from '@tenma/firewall-sdk';

const agent = new TenmaAgent({
  apiKey: process.env.TENMA_API_KEY!,
  name: 'TenmaBot',
  strategies: ['dca', 'arbitrage'],
  riskProfile: 'moderate',
  maxPositionSize: '1.0',
  maxDailyTrades: 10,
}, firewall);

await agent.start();
```

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **0G Network** - For providing the blockchain infrastructure
- **OpenZeppelin** - For secure smart contract libraries
- **Grok AI** - For AI agent integration
- **Hackathon Organizers** - For the opportunity to build

---

## 📞 Contact

- **GitHub**: [github.com/yourusername/tenma-firewall](https://github.com/yourusername/tenma-firewall)
- **Twitter**: [@yourhandle](https://twitter.com/yourhandle)
- **Discord**: YourDiscord#1234

---

<div align="center">

**Tenma - Privacy & Sovereignty Layer for Web 4.0**

*Protecting the $10B+ AI Agent Economy*

[Documentation](./docs/) • [Smart Contracts](https://chainscan-newton.0g.ai/address/0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9) • [Live Demo](http://localhost:5175)

Built with ❤️ for 0G Network Hackathon 2025

</div>
