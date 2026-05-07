# ShieldPool Smart Contracts

MEV-resistant transaction submission using commit-reveal mechanism.

## Overview

The `CommitRevealContract` implements a two-phase commit-reveal pattern:

1. **Commit Phase**: User submits a hash of their transaction without revealing the actual payload
2. **Reveal Phase**: After an execution delay, user reveals and executes the transaction

This prevents MEV bots from front-running transactions since the payload is encrypted until execution time.

## Features

- ✅ Commit-reveal mechanism with configurable execution delay
- ✅ Expiration window to prevent stale commitments
- ✅ Reentrancy protection
- ✅ Pausable for emergency situations
- ✅ Gas optimized with Solidity 0.8.24
- ✅ Comprehensive event logging
- ✅ Full test coverage

## Installation

```bash
npm install
```

## Compile

```bash
npm run compile
```

## Test

```bash
npm run test
```

## Test Coverage

```bash
npm run coverage
```

## Gas Report

```bash
npm run gas-report
```

## Deploy

### Local Network

```bash
# Start local node
npx hardhat node

# Deploy (in another terminal)
npm run deploy:local
```

### Sepolia Testnet

```bash
npm run deploy:sepolia
```

### Mainnet

```bash
npm run deploy:mainnet
```

## Verify Contract

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <EXECUTION_DELAY> <REVEAL_WINDOW>
```

## Configuration

Edit `.env` file (copy from `.env.example`):

```env
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Contract Parameters

- **Execution Delay**: 300 seconds (5 minutes) - Minimum time between commit and reveal
- **Reveal Window**: 86400 seconds (24 hours) - Maximum time to reveal after commit

## Usage Example

```typescript
// 1. Create payload
const payload = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address", "uint256", "bytes"],
  [targetAddress, value, data]
);

// 2. Generate secret
const secret = ethers.randomBytes(32);

// 3. Compute commitment hash
const commitmentHash = ethers.keccak256(
  ethers.concat([payload, secret])
);

// 4. Commit
await contract.commit(commitmentHash);

// 5. Wait for execution delay (5 minutes)
await new Promise(resolve => setTimeout(resolve, 300000));

// 6. Reveal and execute
await contract.reveal(payload, secret);
```

## Security

- ✅ Audited by [Pending]
- ✅ Reentrancy protection via OpenZeppelin
- ✅ Access control for admin functions
- ✅ Pausable for emergency stops
- ✅ Custom errors for gas efficiency

## License

MIT
