# @tenma/firewall-sdk

**On-Chain Firewall SDK for AI Agents on 0G Network**

[![npm version](https://img.shields.io/npm/v/@tenma/firewall-sdk.svg)](https://www.npmjs.com/package/@tenma/firewall-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What is Tenma Firewall?

Tenma Firewall is an **on-chain security layer** that protects autonomous AI agent transactions on the 0G blockchain. It enforces spending policies directly at the smart contract level, ensuring that even if an AI agent's private key is compromised or the agent is manipulated, attackers cannot drain funds beyond configured limits.

### Key Features

- ✅ **On-Chain Policy Enforcement** - Policies validated by smart contracts (cannot be bypassed)
- ✅ **Real-Time Blocking** - Transactions blocked before execution
- ✅ **MEV Protection** - Commit-reveal mechanism with 5-minute delay
- ✅ **Tenma AI Integration** - Autonomous agents powered by Tenma AI
- ✅ **0G Storage** - Encrypted payload storage
- ✅ **Developer-Friendly** - Simple, intuitive API

---

## 📦 Installation

```bash
npm install @tenma/firewall-sdk
```

Or with yarn:

```bash
yarn add @tenma/firewall-sdk
```

---

## 🚀 Quick Start

### 1. Basic Firewall Usage

```typescript
import { TenmaFirewall } from '@tenma/firewall-sdk';

// Initialize firewall
const firewall = new TenmaFirewall({
  contractAddress: '0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d',
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  privateKey: process.env.PRIVATE_KEY!,
  chainId: 16602,
});

await firewall.initialize();

// Set policies
await firewall.setPolicy({
  maxTransactionAmount: '10000', // 10,000 ETH max per transaction
  maxDailyAmount: '50000',       // 50,000 ETH max per day
  whitelistedContracts: [
    '0x1234567890123456789012345678901234567890',
  ],
  maxRiskScore: 50,
  requireManualApproval: false,
});

// Execute protected transaction
const result = await firewall.executeTransaction({
  to: '0xRecipient...',
  value: '1.0',
  data: '0x',
});

console.log('Transaction status:', result.status);
console.log('Commitment hash:', result.commitmentHash);
```

### 2. Grok AI Agent

```typescript
import { TenmaFirewall, GrokAgent } from '@tenma/firewall-sdk';

// Initialize firewall
const firewall = new TenmaFirewall({
  contractAddress: '0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d',
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  privateKey: process.env.PRIVATE_KEY!,
});

await firewall.initialize();

// Create Grok-powered AI agent
const agent = new GrokAgent({
  apiKey: process.env.GROK_API_KEY!,
  name: 'TenmaBot-Alpha',
  strategies: ['dca', 'arbitrage'],
  riskProfile: 'moderate',
  maxPositionSize: '1.0',
  maxDailyTrades: 10,
  decisionInterval: 300000, // 5 minutes
}, firewall);

// Start autonomous trading
await agent.start();

// Agent will:
// 1. Query Grok AI for trading decisions
// 2. Validate against firewall policies
// 3. Execute protected transactions
// 4. Block risky transactions automatically
```

### 3. Real-Time Blocking Demo

```typescript
import { TenmaFirewall, EventType } from '@tenma/firewall-sdk';

const firewall = new TenmaFirewall({
  contractAddress: '0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d',
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  privateKey: process.env.PRIVATE_KEY!,
});

await firewall.initialize();

// Listen to blocking events
firewall.on(EventType.TRANSACTION_BLOCKED, (data) => {
  console.log('🚫 TRANSACTION BLOCKED:');
  console.log('Violations:', data.violations);
});

// Set strict policy
await firewall.setPolicy({
  maxTransactionAmount: '1.0', // Only 1 ETH allowed
  maxDailyAmount: '5.0',
  whitelistedContracts: [],
});

// Try to send 10 ETH (will be blocked)
const result = await firewall.executeTransaction({
  to: '0xRecipient...',
  value: '10.0', // Exceeds limit!
  data: '0x',
});

// Output:
// 🚫 TRANSACTION BLOCKED:
// Violations: [
//   {
//     rule: 'MAX_TRANSACTION_AMOUNT',
//     message: 'Transaction amount 10.0 ETH exceeds maximum allowed 1.0 ETH',
//     severity: 'critical',
//     blocked: true
//   }
// ]
```

---

## 📚 API Reference

### TenmaFirewall

Main firewall class for policy enforcement and transaction protection.

#### Constructor

```typescript
new TenmaFirewall(config: FirewallConfig)
```

**Parameters:**
- `config.contractAddress` - Tenma Firewall contract address
- `config.rpcUrl` - 0G Network RPC URL
- `config.privateKey` - Wallet private key
- `config.chainId` - Chain ID (default: 16602)
- `config.storageEndpoint` - Optional 0G Storage endpoint
- `config.storageApiKey` - Optional 0G Storage API key

#### Methods

##### `initialize()`

Initialize the firewall and set up event listeners.

```typescript
await firewall.initialize();
```

##### `setPolicy(policy: PolicyConfig)`

Set firewall policies.

```typescript
await firewall.setPolicy({
  maxTransactionAmount: '10000',
  maxDailyAmount: '50000',
  maxGasPrice: '100000000000', // 100 gwei
  whitelistedContracts: ['0x...'],
  blacklistedContracts: ['0x...'],
  maxRiskScore: 50,
  requireManualApproval: false,
  timeRestrictions: {
    enabled: true,
    startHour: 9,
    endHour: 17,
  },
});
```

##### `executeTransaction(request: TransactionRequest)`

Execute a protected transaction.

```typescript
const result = await firewall.executeTransaction({
  to: '0xRecipient...',
  value: '1.0',
  data: '0x',
  gasLimit: '21000',
});
```

**Returns:** `TransactionResult`
- `status` - Transaction status (pending, committed, blocked, etc.)
- `commitmentHash` - Commitment hash (if committed)
- `transactionHash` - Transaction hash (if executed)
- `violations` - Policy violations
- `timestamp` - Timestamp

##### `simulateTransaction(request: TransactionRequest)`

Check if a transaction would be blocked without executing it.

```typescript
const violations = await firewall.simulateTransaction({
  to: '0xRecipient...',
  value: '1.0',
  data: '0x',
});

if (violations.some(v => v.blocked)) {
  console.log('Transaction would be blocked');
}
```

##### `getBalance()`

Get wallet balance.

```typescript
const balance = await firewall.getBalance();
console.log('Balance:', balance, 'ETH');
```

##### `on(event: EventType, listener: EventListener)`

Add event listener.

```typescript
firewall.on(EventType.TRANSACTION_BLOCKED, (data) => {
  console.log('Transaction blocked:', data);
});
```

**Events:**
- `COMMITMENT_CREATED` - Transaction committed
- `TRANSACTION_REVEALED` - Transaction revealed
- `TRANSACTION_EXECUTED` - Transaction executed
- `TRANSACTION_BLOCKED` - Transaction blocked
- `POLICY_UPDATED` - Policy updated

---

### GrokAgent

AI-powered autonomous trading agent using Grok API.

#### Constructor

```typescript
new GrokAgent(config: GrokAgentConfig, firewall: TenmaFirewall)
```

**Parameters:**
- `config.apiKey` - Grok API key
- `config.model` - Grok model (default: 'grok-beta')
- `config.name` - Agent name
- `config.strategies` - Trading strategies
- `config.riskProfile` - Risk profile (conservative, moderate, aggressive)
- `config.maxPositionSize` - Max position size in ETH
- `config.maxDailyTrades` - Max trades per day
- `config.decisionInterval` - Decision interval in ms (default: 300000)
- `firewall` - TenmaFirewall instance

#### Methods

##### `start()`

Start the autonomous agent.

```typescript
await agent.start();
```

##### `stop()`

Stop the agent.

```typescript
await agent.stop();
```

##### `getState()`

Get current agent state.

```typescript
const state = agent.getState();
console.log('Balance:', state.balance);
console.log('Trades executed:', state.tradesExecuted);
console.log('Trades blocked:', state.tradesBlocked);
```

##### `getStatistics()`

Get agent statistics.

```typescript
const stats = agent.getStatistics();
console.log('Total decisions:', stats.totalDecisions);
console.log('Block rate:', stats.blockRate);
console.log('Average confidence:', stats.averageConfidence);
```

---

## 🎯 Use Cases

### 1. DeFi Trading Bot

```typescript
const firewall = new TenmaFirewall({
  contractAddress: '0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d',
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  privateKey: process.env.PRIVATE_KEY!,
});

await firewall.initialize();

// Set conservative limits
await firewall.setPolicy({
  maxTransactionAmount: '5.0',
  maxDailyAmount: '20.0',
  whitelistedContracts: [
    '0xUniswapRouter...',
    '0x1inchRouter...',
  ],
});

// Execute swaps with protection
const result = await firewall.executeTransaction({
  to: '0xUniswapRouter...',
  value: '1.0',
  data: swapCalldata,
});
```

### 2. DAO Treasury Management

```typescript
// Set up firewall for DAO treasury
await firewall.setPolicy({
  maxTransactionAmount: '100000',
  maxDailyAmount: '500000',
  requireManualApproval: true,
  timeRestrictions: {
    enabled: true,
    startHour: 9,
    endHour: 17, // Business hours only
  },
});
```

### 3. AI Agent with Risk Management

```typescript
const agent = new GrokAgent({
  apiKey: process.env.GROK_API_KEY!,
  name: 'ConservativeBot',
  strategies: ['dca'],
  riskProfile: 'conservative',
  maxPositionSize: '0.5',
  maxDailyTrades: 5,
}, firewall);

await agent.start();

// Agent will make conservative decisions
// Firewall will block risky transactions
```

---

## 🔒 Security

### On-Chain Enforcement

All policies are enforced at the smart contract level. This means:

- ✅ **Cannot be bypassed** - Even if private key is compromised
- ✅ **Trustless** - No central authority
- ✅ **Transparent** - All rules visible on-chain
- ✅ **Immutable** - Policies stored on blockchain

### MEV Protection

Transactions use commit-reveal mechanism:

1. **Commit** - Transaction details encrypted and committed
2. **Wait** - 5-minute delay (MEV protection)
3. **Reveal** - Transaction revealed and executed

This prevents:
- Front-running
- Sandwich attacks
- MEV extraction

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- TenmaFirewall.test.ts
```

---

## 📖 Examples

See the `/examples` directory for complete examples:

- `basic-firewall.ts` - Basic firewall usage
- `grok-agent.ts` - Grok AI agent
- `real-time-blocking.ts` - Real-time blocking demo
- `policy-management.ts` - Policy configuration
- `event-listeners.ts` - Event handling

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🔗 Links

- **Documentation**: https://docs.tenma.ai
- **GitHub**: https://github.com/yourusername/tenma-firewall
- **0G Network**: https://0g.ai
- **Grok API**: https://x.ai/api

---

## 💬 Support

- **Discord**: https://discord.gg/tenma
- **Twitter**: [@TenmaFirewall](https://twitter.com/TenmaFirewall)
- **Email**: support@tenma.ai

---

**Built for 0G Network Hackathon 2025** 🚀
