import { z } from 'zod';

/**
 * Firewall Configuration
 */
export const FirewallConfigSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  rpcUrl: z.string().url('Invalid RPC URL'),
  privateKey: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid private key'),
  chainId: z.number().optional().default(16602),
  storageEndpoint: z.string().url().optional(),
  storageApiKey: z.string().optional(),
});

export type FirewallConfig = z.infer<typeof FirewallConfigSchema>;

/**
 * Policy Configuration
 */
export const PolicyConfigSchema = z.object({
  maxTransactionAmount: z.string(), // in wei or token units
  maxDailyAmount: z.string(),
  maxGasPrice: z.string().optional(),
  whitelistedContracts: z.array(z.string()).optional().default([]),
  blacklistedContracts: z.array(z.string()).optional().default([]),
  maxRiskScore: z.number().min(0).max(100).optional().default(50),
  requireManualApproval: z.boolean().optional().default(false),
  timeRestrictions: z.object({
    enabled: z.boolean(),
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
  }).optional(),
});

export type PolicyConfig = z.infer<typeof PolicyConfigSchema>;

/**
 * Transaction Request
 */
export const TransactionRequestSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  value: z.string(), // in ETH
  data: z.string().regex(/^0x[a-fA-F0-9]*$/),
  gasLimit: z.string().optional(),
  maxFeePerGas: z.string().optional(),
  maxPriorityFeePerGas: z.string().optional(),
});

export type TransactionRequest = z.infer<typeof TransactionRequestSchema>;

/**
 * Commitment Result
 */
export interface CommitmentResult {
  commitmentHash: string;
  timestamp: number;
  revealTime: number;
  storageId?: string;
}

/**
 * Transaction Status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  COMMITTED = 'committed',
  REVEALED = 'revealed',
  EXECUTED = 'executed',
  FAILED = 'failed',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
}

/**
 * Policy Violation
 */
export interface PolicyViolation {
  rule: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
}

/**
 * Transaction Result
 */
export interface TransactionResult {
  status: TransactionStatus;
  commitmentHash?: string;
  transactionHash?: string;
  violations: PolicyViolation[];
  timestamp: number;
}

/**
 * Tenma AI Agent Configuration
 */
export const TenmaAgentConfigSchema = z.object({
  apiKey: z.string(),
  model: z.string().optional().default('tenma-v1'),
  name: z.string(),
  strategies: z.array(z.enum(['dca', 'arbitrage', 'limit_order', 'grid_trading'])),
  riskProfile: z.enum(['conservative', 'moderate', 'aggressive']),
  maxPositionSize: z.string(),
  maxDailyTrades: z.number(),
  decisionInterval: z.number().optional().default(300000), // 5 minutes
});

export type TenmaAgentConfig = z.infer<typeof TenmaAgentConfigSchema>;

/**
 * Trading Decision
 */
export const TradingDecisionSchema = z.object({
  action: z.enum(['buy', 'sell', 'hold', 'wait']),
  token: z.string(),
  amount: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  urgency: z.enum(['low', 'medium', 'high']),
  timestamp: z.number(),
});

export type TradingDecision = z.infer<typeof TradingDecisionSchema>;

/**
 * Agent State
 */
export interface AgentState {
  balance: string;
  pendingTransactions: number;
  tradesExecuted: number;
  tradesBlocked: number;
  lastDecision: TradingDecision | null;
  isRunning: boolean;
}

/**
 * Event Types
 */
export enum EventType {
  COMMITMENT_CREATED = 'CommitmentCreated',
  TRANSACTION_REVEALED = 'TransactionRevealed',
  TRANSACTION_EXECUTED = 'TransactionExecuted',
  TRANSACTION_BLOCKED = 'TransactionBlocked',
  POLICY_UPDATED = 'PolicyUpdated',
  AGENT_DECISION = 'AgentDecision',
}

/**
 * Event Listener
 */
export type EventListener<T = any> = (data: T) => void | Promise<void>;

/**
 * Storage Options
 */
export interface StorageOptions {
  endpoint: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}
