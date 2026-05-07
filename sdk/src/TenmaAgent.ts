import axios, { AxiosInstance } from 'axios';
import {
  TenmaAgentConfig,
  TenmaAgentConfigSchema,
  TradingDecision,
  TradingDecisionSchema,
  AgentState,
  EventType,
} from './types';
import { TenmaFirewall } from './TenmaFirewall';

/**
 * TenmaAgent - AI-powered autonomous trading agent
 * 
 * Features:
 * - Real-time decision making with Tenma AI
 * - Automatic policy enforcement via TenmaFirewall
 * - Real-time blocking demonstration
 * - Memory and learning capabilities
 * 
 * @example
 * ```typescript
 * const agent = new TenmaAgent({
 *   apiKey: process.env.TENMA_API_KEY!,
 *   name: 'TenmaBot-Alpha',
 *   strategies: ['dca', 'arbitrage'],
 *   riskProfile: 'moderate',
 *   maxPositionSize: '1.0',
 *   maxDailyTrades: 10
 * }, firewall);
 * 
 * await agent.start();
 * ```
 */
export class TenmaAgent {
  private config: TenmaAgentConfig;
  private firewall: TenmaFirewall;
  private aiClient: AxiosInstance;
  private isRunning: boolean = false;
  private state: AgentState;
  private decisionHistory: TradingDecision[] = [];
  private intervalId?: NodeJS.Timeout;

  constructor(config: TenmaAgentConfig, firewall: TenmaFirewall) {
    this.config = TenmaAgentConfigSchema.parse(config);
    this.firewall = firewall;
    
    // Initialize Tenma AI client
    this.aiClient = axios.create({
      baseURL: 'https://api.tenma.ai/v1',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Initialize state
    this.state = {
      balance: '0',
      pendingTransactions: 0,
      tradesExecuted: 0,
      tradesBlocked: 0,
      lastDecision: null,
      isRunning: false,
    };

    // Listen to firewall events
    this.setupFirewallListeners();
  }

  /**
   * Start the autonomous agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    console.log(`🤖 Starting ${this.config.name}...`);
    this.isRunning = true;
    this.state.isRunning = true;

    // Update balance
    await this.updateState();

    // Start decision loop
    this.intervalId = setInterval(async () => {
      try {
        await this.executeCycle();
      } catch (error) {
        console.error('❌ Error in agent cycle:', error);
      }
    }, this.config.decisionInterval);

    // Execute first cycle immediately
    await this.executeCycle();

    console.log(`✅ ${this.config.name} started successfully`);
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log(`🛑 Stopping ${this.config.name}...`);
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.isRunning = false;
    this.state.isRunning = false;

    console.log(`✅ ${this.config.name} stopped`);
  }

  /**
   * Execute one decision cycle
   */
  private async executeCycle(): Promise<void> {
    console.log(`\n🔄 ${this.config.name} - Starting decision cycle...`);

    // Update state
    await this.updateState();

    // Check if we've hit daily trade limit
    if (this.state.tradesExecuted >= this.config.maxDailyTrades) {
      console.log(`⏸️  Daily trade limit reached (${this.config.maxDailyTrades})`);
      return;
    }

    // Get market data
    const marketData = await this.getMarketData();

    // Make decision using Grok AI
    const decision = await this.makeDecision(marketData);

    console.log(`🧠 Decision: ${decision.action.toUpperCase()}`);
    console.log(`   Token: ${decision.token}`);
    console.log(`   Amount: ${decision.amount} ETH`);
    console.log(`   Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
    console.log(`   Reasoning: ${decision.reasoning}`);

    // Store decision
    this.decisionHistory.push(decision);
    this.state.lastDecision = decision;

    // Execute if action required
    if (decision.action !== 'hold' && decision.action !== 'wait') {
      await this.executeDecision(decision);
    }
  }

  /**
   * Make trading decision using Tenma AI
   */
  private async makeDecision(marketData: any): Promise<TradingDecision> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(marketData);

    console.log(`🤖 Querying Tenma AI for decision...`);

    try {
      const response = await this.aiClient.post('/chat/completions', {
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.data.choices[0].message.content;
      const decisionData = JSON.parse(content);
      
      return TradingDecisionSchema.parse({
        ...decisionData,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('❌ Tenma AI API error:', error);
      
      // Fallback to safe decision
      return {
        action: 'hold',
        token: '0x0000000000000000000000000000000000000000',
        amount: '0',
        reasoning: 'Error querying Tenma AI, defaulting to hold',
        confidence: 0,
        urgency: 'low',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Build system prompt for Tenma AI
   */
  private buildSystemPrompt(): string {
    return `You are "${this.config.name}", an autonomous AI trading agent with a ${this.config.riskProfile} risk profile.

🛡️ SECURITY: You are protected by Tenma Firewall - an on-chain security layer that enforces spending policies at the smart contract level.

Your capabilities:
- Execute MEV-protected trades via commit-reveal mechanism
- Analyze market conditions and make trading decisions
- Manage risk and position sizing
- Learn from past decisions

Your strategies: ${this.config.strategies.join(', ')}

Risk Management Rules:
- Max position size: ${this.config.maxPositionSize} ETH
- Max daily trades: ${this.config.maxDailyTrades}
- Risk profile: ${this.config.riskProfile}

Current State:
- Balance: ${this.state.balance} ETH
- Trades executed today: ${this.state.tradesExecuted}/${this.config.maxDailyTrades}
- Trades blocked: ${this.state.tradesBlocked}

🔒 FIREWALL PROTECTION:
All your transactions are validated against on-chain policies BEFORE execution:
1. Amount limits (max per transaction, daily caps)
2. Contract whitelist/blacklist
3. Risk score validation
4. Time-based restrictions
5. MEV protection via commit-reveal (5-minute delay)

If you attempt a transaction that violates policies, it will be BLOCKED at the smart contract level - no funds can move.

You must respond with a JSON object:
{
  "action": "buy" | "sell" | "hold" | "wait",
  "token": "token address (use 0x0000000000000000000000000000000000000000 for ETH)",
  "amount": "amount in ETH (string)",
  "reasoning": "detailed explanation of your decision",
  "confidence": 0.0 to 1.0,
  "urgency": "low" | "medium" | "high"
}

IMPORTANT: Be conservative. The firewall will block risky transactions, but you should still make sound decisions.`;
  }

  /**
   * Build user prompt with current data
   */
  private buildUserPrompt(marketData: any): string {
    const recentDecisions = this.decisionHistory.slice(-5);
    
    return `Current Market Data:
- ETH Price: $${marketData.ethPrice}
- Gas Price: ${marketData.gasPrice} gwei
- Block Number: ${marketData.blockNumber}
- Timestamp: ${new Date(marketData.timestamp).toISOString()}

Your Current State:
- Balance: ${this.state.balance} ETH
- Pending Transactions: ${this.state.pendingTransactions}
- Trades Executed Today: ${this.state.tradesExecuted}/${this.config.maxDailyTrades}
- Trades Blocked: ${this.state.tradesBlocked}

Recent Decisions (last 5):
${recentDecisions.length > 0 ? JSON.stringify(recentDecisions, null, 2) : 'No recent decisions'}

Based on this information, what trading action should you take right now?

Remember: The Tenma Firewall will validate your transaction against on-chain policies. If it violates any rule, it will be blocked automatically.`;
  }

  /**
   * Execute trading decision
   */
  private async executeDecision(decision: TradingDecision): Promise<void> {
    console.log(`\n🚀 Executing ${decision.action} transaction...`);
    console.log(`   Amount: ${decision.amount} ETH`);
    console.log(`   Confidence: ${(decision.confidence * 100).toFixed(1)}%`);

    try {
      // Simulate transaction first
      const violations = await this.firewall.simulateTransaction({
        to: decision.token,
        value: decision.amount,
        data: '0x',
      });

      // Check for blocking violations
      const blockingViolations = violations.filter(v => v.blocked);
      
      if (blockingViolations.length > 0) {
        console.log(`\n🚫 TRANSACTION BLOCKED BY FIREWALL:`);
        blockingViolations.forEach(v => {
          console.log(`   ❌ ${v.rule}: ${v.message}`);
        });
        
        this.state.tradesBlocked++;
        return;
      }

      // Show warnings (non-blocking violations)
      const warnings = violations.filter(v => !v.blocked);
      if (warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        warnings.forEach(v => {
          console.log(`   ⚠️  ${v.rule}: ${v.message}`);
        });
      }

      // Execute transaction through firewall
      console.log(`\n✅ All policies passed. Executing transaction...`);
      
      const result = await this.firewall.executeTransaction({
        to: decision.token,
        value: decision.amount,
        data: '0x',
      });

      if (result.status === 'committed') {
        console.log(`✅ Transaction committed successfully`);
        console.log(`   Commitment Hash: ${result.commitmentHash}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   ⏰ Will be revealed in 5 minutes (MEV protection)`);
        
        this.state.tradesExecuted++;
        this.state.pendingTransactions++;
      } else if (result.status === 'blocked') {
        console.log(`🚫 Transaction blocked by firewall`);
        this.state.tradesBlocked++;
      }
    } catch (error) {
      console.error(`❌ Failed to execute transaction:`, error);
    }
  }

  /**
   * Update agent state
   */
  private async updateState(): Promise<void> {
    try {
      this.state.balance = await this.firewall.getBalance();
    } catch (error) {
      console.error('Failed to update state:', error);
    }
  }

  /**
   * Get market data
   */
  private async getMarketData(): Promise<any> {
    // In production, integrate with price oracles, DEX APIs, etc.
    // For now, return mock data
    return {
      ethPrice: 3000 + Math.random() * 100,
      gasPrice: (20 + Math.random() * 30).toFixed(2),
      blockNumber: Math.floor(Math.random() * 1000000),
      timestamp: Date.now(),
    };
  }

  /**
   * Setup firewall event listeners
   */
  private setupFirewallListeners(): void {
    this.firewall.on(EventType.TRANSACTION_BLOCKED, (data: any) => {
      console.log(`\n🚫 FIREWALL BLOCKED TRANSACTION:`);
      console.log(`   Reason: ${data.violations.map((v: any) => v.message).join(', ')}`);
      this.state.tradesBlocked++;
    });

    this.firewall.on(EventType.COMMITMENT_CREATED, (data: any) => {
      console.log(`\n✅ Transaction committed to blockchain`);
      console.log(`   Commitment Hash: ${data.commitmentHash}`);
    });

    this.firewall.on(EventType.TRANSACTION_REVEALED, (data: any) => {
      console.log(`\n🔓 Transaction revealed`);
      console.log(`   Commitment Hash: ${data.commitmentHash}`);
      this.state.pendingTransactions = Math.max(0, this.state.pendingTransactions - 1);
    });

    this.firewall.on(EventType.TRANSACTION_EXECUTED, (data: any) => {
      console.log(`\n✅ Transaction executed successfully`);
      console.log(`   TX Hash: ${data.transactionHash}`);
    });
  }

  /**
   * Get agent state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Get decision history
   */
  getDecisionHistory(): TradingDecision[] {
    return [...this.decisionHistory];
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalDecisions: this.decisionHistory.length,
      tradesExecuted: this.state.tradesExecuted,
      tradesBlocked: this.state.tradesBlocked,
      blockRate: this.state.tradesBlocked / (this.state.tradesExecuted + this.state.tradesBlocked) || 0,
      averageConfidence: this.decisionHistory.reduce((sum, d) => sum + d.confidence, 0) / this.decisionHistory.length || 0,
    };
  }
}
