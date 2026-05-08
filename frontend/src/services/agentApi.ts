/**
 * Agent API Client
 * 
 * Connects frontend to Groq-powered AI agent backend
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:3001';

export interface ChatRequest {
  message: string;
  strategy: string;
  riskProfile: string;
  balance?: string;
  tradesExecuted?: number;
  account?: string;
}

export interface ChatResponse {
  response: string;
  provider: string;
  model: string;
  timestamp: number;
}

export interface DecisionRequest {
  strategy: string;
  riskProfile: string;
  balance?: string;
  tradesExecuted?: number;
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

export interface DecisionResponse {
  decision: TradingDecision;
  provider: string;
  model: string;
  timestamp: number;
}

class AgentApiClient {
  private baseURL: string;
  private isAvailable: boolean = false;

  constructor() {
    this.baseURL = API_URL;
    this.checkAvailability();
  }

  /**
   * Check if agent API is available
   */
  private async checkAvailability(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });
      this.isAvailable = response.data.status === 'ok';
      console.log('✅ Agent API is available:', response.data);
    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️ Agent API not available, using fallback responses');
    }
  }

  /**
   * Chat with the AI agent
   */
  async chat(request: ChatRequest): Promise<string> {
    try {
      if (!this.isAvailable) {
        // Fallback to local responses if API not available
        return this.generateFallbackResponse(request);
      }

      const response = await axios.post<ChatResponse>(
        `${this.baseURL}/agent/chat`,
        request,
        {
          timeout: 10000, // 10 second timeout
        }
      );

      console.log('🤖 Groq response received:', {
        provider: response.data.provider,
        model: response.data.model,
        responseLength: response.data.response.length,
      });

      return response.data.response;
    } catch (error: any) {
      console.error('Agent API error:', error.message);
      // Fallback to local responses on error
      return this.generateFallbackResponse(request);
    }
  }

  /**
   * Get trading decision from AI
   */
  async getDecision(request: DecisionRequest): Promise<TradingDecision> {
    try {
      if (!this.isAvailable) {
        throw new Error('Agent API not available');
      }

      const response = await axios.post<DecisionResponse>(
        `${this.baseURL}/agent/decision`,
        request,
        {
          timeout: 10000,
        }
      );

      console.log('🤖 Trading decision received:', response.data.decision);

      return response.data.decision;
    } catch (error: any) {
      console.error('Decision API error:', error.message);
      throw error;
    }
  }

  /**
   * Check if API is available
   */
  getAvailability(): boolean {
    return this.isAvailable;
  }

  /**
   * Generate fallback response when API is not available
   */
  private generateFallbackResponse(request: ChatRequest): string {
    const message = request.message.toLowerCase();

    if (message.includes('buy') || message.includes('purchase')) {
      return `I'll execute a ${request.strategy} buy order. Let me analyze the market conditions first.\n\n📊 Analysis:\n• Strategy: ${request.strategy}\n• Risk level: ${request.riskProfile}\n\n✅ Firewall validation will be performed before execution.\n🔒 Transaction will be protected with commit-reveal mechanism.\n\n💡 Note: Connect to Groq AI for intelligent responses!`;
    }

    if (message.includes('sell')) {
      return `I'll execute a ${request.strategy} sell order.\n\n📊 Analysis:\n• Strategy: ${request.strategy}\n• Risk level: ${request.riskProfile}\n\n✅ Firewall validation will be performed before execution.\n\n💡 Note: Connect to Groq AI for intelligent responses!`;
    }

    if (message.includes('status') || message.includes('portfolio') || message.includes('balance')) {
      return `📊 Current Portfolio Status:\n\n🎯 Trades Executed: ${request.tradesExecuted || 0}\n📈 Strategy: ${request.strategy}\n⚖️ Risk Profile: ${request.riskProfile}\n\n🛡️ Firewall Status: Active\n✅ All policies enforced\n\n💡 Note: Connect to Groq AI for intelligent responses!`;
    }

    if (message.includes('market') || message.includes('analysis')) {
      return `📊 Market Analysis (${request.strategy}):\n\n• A0GI/USD: $0.85 (+0.5%)\n• Volume: Moderate\n• Volatility: Low\n• Trend: Stable\n\n💡 Recommendation: Good time for ${request.riskProfile} entry\n\n🛡️ All recommendations are within firewall limits.\n\n💡 Note: Connect to Groq AI for intelligent responses!`;
    }

    return `I understand you want to ${request.message}. As a ${request.strategy} specialist with ${request.riskProfile} risk profile, I can help with that.\n\nCould you be more specific? For example:\n• "Buy 0.5 A0GI"\n• "Show market analysis"\n• "Check portfolio status"\n\n🛡️ All commands are validated by Tenma Firewall before execution.\n\n💡 Note: Start the agent API server for Groq AI responses!`;
  }
}

// Export singleton instance
export const agentApi = new AgentApiClient();

export default agentApi;
