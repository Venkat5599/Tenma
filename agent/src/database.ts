/**
 * Database Service
 * Supabase PostgreSQL connection and queries
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Logger } from './logger';

const logger = new Logger('Database');

// Parse connection string
const DATABASE_URL = process.env.DATABASE_URL || '';
const url = new URL(DATABASE_URL);
const supabaseUrl = `https://${url.hostname.replace('db.', '')}`;
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export class DatabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(supabaseUrl, supabaseKey);
    logger.info('Database service initialized');
  }

  // User Profiles
  async getUserProfile(address: string) {
    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('address', address)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching user profile', error);
      throw error;
    }

    return data;
  }

  async createOrUpdateProfile(address: string, profile: any) {
    const { data, error } = await this.client
      .from('user_profiles')
      .upsert({
        address,
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Error upserting profile', error);
      throw error;
    }

    return data;
  }

  // Conversations
  async saveMessage(address: string, role: 'user' | 'assistant', content: string, metadata: any = {}) {
    const { data, error } = await this.client
      .from('conversations')
      .insert({
        address,
        role,
        content,
        metadata,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error saving message', error);
      throw error;
    }

    return data;
  }

  async getConversationHistory(address: string, limit: number = 10) {
    const { data, error } = await this.client
      .from('conversations')
      .select('role, content, created_at, metadata')
      .eq('address', address)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching conversation history', error);
      throw error;
    }

    return data?.reverse() || [];
  }

  // Execution Logs
  async logExecution(log: {
    address: string;
    tool_name: string;
    parameters: any;
    result?: any;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    error?: string;
    risk_level: 'low' | 'medium' | 'high';
    approved_by?: string;
  }) {
    const { data, error } = await this.client
      .from('execution_logs')
      .insert(log)
      .select()
      .single();

    if (error) {
      logger.error('Error logging execution', error);
      throw error;
    }

    return data;
  }

  async getExecutionLogs(address: string, limit: number = 20) {
    const { data, error } = await this.client
      .from('execution_logs')
      .select('*')
      .eq('address', address)
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching execution logs', error);
      throw error;
    }

    return data || [];
  }

  // Pending Approvals
  async createApproval(approval: {
    address: string;
    tool_name: string;
    parameters: any;
    risk_level: 'low' | 'medium' | 'high';
    reasoning?: string;
    expires_at: Date;
  }) {
    const { data, error } = await this.client
      .from('pending_approvals')
      .insert(approval)
      .select()
      .single();

    if (error) {
      logger.error('Error creating approval', error);
      throw error;
    }

    return data;
  }

  async getPendingApprovals(address: string) {
    const { data, error } = await this.client
      .from('pending_approvals')
      .select('*')
      .eq('address', address)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching pending approvals', error);
      throw error;
    }

    return data || [];
  }

  async updateApprovalStatus(id: string, status: 'approved' | 'rejected') {
    const { data, error } = await this.client
      .from('pending_approvals')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating approval status', error);
      throw error;
    }

    return data;
  }

  // Agent Memory
  async saveMemory(memory: {
    address: string;
    memory_type: 'preference' | 'pattern' | 'feedback';
    key: string;
    value: any;
    confidence?: number;
  }) {
    const { data, error } = await this.client
      .from('agent_memory')
      .upsert({
        ...memory,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Error saving memory', error);
      throw error;
    }

    return data;
  }

  async getMemory(address: string, memory_type?: string) {
    let query = this.client
      .from('agent_memory')
      .select('*')
      .eq('address', address);

    if (memory_type) {
      query = query.eq('memory_type', memory_type);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      logger.error('Error fetching memory', error);
      throw error;
    }

    return data || [];
  }

  // Transaction History
  async saveTransaction(tx: {
    address: string;
    tx_hash: string;
    chain_id: number;
    action_type: string;
    from_token?: string;
    to_token?: string;
    amount?: string;
    status: 'pending' | 'confirmed' | 'failed';
    block_number?: number;
    gas_used?: string;
  }) {
    const { data, error } = await this.client
      .from('transaction_history')
      .insert(tx)
      .select()
      .single();

    if (error) {
      logger.error('Error saving transaction', error);
      throw error;
    }

    return data;
  }

  async updateTransactionStatus(tx_hash: string, status: 'confirmed' | 'failed', block_number?: number) {
    const { data, error } = await this.client
      .from('transaction_history')
      .update({
        status,
        block_number,
        confirmed_at: new Date().toISOString(),
      })
      .eq('tx_hash', tx_hash)
      .select()
      .single();

    if (error) {
      logger.error('Error updating transaction status', error);
      throw error;
    }

    return data;
  }

  async getTransactionHistory(address: string, limit: number = 20) {
    const { data, error } = await this.client
      .from('transaction_history')
      .select('*')
      .eq('address', address)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching transaction history', error);
      throw error;
    }

    return data || [];
  }

  // Stats
  async getUserStats(address: string) {
    const { data, error } = await this.client
      .rpc('get_user_stats', { user_address: address });

    if (error) {
      logger.error('Error fetching user stats', error);
      throw error;
    }

    return data;
  }
}

export const db = new DatabaseService();
