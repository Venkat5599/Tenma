<p align="center"><img src="https://img.shields.io/badge/🛡️-Tenma_Firewall-00D4FF?style=for-the-badge&labelColor=0a0f12" alt="Tenma Firewall" /></p>

<h1 align="center">Tenma (天魔) Firewall</h1>

<p align="center"><strong>On-Chain Security Layer for Autonomous AI Agent Transactions on 0G Network</strong></p>

<p align="center">
<a href="https://chainscan-newton.0g.ai/address/0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9"><img src="https://img.shields.io/badge/🔴_LIVE-0G_Newton_Testnet-00D4FF?style=for-the-badge" alt="Live on 0G" /></a>
<a href="https://chainscan-newton.0g.ai/address/0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9"><img src="https://img.shields.io/badge/✅_VERIFIED-Smart_Contracts-00FF88?style=for-the-badge" alt="Verified" /></a>
<img src="https://img.shields.io/badge/Solidity-0.8.19-363636?style=for-the-badge&logo=solidity" alt="Solidity" />
</p>

---

## 📋 Project Overview

**Tenma (天魔 - Heavenly Demon) Firewall** is a smart contract security layer that protects autonomous AI agent transactions on the 0G blockchain. It enforces spending policies directly on-chain, ensuring that even if an AI agent's private key is compromised, attackers cannot drain funds beyond configured limits.

### What It Does

- **Enforces spending limits** - Max per transaction, daily caps
- **Blocks unauthorized recipients** - Whitelist/blacklist support
- **Prevents MEV attacks** - 5-minute commit-reveal mechanism
- **Provides emergency controls** - Instant pause capability
- **Creates audit trail** - All attempts logged on-chain
- **Protects AI agents** - Blockchain-enforced security policies

### Key Innovation

Unlike off-chain security (which can be bypassed), our firewall is **enforced at the smart contract level**. The blockchain itself prevents unauthorized transfers - no trust assumptions, no external dependencies.

```
Traditional Security:  Agent → Wallet → Blockchain (no protection)

With Tenma Firewall:   Agent → Firewall → Policy Check → MEV Protection → Blockchain (protected)
```

---

## 🌐 Why This Matters for 0G Network

### The AI Agent Opportunity

The future of blockchain is autonomous AI agents managing funds. 0G Network is positioning itself as a leader in this space with high-performance infrastructure. But **autonomous transactions without security = liability**.

### What We Bring to 0G

| Benefit | Impact |
|---------|--------|
| **Enables Enterprise Adoption** | Companies won't deploy AI agents with unlimited spending power. Our firewall makes it safe. |
| **Reduces Risk** | Limits damage from compromised agents, prompt injection attacks, and bugs |
| **Increases Trust** | Users can authorize AI payments knowing there are guardrails |
| **MEV Protection** | Commit-reveal mechanism prevents front-running and sandwich attacks |
| **Native Integration** | Built specifically for 0G Network, optimized for A0GI transactions |

### Market Need

- AI agents managing treasury funds need spending limits
- DAOs automating payments need recipient controls
- DeFi protocols need MEV protection
- **All of these need on-chain enforcement that can't be bypassed**

---

## 🚀 Deployment Information

### Live Contracts on 0G Newton Testnet

| Contract | Address | Verified |
|----------|---------|----------|
| **TenmaFirewall** | `0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9` | [✅ View Code](https://chainscan-newton.0g.ai/address/0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9) |
| **CommitRevealContract** | `0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d` | [✅ View Code](https://chainscan-newton.0g.ai/address/0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d) |

### AI Agent API (Groq-Powered)

**Option 1: Serverless (Recommended)** 🚀
- Deploy to Vercel in 3 commands
- Free tier: 100K requests/month
- Auto-scaling, global CDN
- Zero maintenance

```bash
npm install -g vercel
vercel login
vercel --prod
```

See [SERVERLESS-DEPLOYMENT.md](./SERVERLESS-DEPLOYMENT.md) for details.

**Option 2: Local Server**
- Run on your machine
- Good for development

```bash
cd agent
npm install groq-sdk
npm run api:dev
```

See [GROQ-SETUP.md](./GROQ-SETUP.md) for details.

### Network Details

```
Network:     0G Newton Testnet
Chain ID:    16602
RPC URL:     https://evmrpc-testnet.0g.ai
Explorer:    https://chainscan-newton.0g.ai
Currency:    A0GI (test tokens)
```

### Deploy Your Own

```bash
# 1. Clone the repository
git clone https://github.com/Venkat5599/Tenma.git
cd Tenma

# 2. Install dependencies
cd contracts
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your private key

# 4. Deploy to 0G Newton Testnet
npx hardhat run scripts/deploy-tenma-firewall-full.ts --network 0g-testnet

# 5. Verify contracts (optional)
npx hardhat verify --network 0g-testnet <CONTRACT_ADDRESS>
```

---

## 📖 How to Use the Contracts

### Option 1: Direct Contract Interaction

#### Execute a Protected Transaction

```solidity
// Solidity - Call from your contract
interface ITenmaFirewall {
    function commit(bytes32 commitmentHash) external;
    function reveal(address target, uint256 value, bytes data, bytes32 secret) external payable;
}

ITenmaFirewall firewall = ITenmaFirewall(0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9);

// Step 1: Commit (hide transaction details)
bytes32 secret = keccak256(abi.encodePacked(block.timestamp));
bytes32 commitmentHash = keccak256(abi.encodePacked(target, value, data, secret));
firewall.commit(commitmentHash);

// Step 2: Wait 5 minutes (MEV protection)

// Step 3: Reveal and execute
firewall.reveal{value: value}(target, value, data, secret);
// If policy violated → transaction REVERTS
// If policy passes → payment executes
```

#### Check If Transaction Would Succeed

```solidity
// Simulate before executing
(bool allowed, string memory reason) = firewall.simulateTransaction(
    senderAddress,
    recipientAddress,
    amount
);

// allowed = true/false
// reason = "Transaction allowed" or "Exceeds max transaction amount"
```

### Option 2: JavaScript/TypeScript Integration

```typescript
import { ethers } from 'ethers';

// Connect to firewall
const FIREWALL_ADDRESS = '0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9';
const FIREWALL_ABI = [
  'function commit(bytes32 commitmentHash) external',
  'function reveal(address target, uint256 value, bytes data, bytes32 secret) external payable',
  'function simulateTransaction(address sender, address target, uint256 value) view returns (bool allowed, string reason)',
];

const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai');
const signer = new ethers.Wallet(privateKey, provider);
const firewall = new ethers.Contract(FIREWALL_ADDRESS, FIREWALL_ABI, signer);

// Simulate first
const [allowed, reason] = await firewall.simulateTransaction(
  await signer.getAddress(),
  '0xRecipientAddress',
  ethers.parseEther('1.0')
);

console.log(allowed ? 'Will succeed' : `Will fail: ${reason}`);

// Step 1: Commit
const target = '0xRecipientAddress';
const value = ethers.parseEther('1.0');
const data = '0x';
const secret = ethers.randomBytes(32);

const payload = ethers.AbiCoder.defaultAbiCoder().encode(
  ['address', 'uint256', 'bytes'],
  [target, value, data]
);
const commitmentHash = ethers.keccak256(ethers.concat([payload, secret]));

const tx1 = await firewall.commit(commitmentHash);
await tx1.wait();
console.log('Committed:', commitmentHash);

// Step 2: Wait 5 minutes
await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));

// Step 3: Reveal and execute
const tx2 = await firewall.reveal(target, value, data, secret, { value });
await tx2.wait();
console.log('Transaction executed:', tx2.hash);
```

### Option 3: Using the Frontend Dashboard

```bash
# 1. Clone and install
git clone https://github.com/Venkat5599/Tenma.git
cd Tenma/frontend
npm install

# 2. Start development server
npm run dev

# 3. Open http://localhost:5174

# 4. Connect MetaMask to 0G Newton Testnet
#    - Network: 0G Newton Testnet
#    - RPC: https://evmrpc-testnet.0g.ai
#    - Chain ID: 16602

# 5. Configure your policies in the Policy Config page

# 6. Try the Live Demo to see real-time blocking!
```

### Contract Functions Reference

| Function | Description | Access |
|----------|-------------|--------|
| `commit(commitmentHash)` | Commit transaction (step 1) | Anyone |
| `reveal(target, value, data, secret)` | Reveal and execute (step 2) | Committer |
| `simulateTransaction(sender, target, value)` | Check if transaction would succeed | View |
| `setPolicy(...)` | Configure security policies | Owner |
| `addToWhitelist(target)` | Add address to whitelist | Owner |
| `removeFromWhitelist(target)` | Remove from whitelist | Owner |
| `pause()` / `unpause()` | Emergency controls | Owner |

---

## 🛡️ Security Policies

All policies are enforced on-chain. Violations cause transaction revert.

| Policy | Default Value | Configurable |
|--------|---------------|--------------|
| Max per transaction | 10.0 A0GI | ✅ Yes |
| Daily spending limit | 50.0 A0GI | ✅ Yes |
| Max gas price | 100 Gwei | ✅ Yes |
| Max risk score | 5/10 | ✅ Yes |
| Whitelist enforcement | Optional | ✅ Yes |
| Time restrictions | Optional | ✅ Yes |
| Emergency pause | Off | ✅ Yes |
| MEV protection delay | 5 minutes | ❌ Fixed |

### Policy Violation Examples

```
Attempt: Send 15.0 A0GI (limit is 10.0)
Result:  REVERT("Exceeds max transaction amount")

Attempt: Send to non-whitelisted address
Result:  REVERT("Recipient not whitelisted")

Attempt: Exceed daily limit
Result:  REVERT("Daily limit exceeded")

Attempt: Reveal before 5 minutes
Result:  REVERT("Commitment not ready")
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER/AI AGENT                               │
│                    (AI Agent, DApp, or Direct Call)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          TenmaFirewall                                   │
│                   0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9            │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ Policy Engine   │  │ Commit-Reveal   │  │ Emergency Pause │         │
│  │ setPolicy()     │  │ commit/reveal() │  │ pause/unpause() │         │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────┘         │
│           │                    │                                         │
│           └────────────────────┴──────────────────┐                     │
│                                                   ▼                     │
│                                    ┌─────────────────────────┐          │
│                                    │    Policy Check         │          │
│                                    │    (MUST PASS)          │          │
│                                    └───────────┬─────────────┘          │
└────────────────────────────────────────────────┼────────────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CommitRevealContract                                │
│                   0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d            │
│                                                                          │
│  Checks:                                                                 │
│  ├── Commitment exists?                                                 │
│  ├── 5 minutes passed?                                                  │
│  ├── Not expired (24 hours)?                                            │
│  ├── Secret matches?                                                    │
│  └── Not already revealed?                                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            ┌─────────────┐                 ┌─────────────┐
            │  ✅ ALLOWED  │                 │  ❌ BLOCKED  │
            │   Transfer   │                 │   REVERT    │
            │   Executes   │                 │   No funds  │
            └─────────────┘                 │   move      │
                                            └─────────────┘
```

---

## 📁 Project Structure

```
Tenma/
├── contracts/          # Solidity smart contracts
│   ├── contracts/
│   │   ├── TenmaFirewall.sol
│   │   └── CommitRevealContract.sol
│   ├── scripts/        # Deployment scripts
│   ├── test/           # Contract tests
│   └── hardhat.config.ts
│
├── frontend/           # React dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── ...
│   └── package.json
│
├── sdk/                # TypeScript SDK
│   ├── src/
│   │   ├── TenmaFirewall.ts
│   │   ├── TenmaAgent.ts
│   │   └── ...
│   └── package.json
│
├── agent/              # AI agent implementation
├── storage/            # 0G Storage integration
└── docs/               # Documentation
```

---

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Technical deep-dive
- [Deployment Guide](./docs/DEPLOYMENT.md) - How to deploy
- [SDK Documentation](./docs/SDK.md) - Complete SDK reference
- [Vercel Environment Setup](./vercel-env-setup.md) - Production deployment
- [Implementation Status](./docs/IMPLEMENTATION-STATUS.md) - What's real vs demo

---

## 🤖 AI Agent Features

### Groq-Powered Intelligence

Tenma uses **Groq AI** with the Llama 3.3 70B model for ultra-fast AI responses:

- **Real-time Trading Decisions** - Analyze market data and execute trades
- **Natural Language Processing** - Understand complex trading commands
- **Risk Assessment** - Evaluate transaction safety before execution
- **Memory System** - Remember conversation context and past decisions
- **11+ Tools** - Balance checks, price queries, token purchases, transfers, and more

### Database & Memory

- **Supabase PostgreSQL** - Persistent storage for conversations
- **Conversation History** - Track all interactions with the AI agent
- **Execution Logs** - Audit trail of all transactions
- **User Profiles** - Personalized settings and preferences
- **Pending Approvals** - Queue for transaction confirmations

### Real Blockchain Transactions

- **MetaMask Integration** - Execute real transactions on 0G Network
- **Wallet Execution** - All transactions go through user's wallet
- **Transaction Parameters** - AI agent prepares, user approves
- **Balance Checking** - Verify funds before execution
- **Gas Estimation** - Automatic gas limit calculation

---

## 🖥️ Frontend Features

### Dashboard
- Real wallet connection with MetaMask
- Real-time policy data from blockchain
- Live transaction statistics
- Quick actions to all features

### Privacy Dashboard
- Privacy score calculation
- MEV risk assessment
- Transaction history from blockchain
- Clickable transactions with details
- Privacy settings panel

### MEV Analytics
- Real-time attack prevention stats
- Time range filters (24h, 7d, 30d, all)
- Attack type filters
- Export data as JSON
- Live attack feed

### Policy Configuration
- Load policies from blockchain
- Save policies to smart contract
- Add contracts to on-chain whitelist
- Real-time validation
- Blockchain-enforced rules

### AI Trading Chat
- Interactive AI agent demo
- Real-time firewall blocking
- Suspicious command detection
- Multiple trading strategies

### Intent Cross-Chain
- Intent-based execution
- Solver competition
- Gas abstraction
- Unified policies across chains

### Live Demo
- Watch AI agent make decisions
- See real-time firewall blocking
- Policy violation detection
- Interactive controls

---

## 🧪 Testing

```bash
# Run contract tests
cd contracts
npx hardhat test

# Run the full demo flow
npx hardhat run scripts/demo-firewall-flow.ts --network 0g-testnet

# Expected output:
# ✅ Policy set successfully
# ✅ Commitment created
# ⏳ Waiting 5 minutes...
# ✅ Transaction revealed and executed
# ❌ Policy violation blocked (expected)
```

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| **GitHub Repository** | [github.com/Venkat5599/Tenma](https://github.com/Venkat5599/Tenma) |
| **NPM Package** | [npmjs.com/package/tenma-firewall-sdk](https://www.npmjs.com/package/tenma-firewall-sdk) |
| **TenmaFirewall Contract** | [View on Explorer](https://chainscan-newton.0g.ai/address/0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9) |
| **CommitReveal Contract** | [View on Explorer](https://chainscan-newton.0g.ai/address/0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d) |
| **0G Network** | [0g.ai](https://0g.ai) |
| **0G Faucet** | [Get Test A0GI](https://faucet.0g.ai) |
| **Groq AI** | [groq.com](https://groq.com) |

---

## 🛠️ Tech Stack

- **Smart Contracts:** Solidity 0.8.19
- **Development:** Hardhat, TypeScript
- **Frontend:** React, Vite, TailwindCSS
- **SDK:** TypeScript, ethers.js v6 (Published on NPM)
- **AI Agent:** Groq AI (Llama 3.3 70B)
- **Database:** Supabase (PostgreSQL with RLS)
- **Blockchain:** 0G Network (Newton Testnet)
- **Storage:** 0G Storage (planned)

---

## 📈 Roadmap

- [x] Core contracts deployed & verified
- [x] MEV protection (commit-reveal)
- [x] Policy enforcement working
- [x] Frontend dashboard
- [x] TypeScript SDK published to NPM
- [x] Documentation
- [x] **Real blockchain integration** 🎉
- [x] **Tenma AI agent integration** (Groq-powered)
- [x] **Real-time database** (Supabase)
- [ ] 0G Storage integration
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Multi-chain support

---

## 🎯 Key Features

### ✅ Implemented & Working

1. **On-Chain Firewall** - Smart contracts deployed and verified on 0G Network
2. **MEV Protection** - 5-minute commit-reveal mechanism prevents front-running
3. **Policy Enforcement** - Amount limits, whitelists, risk scores enforced on-chain
4. **Frontend Integration** - Fully connected to blockchain with real-time data
5. **Real-time Events** - Live monitoring from contract events
6. **Interactive UI** - Filters, exports, modals, settings on all pages
7. **Intent Cross-Chain** - Better UX for multi-chain operations
8. **Wallet Integration** - MetaMask connection with 0G Network
9. **AI Agent Integration** - Groq-powered AI agent with 11+ tools
10. **NPM SDK** - Published as `tenma-firewall-sdk@1.0.0`
11. **Database** - Supabase for conversation history and execution logs
12. **Real Transactions** - Execute actual blockchain transactions via MetaMask

### 🎭 Demo/Simulated

1. **Cross-Chain Bridge** - UI only (needs multi-chain deployment)
2. **0G Storage** - Planned integration

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

```bash
# Fork the repository
# Create a feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m 'Add amazing feature'

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

## Built for 0G Network 🚀

**Track: DevTooling & Privacy**

*Protecting AI Agent Transactions with On-Chain Security*

**Made with ❤️ by the Tenma Team**

[GitHub](https://github.com/Venkat5599/Tenma) • [Documentation](./docs/) • [Live Demo](http://localhost:5174)

</div>
