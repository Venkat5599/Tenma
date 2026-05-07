# Tenma AI Agent & 0G Storage Integration Plan

## Overview
Integrate real Tenma AI agent and 0G Storage into the frontend to make the demo fully functional.

## Phase 1: Tenma AI Agent Integration ✅

### 1.1 Backend API Service
Create a backend service that:
- Connects to Tenma AI API (placeholder for now, will use OpenAI as fallback)
- Handles agent decision making
- Integrates with smart contracts
- Manages agent state and memory

**Files to create:**
- `agent/src/api-server.ts` - Express API server
- `agent/src/tenma-service.ts` - Tenma AI service wrapper
- `frontend/src/services/agentApi.ts` - Frontend API client

### 1.2 Frontend Integration
Update frontend pages to use real AI agent:
- `AITradingChat.tsx` - Connect to real agent API
- `LiveDemo.tsx` - Stream real agent decisions
- Add WebSocket support for real-time updates

## Phase 2: 0G Storage Integration ✅

### 2.1 Storage Service
Create storage service for:
- Transaction payloads (encrypted)
- Agent memory and decision history
- Policy configurations backup
- Analytics data

**Files to create:**
- `storage/src/api-server.ts` - Storage API server
- `storage/src/encryption.ts` - Encryption utilities
- `frontend/src/services/storageApi.ts` - Frontend storage client

### 2.2 Frontend Integration
Update pages to use 0G Storage:
- Store transaction history
- Backup policy configurations
- Store agent memory
- Analytics data persistence

## Phase 3: Full Integration Testing

### 3.1 End-to-End Flow
1. User connects wallet
2. AI agent makes decision
3. Decision stored in 0G Storage
4. Transaction validated by firewall
5. If approved: commit → store payload → reveal
6. If blocked: log to storage

### 3.2 Demo Scenarios
- Normal trade (approved)
- Exceeds limit (blocked)
- Blacklisted address (blocked)
- Daily limit exceeded (blocked)

## Implementation Steps

### Step 1: Create Agent API Server
```bash
cd agent
npm install express cors dotenv
```

### Step 2: Create Storage API Server
```bash
cd storage
npm install express cors dotenv
```

### Step 3: Update Frontend
```bash
cd frontend
npm install socket.io-client
```

### Step 4: Environment Variables
```env
# Agent
TENMA_API_KEY=your_key_here
TENMA_API_URL=https://api.tenma.ai/v1
OPENAI_API_KEY=fallback_key

# Storage
ZEROG_STORAGE_ENDPOINT=https://storage-testnet.0g.ai
ZEROG_API_KEY=your_key_here

# Contracts
PRIVATE_KEY=your_private_key
RPC_URL=https://evmrpc-testnet.0g.ai
```

## Timeline
- Phase 1: 2-3 hours
- Phase 2: 2-3 hours  
- Phase 3: 1-2 hours
- **Total: 5-8 hours**

## Success Criteria
✅ AI agent makes real decisions
✅ Decisions stored in 0G Storage
✅ Firewall validates in real-time
✅ Frontend shows live updates
✅ All data persisted on 0G Network
