# 🏗️ Tenma Real Agent Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                             │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  AI Trading      │  │  Approval        │  │  Execution       │  │
│  │  Chat            │  │  Modal           │  │  Logs            │  │
│  │  Component       │  │  Component       │  │  (Future)        │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                      │                      │             │
│           └──────────────────────┴──────────────────────┘             │
│                                  │                                    │
└──────────────────────────────────┼────────────────────────────────────┘
                                   │
                                   │ HTTP/REST
                                   │
┌──────────────────────────────────▼────────────────────────────────────┐
│                        REAL AGENT API SERVER                          │
│                      (Express.js on Port 3001)                        │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  API Endpoints                                              │    │
│  │  • POST /agent/chat          - Chat with agent             │    │
│  │  • GET  /agent/approvals/:id - Get pending approvals       │    │
│  │  • POST /agent/approve/:id   - Approve action              │    │
│  │  • POST /agent/reject/:id    - Reject action               │    │
│  │  • GET  /agent/logs/:id      - Get execution logs          │    │
│  │  • GET  /agent/stats/:id     - Get user stats              │    │
│  │  • GET  /health              - Health check                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                  │                                    │
└──────────────────────────────────┼────────────────────────────────────┘
                                   │
                                   │
┌──────────────────────────────────▼────────────────────────────────────┐
│                           REAL AGENT CORE                             │
│                      (agent/src/real-agent.ts)                        │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Agent Loop                                                   │  │
│  │                                                               │  │
│  │  1. Load Context                                             │  │
│  │     ├─ Get conversation history from database                │  │
│  │     ├─ Get user preferences                                  │  │
│  │     └─ Get agent memory                                      │  │
│  │                                                               │  │
│  │  2. Understand Intent (Groq LLM)                             │  │
│  │     ├─ Analyze user message                                  │  │
│  │     ├─ Determine required tools                              │  │
│  │     └─ Plan execution strategy                               │  │
│  │                                                               │  │
│  │  3. Execute Tools                                            │  │
│  │     ├─ Low Risk → Execute immediately                        │  │
│  │     ├─ Medium Risk → Execute immediately                     │  │
│  │     └─ High Risk → Create approval request                   │  │
│  │                                                               │  │
│  │  4. Generate Response (Groq LLM)                             │  │
│  │     ├─ Summarize tool results                                │  │
│  │     ├─ Provide insights                                      │  │
│  │     └─ Suggest next actions                                  │  │
│  │                                                               │  │
│  │  5. Save to Memory                                           │  │
│  │     ├─ Save conversation                                     │  │
│  │     ├─ Log tool executions                                   │  │
│  │     └─ Update agent memory                                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                    │                    │                    │
                    │                    │                    │
        ┌───────────▼──────────┐  ┌─────▼──────┐  ┌─────────▼─────────┐
        │   Tool Registry      │  │  Database  │  │   Groq AI         │
        │   (15+ Tools)        │  │  Service   │  │   (LLM)           │
        └───────────┬──────────┘  └─────┬──────┘  └─────────┬─────────┘
                    │                    │                    │
                    │                    │                    │
┌───────────────────▼────────────────────▼────────────────────▼─────────┐
│                         EXTERNAL SERVICES                             │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  0G Network  │  │  Supabase    │  │  Groq API    │              │
│  │  (RPC)       │  │  (PostgreSQL)│  │  (LLM)       │              │
│  │              │  │              │  │              │              │
│  │  • Balance   │  │  • Users     │  │  • Llama 3.3 │              │
│  │  • TX Status │  │  • Convos    │  │  • 70B       │              │
│  │  • Gas Est.  │  │  • Logs      │  │  • Fast      │              │
│  │  • Firewall  │  │  • Approvals │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Low-Risk Command Flow (e.g., "What is my balance?")

```
User Types Message
       │
       ▼
Frontend (AITradingChat)
       │
       ▼
POST /agent/chat
       │
       ▼
Real Agent Core
       │
       ├─ Load Context (from Supabase)
       │
       ├─ Understand Intent (Groq LLM)
       │  └─ "User wants to check balance"
       │  └─ "Use get_balance tool"
       │
       ├─ Execute Tool
       │  └─ get_balance (Low Risk)
       │  └─ Execute immediately ✅
       │  └─ Call 0G RPC
       │  └─ Get balance: 10.5 A0GI
       │
       ├─ Generate Response (Groq LLM)
       │  └─ "Your balance is 10.5 A0GI"
       │
       └─ Save to Memory (Supabase)
          └─ Save conversation
          └─ Log execution
       │
       ▼
Response to User
"Your balance is 10.5 A0GI"
```

**Time:** ~500ms (Groq is fast!)

---

### 2. High-Risk Command Flow (e.g., "Buy 0.5 A0GI")

```
User Types Message
       │
       ▼
Frontend (AITradingChat)
       │
       ▼
POST /agent/chat
       │
       ▼
Real Agent Core
       │
       ├─ Load Context (from Supabase)
       │
       ├─ Understand Intent (Groq LLM)
       │  └─ "User wants to buy A0GI"
       │  └─ "Use execute_swap tool"
       │
       ├─ Check Tool Risk Level
       │  └─ execute_swap = HIGH RISK ⚠️
       │
       ├─ Create Approval Request
       │  └─ Save to pending_approvals table
       │  └─ Set expires_at = now + 5 minutes
       │  └─ Return approval_id
       │
       └─ Generate Response (Groq LLM)
          └─ "I can buy 0.5 A0GI for you."
          └─ "This requires your approval."
       │
       ▼
Response to User
{
  "message": "I can buy 0.5 A0GI...",
  "requiresApproval": true,
  "approvalId": "uuid-123"
}
       │
       ▼
Frontend Shows Approval Modal
       │
       ├─ User clicks "Approve"
       │  │
       │  ▼
       │  POST /agent/approve/:id
       │  │
       │  ▼
       │  Real Agent Core
       │  │
       │  ├─ Get approval from database
       │  ├─ Execute tool (execute_swap)
       │  ├─ Call 0G Network
       │  ├─ Get transaction hash
       │  ├─ Update approval status = 'approved'
       │  └─ Log execution
       │  │
       │  ▼
       │  Response: { success: true, txHash: "0x..." }
       │
       └─ User clicks "Reject"
          │
          ▼
          POST /agent/reject/:id
          │
          ▼
          Update approval status = 'rejected'
```

**Time:** 
- Initial response: ~500ms
- Approval execution: ~2-5s (blockchain TX)

---

## Tool Risk Levels

### 🟢 Low Risk (Auto-Execute)
- **get_balance** - Read-only, no state change
- **get_transaction** - Read-only
- **estimate_gas** - Read-only
- **get_price** - Read-only
- **get_market_data** - Read-only
- **check_policy** - Read-only
- **get_policies** - Read-only

### 🟡 Medium Risk (Auto-Execute)
- **simulate_transaction** - Simulation only, no real TX

### 🔴 High Risk (Requires Approval)
- **execute_swap** - Real blockchain transaction
- **send_transaction** - Real blockchain transaction
- **commit_transaction** - Real blockchain transaction

---

## Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE POSTGRESQL                     │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  user_profiles   │  │  conversations   │                │
│  ├──────────────────┤  ├──────────────────┤                │
│  │ address (PK)     │  │ id (PK)          │                │
│  │ strategy         │  │ address          │                │
│  │ risk_profile     │  │ role             │                │
│  │ preferences      │  │ content          │                │
│  │ created_at       │  │ created_at       │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  execution_logs  │  │ pending_approvals│                │
│  ├──────────────────┤  ├──────────────────┤                │
│  │ id (PK)          │  │ id (PK)          │                │
│  │ address          │  │ address          │                │
│  │ tool_name        │  │ tool_name        │                │
│  │ parameters       │  │ parameters       │                │
│  │ result           │  │ risk_level       │                │
│  │ status           │  │ status           │                │
│  │ risk_level       │  │ expires_at       │                │
│  │ executed_at      │  │ created_at       │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  agent_memory    │  │ transaction_hist │                │
│  ├──────────────────┤  ├──────────────────┤                │
│  │ id (PK)          │  │ id (PK)          │                │
│  │ address          │  │ address          │                │
│  │ memory_type      │  │ tx_hash          │                │
│  │ key              │  │ chain_id         │                │
│  │ value            │  │ action_type      │                │
│  │ confidence       │  │ amount           │                │
│  │ created_at       │  │ status           │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Security Model

### Row Level Security (RLS)

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON conversations
  FOR SELECT USING (address = current_setting('app.current_user_address'));

-- Same for all tables:
-- ✅ user_profiles
-- ✅ conversations
-- ✅ execution_logs
-- ✅ pending_approvals
-- ✅ agent_memory
-- ✅ transaction_history
```

### Risk-Based Execution

```typescript
if (tool.riskLevel === 'low' || tool.riskLevel === 'medium') {
  // Execute immediately
  const result = await tool.execute(parameters);
  return result;
} else if (tool.riskLevel === 'high') {
  // Create approval request
  const approvalId = await db.createApproval({
    tool_name: tool.name,
    parameters,
    risk_level: 'high',
    expires_at: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    requiresApproval: true,
    approvalId,
  };
}
```

---

## Performance

### Response Times

| Operation | Time | Notes |
|-----------|------|-------|
| Health Check | ~10ms | Simple JSON response |
| Low-Risk Tool | ~500ms | Groq LLM + RPC call |
| High-Risk Tool | ~500ms | Creates approval (no execution) |
| Approval Execution | ~2-5s | Blockchain transaction |
| Database Query | ~50ms | Supabase is fast |

### Groq AI Performance

- **Model:** Llama 3.3 70B Versatile
- **Speed:** 200-500ms per request
- **Tokens:** ~1000 tokens per response
- **Cost:** Free tier (100 requests/day)

---

## Deployment Architecture

### Current (Development)

```
Frontend (localhost:5173)
    ↓
Agent API (localhost:3001)
    ↓
Supabase (cloud)
Groq API (cloud)
0G Network (testnet)
```

### Production (Recommended)

```
Frontend (Vercel)
    ↓
Agent API (Railway/Vercel)
    ↓
Supabase (cloud)
Groq API (cloud)
0G Network (testnet/mainnet)
```

---

## Key Features

✅ **Real AI Agent** - Not a chatbot, actual tool execution
✅ **15+ Tools** - Blockchain, trading, firewall
✅ **Persistent Memory** - Supabase PostgreSQL
✅ **Human-in-the-Loop** - Approval system for high-risk actions
✅ **Audit Trail** - All executions logged
✅ **Risk Management** - Low/medium/high risk levels
✅ **Fast Responses** - Groq AI (200-500ms)
✅ **Secure** - Row Level Security (RLS)
✅ **Scalable** - Serverless architecture

---

## Next Steps

1. **Run database schema** in Supabase
2. **Add SUPABASE_ANON_KEY** to agent/.env
3. **Test with** `npm run real-agent:dev`
4. **Deploy to production** (optional)

See `NEXT-STEPS.md` for detailed instructions.
