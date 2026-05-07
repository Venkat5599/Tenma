# Tenma SDK Documentation

## Installation

```bash
npm install @tenma/firewall-sdk
```

Or use locally:

```bash
cd sdk
npm install
npm run build
```

## Quick Start

```typescript
import { TenmaFirewall } from '@tenma/firewall-sdk';

// Initialize firewall
const firewall = new TenmaFirewall({
  contractAddress: '0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9',
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  privateKey: process.env.PRIVATE_KEY!,
});

await firewall.initialize();

// Set policy
await firewall.setPolicy({
  maxTransactionAmount: '10.0',
  maxDailyAmount: '50.0',
  whitelistedContracts: [],
  maxRiskScore: 50,
});

// Execute transaction
const result = await firewall.executeTransaction({
  to: '0xRecipient...',
  value: '1.0',
  data: '0x',
});

console.log('Transaction:', result.hash);
```

## API Reference

### TenmaFirewall

Main firewall class for policy enforcement and transaction protection.

#### Constructor

```typescript
new TenmaFirewall(config: FirewallConfig)
```

**Parameters**:
- `config.contractAddress`: TenmaFirewall contract address
- `config.rpcUrl`: 0G Network RPC URL
- `config.privateKey`: Private key for signing transactions
- `config.storageConfig` (optional): 0G Storage configuration

#### Methods

##### `initialize()`

Initialize the firewall connection.

```typescript
await firewall.initialize();
```

##### `setPolicy(policy: Policy)`

Set security policies.

```typescript
await firewall.setPolicy({
  maxTransactionAmount: '10.0',      // Max per transaction (ETH)
  maxDailyAmount: '50.0',            // Max per day (ETH)
  whitelistedContracts: [            // Allowed contracts
    '0xUniswapRouter...',
  ],
  blacklistedContracts: [            // Blocked contracts
    '0xMalicious...',
  ],
  maxRiskScore: 50,                  // Max risk score (0-100)
  maxGasPrice: '100',                // Max gas price (Gwei)
  timeRestrictions: {
    enabled: true,
    startHour: 9,                    // 9 AM
    endHour: 17,                     // 5 PM
  },
  requireApproval: false,            // Manual approval required
});
``` 

##### `executeTransaction(tx: Transaction)`

Execute a protected transaction.

```typescript
const result = await firewall.executeTransaction({
  to: '0xRecipient...',
  value: '1.0',
  data: '0x',
});
```

**Returns**: Transaction receipt

##### `simulateTransaction(tx: Transaction)`

Simulate transaction to check if it would pass policies.

```typescript
const { allowed, reason } = await firewall.simulateTransaction({
  to: '0xRecipient...',
  value: '100.0',
  data: '0x',
});

if (!allowed) {
  console.log('Would be blocked:', reason);
}
```

##### `getPolicy()`

Get current policy configuration.

```typescript
const policy = await firewall.getPolicy();
console.log('Max transaction:', policy.maxTransactionAmount);
```

##### `on(event: EventType, callback: Function)`

Listen to firewall events.

```typescript
firewall.on(EventType.TRANSACTION_BLOCKED, (data) => {
  console.log('Blocked:', data.violations);
});

firewall.on(EventType.TRANSACTION_EXECUTED, (data) => {
  console.log('Executed:', data.hash);
});
```

**Events**:
- `TRANSACTION_BLOCKED`: Transaction blocked by policy
- `TRANSACTION_EXECUTED`: Transaction executed successfully
- `POLICY_UPDATED`: Policy configuration changed
- `COMMITMENT_CREATED`: Commit-reveal commitment created
- `TRANSACTION_REVEALED`: Commit-reveal transaction revealed

### GrokAgent

AI-powered autonomous agent with Grok API integration.

#### Constructor

```typescript
new GrokAgent(config: AgentConfig, firewall: TenmaFirewall)
```

**Parameters**:
- `config.apiKey`: Grok API key
- `config.model`: Grok model (default: 'grok-beta')
- `config.name`: Agent name
- `config.strategies`: Trading strategies
- `config.riskProfile`: Risk profile ('conservative' | 'moderate' | 'aggressive')
- `config.maxPositionSize`: Max position size (ETH)
- `config.maxDailyTrades`: Max trades per day
- `firewall`: TenmaFirewall instance

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

##### `getStatistics()`

Get agent statistics.

```typescript
const stats = agent.getStatistics();
console.log('Decisions:', stats.totalDecisions);
console.log('Blocked:', stats.blockedTransactions);
```

### PolicyManager

Policy configuration and validation.

#### Methods

##### `validatePolicy(policy: Policy)`

Validate policy configuration.

```typescript
const { valid, errors } = PolicyManager.validatePolicy(policy);
if (!valid) {
  console.error('Invalid policy:', errors);
}
```

##### `createDefaultPolicy()`

Create default policy configuration.

```typescript
const policy = PolicyManager.createDefaultPolicy();
```

### TransactionGuard

Transaction validation and risk assessment.

#### Methods

##### `validateTransaction(tx: Transaction, policy: Policy)`

Validate transaction against policy.

```typescript
const { allowed, violations } = TransactionGuard.validateTransaction(tx, policy);
if (!allowed) {
  console.log('Violations:', violations);
}
```

##### `calculateRiskScore(tx: Transaction)`

Calculate transaction risk score.

```typescript
const riskScore = TransactionGuard.calculateRiskScore(tx);
console.log('Risk score:', riskScore);
```

### StorageClient

0G Storage integration for encrypted payloads.

#### Methods

##### `upload(data: string)`

Upload encrypted data to 0G Storage.

```typescript
const cid = await storageClient.upload(encryptedData);
```

##### `download(cid: string)`

Download data from 0G Storage.

```typescript
const data = await storageClient.download(cid);
```

### Utils

Utility functions for encryption and helpers.

#### Functions

##### `encrypt(data: string, secret: string)`

Encrypt data with AES-256-GCM.

```typescript
const encrypted = encrypt(data, secret);
```

##### `decrypt(encrypted: string, secret: string)`

Decrypt data.

```typescript
const decrypted = decrypt(encrypted, secret);
```

##### `generateSecret()`

Generate random secret.

```typescript
const secret = generateSecret();
```

##### `formatAmount(amount: string)`

Format amount for display.

```typescript
const formatted = formatAmount('1.5'); // "1.5 ETH"
```

## Examples

### Basic Firewall

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

### Grok AI Agent

```typescript
import { GrokAgent, TenmaFirewall } from '@tenma/firewall-sdk';

const firewall = new TenmaFirewall(config);
await firewall.initialize();

const agent = new GrokAgent({
  apiKey: process.env.GROK_API_KEY!,
  name: 'TenmaBot',
  strategies: ['dca', 'arbitrage'],
  riskProfile: 'moderate',
  maxPositionSize: '1.0',
  maxDailyTrades: 10,
}, firewall);

await agent.start();
```

### Real-Time Blocking

```typescript
import { TenmaFirewall, EventType } from '@tenma/firewall-sdk';

const firewall = new TenmaFirewall(config);
await firewall.initialize();

firewall.on(EventType.TRANSACTION_BLOCKED, (data) => {
  console.log('🚫 BLOCKED:', data.violations);
});

// Try to send 100 ETH (exceeds limit)
await firewall.executeTransaction({
  to: '0xRecipient...',
  value: '100.0',
  data: '0x',
});
// Output: 🚫 BLOCKED: ["Amount exceeds limit"]
```

## TypeScript Support

Full TypeScript support with type definitions.

```typescript
import {
  TenmaFirewall,
  GrokAgent,
  Policy,
  Transaction,
  EventType,
  FirewallConfig,
  AgentConfig,
} from '@tenma/firewall-sdk';
```

## Error Handling

```typescript
try {
  await firewall.executeTransaction(tx);
} catch (error) {
  if (error.code === 'POLICY_VIOLATION') {
    console.error('Policy violation:', error.violations);
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('Insufficient funds');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Environment Variables

Create `.env` file:

```
PRIVATE_KEY=0x...
GROK_API_KEY=xai-...
ZEROG_RPC_URL=https://evmrpc-testnet.0g.ai
```

## Testing

```bash
cd sdk
npm test
```

## Building

```bash
cd sdk
npm run build
```

## License

MIT
