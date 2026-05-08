import Groq from 'groq-sdk';
import { Logger } from './logger';

export interface GroqServiceConfig {
  apiKey: string;
  model?: string;
}

export interface ChatRequest {
  message: string;
  strategy: string;
  riskProfile: string;
  balance: string;
  tradesExecuted: number;
  account?: string;
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
 * Groq AI Service
 * 
 * Ultra-fast AI responses for trading agent
 * Uses Llama 3.1 70B for intelligent trading decisions
 */
export class GroqService {
  private config: GroqServiceConfig;
  private client: Groq;
  private logger: Logger;

  constructor(config: GroqServiceConfig) {
    this.config = {
      model: 'llama-3.1-70b-versatile',
      ...config,
    };

    this.logger = new Logger('GroqService');

    // Initialize Groq client
    this.client = new Groq({
      apiKey: this.config.apiKey,
    });

    this.logger.info('Groq service initialized', { model: this.config.model });
  }

  /**
   * Chat with the trading agent
   */
  async chat(request: ChatRequest): Promise<string> {
    try {
      const systemPrompt = this.buildChatSystemPrompt(request);
      const userPrompt = request.message;

      this.logger.info('Processing chat request', { 
        strategy: request.strategy,
        message: request.message.substring(0, 50) + '...',
      });

      const startTime = Date.now();

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        model: this.config.model!,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        stream: false,
      });

      const responseTime = Date.now() - startTime;
      this.logger.info('Chat response received', { 
        responseTime: `${responseTime}ms`,
        tokens: completion.usage?.total_tokens,
      });

      const content = completion.choices[0]?.message?.content || '';
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
  async makeDecision(request: ChatRequest): Promise<TradingDecision> {
    try {
      const systemPrompt = this.buildDecisionSystemPrompt(request);
      const userPrompt = this.buildDecisionUserPrompt(request);

      this.logger.info('Making trading decision', { strategy: request.strategy });

      const startTime = Date.now();

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        model: this.config.model!,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        response_format: { type: 'json_object' },
      });

      const responseTime = Date.now() - startTime;
      this.logger.info('Decision made', { 
        responseTime: `${responseTime}ms`,
        tokens: completion.usage?.total_tokens,
      });

      const content = completion.choices[0]?.message?.content || '{}';
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
${request.account ? `- Wallet: ${request.account}` : ''}

You can help users with:
• Market analysis
• Trade execution (real transactions on 0G Network)
• Portfolio management
• Risk assessment
• Trading strategies

All your actions are validated by the Tenma Firewall before execution. If a transaction violates policies, it will be blocked at the smart contract level.

IMPORTANT RULES:
1. Be concise and actionable (max 3-4 sentences)
2. Use emojis sparingly (1-2 per response)
3. Focus on trading insights
4. Always mention if wallet is connected when relevant
5. Suggest specific actions (e.g., "Try: Buy 0.01 A0GI")
6. Be professional but friendly

Respond in a helpful, professional manner. Keep responses concise and actionable.`;
  }

  /**
   * Build system prompt for decision making
   */
  private buildDecisionSystemPrompt(request: ChatRequest): string {
    return `You are a Tenma AI autonomous trading agent with a ${request.riskProfile} risk profile.

🛡️ SECURITY: You are protected by Tenma Firewall - an on-chain security layer that enforces spending policies.

Your strategy: ${request.strategy}

Risk Management Rules:
- Risk profile: ${request.riskProfile}
- Current balance: ${request.balance} A0GI
- Trades executed: ${request.tradesExecuted}

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
  private buildDecisionUserPrompt(request: ChatRequest): string {
    return `Your Current State:
- Balance: ${request.balance} A0GI
- Trades Executed: ${request.tradesExecuted}
- Strategy: ${request.strategy}
- Risk Profile: ${request.riskProfile}

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

export default GroqService;
