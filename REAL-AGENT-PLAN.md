# 🤖 Real Agent Architecture for Tenma

## Current State (Fake Agent)
❌ Just a chatbot with hardcoded responses
❌ No real tools or actions
❌ No memory or context
❌ No execution capabilities
❌ No approval system

## Target State (Real Agent)

### 1. **LLM Layer** ✅
- **Provider:** Groq (Llama 3.3 70B) - WORKING
- **Fallback:** Gemini 2.5 Flash (free tier)
- **Purpose:** Natural language understanding & decision making

### 2. **Tools Layer** 🔧
Real blockchain and DeFi tools:

#### Blockchain Tools
- `get_balance(address)` - Get wallet balance
- `get_transaction(txHash)` - Get transaction details
- `estimate_gas(tx)` - Estimate gas costs
- `check_allowance(token, spender)` - Check token allowances

#### Trading Tools
- `execute_swap(fromToken, toToken, amount)` - Execute swap
- `get_price(token)` - Get token price
- `get_market_data(token)` - Get market stats
- `calculate_slippage(amount, token)` - Calculate slippage

#### Firewall Tools
- `check_policy(tx)` - Check if transaction passes firewall
- `get_policies()` - Get active policies
- `simulate_transaction(tx)` - Simulate before execution
- `get_block_history()` - Get blocked transactions

#### MEV Protection Tools
- `commit_transaction(tx)` - Commit transaction hash
- `reveal_transaction(commitId)` - Reveal after delay
- `check_commit_status(commitId)` - Check commit status

### 3. **Memory Layer** 🧠
Persistent storage with Supabase/Neon:

#### Tables
```sql
-- User preferences
CREATE TABLE user_profiles (
  address TEXT PRIMARY KEY,
  strategy TEXT,
  risk_profile TEXT,
  preferences JSONB,
  created_at TIMESTAMP
);

-- Conversation history
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  address TEXT,
  messages JSONB[],
  created_at TIMESTAMP
);

-- Execution logs
CREATE TABLE execution_logs (
  id UUID PRIMARY KEY,
  address TEXT,
  tool_name TEXT,
  parameters JSONB,
  result JSONB,
  status TEXT,
  approved_by TEXT,
  executed_at TIMESTAMP
);

-- Pending approvals
CREATE TABLE pending_approvals (
  id UUID PRIMARY KEY,
  address TEXT,
  action JSONB,
  risk_level TEXT,
  status TEXT,
  created_at TIMESTAMP
);
```

### 4. **Permission System** 🔐

#### Risk Levels
- **Low:** Read-only operations (get balance, check price)
- **Medium:** Simulations, estimates (no execution)
- **High:** Actual transactions (requires approval)

#### Approval Flow
```
User: "Buy 1 A0GI"
  ↓
Agent: Analyzes intent
  ↓
Agent: Checks risk level → HIGH
  ↓
Agent: Creates approval request
  ↓
User: Reviews & approves
  ↓
Agent: Executes transaction
  ↓
Agent: Logs execution
```

### 5. **Execution Engine** ⚙️

#### Tool Execution Flow
```typescript
async function executeTool(toolName, params, userAddress) {
  // 1. Check permissions
  const riskLevel = getRiskLevel(toolName);
  
  // 2. Require approval for high-risk
  if (riskLevel === 'high') {
    const approval = await requestApproval(toolName, params, userAddress);
    if (!approval.approved) {
      return { error: 'User denied approval' };
    }
  }
  
  // 3. Execute tool
  const result = await tools[toolName](params);
  
  // 4. Log execution
  await logExecution({
    tool: toolName,
    params,
    result,
    userAddress,
    timestamp: Date.now(),
  });
  
  return result;
}
```

### 6. **Agent Framework** 🏗️

#### Option A: LangGraph (Recommended)
```typescript
import { StateGraph } from "@langchain/langgraph";

const workflow = new StateGraph({
  channels: {
    messages: [],
    tools: [],
    approvals: [],
  }
});

workflow
  .addNode("understand", understandIntent)
  .addNode("plan", planActions)
  .addNode("approve", requestApproval)
  .addNode("execute", executeTools)
  .addNode("respond", generateResponse);

workflow
  .addEdge("understand", "plan")
  .addEdge("plan", "approve")
  .addConditionalEdges("approve", shouldExecute)
  .addEdge("execute", "respond");
```

#### Option B: Custom Loop
```typescript
async function agentLoop(userMessage, userAddress) {
  // 1. Load memory
  const history = await loadConversation(userAddress);
  const profile = await loadProfile(userAddress);
  
  // 2. Understand intent
  const intent = await llm.analyze(userMessage, history);
  
  // 3. Plan actions
  const plan = await llm.planTools(intent, availableTools);
  
  // 4. Execute with approval
  const results = [];
  for (const action of plan.actions) {
    if (action.riskLevel === 'high') {
      const approved = await requestApproval(action);
      if (!approved) continue;
    }
    const result = await executeTool(action.tool, action.params);
    results.push(result);
  }
  
  // 5. Generate response
  const response = await llm.respond(results, intent);
  
  // 6. Save to memory
  await saveConversation(userAddress, userMessage, response);
  
  return response;
}
```

## Implementation Plan

### Phase 1: Tools (Week 1)
- [ ] Create tool registry
- [ ] Implement blockchain tools
- [ ] Implement trading tools
- [ ] Implement firewall tools
- [ ] Add tool testing

### Phase 2: Memory (Week 1)
- [ ] Set up Supabase/Neon
- [ ] Create database schema
- [ ] Implement memory service
- [ ] Add conversation persistence
- [ ] Add user profiles

### Phase 3: Permissions (Week 2)
- [ ] Define risk levels
- [ ] Create approval system
- [ ] Build approval UI
- [ ] Add execution logs
- [ ] Implement audit trail

### Phase 4: Agent Loop (Week 2)
- [ ] Set up LangGraph or custom loop
- [ ] Integrate LLM with tools
- [ ] Add memory to agent
- [ ] Implement approval flow
- [ ] Add error handling

### Phase 5: Testing & Polish (Week 3)
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation
- [ ] Demo scenarios

## Tech Stack

### Free Tier Services
- **LLM:** Groq (Llama 3.3 70B) + Gemini 2.5 Flash fallback
- **Backend:** Vercel Serverless (current)
- **Database:** Supabase free tier (500MB) or Neon (3GB)
- **Queue:** Upstash Redis free tier or Vercel Cron
- **Vector DB:** Supabase pgvector (included)

### Libraries
```json
{
  "dependencies": {
    "@langchain/langgraph": "^0.0.19",
    "@langchain/core": "^0.1.0",
    "@supabase/supabase-js": "^2.39.0",
    "groq-sdk": "^0.7.0",
    "ethers": "^6.16.0",
    "zod": "^3.22.0"
  }
}
```

## Example: Real Agent in Action

### User Input
```
"Buy 0.5 A0GI if price is below $0.90"
```

### Agent Process
```
1. UNDERSTAND
   - Intent: Conditional buy order
   - Amount: 0.5 A0GI
   - Condition: Price < $0.90

2. PLAN
   - Tool 1: get_price('A0GI')
   - Tool 2: check_policy({type: 'buy', amount: '0.5'})
   - Tool 3: execute_swap({from: 'ETH', to: 'A0GI', amount: '0.5'})

3. EXECUTE
   - get_price → $0.85 ✅ (condition met)
   - check_policy → PASS ✅
   - execute_swap → REQUIRES APPROVAL ⚠️

4. APPROVE
   - Show user: "Buy 0.5 A0GI for ~$0.425"
   - User clicks: "Approve"

5. EXECUTE
   - Commit transaction hash
   - Wait 5 minutes (MEV protection)
   - Reveal and execute
   - Log transaction

6. RESPOND
   "✅ Bought 0.5 A0GI for $0.425
   
   Transaction: 0x123...
   Status: Confirmed
   Gas: 0.0001 A0GI
   
   Your new balance: 10.5 A0GI"
```

## Benefits of Real Agent

### vs Chatbot
❌ Chatbot: "I'll help you buy A0GI" (does nothing)
✅ Real Agent: Actually executes the transaction

### vs Hardcoded
❌ Hardcoded: Only predefined actions
✅ Real Agent: Understands natural language, adapts

### vs No Memory
❌ No Memory: Forgets everything
✅ Real Agent: Remembers preferences, history

### vs No Approval
❌ No Approval: Dangerous auto-execution
✅ Real Agent: Human-in-the-loop for safety

## Next Steps

1. **Immediate:** Finish Groq fix ✅
2. **Today:** Set up Supabase database
3. **Tomorrow:** Implement tool registry
4. **This Week:** Build agent loop
5. **Next Week:** Add approval system

---

**Ready to build a REAL agent?** 🚀
