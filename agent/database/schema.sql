-- Tenma Real Agent Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles and preferences
CREATE TABLE IF NOT EXISTS user_profiles (
  address TEXT PRIMARY KEY,
  strategy TEXT DEFAULT 'DCA',
  risk_profile TEXT DEFAULT 'moderate',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation history
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_address ON conversations(address);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- Tool execution logs
CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  parameters JSONB NOT NULL,
  result JSONB,
  status TEXT NOT NULL, -- 'pending', 'success', 'failed', 'cancelled'
  error TEXT,
  risk_level TEXT NOT NULL, -- 'low', 'medium', 'high'
  approved_by TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_address ON execution_logs(address);
CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_execution_logs_executed_at ON execution_logs(executed_at DESC);

-- Pending approvals
CREATE TABLE IF NOT EXISTS pending_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  parameters JSONB NOT NULL,
  risk_level TEXT NOT NULL,
  reasoning TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_approvals_address ON pending_approvals(address);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status ON pending_approvals(status);

-- Agent memory (for context and learning)
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  memory_type TEXT NOT NULL, -- 'preference', 'pattern', 'feedback'
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_address ON agent_memory(address);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON agent_memory(memory_type);

-- Transaction history (for tracking on-chain actions)
CREATE TABLE IF NOT EXISTS transaction_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'swap', 'commit', 'reveal', 'approve'
  from_token TEXT,
  to_token TEXT,
  amount TEXT,
  status TEXT NOT NULL, -- 'pending', 'confirmed', 'failed'
  block_number INTEGER,
  gas_used TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transaction_history_address ON transaction_history(address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_tx_hash ON transaction_history(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transaction_history_status ON transaction_history(status);

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (address = current_setting('app.current_user_address', true));

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (address = current_setting('app.current_user_address', true));

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (address = current_setting('app.current_user_address', true));

CREATE POLICY "Users can view own execution logs" ON execution_logs
  FOR SELECT USING (address = current_setting('app.current_user_address', true));

CREATE POLICY "Users can view own approvals" ON pending_approvals
  FOR SELECT USING (address = current_setting('app.current_user_address', true));

CREATE POLICY "Users can update own approvals" ON pending_approvals
  FOR UPDATE USING (address = current_setting('app.current_user_address', true));

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_conversation_history(user_address TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  role TEXT,
  content TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.role, c.content, c.created_at
  FROM conversations c
  WHERE c.address = user_address
  ORDER BY c.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_stats(user_address TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_conversations', (SELECT COUNT(*) FROM conversations WHERE address = user_address),
    'total_executions', (SELECT COUNT(*) FROM execution_logs WHERE address = user_address),
    'successful_executions', (SELECT COUNT(*) FROM execution_logs WHERE address = user_address AND status = 'success'),
    'pending_approvals', (SELECT COUNT(*) FROM pending_approvals WHERE address = user_address AND status = 'pending'),
    'total_transactions', (SELECT COUNT(*) FROM transaction_history WHERE address = user_address)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_approvals_updated_at BEFORE UPDATE ON pending_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_memory_updated_at BEFORE UPDATE ON agent_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
