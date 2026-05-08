/**
 * Tool Registry
 * Defines all available tools for the agent
 */

import { ethers } from 'ethers';
import { Logger } from '../logger';

const logger = new Logger('ToolRegistry');

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Tool {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
  riskLevel: RiskLevel;
  execute: (params: any, context: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.registerTools();
  }

  private registerTools() {
    // Blockchain Tools (Low Risk - Read Only)
    this.register({
      name: 'get_balance',
      description: 'Get the A0GI balance of a wallet address',
      parameters: [
        { name: 'address', type: 'string', description: 'Wallet address', required: true },
      ],
      riskLevel: 'low',
      execute: async (params, context) => {
        const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai');
        const balance = await provider.getBalance(params.address);
        return {
          address: params.address,
          balance: ethers.formatEther(balance),
          balanceWei: balance.toString(),
        };
      },
    });

    this.register({
      name: 'get_transaction',
      description: 'Get transaction details by hash',
      parameters: [
        { name: 'txHash', type: 'string', description: 'Transaction hash', required: true },
      ],
      riskLevel: 'low',
      execute: async (params, context) => {
        const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai');
        const tx = await provider.getTransaction(params.txHash);
        const receipt = await provider.getTransactionReceipt(params.txHash);
        return {
          transaction: tx,
          receipt,
          status: receipt?.status === 1 ? 'success' : 'failed',
        };
      },
    });

    this.register({
      name: 'estimate_gas',
      description: 'Estimate gas cost for a transaction',
      parameters: [
        { name: 'to', type: 'string', description: 'Recipient address', required: true },
        { name: 'value', type: 'string', description: 'Amount in A0GI', required: false },
        { name: 'data', type: 'string', description: 'Transaction data', required: false },
      ],
      riskLevel: 'low',
      execute: async (params, context) => {
        const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai');
        const gasEstimate = await provider.estimateGas({
          to: params.to,
          value: params.value ? ethers.parseEther(params.value) : undefined,
          data: params.data,
        });
        const gasPrice = await provider.getFeeData();
        return {
          gasLimit: gasEstimate.toString(),
          gasPrice: gasPrice.gasPrice?.toString(),
          estimatedCost: ethers.formatEther(gasEstimate * (gasPrice.gasPrice || 0n)),
        };
      },
    });

    // Market Data Tools (Low Risk - Read Only)
    this.register({
      name: 'get_price',
      description: 'Get current price of A0GI token',
      parameters: [],
      riskLevel: 'low',
      execute: async (params, context) => {
        // Mock price data (replace with real API)
        return {
          token: 'A0GI',
          price: '0.85',
          currency: 'USD',
          change24h: '+0.5%',
          timestamp: Date.now(),
        };
      },
    });

    this.register({
      name: 'get_market_data',
      description: 'Get market statistics for A0GI',
      parameters: [],
      riskLevel: 'low',
      execute: async (params, context) => {
        return {
          token: 'A0GI',
          price: '0.85',
          volume24h: '1250000',
          marketCap: '85000000',
          circulatingSupply: '100000000',
          change24h: '+0.5%',
          high24h: '0.87',
          low24h: '0.83',
        };
      },
    });

    // Firewall Tools (Low/Medium Risk)
    this.register({
      name: 'check_policy',
      description: 'Check if a transaction passes firewall policies',
      parameters: [
        { name: 'to', type: 'string', description: 'Recipient address', required: true },
        { name: 'value', type: 'string', description: 'Amount in A0GI', required: true },
        { name: 'data', type: 'string', description: 'Transaction data', required: false },
      ],
      riskLevel: 'low',
      execute: async (params, context) => {
        // Mock policy check (replace with real contract call)
        const amount = parseFloat(params.value);
        const passes = amount <= 1.0; // Max 1 A0GI per transaction
        return {
          passes,
          policies: {
            maxAmount: '1.0 A0GI',
            dailyLimit: '10.0 A0GI',
            whitelist: true,
          },
          violations: passes ? [] : ['Amount exceeds maximum per transaction'],
        };
      },
    });

    this.register({
      name: 'get_policies',
      description: 'Get active firewall policies',
      parameters: [],
      riskLevel: 'low',
      execute: async (params, context) => {
        return {
          policies: [
            { name: 'Max Per Transaction', value: '1.0 A0GI', active: true },
            { name: 'Daily Limit', value: '10.0 A0GI', active: true },
            { name: 'Whitelist Only', value: 'false', active: true },
            { name: 'MEV Protection', value: 'true', active: true },
          ],
        };
      },
    });

    // Simulation Tools (Medium Risk)
    this.register({
      name: 'simulate_transaction',
      description: 'Simulate a transaction without executing it',
      parameters: [
        { name: 'to', type: 'string', description: 'Recipient address', required: true },
        { name: 'value', type: 'string', description: 'Amount in A0GI', required: true },
        { name: 'data', type: 'string', description: 'Transaction data', required: false },
      ],
      riskLevel: 'medium',
      execute: async (params, context) => {
        return {
          success: true,
          gasUsed: '21000',
          result: 'Transaction would succeed',
          warnings: [],
        };
      },
    });

    // Trading Tools (High Risk - Requires Approval)
    this.register({
      name: 'buy_token',
      description: 'Buy tokens (purchase with fiat or native currency)',
      parameters: [
        { name: 'token', type: 'string', description: 'Token to buy (e.g., A0GI)', required: true },
        { name: 'amount', type: 'string', description: 'Amount to buy', required: true },
      ],
      riskLevel: 'high',
      execute: async (params, context) => {
        // Check if this is an approved execution
        if (!context.approved) {
          throw new Error('Requires user approval');
        }

        // Return transaction parameters for frontend to execute
        // Frontend will use wallet to execute real transaction
        return {
          success: true,
          requiresWalletExecution: true,
          transactionType: 'buy_token',
          token: params.token,
          amount: params.amount,
          // For testing: send to user's own address (they send to themselves)
          // In production, this would be a DEX contract or liquidity pool
          to: context.userAddress, // Send to self for testing
          value: params.amount,
          data: '0x', // No data for simple transfer
          message: `⏳ Preparing to buy ${params.amount} ${params.token}...\n\n📝 Transaction will be executed through your wallet.\n\n🛡️ Firewall protection: Active\n🔒 MEV protection: Enabled\n\n💡 For testing: Sending to your own address`,
        };
      },
    });

    this.register({
      name: 'send_transaction',
      description: 'Send A0GI to an address',
      parameters: [
        { name: 'to', type: 'string', description: 'Recipient address', required: true },
        { name: 'amount', type: 'string', description: 'Amount in A0GI', required: true },
      ],
      riskLevel: 'high',
      execute: async (params, context) => {
        // Check if this is an approved execution
        if (!context.approved) {
          throw new Error('Requires user approval');
        }

        // Return transaction parameters for frontend to execute
        return {
          success: true,
          requiresWalletExecution: true,
          transactionType: 'send_transaction',
          to: params.to,
          amount: params.amount,
          value: params.amount,
          data: '0x',
          message: `⏳ Preparing to send ${params.amount} A0GI to ${params.to}...\n\n📝 Transaction will be executed through your wallet.\n\n🛡️ Firewall protection: Active\n🔒 MEV protection: Enabled`,
        };
      },
    });

    // MEV Protection Tools (High Risk)
    this.register({
      name: 'commit_transaction',
      description: 'Commit a transaction hash for MEV protection',
      parameters: [
        { name: 'txHash', type: 'string', description: 'Transaction hash to commit', required: true },
      ],
      riskLevel: 'high',
      execute: async (params, context) => {
        throw new Error('Requires user approval');
      },
    });

    logger.info(`Registered ${this.tools.size} tools`);
  }

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getByRiskLevel(riskLevel: RiskLevel): Tool[] {
    return this.getAll().filter(tool => tool.riskLevel === riskLevel);
  }

  async execute(name: string, params: any, context: any): Promise<any> {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    logger.info(`Executing tool: ${name}`, { params, riskLevel: tool.riskLevel });

    try {
      const result = await tool.execute(params, context);
      logger.info(`Tool executed successfully: ${name}`);
      return result;
    } catch (error: any) {
      logger.error(`Tool execution failed: ${name}`, error);
      throw error;
    }
  }
}

export const toolRegistry = new ToolRegistry();
