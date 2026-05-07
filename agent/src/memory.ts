import { ZeroGStorageClient } from "./storage-client";
import { Logger } from "./logger";

/**
 * Agent Memory System
 * 
 * Stores agent's decision history, learned patterns, and state on 0G Storage
 * for persistence and verifiability.
 */

interface Decision {
  timestamp: number;
  action: string;
  token: string;
  amount: string;
  reasoning: string;
  confidence: number;
  outcome?: {
    success: boolean;
    profit?: string;
    gasUsed?: string;
  };
}

interface MemoryState {
  agentName: string;
  decisions: Decision[];
  learnedPatterns: Record<string, any>;
  statistics: {
    totalTrades: number;
    successfulTrades: number;
    totalProfit: string;
    averageConfidence: number;
  };
  lastUpdated: number;
}

export class AgentMemory {
  private storage: ZeroGStorageClient;
  private agentName: string;
  private logger: Logger;
  private state: MemoryState;
  private storageId?: string;

  constructor(storage: ZeroGStorageClient, agentName: string) {
    this.storage = storage;
    this.agentName = agentName;
    this.logger = new Logger(`Memory:${agentName}`);
    
    // Initialize empty state
    this.state = {
      agentName,
      decisions: [],
      learnedPatterns: {},
      statistics: {
        totalTrades: 0,
        successfulTrades: 0,
        totalProfit: "0",
        averageConfidence: 0,
      },
      lastUpdated: Date.now(),
    };
  }

  /**
   * Load memory from 0G Storage
   */
  async load(): Promise<void> {
    try {
      this.logger.info("Loading memory from 0G Storage");
      
      // Try to retrieve existing memory
      const memoryKey = `shieldpool-agent-memory-${this.agentName}`;
      const data = await this.storage.retrieve(memoryKey);
      
      if (data) {
        this.state = JSON.parse(data);
        this.storageId = memoryKey;
        this.logger.info("Memory loaded", {
          decisions: this.state.decisions.length,
          totalTrades: this.state.statistics.totalTrades,
        });
      } else {
        this.logger.info("No existing memory found, starting fresh");
      }
    } catch (error) {
      this.logger.error("Failed to load memory", error);
      // Continue with empty state
    }
  }

  /**
   * Save memory to 0G Storage
   */
  async save(): Promise<void> {
    try {
      this.logger.info("Saving memory to 0G Storage");
      
      this.state.lastUpdated = Date.now();
      const data = JSON.stringify(this.state, null, 2);
      
      const memoryKey = `shieldpool-agent-memory-${this.agentName}`;
      await this.storage.upload(memoryKey, data);
      
      this.storageId = memoryKey;
      this.logger.info("Memory saved", {
        storageId: this.storageId,
        size: data.length,
      });
    } catch (error) {
      this.logger.error("Failed to save memory", error);
      throw error;
    }
  }

  /**
   * Add a new decision to memory
   */
  async addDecision(decision: Decision): Promise<void> {
    this.state.decisions.push(decision);
    
    // Update statistics
    this.state.statistics.totalTrades++;
    
    // Keep only last 1000 decisions to prevent unbounded growth
    if (this.state.decisions.length > 1000) {
      this.state.decisions = this.state.decisions.slice(-1000);
    }
    
    this.logger.info("Decision added to memory", {
      action: decision.action,
      confidence: decision.confidence,
    });
  }

  /**
   * Update decision outcome after execution
   */
  async updateDecisionOutcome(
    timestamp: number,
    outcome: Decision["outcome"]
  ): Promise<void> {
    const decision = this.state.decisions.find((d) => d.timestamp === timestamp);
    
    if (decision && outcome) {
      decision.outcome = outcome;
      
      if (outcome.success) {
        this.state.statistics.successfulTrades++;
      }
      
      this.logger.info("Decision outcome updated", {
        timestamp,
        success: outcome.success,
      });
    }
  }

  /**
   * Get recent decisions
   */
  async getRecentDecisions(count: number = 10): Promise<Decision[]> {
    return this.state.decisions.slice(-count);
  }

  /**
   * Get decisions by action type
   */
  async getDecisionsByAction(action: string): Promise<Decision[]> {
    return this.state.decisions.filter((d) => d.action === action);
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.state.statistics.totalTrades === 0) return 0;
    return (
      this.state.statistics.successfulTrades / this.state.statistics.totalTrades
    );
  }

  /**
   * Learn patterns from historical decisions
   */
  async learnPatterns(): Promise<void> {
    // Analyze decision history to identify patterns
    const patterns: Record<string, any> = {};
    
    // Pattern 1: Best time of day for trades
    const hourlySuccess: Record<number, { total: number; success: number }> = {};
    
    for (const decision of this.state.decisions) {
      if (!decision.outcome) continue;
      
      const hour = new Date(decision.timestamp).getHours();
      if (!hourlySuccess[hour]) {
        hourlySuccess[hour] = { total: 0, success: 0 };
      }
      
      hourlySuccess[hour].total++;
      if (decision.outcome.success) {
        hourlySuccess[hour].success++;
      }
    }
    
    patterns.hourlySuccess = hourlySuccess;
    
    // Pattern 2: Confidence vs Success correlation
    const confidenceBuckets: Record<string, { total: number; success: number }> = {
      low: { total: 0, success: 0 },
      medium: { total: 0, success: 0 },
      high: { total: 0, success: 0 },
    };
    
    for (const decision of this.state.decisions) {
      if (!decision.outcome) continue;
      
      const bucket =
        decision.confidence < 0.5
          ? "low"
          : decision.confidence < 0.8
          ? "medium"
          : "high";
      
      confidenceBuckets[bucket].total++;
      if (decision.outcome.success) {
        confidenceBuckets[bucket].success++;
      }
    }
    
    patterns.confidenceBuckets = confidenceBuckets;
    
    this.state.learnedPatterns = patterns;
    this.logger.info("Patterns learned", patterns);
  }

  /**
   * Get learned patterns
   */
  getLearnedPatterns(): Record<string, any> {
    return this.state.learnedPatterns;
  }

  /**
   * Export memory for backup
   */
  async export(): Promise<string> {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Import memory from backup
   */
  async import(data: string): Promise<void> {
    this.state = JSON.parse(data);
    await this.save();
    this.logger.info("Memory imported");
  }

  /**
   * Clear all memory
   */
  async clear(): Promise<void> {
    this.state = {
      agentName: this.agentName,
      decisions: [],
      learnedPatterns: {},
      statistics: {
        totalTrades: 0,
        successfulTrades: 0,
        totalProfit: "0",
        averageConfidence: 0,
      },
      lastUpdated: Date.now(),
    };
    
    await this.save();
    this.logger.info("Memory cleared");
  }
}
