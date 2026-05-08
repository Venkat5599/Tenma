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
