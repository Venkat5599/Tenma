import axios, { AxiosInstance } from 'axios';

const AGENT_API_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:3001';

export interface AgentStatus {
  isRunning: boolean;
  balance: string;
  tradesExecuted: number;
  tradesBlocked: number;
  lastDecision: any | null;
  address: string;
  network: string;
}

export interface ChatRequest {
  message: string;
  strategy?: string;
  riskProfile?: string;
}

export interface ChatResponse {
  response: string;
  timestamp: number;
}

export interface DecisionRequest {
  strategy?: string;
  riskProfile?: string;
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
  marketData: any;
  timestamp: number;
}

export interface StorageStats {
  totalUploads: number;
  totalSize: number;
  successRate: number;
  averageUploadTime: number;
  averageRetrieveTime: number;
}

/**
 * Agent API Client
 * 
 * Handles all communication with the agent backend API
 */
class AgentApiClient {
  private client: AxiosInstance;
  private isAvailable: boolean = false;

  constructor() {
    this.client = axios.create({
      baseURL: AGENT_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check availability
    this.checkHealth();
  }

  /**
   * Check if API is available
   */
  private async checkHealth(): Promise<void> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      this.isAvailable = true;
      console.log('✅ Agent API is available');
    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️ Agent API is not available, using fallback mode');
    }
  }

  /**
   * Get API availability status
   */
  getAvailability(): boolean {
    return this.isAvailable;
  }

  /**
   * Get agent status
   */
  async getStatus(): Promise<AgentStatus> {
    try {
      const response = await this.client.get<AgentStatus>('/agent/status');
      return response.data;
    } catch (error) {
      console.error('Error getting agent status:', error);
      throw error;
    }
  }

  /**
   * Start the agent
   */
  async start(): Promise<{ message: string; state: AgentStatus }> {
    try {
      const response = await this.client.post('/agent/start');
      return response.data;
    } catch (error) {
      console.error('Error starting agent:', error);
      throw error;
    }
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<{ message: string; state: AgentStatus }> {
    try {
      const response = await this.client.post('/agent/stop');
      return response.data;
    } catch (error) {
      console.error('Error stopping agent:', error);
      throw error;
    }
  }

  /**
   * Chat with the agent
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.client.post<ChatResponse>('/agent/chat', request);
      return response.data;
    } catch (error) {
      console.error('Error chatting with agent:', error);
      throw error;
    }
  }

  /**
   * Get trading decision from agent
   */
  async getDecision(request: DecisionRequest): Promise<DecisionResponse> {
    try {
      const response = await this.client.post<DecisionResponse>('/agent/decision', request);
      return response.data;
    } catch (error) {
      console.error('Error getting decision:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const response = await this.client.get<StorageStats>('/storage/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }

  /**
   * List stored items
   */
  async listStorageItems(prefix?: string): Promise<string[]> {
    try {
      const response = await this.client.get<{ items: string[] }>('/storage/list', {
        params: { prefix },
      });
      return response.data.items;
    } catch (error) {
      console.error('Error listing storage items:', error);
      throw error;
    }
  }

  /**
   * Retrieve item from storage
   */
  async retrieveFromStorage(key: string): Promise<any> {
    try {
      const response = await this.client.get<{ data: any }>(`/storage/retrieve/${key}`);
      return response.data.data;
    } catch (error) {
      console.error('Error retrieving from storage:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const agentApi = new AgentApiClient();

export default agentApi;
