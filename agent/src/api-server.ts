import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GroqService } from './groq-service';
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
const wallet = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, provider) : null;

const groqService = new GroqService({
  apiKey: process.env.GROQ_API_KEY || '',
  model: process.env.LLM_MODEL || 'llama-3.1-70b-versatile',
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
    provider: 'Groq',
    model: 'llama-3.1-70b-versatile',
    services: {
      groq: true,
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
    if (wallet) {
      const balance = await provider.getBalance(wallet.address);
      agentState.balance = ethers.formatEther(balance);
    }

    res.json({
      ...agentState,
      address: wallet?.address || 'Not configured',
      network: '0G Newton Testnet',
      aiProvider: 'Groq (Llama 3.1 70B)',
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
    const { message, strategy = 'DCA', riskProfile = 'moderate', account } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    logger.info('Processing chat message', { message: message.substring(0, 50), strategy });

    // Get agent response from Groq
    const response = await groqService.chat({
      message,
      strategy,
      riskProfile,
      balance: agentState.balance,
      tradesExecuted: agentState.tradesExecuted,
      account,
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
      provider: 'groq',
      model: 'llama-3.1-70b-versatile',
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
    const { strategy = 'DCA', riskProfile = 'moderate', account } = req.body;

    logger.info('Making trading decision', { strategy, riskProfile });

    // Make decision using Groq
    const decision = await groqService.makeDecision({
      message: 'Make a trading decision based on current market conditions',
      strategy,
      riskProfile,
      balance: agentState.balance,
      tradesExecuted: agentState.tradesExecuted,
      account,
    });

    // Store decision in 0G Storage
    try {
      await storage.upload(
        `decisions/${Date.now()}`,
        JSON.stringify({
          decision,
          timestamp: Date.now(),
        })
      );
    } catch (storageError) {
      logger.warn('Failed to store decision in 0G Storage', storageError);
    }

    agentState.lastDecision = decision;

    res.json({
      decision,
      provider: 'groq',
      model: 'llama-3.1-70b-versatile',
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
// app.get('/storage/stats', async (req, res) => {
//   try {
//     const stats = storage.getStats();
//     res.json(stats);
//   } catch (error: any) {
//     logger.error('Error getting storage stats', error);
//     res.status(500).json({ error: error.message });
//   }
// });

/**
 * GET /storage/list
 * List stored items
 */
// app.get('/storage/list', async (req, res) => {
//   try {
//     const { prefix } = req.query;
//     const items = await storage.list(prefix as string);
//     res.json({ items });
//   } catch (error: any) {
//     logger.error('Error listing storage items', error);
//     res.status(500).json({ error: error.message });
//   }
// });

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
  logger.info(`🚀 Tenma Agent API running on port ${PORT}`);
  logger.info(`🤖 AI Provider: Groq (Llama 3.1 70B)`);
  logger.info(`🌐 Network: 0G Newton Testnet`);
  if (wallet) {
    logger.info(`💰 Wallet: ${wallet.address}`);
  }
  logger.info(`📡 Endpoints:`);
  logger.info(`   GET  /health`);
  logger.info(`   GET  /agent/status`);
  logger.info(`   POST /agent/chat`);
  logger.info(`   POST /agent/decision`);
});

export default app;
