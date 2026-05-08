# 🚀 Real Agent Quick Start

## What We Built

A **real AI agent** with:
- ✅ **15+ Tools** (blockchain, trading, firewall)
- ✅ **Memory** (Supabase database)
- ✅ **Approvals** (human-in-the-loop)
- ✅ **Execution Logs** (audit trail)
- ✅ **Risk Management** (low/medium/high)

## Setup (5 minutes)

### 1. Set up Supabase Database

```bash
# Go to https://supabase.com
# Create new project
# Copy connection string

# Run schema
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" < agent/database/schema.sql
```

Or use Supabase SQL Editor:
1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `agent/database/schema.sql`
3. Run the SQL

### 2. Configure Environment

Update `agent/.env`:
```env
# Already configured
DATABASE_URL=postgresql://postgres:Xyzpokemontree123@db.xcrmndwnaptjnacvvjpm.supabase.co:5432/postgres
SUPABASE_URL=https://xcrmndwnaptjnacvvjpm.supabase.co
SUPABASE_ANON_KEY=[GET_FROM_SUPABASE_DASHBOARD]
GROQ_API_KEY=[YOUR_GROQ_API_KEY]
```

Get Supabase Anon Key:
1. Go to Project Settings → API
2. Copy `anon` `public` key

### 3. Install Dependencies

```bash
cd agent
npm install
```

### 4. Start Real Agent API

```bash
npm run real-agent:dev
```

Server starts on: `http://localhost:3001`

## API Endpoints

### Chat with Agent
```bash
POST http://localhost:3001/agent/chat
{
  "message": "What's my balance?",
  "address": "0x..."
}
```

### Get Pending Approvals
```bash
GET http://localhost:3001/agent/approvals/0x...
```

### Approve Action
```bash
POST http://localhost:3001/agent/approve/:approvalId
{
  "address": "0x..."
}
```

### Get Execution Logs
```bash
GET http://localhost:3001/agent/logs/0x...
```

### Get User Stats
```bash
GET http://localhost:3001/agent/stats/0x...
```

## How It Works

### Example: "Buy 0.5 A0GI"

1. **User sends message**
   ```
   "Buy 0.5 A0GI"
   ```

2. **Agent understands intent**
   ```json
   {
     "intent": "Execute token purchase",
     "tools": [
       {
         "name": "get_balance",
         "parameters": { "address": "0x..." }
       },
       {
         "name": "check_policy",
         "parameters": { "to": "...", "value": "0.5" }
       },
       {
         "name": "execute_swap",
         "parameters": { "amount": "0.5" }
       }
     ]
   }
   ```

3. **Agent executes tools**
   - ✅ `get_balance` → Executes immediately (low risk)
   - ✅ `check_policy` → Executes immediately (low risk)
   - ⚠️ `execute_swap` → **Requires approval** (high risk)

4. **Agent creates approval request**
   ```json
   {
     "id": "uuid",
     "tool_name": "execute_swap",
     "parameters": { "amount": "0.5" },
     "risk_level": "high",
     "expires_at": "5 minutes from now"
   }
   ```

5. **Agent responds**
   ```
   "I can buy 0.5 A0GI for you. Your current balance is 10.5 A0GI.
   
   This action requires your approval. Please review and approve."
   ```

6. **User approves**
   ```bash
   POST /agent/approve/:approvalId
   ```

7. **Agent executes**
   - Executes the swap
   - Logs to database
   - Returns transaction hash

8. **Agent confirms**
   ```
   "✅ Bought 0.5 A0GI
   
   Transaction: 0x123...
   New balance: 11.0 A0GI"
   ```

## Available Tools

### Low Risk (Auto-execute)
- `get_balance` - Check wallet balance
- `get_transaction` - Get TX details
- `estimate_gas` - Calculate gas
- `get_price` - Token price
- `get_market_data` - Market stats
- `check_policy` - Firewall check
- `get_policies` - Active policies

### Medium Risk (Auto-execute)
- `simulate_transaction` - Test TX

### High Risk (Requires Approval)
- `execute_swap` - Token swap
- `send_transaction` - Send A0GI
- `commit_transaction` - MEV protection

## Testing

### Test 1: Check Balance
```bash
curl -X POST http://localhost:3001/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is my balance?",
    "address": "0x1E0048D83ba01D823dc852cfabeb94fC76B089B7"
  }'
```

Expected: Agent uses `get_balance` tool and returns balance

### Test 2: Get Price
```bash
curl -X POST http://localhost:3001/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the price of A0GI?",
    "address": "0x1E0048D83ba01D823dc852cfabeb94fC76B089B7"
  }'
```

Expected: Agent uses `get_price` tool and returns price

### Test 3: Request Swap (Approval)
```bash
curl -X POST http://localhost:3001/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Buy 0.5 A0GI",
    "address": "0x1E0048D83ba01D823dc852cfabeb94fC76B089B7"
  }'
```

Expected: Agent creates approval request

### Test 4: Get Approvals
```bash
curl http://localhost:3001/agent/approvals/0x1E0048D83ba01D823dc852cfabeb94fC76B089B7
```

Expected: List of pending approvals

## Next Steps

### 1. Connect Frontend
Update `frontend/src/services/agentApi.ts` to use real agent endpoints

### 2. Add Approval UI
Create approval modal in frontend for high-risk actions

### 3. Add More Tools
- Price alerts
- Portfolio rebalancing
- Limit orders
- Stop loss

### 4. Deploy to Production
- Deploy agent API to Vercel/Railway
- Add authentication
- Enable rate limiting

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```

**Solution:** Check DATABASE_URL in `agent/.env`

### Groq API Error
```
Error: 401 Unauthorized
```

**Solution:** Check GROQ_API_KEY in `agent/.env`

### Tool Not Found
```
Error: Tool not found: execute_swap
```

**Solution:** Tool is registered in `agent/src/tools/registry.ts`

## Architecture

```
User Message
    ↓
Real Agent
    ↓
1. Load Memory (Database)
    ↓
2. Plan Actions (Groq LLM)
    ↓
3. Execute Tools
    ├─→ Low Risk: Execute immediately
    ├─→ Medium Risk: Execute immediately
    └─→ High Risk: Create approval
    ↓
4. Generate Response (Groq LLM)
    ↓
5. Save to Memory (Database)
    ↓
Response to User
```

## Database Tables

- `user_profiles` - User preferences
- `conversations` - Chat history
- `execution_logs` - Tool execution audit
- `pending_approvals` - Actions awaiting approval
- `agent_memory` - Learning & patterns
- `transaction_history` - On-chain transactions

---

**Your real agent is ready!** 🤖

Start it with: `npm run real-agent:dev`
