import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { TenmaService } from './tenma-service';
import { ZeroGStorageClient } from './storage-client';
import { Logger } from './logger';

dotenv.config();

const app = express();
const logger = new Logger('AgentAPI');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);

const tenmaService = new TenmaService({
  apiKey: process.env.TENMA_API_KEY || process.env.OPENAI_API_KEY || '',
  model: 'gpt-4-turbo-preview',
  fallbackToOpenAI: true,
});

const storage = new ZeroGStorageClient({
  endpoint: process.env.ZEROG_STORAGE_ENDPOINT || 'https://storage-testnet.0g.ai',
  apiKey: process.env.ZEROG_API_KEY,
});

// Agent state
interface AgentState {
  isRunning: boolean;
  balance: string;
  tradesExecuted: number;
  tradesBlocked: number;
  lastDecision: any | null;
}

let agentState: AgentState = {
  isRunning: false,
  balance: '0',
  tradesExecuted: 0,
  tradesBlocked: 0,
  lastDecision: null,
};

// Routes

/**
 * GET /health
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    services: {
      tenma: tenmaService.isAvailable(),
      storage: true,
      blockchain: true,
    },
  });
});

/**
 * GET /agent/status
 * Get agent status
 */
app.get('/agent/status', async (req, res) => {
  try {
    const balance = await provider.getBalance(wallet.address);
    agentState.balance = ethers.formatEther(balance);

    res.json({
      ...agentState,
      address: wallet.address,
      network: 'OG Newton Testnet',
    });
  } catch (error: any) {
    logger.error('Error getting agent status', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /agent/start
 * Start the agent
 */
app.post('/agent/start', async (req, res) => {
  try {
    if (agentState.isRunning) {
      return res.status(400).json({ error: 'Agent is already running' });
    }

    agentState.isRunning = true;
    logger.info('Agent started');

    res.json({
      message: 'Agent started successfully',
      state: agentState,
    });
  } catch (error: any) {
    logger.error('Error starting agent', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /agent/stop
 * Stop the agent
 */
app.post('/agent/stop', async (req, res) => {
  try {
    agentState.isRunning = false;
    logger.info('Agent stopped');

    res.json({
      message: 'Agent stopped successfully',
      state: agentState,
    });
  } catch (error: any) {
    logger.error('Error stopping agent', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /agent/chat
 * Chat with the agent
 */
app.post('/agent/chat', async (req, res) => {
  try {
    const { message, strategy = 'dca', riskProfile = 'moderate' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    logger.info('Processing chat message', { message, strategy });

    // Get agent response
    const response = await tenmaService.chat({
      message,
      strategy,
      riskProfile,
      balance: agentState.balance,
      tradesExecuted: agentState.tradesExecuted,
    });

    // Store in 0G Storage
    try {
      await storage.upload(
        `chat/${Date.now()}`,
        JSON.stringify({
          message,
          response,
          timestamp: Date.now(),
        })
      );
    } catch (storageError) {
      logger.warn('Failed to store chat in 0G Storage', storageError);
    }

    res.json({
      response,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    logger.error('Error processing chat', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /agent/decision
 * Make a trading decision
 */
app.post('/agent/decision', async (req, res) => {
  try {
    const { strategy = 'dca', riskProfile = 'moderate' } = req.body;

    logger.info('Making trading decision', { strategy, riskProfile });

    // Get market data
    const blockNumber = await provider.getBlockNumber();
    const feeData = await provider.getFeeData();

    const marketData = {
      blockNumber,
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0',
      timestamp: Date.now(),
    };

    // Make decision
    const decision = await tenmaService.makeDecision({
      strategy,
      riskProfile,
      balance: agentState.balance,
      tradesExecuted: agentState.tradesExecuted,
      maxDailyTrades: 10,
      marketData,
    });

    // Store decision in 0G Storage
    try {
      await storage.upload(
        `decisions/${Date.now()}`,
        JSON.stringify({
          decision,
          marketData,
          timestamp: Date.now(),
        })
      );
    } catch (storageError) {
      logger.warn('Failed to store decision in 0G Storage', storageError);
    }

    agentState.lastDecision = decision;

    res.json({
      decision,
      marketData,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    logger.error('Error making decision', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /storage/stats
 * Get storage statistics
 */
app.get('/storage/stats', async (req, res) => {
  try {
    const stats = storage.getStats();
    res.json(stats);
  } catch (error: any) {
    logger.error('Error getting storage stats', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /storage/list
 * List stored items
 */
app.get('/storage/list', async (req, res) => {
  try {
    const { prefix } = req.query;
    const items = await storage.list(prefix as string);
    res.json({ items });
  } catch (error: any) {
    logger.error('Error listing storage items', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /storage/retrieve/:key
 * Retrieve item from storage
 */
app.get('/storage/retrieve/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const data = await storage.retrieve(key);
    res.json({ data: JSON.parse(data) });
  } catch (error: any) {
    logger.error('Error retrieving from storage', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.AGENT_API_PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Agent API server running on port ${PORT}`);
  logger.info(`Wallet address: ${wallet.address}`);
  logger.info(`Network: 0G Newton Testnet`);
  logger.info(`Tenma AI: ${tenmaService.isAvailable() ? 'Available' : 'Using fallback'}`);
});

export default app;
