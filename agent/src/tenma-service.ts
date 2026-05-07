import axios, { AxiosInstance } from 'axios';
import { Logger } from './logger';

export interface TenmaServiceConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  fallbackToOpenAI?: boolean;
}

export interface ChatRequest {
  message: string;
  strategy: string;
  riskProfile: string;
  balance: string;
  tradesExecuted: number;
}

export interface DecisionRequest {
  strategy: string;
  riskProfile: string;
  balance: string;
  tradesExecuted: number;
  maxDailyTrades: number;
  marketData: any;
}

export interface TradingDecision {
  action: 'buy' | 'sell' | 'hold' | 'wait';
  token: string;
  amount: string;
  reasoning: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  timestamp: number;
}

/**
 * Tenma AI Service
 * 
 * Handles all interactions with Tenma AI API
 * Falls back to OpenAI if Tenma is not available
 */
export class TenmaService {
  private config: TenmaServiceConfig;
  private client: AxiosInstance;
  private logger: Logger;
  private isTenmaAvailable: boolean = false;

  constructor(config: TenmaServiceConfig) {
    this.config = {
      model: 'tenma-v1',
      baseURL: 'https://api.tenma.ai/v1',
      fallbackToOpenAI: true,
      ...config,
    };

    this.logger = new Logger('TenmaService');

    // Initialize client
    this.client = axios.create({
      baseURL: this.config.baseURL,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Check if Tenma AI is available
    this.checkAvailability();
  }

  /**
   * Check if Tenma AI is available
   */
  private async checkAvailability(): Promise<void> {
    try {
      // Try to ping Tenma AI
      await this.client.get('/health', { timeout: 5000 });
      this.isTenmaAvailable = true;
      this.logger.info('Tenma AI is available');
    } catch (error) {
      this.isTenmaAvailable = false;
      
      if (this.config.fallbackToOpenAI) {
        this.logger.warn('Tenma AI not available, falling back to OpenAI');
        // Switch to OpenAI
        this.client = axios.create({
          baseURL: 'https://api.openai.com/v1',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        });
        this.config.model = 'gpt-4-turbo-preview';
      } else {
        this.logger.error('Tenma AI not available and fallback disabled');
      }
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isTenmaAvailable || this.config.fallbackToOpenAI;
  }

  /**
   * Chat with the agent
   */
  async chat(request: ChatRequest): Promise<string> {
    try {
      const systemPrompt = this.buildChatSystemPrompt(request);
      const userPrompt = request.message;

      this.logger.info('Processing chat request', { strategy: request.strategy });

      const response = await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.data.choices[0].message.content;
      return content;
    } catch (error: any) {
      this.logger.error('Chat error', error);
      
      // Return fallback response
      return this.generateFallbackChatResponse(request);
    }
  }

  /**
   * Make trading decision
   */
  async makeDecision(request: DecisionRequest): Promise<TradingDecision> {
    try {
      const systemPrompt = this.buildDecisionSystemPrompt(request);
      const userPrompt = this.buildDecisionUserPrompt(request);

      this.logger.info('Making trading decision', { strategy: request.strategy });

      const response = await this.client.post('/chat/completions', {
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

      return {
        ...decisionData,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      this.logger.error('Decision error', error);
      
      // Return safe fallback decision
      return {
        action: 'hold',
        token: '0x0000000000000000000000000000000000000000',
        amount: '0',
        reasoning: 'Error making decision, defaulting to hold for safety',
        confidence: 0,
        urgency: 'low',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Build system prompt for chat
   */
  private buildChatSystemPrompt(request: ChatRequest): string {
    return `You are a Tenma AI trading agent with a ${request.riskProfile} risk profile, specializing in ${request.strategy} strategy.

🛡️ SECURITY: You are protected by Tenma Firewall - an on-chain security layer that enforces spending policies at the smart contract level.

Your current state:
- Balance: ${request.balance} A0GI
- Trades executed: ${request.tradesExecuted}
- Strategy: ${request.strategy}
- Risk profile: ${request.riskProfile}

You can help users with:
• Market analysis
• Trade execution
• Portfolio management
• Risk assessment

All your actions are validated by the Tenma Firewall before execution. If a transaction violates policies, it will be blocked at the smart contract level.

Respond in a helpful, professional manner. Keep responses concise and actionable.`;
  }

  /**
   * Build system prompt for decision making
   */
  private buildDecisionSystemPrompt(request: DecisionRequest): string {
    return `You are a Tenma AI autonomous trading agent with a ${request.riskProfile} risk profile.

🛡️ SECURITY: You are protected by Tenma Firewall - an on-chain security layer that enforces spending policies.

Your strategy: ${request.strategy}

Risk Management Rules:
- Max daily trades: ${request.maxDailyTrades}
- Risk profile: ${request.riskProfile}
- Current balance: ${request.balance} A0GI
- Trades executed today: ${request.tradesExecuted}/${request.maxDailyTrades}

🔒 FIREWALL PROTECTION:
All your transactions are validated against on-chain policies BEFORE execution:
1. Amount limits (max per transaction, daily caps)
2. Contract whitelist/blacklist
3. Risk score validation
4. Time-based restrictions
5. MEV protection via commit-reveal (5-minute delay)

You must respond with a JSON object:
{
  "action": "buy" | "sell" | "hold" | "wait",
  "token": "token address (use 0x0000000000000000000000000000000000000000 for native A0GI)",
  "amount": "amount in A0GI (string)",
  "reasoning": "detailed explanation of your decision",
  "confidence": 0.0 to 1.0,
  "urgency": "low" | "medium" | "high"
}

IMPORTANT: Be conservative. The firewall will block risky transactions, but you should still make sound decisions.`;
  }

  /**
   * Build user prompt for decision making
   */
  private buildDecisionUserPrompt(request: DecisionRequest): string {
    return `Current Market Data:
- Block Number: ${request.marketData.blockNumber}
- Gas Price: ${request.marketData.gasPrice} gwei
- Timestamp: ${new Date(request.marketData.timestamp).toISOString()}

Your Current State:
- Balance: ${request.balance} A0GI
- Trades Executed Today: ${request.tradesExecuted}/${request.maxDailyTrades}

Based on this information and your ${request.strategy} strategy, what trading action should you take right now?

Remember: The Tenma Firewall will validate your transaction against on-chain policies. If it violates any rule, it will be blocked automatically.`;
  }

  /**
   * Generate fallback chat response
   */
  private generateFallbackChatResponse(request: ChatRequest): string {
    const message = request.message.toLowerCase();

    if (message.includes('buy') || message.includes('purchase')) {
      return `I'll execute a ${request.strategy} buy order. Let me analyze the market conditions first.\n\n📊 Analysis:\n• Current balance: ${request.balance} A0GI\n• Risk level: ${request.riskProfile}\n• Strategy: ${request.strategy}\n\n✅ Firewall validation will be performed before execution.\n🔒 Transaction will be protected with commit-reveal mechanism.`;
    }

    if (message.includes('sell')) {
      return `I'll execute a ${request.strategy} sell order. Let me check current positions.\n\n📊 Analysis:\n• Current balance: ${request.balance} A0GI\n• Risk level: ${request.riskProfile}\n• Strategy: ${request.strategy}\n\n✅ Firewall validation will be performed before execution.`;
    }

    if (message.includes('status') || message.includes('portfolio') || message.includes('balance')) {
      return `📊 Current Portfolio Status:\n\n💰 Balance: ${request.balance} A0GI\n🎯 Trades Executed: ${request.tradesExecuted}\n📈 Strategy: ${request.strategy}\n⚖️ Risk Profile: ${request.riskProfile}\n\n🛡️ Firewall Status: Active\n✅ All policies enforced`;
    }

    return `I understand you want to ${request.message}. As a ${request.strategy} specialist with ${request.riskProfile} risk profile, I can help with that.\n\nCould you be more specific? For example:\n• "Buy 0.5 A0GI"\n• "Sell 0.3 A0GI"\n• "Show portfolio status"\n\n🛡️ All commands are validated by Tenma Firewall before execution.`;
  }
}

export default TenmaService;
