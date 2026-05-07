import { ethers } from "ethers";
import { OpenAI } from "openai";
import { ShieldPoolClient } from "./shieldpool-client";
import { ZeroGStorageClient } from "./storage-client";
import { AgentMemory } from "./memory";
import { Logger } from "./logger";
import { z } from "zod";

/**
 * ShieldPool Autonomous Trading Agent
 * 
 * An AI-powered agent that executes MEV-protected trades autonomously
 * using ShieldPool's commit-reveal mechanism and 0G Storage.
 * 
 * Features:
 * - Autonomous decision making using LLM
 * - MEV protection via ShieldPool
 * - Memory stored on 0G Storage
 * - Multiple trading strategies (DCA, Arbitrage, Limit Orders)
 * - Risk management and position sizing
 */

// Agent configuration schema
const AgentConfigSchema = z.object({
  name: z.string(),
  wallet: z.object({
    privateKey: z.string(),
    address: z.string(),
  }),
  strategies: z.array(z.enum(["dca", "arbitrage", "limit_order", "grid_trading"])),
  riskProfile: z.enum(["conservative", "moderate", "aggressive"]),
  maxPositionSize: z.string(), // ETH amount
  maxDailyTrades: z.number(),
  llmProvider: z.enum(["openai", "anthropic"]),
  llmModel: z.string(),
});

type AgentConfig = z.infer<typeof AgentConfigSchema>;

// Trading decision schema
const TradingDecisionSchema = z.object({
  action: z.enum(["buy", "sell", "hold", "wait"]),
  token: z.string(),
  amount: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  urgency: z.enum(["low", "medium", "high"]),
});

type TradingDecision = z.infer<typeof TradingDecisionSchema>;

export class ShieldPoolAgent {
  private config: AgentConfig;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private shieldPool: ShieldPoolClient;
  private storage: ZeroGStorageClient;
  private memory: AgentMemory;
  private llm: OpenAI;
  private logger: Logger;
  private isRunning: boolean = false;
  private tradeCount: number = 0;
  private lastResetTime: number = Date.now();

  constructor(config: AgentConfig) {
    this.config = AgentConfigSchema.parse(config);
    this.logger = new Logger(`Agent:${config.name}`);
    
    // Initialize blockchain connection
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(config.wallet.privateKey, this.provider);
    
    // Initialize ShieldPool client
    this.shieldPool = new ShieldPoolClient(
      this.wallet,
      process.env.SHIELDPOOL_CONTRACT_ADDRESS!
    );
    
    // Initialize 0G Storage client
    this.storage = new ZeroGStorageClient({
      endpoint: process.env.ZEROG_STORAGE_ENDPOINT!,
      apiKey: process.env.ZEROG_API_KEY,
    });
    
    // Initialize agent memory (stored on 0G)
    this.memory = new AgentMemory(this.storage, config.name);
    
    // Initialize LLM
    this.llm = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.logger.info("Agent initialized", {
      name: config.name,
      address: config.wallet.address,
      strategies: config.strategies,
    });
  }

  /**
   * Start the autonomous agent
   */
  async start(): Promise<void> {
    this.logger.info("Starting agent...");
    this.isRunning = true;
    
    // Load memory from 0G Storage
    await this.memory.load();
    
    // Main agent loop
    while (this.isRunning) {
      try {
        await this.executeCycle();
        
        // Wait before next cycle (5 minutes)
        await this.sleep(300000);
      } catch (error) {
        this.logger.error("Error in agent cycle", error);
        await this.sleep(60000); // Wait 1 minute on error
      }
    }
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    this.logger.info("Stopping agent...");
    this.isRunning = false;
    
    // Save memory to 0G Storage
    await this.memory.save();
  }

  /**
   * Execute one decision cycle
   */
  private async executeCycle(): Promise<void> {
    this.logger.info("Starting decision cycle");
    
    // Reset daily trade count if needed
    this.resetDailyTradeCountIfNeeded();
    
    // Check if we've hit daily trade limit
    if (this.tradeCount >= this.config.maxDailyTrades) {
      this.logger.info("Daily trade limit reached, skipping cycle");
      return;
    }
    
    // 1. Gather market data
    const marketData = await this.gatherMarketData();
    
    // 2. Get agent's current state
    const agentState = await this.getAgentState();
    
    // 3. Make trading decision using LLM
    const decision = await this.makeDecision(marketData, agentState);
    
    // 4. Execute decision if action required
    if (decision.action !== "hold" && decision.action !== "wait") {
      await this.executeDecision(decision);
    }
    
    // 5. Update memory
    await this.memory.addDecision(decision);
    await this.memory.save();
    
    this.logger.info("Cycle completed", { decision });
  }

  /**
   * Gather current market data
   */
  private async gatherMarketData(): Promise<any> {
    // Get ETH price, gas prices, DEX liquidity, etc.
    const [ethPrice, gasPrice, blockNumber] = await Promise.all([
      this.getETHPrice(),
      this.provider.getFeeData(),
      this.provider.getBlockNumber(),
    ]);
    
    return {
      ethPrice,
      gasPrice: gasPrice.gasPrice?.toString(),
      blockNumber,
      timestamp: Date.now(),
    };
  }

  /**
   * Get agent's current state
   */
  private async getAgentState(): Promise<any> {
    const balance = await this.provider.getBalance(this.wallet.address);
    const pendingCommitments = await this.shieldPool.getPendingCommitments(
      this.wallet.address
    );
    
    return {
      balance: ethers.formatEther(balance),
      pendingCommitments: pendingCommitments.length,
      tradeCount: this.tradeCount,
      maxDailyTrades: this.config.maxDailyTrades,
      recentDecisions: await this.memory.getRecentDecisions(10),
    };
  }

  /**
   * Make trading decision using LLM
   */
  private async makeDecision(
    marketData: any,
    agentState: any
  ): Promise<TradingDecision> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(marketData, agentState);
    
    this.logger.info("Querying LLM for decision");
    
    const response = await this.llm.chat.completions.create({
      model: this.config.llmModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from LLM");
    }
    
    const decision = JSON.parse(content);
    return TradingDecisionSchema.parse(decision);
  }

  /**
   * Build system prompt for LLM
   */
  private buildSystemPrompt(): string {
    return `You are an autonomous trading agent named "${this.config.name}" with a ${this.config.riskProfile} risk profile.

Your capabilities:
- Execute MEV-protected trades via ShieldPool (commit-reveal mechanism)
- Analyze market conditions and make trading decisions
- Manage risk and position sizing
- Learn from past decisions stored in memory

Your strategies: ${this.config.strategies.join(", ")}

Risk Management Rules:
- Max position size: ${this.config.maxPositionSize} ETH
- Max daily trades: ${this.config.maxDailyTrades}
- Risk profile: ${this.config.riskProfile}

You must respond with a JSON object containing:
{
  "action": "buy" | "sell" | "hold" | "wait",
  "token": "token address or symbol",
  "amount": "amount in ETH",
  "reasoning": "detailed explanation of your decision",
  "confidence": 0.0 to 1.0,
  "urgency": "low" | "medium" | "high"
}

IMPORTANT: All trades will be protected from MEV attacks using ShieldPool's commit-reveal mechanism. This means:
1. Your transaction intent is encrypted and committed on-chain
2. After a 5-minute delay, the transaction is revealed and executed
3. MEV bots cannot front-run your trades

Consider this protection when making decisions - you can execute larger trades safely.`;
  }

  /**
   * Build user prompt with current data
   */
  private buildUserPrompt(marketData: any, agentState: any): string {
    return `Current Market Data:
- ETH Price: $${marketData.ethPrice}
- Gas Price: ${ethers.formatUnits(marketData.gasPrice || "0", "gwei")} gwei
- Block Number: ${marketData.blockNumber}

Your Current State:
- Balance: ${agentState.balance} ETH
- Pending Commitments: ${agentState.pendingCommitments}
- Trades Today: ${agentState.tradeCount}/${agentState.maxDailyTrades}

Recent Decisions:
${JSON.stringify(agentState.recentDecisions, null, 2)}

Based on this information, what trading action should you take right now?`;
  }

  /**
   * Execute trading decision via ShieldPool
   */
  private async executeDecision(decision: TradingDecision): Promise<void> {
    this.logger.info("Executing decision", decision);
    
    // Build transaction payload
    const payload = await this.buildTransactionPayload(decision);
    
    // Submit via ShieldPool (commit-reveal)
    const result = await this.shieldPool.submitTransaction({
      target: decision.token,
      value: ethers.parseEther(decision.amount),
      data: payload,
    });
    
    this.logger.info("Transaction committed", {
      commitmentHash: result.commitmentHash,
      storageId: result.storageId,
    });
    
    // Schedule reveal after execution delay
    setTimeout(async () => {
      try {
        await this.shieldPool.revealTransaction(result.commitmentHash);
        this.logger.info("Transaction revealed and executed", {
          commitmentHash: result.commitmentHash,
        });
      } catch (error) {
        this.logger.error("Failed to reveal transaction", error);
      }
    }, 300000); // 5 minutes
    
    this.tradeCount++;
  }

  /**
   * Build transaction payload for DEX swap
   */
  private async buildTransactionPayload(decision: TradingDecision): Promise<string> {
    // This would integrate with Uniswap/1inch/etc
    // For now, return placeholder
    return "0x";
  }

  /**
   * Get current ETH price from oracle
   */
  private async getETHPrice(): Promise<number> {
    // Integrate with Chainlink or other price oracle
    // For now, return mock price
    return 3000;
  }

  /**
   * Reset daily trade count if new day
   */
  private resetDailyTradeCountIfNeeded(): void {
    const now = Date.now();
    const dayInMs = 86400000;
    
    if (now - this.lastResetTime > dayInMs) {
      this.tradeCount = 0;
      this.lastResetTime = now;
      this.logger.info("Daily trade count reset");
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Example usage
async function main() {
  const agent = new ShieldPoolAgent({
    name: "ShieldBot-Alpha",
    wallet: {
      privateKey: process.env.AGENT_PRIVATE_KEY!,
      address: process.env.AGENT_ADDRESS!,
    },
    strategies: ["dca", "arbitrage"],
    riskProfile: "moderate",
    maxPositionSize: "1.0",
    maxDailyTrades: 10,
    llmProvider: "openai",
    llmModel: "gpt-4-turbo-preview",
  });
  
  await agent.start();
}

if (require.main === module) {
  main().catch(console.error);
}

export default ShieldPoolAgent;
