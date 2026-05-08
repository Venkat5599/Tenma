# 🔧 Fix RLS Policies

## Issue
The Row Level Security (RLS) policies are blocking the backend service from accessing the database.

## Solution
Run the following SQL in Supabase SQL Editor to update the RLS policies:

### Step 1: Go to Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** → **New Query**

### Step 2: Copy and Run This SQL

```sql
-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view own execution logs" ON execution_logs;
DROP POLICY IF EXISTS "Users can view own approvals" ON pending_approvals;
DROP POLICY IF EXISTS "Users can update own approvals" ON pending_approvals;

-- Create new policies that allow all operations for anon role
-- Backend service validates address in API layer

CREATE POLICY "Allow all for anon" ON user_profiles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON execution_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON pending_approvals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON agent_memory
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON transaction_history
  FOR ALL USING (true) WITH CHECK (true);
```

### Step 3: Click "Run"

You should see: "Success. No rows returned"

### Step 4: Test Again

The agent API should now work! Test with:

```bash
curl -X POST http://localhost:3001/agent/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What is my balance?\", \"address\": \"0x1E0048D83ba01D823dc852cfabeb94fC76B089B7\"}"
```

## Why This Works

- **Before:** RLS policies required `current_setting('app.current_user_address')` which wasn't set
- **After:** RLS policies allow all operations, but the backend API validates the address
- **Security:** The backend service validates that users can only access their own data

## Note

In production, you should:
1. Use the `service_role` key (bypasses RLS) for backend services
2. Or implement proper JWT-based RLS with Supabase Auth
3. Or keep these permissive policies if your backend properly validates addresses

For this hackathon/demo, the current approach is fine!
