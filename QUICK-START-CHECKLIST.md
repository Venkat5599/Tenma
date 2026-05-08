# ✅ Quick Start Checklist

## 🎯 Goal
Get the real AI agent working with tools, memory, and approvals in 15 minutes.

---

## ☑️ Step 1: Database Setup (5 min)

### 1.1 Run Schema in Supabase
- [ ] Go to https://supabase.com/dashboard
- [ ] Select your project
- [ ] Click **SQL Editor** → **New Query**
- [ ] Copy all content from `agent/database/schema.sql`
- [ ] Paste and click **Run**
- [ ] Verify: "Success. No rows returned"

### 1.2 Verify Tables Created
Run this query:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

Expected tables:
- [ ] agent_memory
- [ ] conversations
- [ ] execution_logs
- [ ] pending_approvals
- [ ] transaction_history
- [ ] user_profiles

---

## ☑️ Step 2: Get Supabase Key (2 min)

- [ ] Go to **Settings** → **API** in Supabase dashboard
- [ ] Copy the `anon` `public` key (NOT service_role!)
- [ ] Open `agent/.env`
- [ ] Replace `SUPABASE_ANON_KEY=your_supabase_anon_key_here`
- [ ] With your actual key: `SUPABASE_ANON_KEY=eyJhbGci...`
- [ ] Save file

---

## ☑️ Step 3: Test Agent API (5 min)

### 3.1 Start Server
```bash
cd agent
npm install
npm run real-agent:dev
```

Expected output:
- [ ] ✅ Real Agent API server running on http://localhost:3001
- [ ] ✅ Database connected
- [ ] ✅ Groq AI connected

### 3.2 Test Health Check
```bash
curl http://localhost:3001/health
```

Expected:
- [ ] `"status": "ok"`
- [ ] `"agent": "real"`
- [ ] `"features": { "tools": true, "memory": true, "approvals": true }`

### 3.3 Test Chat (Low Risk)
```bash
curl -X POST http://localhost:3001/agent/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What is my balance?\", \"address\": \"0x1E0048D83ba01D823dc852cfabeb94fC76B089B7\"}"
```

Expected:
- [ ] Response contains balance information
- [ ] `toolsExecuted` includes `get_balance`
- [ ] No approval required

### 3.4 Test Chat (High Risk)
```bash
curl -X POST http://localhost:3001/agent/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Buy 0.5 A0GI\", \"address\": \"0x1E0048D83ba01D823dc852cfabeb94fC76B089B7\"}"
```

Expected:
- [ ] `requiresApproval: true`
- [ ] `approvalId` is present
- [ ] Message says "requires your approval"

### 3.5 Check Approvals
```bash
curl http://localhost:3001/agent/approvals/0x1E0048D83ba01D823dc852cfabeb94fC76B089B7
```

Expected:
- [ ] List contains pending approval from previous test
- [ ] `status: "pending"`
- [ ] `risk_level: "high"`

---

## ☑️ Step 4: Test Frontend (3 min)

### 4.1 Start Frontend
```bash
cd frontend
npm run dev
```

- [ ] Open http://localhost:5173
- [ ] Page loads without errors

### 4.2 Connect Wallet
- [ ] Click "Connect Wallet"
- [ ] Connect MetaMask
- [ ] Wallet address shows in header

### 4.3 Enable Real Agent
- [ ] Click "🎭 Demo Mode" button
- [ ] Button changes to "✅ Real Agent Mode"
- [ ] "View Approvals" button appears

### 4.4 Test Low-Risk Command
- [ ] Type: "What is my balance?"
- [ ] Press Enter
- [ ] Agent responds with balance
- [ ] No approval modal appears

### 4.5 Test High-Risk Command
- [ ] Type: "Buy 0.5 A0GI"
- [ ] Press Enter
- [ ] Agent says "requires your approval"
- [ ] Click "View Approvals" button
- [ ] Approval modal opens
- [ ] Pending action is shown with details

### 4.6 Test Approval Flow
- [ ] Click "Approve" or "Reject" in modal
- [ ] Action executes or is rejected
- [ ] Success/rejection message appears in chat
- [ ] Modal closes

---

## ☑️ Step 5: Verify in Database (2 min)

### 5.1 Check Conversations
Go to Supabase → SQL Editor:
```sql
SELECT * FROM conversations 
WHERE address = '0x1E0048D83ba01D823dc852cfabeb94fC76B089B7'
ORDER BY created_at DESC LIMIT 5;
```

Expected:
- [ ] Your chat messages are saved
- [ ] Both user and assistant messages present

### 5.2 Check Execution Logs
```sql
SELECT tool_name, status, risk_level, executed_at
FROM execution_logs
WHERE address = '0x1E0048D83ba01D823dc852cfabeb94fC76B089B7'
ORDER BY executed_at DESC LIMIT 5;
```

Expected:
- [ ] Tool executions are logged
- [ ] Status shows 'success' or 'pending'
- [ ] Risk levels are correct

### 5.3 Check Approvals
```sql
SELECT tool_name, status, risk_level, created_at
FROM pending_approvals
WHERE address = '0x1E0048D83ba01D823dc852cfabeb94fC76B089B7'
ORDER BY created_at DESC LIMIT 5;
```

Expected:
- [ ] High-risk actions are in approvals table
- [ ] Status changes after approval/rejection

---

## 🎉 Success Criteria

You're done when:
- [x] Database schema is running in Supabase
- [x] Agent API server starts without errors
- [x] Health check returns `"status": "ok"`
- [x] Low-risk commands execute immediately
- [x] High-risk commands create approval requests
- [x] Approval modal shows pending actions
- [x] Approve/reject buttons work
- [x] All data is saved to database

---

## 🚨 Common Issues

### Issue: Database connection error
**Solution:** Check `DATABASE_URL` in `agent/.env`

### Issue: Groq API error
**Solution:** Check `GROQ_API_KEY` in `agent/.env`

### Issue: Frontend can't connect to agent
**Solution:** Make sure agent API is running on port 3001

### Issue: Approval modal is empty
**Solution:** Check if approval expired (5-minute timeout)

### Issue: Tool not found
**Solution:** Restart agent API server

---

## 📚 Next Steps After Completion

1. **Add More Tools** - See `agent/src/tools/registry.ts`
2. **Deploy to Production** - See `NEXT-STEPS.md`
3. **Add Analytics** - Build user stats dashboard
4. **Improve Intelligence** - Enhance agent prompts

---

## 🆘 Need Help?

- **Detailed Guide:** `NEXT-STEPS.md`
- **Integration Status:** `INTEGRATION-STATUS.md`
- **Quick Start:** `REAL-AGENT-QUICKSTART.md`
- **Architecture:** `REAL-AGENT-PLAN.md`

---

**Estimated Time:** 15-20 minutes
**Difficulty:** Easy (just follow the steps!)
**Result:** Fully functional AI agent with tools, memory, and approvals

**Ready? Start with Step 1!** 🚀
