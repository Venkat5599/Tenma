# Tenma AI Agent & 0G Storage Integration Guide

## 🎯 Overview

This guide explains how to integrate the Tenma AI agent and 0G Storage into your Tenma Firewall project.

## 📦 What's Been Added

### 1. Agent API Server (`agent/src/api-server.ts`)
- Express REST API for agent operations
- Endpoints for chat, decisions, and storage
- Real-time agent status tracking
- Integration with Tenma AI and 0G Storage

### 2. Tenma AI Service (`agent/src/tenma-service.ts`)
- Wrapper for Tenma AI API
- Automatic fallback to OpenAI if Tenma unavailable
- Chat and decision-making capabilities
- Configurable models and parameters

### 3. Frontend API Client (`frontend/src/services/agentApi.ts`)
- TypeScript client for frontend
- Type-safe API calls
- Error handling and retries
- Availability checking

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
# Install agent dependencies
cd agent
npm install

# Install frontend dependencies (if needed)
cd ../frontend
npm install axios
```

### Step 2: Configure Environment

Create `agent/.env` from the example:

```bash
cd agent
cp .env.example .env
```

Edit `agent/.env` with your credentials:

```env
# Blockchain
RPC_URL=https://evmrpc-testnet.0g.ai
PRIVATE_KEY=your_private_key_here

# Tenma AI (or use OpenAI as fallback)
TENMA_API_KEY=your_tenma_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# 0G Storage
ZEROG_STORAGE_ENDPOINT=https://storage-testnet.0g.ai
ZEROG_API_KEY=your_0g_storage_api_key_here

# Smart Contracts
TENMA_FIREWALL_ADDRESS=0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9
```

### Step 3: Start the Agent API Server

```bash
cd agent
npm run api:start
```

The server will start on `http://localhost:3001`

### Step 4: Configure Frontend

Create `frontend/.env.local`:

```env
VITE_AGENT_API_URL=http://localhost:3001
```

### Step 5: Start Frontend

```bash
cd frontend
npm run dev
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

Returns service status and availability.

### Agent Status
```
GET /agent/status
```

Returns current agent state:
- Balance
- Trades executed/blocked
- Running status
- Last decision

### Start Agent
```
POST /agent/start
```

Starts the autonomous agent.

### Stop Agent
```
POST /agent/stop
```

Stops the agent.

### Chat with Agent
```
POST /agent/chat
Body: {
  "message": "Buy 0.5 A0GI",
  "strategy": "dca",
  "riskProfile": "moderate"
}
```

Chat with the AI agent and get responses.

### Get Trading Decision
```
POST /agent/decision
Body: {
  "strategy": "dca",
  "riskProfile": "moderate"
}
```

Get an autonomous trading decision from the agent.

### Storage Stats
```
GET /storage/stats
```

Get 0G Storage statistics.

### List Storage Items
```
GET /storage/list?prefix=decisions
```

List items stored in 0G Storage.

### Retrieve from Storage
```
GET /storage/retrieve/:key
```

Retrieve specific item from 0G Storage.

## 🔧 Frontend Integration

### Using the Agent API Client

```typescript
import { agentApi } from '@/services/agentApi';

// Check if API is available
const isAvailable = agentApi.getAvailability();

// Get agent status
const status = await agentApi.getStatus();
console.log('Balance:', status.balance);
console.log('Trades:', status.tradesExecuted);

// Chat with agent
const response = await agentApi.chat({
  message: 'Buy 0.5 A0GI',
  strategy: 'dca',
  riskProfile: 'moderate',
});
console.log('Agent response:', response.response);

// Get trading decision
const decision = await agentApi.getDecision({
  strategy: 'arbitrage',
  riskProfile: 'aggressive',
});
console.log('Decision:', decision.decision);

// Get storage stats
const stats = await agentApi.getStorageStats();
console.log('Storage uploads:', stats.totalUploads);
```

### Updating AI Trading Chat Page

Replace the simulated responses in `AITradingChat.tsx`:

```typescript
import { agentApi } from '@/services/agentApi';

const handleSend = async () => {
  if (!input.trim()) return;

  // Add user message
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsTyping(true);

  try {
    // Get real AI response
    const response = await agentApi.chat({
      message: input,
      strategy: selectedAgent.strategy,
      riskProfile: selectedAgent.riskProfile,
    });

    const agentResponse: Message = {
      id: `agent-${Date.now()}`,
      role: 'agent',
      content: response.response,
      timestamp: response.timestamp,
    };

    setMessages(prev => [...prev, agentResponse]);
  } catch (error) {
    console.error('Error getting agent response:', error);
    // Fallback to simulated response
  } finally {
    setIsTyping(false);
  }
};
```

### Updating Live Demo Page

Replace simulated decisions in `LiveDemo.tsx`:

```typescript
import { agentApi } from '@/services/agentApi';

const simulateAgentDecision = async () => {
  try {
    // Get real decision from agent
    const response = await agentApi.getDecision({
      strategy: 'dca',
      riskProfile: 'moderate',
    });

    const decision: AgentDecision = {
      id: `decision-${Date.now()}`,
      timestamp: response.timestamp,
      ...response.decision,
      status: 'pending',
      violations: [],
    };

    // Validate with firewall (using useContracts hook)
    const simulation = await simulateTransaction(
      decision.token,
      decision.amount
    );

    if (!simulation.allowed) {
      decision.status = 'blocked';
      decision.violations = [{
        rule: 'POLICY_VIOLATION',
        message: simulation.reason,
        severity: 'critical',
        blocked: true,
      }];
    } else {
      decision.status = 'approved';
    }

    setDecisions(prev => [decision, ...prev].slice(0, 20));
  } catch (error) {
    console.error('Error getting decision:', error);
    // Fallback to simulated decision
  }
};
```

## 🗄️ 0G Storage Integration

### What Gets Stored

1. **Chat History** (`chat/*`)
   - User messages
   - Agent responses
   - Timestamps

2. **Trading Decisions** (`decisions/*`)
   - Decision details
   - Market data
   - Reasoning

3. **Transaction Logs** (`transactions/*`)
   - Commitment hashes
   - Execution results
   - Violations

4. **Agent Memory** (`memory/*`)
   - Learning data
   - Performance metrics
   - Strategy adjustments

### Accessing Stored Data

```typescript
// List all decisions
const decisions = await agentApi.listStorageItems('decisions');

// Retrieve specific decision
const decision = await agentApi.retrieveFromStorage('decisions/1234567890');

// Get storage statistics
const stats = await agentApi.getStorageStats();
console.log(`Total uploads: ${stats.totalUploads}`);
console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
```

## 🔐 Security Considerations

### API Keys
- Never commit `.env` files
- Use environment variables
- Rotate keys regularly

### Private Keys
- Store securely
- Never expose in frontend
- Use separate keys for testing

### CORS
The API server has CORS enabled for development. For production:

```typescript
// agent/src/api-server.ts
app.use(cors({
  origin: 'https://your-production-domain.com',
  credentials: true,
}));
```

## 🧪 Testing

### Test Agent API

```bash
# Health check
curl http://localhost:3001/health

# Get agent status
curl http://localhost:3001/agent/status

# Chat with agent
curl -X POST http://localhost:3001/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Buy 0.5 A0GI", "strategy": "dca"}'

# Get decision
curl -X POST http://localhost:3001/agent/decision \
  -H "Content-Type: application/json" \
  -d '{"strategy": "arbitrage", "riskProfile": "moderate"}'
```

### Test Storage

```bash
# Get storage stats
curl http://localhost:3001/storage/stats

# List items
curl http://localhost:3001/storage/list?prefix=decisions
```

## 🐛 Troubleshooting

### Agent API Not Starting

**Problem:** Server fails to start

**Solutions:**
1. Check if port 3001 is available
2. Verify environment variables are set
3. Check private key format
4. Ensure dependencies are installed

### Tenma AI Not Available

**Problem:** API returns fallback responses

**Solutions:**
1. Check `TENMA_API_KEY` is set
2. Verify API endpoint is correct
3. Ensure OpenAI key is set as fallback
4. Check network connectivity

### 0G Storage Errors

**Problem:** Storage operations fail

**Solutions:**
1. Verify `ZEROG_STORAGE_ENDPOINT` is correct
2. Check API key is valid
3. Ensure network connectivity
4. Check storage quota

### Frontend Can't Connect

**Problem:** Frontend shows "API not available"

**Solutions:**
1. Ensure agent API server is running
2. Check `VITE_AGENT_API_URL` in frontend `.env.local`
3. Verify CORS is enabled
4. Check browser console for errors

## 📊 Monitoring

### Agent Metrics

Monitor these metrics for agent health:

- **Balance**: Should decrease with trades
- **Trades Executed**: Should increase over time
- **Trades Blocked**: Should be reasonable (not 100%)
- **Block Rate**: Should be < 50% for healthy operation

### Storage Metrics

Monitor these metrics for storage health:

- **Total Uploads**: Should increase steadily
- **Success Rate**: Should be > 95%
- **Average Upload Time**: Should be < 5 seconds
- **Total Size**: Monitor for quota limits

## 🚀 Production Deployment

### Environment Variables

Set these in production:

```env
NODE_ENV=production
AGENT_API_PORT=3001
TENMA_API_KEY=prod_key_here
ZEROG_STORAGE_ENDPOINT=https://storage.0g.ai
RPC_URL=https://rpc.0g.ai
```

### Process Management

Use PM2 for production:

```bash
# Install PM2
npm install -g pm2

# Start agent API
cd agent
pm2 start npm --name "tenma-agent-api" -- run api:start

# Monitor
pm2 monit

# Logs
pm2 logs tenma-agent-api
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📝 Next Steps

1. ✅ **Test the Integration**
   - Start agent API server
   - Test all endpoints
   - Verify storage works

2. ✅ **Update Frontend**
   - Replace simulated responses
   - Add real-time updates
   - Test user flows

3. ✅ **Monitor Performance**
   - Check agent decisions
   - Monitor storage usage
   - Track error rates

4. ✅ **Deploy to Production**
   - Set up production environment
   - Configure monitoring
   - Enable logging

## 🎉 Success!

You now have a fully integrated Tenma AI agent with 0G Storage! The agent can:

- ✅ Make autonomous trading decisions
- ✅ Chat with users in real-time
- ✅ Store all data on 0G Network
- ✅ Validate transactions with firewall
- ✅ Learn from past decisions

## 📚 Additional Resources

- [Tenma AI Documentation](https://docs.tenma.ai)
- [0G Storage Documentation](https://docs.0g.ai/storage)
- [0G Network Documentation](https://docs.0g.ai)
- [ethers.js Documentation](https://docs.ethers.org)

## 💬 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review logs: `pm2 logs tenma-agent-api`
3. Test endpoints with curl
4. Check environment variables

---

**Built with ❤️ for 0G Network**
