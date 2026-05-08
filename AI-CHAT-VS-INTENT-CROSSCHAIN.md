# AI Chat vs Intent Cross-Chain Architecture

## Overview
The Tenma platform has two distinct agent interfaces, each designed for specific use cases:

### 1. AI Trading Chat (Simple Operations)
**Purpose**: Handle simple, direct blockchain operations with real agent execution

**Available Operations**:
- ✅ **Buy Tokens** - Purchase tokens (e.g., "Buy 0.5 A0GI") - **REAL TRANSACTIONS**
- ✅ **Send Transactions** - Transfer tokens to addresses - **REAL TRANSACTIONS**
- ✅ **Check Balance** - View wallet balances
- ✅ **Get Prices** - Query token prices
- ✅ **Get Transaction Details** - View transaction status
- ✅ **Check Policies** - View firewall policies

**Tools Used**:
- `get_balance` (low risk)
- `get_price` (low risk)
- `get_transaction` (low risk)
- `get_policies` (low risk)
- `buy_token` (high risk - requires approval) - **EXECUTES REAL TRANSACTIONS**
- `send_transaction` (high risk - requires approval) - **EXECUTES REAL TRANSACTIONS**

**Architecture**:
- Real agent API running on port 3001
- Groq AI (Llama 3.3 70B) for intent understanding
- Database-backed conversation history
- Approval system for high-risk operations
- **Real transaction execution on 0G Newton Testnet via wallet**
- **MEV protection with commit-reveal pattern**
- **Firewall validation before execution**

**Transaction Flow**:
1. User requests action (e.g., "Buy 0.5 A0GI")
2. Agent analyzes intent and creates approval request
3. User approves action
4. Frontend commits transaction (MEV protection)
5. Wait 30 seconds (MEV protection window)
6. Frontend reveals and executes transaction
7. Real transaction hash returned with explorer link

**Example Queries**:
- "What is my balance?"
- "Buy 0.5 A0GI" → **REAL TRANSACTION**
- "Send 1 A0GI to 0x..." → **REAL TRANSACTION**
- "What's the current price?"

---

### 2. Intent Cross-Chain (Complex Swaps & Bridges)
**Purpose**: Handle cross-chain swaps and token exchanges using natural language

**Available Operations**:
- ✅ **Token Swaps** - Exchange one token for another (e.g., "Swap 0.01 A0GI to ETH") - **REAL TRANSACTIONS**
- ✅ **Cross-Chain Bridges** - Move tokens between chains - **REAL TRANSACTIONS**
- ✅ **Multi-Chain Routing** - Find best routes across chains
- ✅ **MEV Protection** - Commit-reveal pattern for swaps
- ✅ **x402 Protocol** - Cross-chain messaging

**Supported Chains**:
- 0G Network (A0GI)
- Ethereum (ETH)
- Polygon (MATIC)
- Arbitrum (ARB)

**Architecture**:
- Natural language intent parsing
- **Real swap execution via wallet**
- x402 cross-chain protocol integration
- 0G Storage for intent tracking
- **MEV protection via commit-reveal**
- **Real explorer links for verification**

**Transaction Flow**:
1. User submits intent (e.g., "Swap 0.01 A0GI to ETH")
2. Agent parses intent and finds best route
3. Frontend commits transaction to bridge contract
4. Wait 30 seconds (MEV protection)
5. Frontend reveals and executes swap
6. Real transaction hash with explorer link

**Example Queries**:
- "Swap 0.01 A0GI to ETH" → **REAL TRANSACTION**
- "Bridge 0.01 A0GI to Ethereum" → **REAL TRANSACTION**
- "Send 0.01 A0GI to Polygon" → **REAL TRANSACTION**

---

## Key Differences

| Feature | AI Trading Chat | Intent Cross-Chain |
|---------|----------------|-------------------|
| **Purpose** | Simple operations | Complex swaps/bridges |
| **Execution** | **Real transactions** | **Real transactions** |
| **Operations** | Buy, send, balance | Swap, bridge |
| **Risk Level** | Low-High (with approval) | High (requires wallet) |
| **Chains** | 0G Network only | Multi-chain |
| **Agent** | Groq AI + Tool Registry | Intent Parser |
| **Database** | Yes (Supabase) | No (direct execution) |
| **Approval** | Yes (for high-risk) | No (direct execution) |
| **MEV Protection** | ✅ Commit-Reveal | ✅ Commit-Reveal |

---

## When to Use Which?

### Use AI Trading Chat when:
- You want to **buy tokens** (simple purchase) → **REAL TRANSACTION**
- You want to **send tokens** to an address → **REAL TRANSACTION**
- You want to **check your balance**
- You want to **query prices**
- You need **conversation history**
- You want **approval system** for high-risk actions

### Use Intent Cross-Chain when:
- You want to **swap tokens** (exchange X for Y) → **REAL TRANSACTION**
- You want to **bridge tokens** between chains → **REAL TRANSACTION**
- You need **cross-chain operations**
- You want to see **multi-chain routing**
- You're testing **x402 protocol**
- You want **MEV protection** for swaps

---

## Important Notes

### Buying vs Swapping
- **Buy** = Purchase tokens with fiat/native currency → Use AI Chat → **REAL TRANSACTION**
- **Swap** = Exchange one token for another → Use Intent Cross-Chain → **REAL TRANSACTION**

### Real Transactions
- **Both AI Chat and Intent Cross-Chain execute REAL transactions on 0G Newton Testnet**
- All transactions use commit-reveal pattern for MEV protection
- All transactions are validated by Tenma Firewall
- Real transaction hashes are returned with explorer links
- Transactions can be viewed on: `https://0g.exploreme.pro/tx/{txHash}`

### MEV Protection Flow
1. **Commit Phase**: Transaction details are hashed and committed on-chain
2. **Wait Period**: 30 seconds to prevent front-running
3. **Reveal Phase**: Transaction is revealed and executed
4. **Confirmation**: Real transaction hash returned

### Explorer Links
- All transactions use: `https://0g.exploreme.pro/tx/{txHash}`
- Transaction hashes are real (from 0G Newton Testnet)
- Links show actual on-chain transactions

---

## Architecture Flow

### AI Trading Chat Flow (Real Transactions):
```
User Message
    ↓
Real Agent (Groq AI)
    ↓
Intent Understanding
    ↓
Tool Selection (Tool Registry)
    ↓
Risk Assessment
    ↓
[High Risk] → Approval Required → User Approves → Execute via Wallet
    ↓
Commit Transaction (MEV Protection)
    ↓
Wait 30 seconds
    ↓
Reveal Transaction
    ↓
Real Transaction Hash
    ↓
Database Logging
    ↓
Response to User with Explorer Link
```

### Intent Cross-Chain Flow (Real Transactions):
```
User Message
    ↓
Intent Parser
    ↓
Extract: fromChain, toChain, fromToken, toToken, amount
    ↓
Find Best Route (x402)
    ↓
Commit Transaction to Bridge (MEV Protection)
    ↓
Wait 30 seconds
    ↓
Reveal Transaction
    ↓
Real Transaction Hash
    ↓
Store Intent (0G Storage)
    ↓
Show Success + Real Explorer Link
```

---

## Security Features

### Both Interfaces Include:
- ✅ **MEV Protection**: Commit-reveal pattern prevents front-running
- ✅ **Firewall Validation**: All transactions validated before execution
- ✅ **Wallet Control**: User maintains full control via MetaMask
- ✅ **Transaction Transparency**: Real explorer links for verification
- ✅ **Error Handling**: Safe failure with no fund loss
- ✅ **Network Validation**: Ensures correct network (0G Newton Testnet)

---

## Technical Details

### AI Chat Backend:
- **Location**: `agent/src/`
- **Main Files**:
  - `real-agent.ts` - Agent logic
  - `tools/registry.ts` - Tool definitions (returns transaction params)
  - `database.ts` - Database operations
  - `real-agent-api.ts` - API server

### AI Chat Frontend:
- **Location**: `frontend/src/pages/AITradingChat.tsx`
- **Key Functions**:
  - `handleApprove()` - Executes real wallet transactions
  - Uses `commitTransaction()` and `revealTransaction()` from `useContracts` hook

### Intent Cross-Chain Frontend:
- **Location**: `frontend/src/pages/IntentCrossChain.tsx`
- **Key Functions**:
  - `parseIntent()` - Extract swap details
  - `executeSwap()` - Execute real swap via wallet
  - Uses `commitTransaction()` and `revealTransaction()` from `useContracts` hook

### Wallet Integration:
- **Location**: `frontend/src/hooks/useContracts.ts`
- **Key Functions**:
  - `commitTransaction()` - Commit transaction with MEV protection
  - `revealTransaction()` - Reveal and execute transaction
  - `simulateTransaction()` - Validate with firewall before execution

---

## Summary

**AI Trading Chat** = Real agent with tools for simple operations (buy, send, balance) → **REAL TRANSACTIONS**
**Intent Cross-Chain** = Natural language swaps and bridges → **REAL TRANSACTIONS**

Both execute **real blockchain transactions** on 0G Newton Testnet with full MEV protection and firewall validation! 🚀

**Key Point**: All transactions are REAL - not simulated. Users need real A0GI tokens in their wallet to execute transactions.
