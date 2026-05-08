# 🚀 Next Steps - Complete Real Agent Integration

## ✅ What's Already Done

1. **Database Schema Created** ✅
   - File: `agent/database/schema.sql`
   - Tables: user_profiles, conversations, execution_logs, pending_approvals, agent_memory, transaction_history
   - RLS policies configured

2. **Database Service Implemented** ✅
   - File: `agent/src/database.ts`
   - Full CRUD operations for all tables

3. **Tool Registry Created** ✅
   - File: `agent/src/tools/registry.ts`
   - 15+ tools with risk levels (low, medium, high)

4. **Real Agent Loop Implemented** ✅
   - File: `agent/src/real-agent.ts`
   - Custom agent loop (not LangGraph)

5. **Real Agent API Server** ✅
   - File: `agent/src/real-agent-api.ts`
   - 9 endpoints ready

6. **Approval UI Component** ✅
   - File: `frontend/src/components/ApprovalModal.tsx`
   - Fully integrated into AITradingChat.tsx

7. **Frontend Integration** ✅
   - ApprovalModal imported and used
   - Real agent toggle added
   - Approval handlers implemented
   - Agent API service updated with real agent methods

---

## ⚠️ What You Need to Do (3 Steps)

### Step 1: Run Database Schema in Supabase (5 minutes)

#### Option A: Using Supabase SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `agent/database/schema.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. You should see: "Success. No rows returned"

#### Option B: Using psql Command Line

```bash
# From the project root
psql "postgresql://postgres:Xyzpokemontree123@db.xcrmndwnaptjnacvvjpm.supabase.co:5432/postgres" < agent/database/schema.sql
```

#### Verify Tables Were Created

Run this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- agent_memory
- conversations
- execution_logs
- pending_approvals
- transaction_history
- user_profiles

---

### Step 2: Get Supabase Anon Key (2 minutes)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **Settings** (gear icon) in the left sidebar
4. Click on **API** under Project Settings
5. Find the **Project API keys** section
6. Copy the `anon` `public` key (NOT the service_role key!)
7. Open `agent/.env` file
8. Replace this line:
   ```env
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
   With:
   ```env
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**Important:** The anon key is safe to use in frontend code. It's protected by Row Level Security (RLS) policies.

---

### Step 3: Test the Real Agent (10 minutes)

#### 3.1 Start the Real Agent API Server

```bash
cd agent
npm install  # If you haven't already
npm run real-agent:dev
```

You should see:
```
🚀 Real Agent API server running on http://localhost:3001
✅ Database connected
✅ Groq AI connected
✅ Tool registry loaded (15 tools)
```

#### 3.2 Test with cURL

**Test 1: Health Check**
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "agent": "real",
  "features": {
    "tools": true,
    "memory": true,
    "approvals": true,
    "database": true
  }
}
```

**Test 2: Chat (Low Risk - Auto Execute)**
```bash
curl -X POST http://localhost:3001/agent/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What is my balance?\", \"address\": \"0x1E0048D83ba01D823dc852cfabeb94fC76B089B7\"}"
```

Expected: Agent uses `get_balance` tool and returns balance immediately.

**Test 3: Chat (High Risk - Requires Approval)**
```bash
curl -X POST http://localhost:3001/agent/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Buy 0.5 A0GI\", \"address\": \"0x1E0048D83ba01D823dc852cfabeb94fC76B089B7\"}"
```

Expected: Agent creates approval request and returns `requiresApproval: true`.

**Test 4: Get Pending Approvals**
```bash
curl http://localhost:3001/agent/approvals/0x1E0048D83ba01D823dc852cfabeb94fC76B089B7
```

Expected: List of pending approvals from Test 3.

**Test 5: Approve Action**
```bash
# Replace APPROVAL_ID with the ID from Test 4
curl -X POST http://localhost:3001/agent/approve/APPROVAL_ID \
  -H "Content-Type: application/json" \
  -d "{\"address\": \"0x1E0048D83ba01D823dc852cfabeb94fC76B089B7\"}"
```

Expected: Action executes and returns transaction result.

#### 3.3 Test with Frontend

1. **Start Frontend** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open Browser**: http://localhost:5173

3. **Connect Wallet**: Click "Connect Wallet" and connect MetaMask

4. **Enable Real Agent Mode**: Click the "🎭 Demo Mode" button to switch to "✅ Real Agent Mode"

5. **Test Low-Risk Command**:
   - Type: "What is my balance?"
   - Agent should execute `get_balance` tool immediately
   - Response shows balance

6. **Test High-Risk Command**:
   - Type: "Buy 0.5 A0GI"
   - Agent creates approval request
   - Click "View Approvals" button
   - Approval modal opens showing pending action
   - Click "Approve" or "Reject"

7. **Check Execution Logs**:
   - All tool executions are logged in database
   - Check `execution_logs` table in Supabase

---

## 🎯 Expected Behavior

### Low-Risk Tools (Auto-Execute)
- `get_balance` - Returns wallet balance immediately
- `get_transaction` - Returns TX details immediately
- `estimate_gas` - Returns gas estimate immediately
- `get_price` - Returns token price immediately
- `get_market_data` - Returns market data immediately
- `check_policy` - Returns firewall validation immediately
- `get_policies` - Returns active policies immediately

### Medium-Risk Tools (Auto-Execute)
- `simulate_transaction` - Simulates TX and returns result immediately

### High-Risk Tools (Requires Approval)
- `execute_swap` - Creates approval request, waits for user approval
- `send_transaction` - Creates approval request, waits for user approval
- `commit_transaction` - Creates approval request, waits for user approval

---

## 🔍 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```

**Solution:**
1. Check `DATABASE_URL` in `agent/.env`
2. Make sure Supabase project is active
3. Test connection:
   ```bash
   psql "postgresql://postgres:Xyzpokemontree123@db.xcrmndwnaptjnacvvjpm.supabase.co:5432/postgres" -c "SELECT 1"
   ```

### Groq API Error
```
Error: 401 Unauthorized
```

**Solution:**
1. Check `GROQ_API_KEY` in `agent/.env`
2. Verify key is valid: https://console.groq.com/keys
3. Check if you have API credits remaining

### Tool Not Found Error
```
Error: Tool not found: execute_swap
```

**Solution:**
1. Check `agent/src/tools/registry.ts`
2. Make sure tool is registered in `TOOLS` array
3. Restart agent API server

### Approval Not Showing in Modal
```
Modal opens but shows "No pending approvals"
```

**Solution:**
1. Check if approval was created in database:
   ```sql
   SELECT * FROM pending_approvals WHERE status = 'pending';
   ```
2. Check if approval expired (5-minute timeout)
3. Check browser console for API errors

### Frontend Not Connecting to Agent API
```
Real agent error: Network Error
```

**Solution:**
1. Make sure agent API is running: `npm run real-agent:dev`
2. Check `VITE_AGENT_API_URL` in `frontend/.env`:
   ```env
   VITE_AGENT_API_URL=http://localhost:3001
   ```
3. Check CORS is enabled in `agent/src/real-agent-api.ts`

---

## 📊 Database Queries for Debugging

### Check User Activity
```sql
SELECT * FROM user_profiles WHERE address = '0x1E0048D83ba01D823dc852cfabeb94fC76B089B7';
```

### Check Conversation History
```sql
SELECT role, content, created_at 
FROM conversations 
WHERE address = '0x1E0048D83ba01D823dc852cfabeb94fC76B089B7'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Execution Logs
```sql
SELECT tool_name, status, risk_level, executed_at
FROM execution_logs
WHERE address = '0x1E0048D83ba01D823dc852cfabeb94fC76B089B7'
ORDER BY executed_at DESC
LIMIT 10;
```

### Check Pending Approvals
```sql
SELECT id, tool_name, risk_level, status, expires_at
FROM pending_approvals
WHERE address = '0x1E0048D83ba01D823dc852cfabeb94fC76B089B7'
AND status = 'pending'
ORDER BY created_at DESC;
```

### Get User Stats
```sql
SELECT get_user_stats('0x1E0048D83ba01D823dc852cfabeb94fC76B089B7');
```

---

## 🚀 Deploy to Production (Optional)

### Deploy Agent API to Railway

1. **Create Railway Account**: https://railway.app
2. **Create New Project**: Click "New Project"
3. **Deploy from GitHub**:
   - Connect your GitHub repo
   - Select `agent` folder as root directory
4. **Add Environment Variables**:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GROQ_API_KEY`
   - `RPC_URL`
   - `CHAIN_ID`
   - `TENMA_FIREWALL_ADDRESS`
   - `SHIELDPOOL_CONTRACT_ADDRESS`
5. **Set Start Command**: `npm run real-agent:start`
6. **Deploy**: Railway will build and deploy automatically
7. **Get URL**: Copy the Railway URL (e.g., `https://tenma-agent.railway.app`)

### Update Frontend to Use Production API

1. Update `frontend/.env`:
   ```env
   VITE_AGENT_API_URL=https://tenma-agent.railway.app
   ```

2. Redeploy frontend to Vercel:
   ```bash
   cd frontend
   vercel --prod
   ```

3. Update environment variables in Vercel dashboard

---

## 📝 Summary

**You need to do:**
1. ✅ Run `agent/database/schema.sql` in Supabase SQL Editor
2. ✅ Get Supabase anon key and add to `agent/.env`
3. ✅ Test with `npm run real-agent:dev` in agent folder

**Everything else is already done:**
- ✅ Database schema created
- ✅ Database service implemented
- ✅ Tool registry with 15+ tools
- ✅ Real agent loop
- ✅ Real agent API server
- ✅ Approval UI component
- ✅ Frontend integration complete

**Estimated time:** 15-20 minutes

**After completion, you'll have:**
- 🤖 Real AI agent with Groq LLM
- 🔧 15+ blockchain tools
- 💾 Persistent memory in Supabase
- ✅ Human-in-the-loop approvals
- 📊 Execution logs and audit trail
- 🛡️ Risk-based security (low/medium/high)

---

## 🎉 What's Next?

After testing the real agent, you can:

1. **Add More Tools** (see `agent/src/tools/registry.ts`)
   - Price alerts
   - Portfolio rebalancing
   - Limit orders
   - Stop loss

2. **Improve Agent Intelligence**
   - Add more context to prompts
   - Implement learning from user feedback
   - Add multi-step planning

3. **Deploy to Production**
   - Deploy agent API to Railway/Vercel
   - Deploy frontend to Vercel (already done)
   - Add authentication
   - Enable rate limiting

4. **Add Analytics Dashboard**
   - User stats page
   - Execution logs viewer
   - Approval history
   - Performance metrics

---

**Need help?** Check the documentation:
- `INTEGRATION-STATUS.md` - Detailed integration status
- `REAL-AGENT-QUICKSTART.md` - Quick start guide
- `agent/README.md` - Agent documentation
- `frontend/README.md` - Frontend documentation

**Ready to start?** Run Step 1 now! 🚀
