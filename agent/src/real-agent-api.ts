/**
 * Real Agent API Server
 * Express server for the real agent with tools, memory, and approvals
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Logger } from './logger';
import { realAgent } from './real-agent';
import { db } from './database';

dotenv.config();

const app = express();
const logger = new Logger('RealAgentAPI');

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    agent: 'real',
    features: {
      tools: true,
      memory: true,
      approvals: true,
      database: true,
    },
  });
});

// Chat with real agent
app.post('/agent/chat', async (req, res) => {
  try {
    const { message, address } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    logger.info('Processing chat request', { address, message: message.substring(0, 50) });

    const startTime = Date.now();
    const response = await realAgent.process(message, address);
    const responseTime = Date.now() - startTime;

    res.json({
      ...response,
      responseTime: `${responseTime}ms`,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    logger.error('Chat error', error);
    res.status(500).json({
      error: error.message,
      message: 'I encountered an error processing your request. Please try again.',
    });
  }
});

// Get conversation history
app.get('/agent/history/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const history = await db.getConversationHistory(address, limit);

    res.json({
      history,
      count: history.length,
    });
  } catch (error: any) {
    logger.error('History error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending approvals
app.get('/agent/approvals/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const approvals = await db.getPendingApprovals(address);

    res.json({
      approvals,
      count: approvals.length,
    });
  } catch (error: any) {
    logger.error('Approvals error', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve action
app.post('/agent/approve/:approvalId', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    logger.info('Approving action', { approvalId, address });

    const result = await realAgent.executeApprovedAction(approvalId, address);

    res.json({
      success: true,
      result,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    logger.error('Approval error', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject action
app.post('/agent/reject/:approvalId', async (req, res) => {
  try {
    const { approvalId } = req.params;

    await db.updateApprovalStatus(approvalId, 'rejected');

    res.json({
      success: true,
      message: 'Action rejected',
    });
  } catch (error: any) {
    logger.error('Rejection error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get execution logs
app.get('/agent/logs/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const logs = await db.getExecutionLogs(address, limit);

    res.json({
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    logger.error('Logs error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
app.get('/agent/stats/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const stats = await db.getUserStats(address);

    res.json(stats);
  } catch (error: any) {
    logger.error('Stats error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/agent/profile/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const profile = await db.getUserProfile(address);

    res.json(profile || { message: 'Profile not found' });
  } catch (error: any) {
    logger.error('Profile error', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.post('/agent/profile/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { strategy, risk_profile, preferences } = req.body;

    const profile = await db.createOrUpdateProfile(address, {
      strategy,
      risk_profile,
      preferences,
    });

    res.json(profile);
  } catch (error: any) {
    logger.error('Profile update error', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.AGENT_API_PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Real Agent API server running on port ${PORT}`);
  logger.info('Features: Tools, Memory, Approvals, Database');
  logger.info('Endpoints:');
  logger.info('  POST /agent/chat - Chat with agent');
  logger.info('  GET  /agent/history/:address - Get conversation history');
  logger.info('  GET  /agent/approvals/:address - Get pending approvals');
  logger.info('  POST /agent/approve/:approvalId - Approve action');
  logger.info('  POST /agent/reject/:approvalId - Reject action');
  logger.info('  GET  /agent/logs/:address - Get execution logs');
  logger.info('  GET  /agent/stats/:address - Get user stats');
  logger.info('  GET  /agent/profile/:address - Get user profile');
  logger.info('  POST /agent/profile/:address - Update user profile');
});

export default app;
