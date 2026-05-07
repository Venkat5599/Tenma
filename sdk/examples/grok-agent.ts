/**
 * Grok AI Agent Example
 * 
 * This example demonstrates:
 * - Creating a Grok-powered AI agent
 * - Autonomous decision making
 * - Real-time policy enforcement
 * - Transaction blocking
 */

import { TenmaFirewall, GrokAgent, EventType } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🤖 Tenma Firewall - Grok AI Agent Example\n');

  // 1. Initialize firewall
  console.log('1️⃣  Initializing firewall...');
  const firewall = new TenmaFirewall({
    contractAddress: '0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d',
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    privateKey: process.env.PRIVATE_KEY!,
    chainId: 16602,
  });

  await firewall.initialize();
  console.log('✅ Firewall initialized\n');

  // 2. Set policies
  console.log('2️⃣  Setting firewall policies...');
  await firewall.setPolicy({
    maxTransactionAmount: '5.0',
    maxDailyAmount: '20.0',
    whitelistedContracts: [],
    maxRiskScore: 50,
    requireManualApproval: false,
  });
  console.log('✅ Policies set\n');

  // 3. Set up event listeners
  console.log('3️⃣  Setting up event listeners...');
  
  firewall.on(EventType.TRANSACTION_BLOCKED, (data) => {
    console.log('\n🚫 TRANSACTION BLOCKED BY FIREWALL:');
    data.violations.forEach((v: any) => {
      console.log(`   ❌ ${v.rule}: ${v.message}`);
    });
  });

  firewall.on(EventType.COMMITMENT_CREATED, (data) => {
    console.log('\n✅ Transaction committed to blockchain');
    console.log(`   Commitment Hash: ${data.commitmentHash}`);
  });

  firewall.on(EventType.TRANSACTION_EXECUTED, (data) => {
    console.log('\n✅ Transaction executed successfully');
    console.log(`   TX Hash: ${data.transactionHash}`);
  });

  console.log('✅ Event listeners set up\n');

  // 4. Create Grok AI agent
  console.log('4️⃣  Creating Grok AI agent...');
  const agent = new GrokAgent({
    apiKey: process.env.GROK_API_KEY!,
    model: 'grok-beta',
    name: 'TenmaBot-Demo',
    strategies: ['dca', 'arbitrage'],
    riskProfile: 'moderate',
    maxPositionSize: '1.0',
    maxDailyTrades: 5,
    decisionInterval: 60000, // 1 minute for demo
  }, firewall);

  console.log('✅ Agent created\n');

  // 5. Start agent
  console.log('5️⃣  Starting autonomous agent...');
  console.log('   Agent will make decisions every 60 seconds');
  console.log('   Press Ctrl+C to stop\n');

  await agent.start();

  // 6. Monitor agent state
  setInterval(() => {
    const state = agent.getState();
    const stats = agent.getStatistics();

    console.log('\n📊 Agent Status:');
    console.log(`   Balance: ${state.balance} A0GI`);
    console.log(`   Trades Executed: ${state.tradesExecuted}/${agent['config'].maxDailyTrades}`);
    console.log(`   Trades Blocked: ${state.tradesBlocked}`);
    console.log(`   Block Rate: ${(stats.blockRate * 100).toFixed(1)}%`);
    console.log(`   Avg Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    
    if (state.lastDecision) {
      console.log(`   Last Decision: ${state.lastDecision.action.toUpperCase()}`);
      console.log(`   Reasoning: ${state.lastDecision.reasoning}`);
    }
  }, 30000); // Every 30 seconds

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down agent...');
    await agent.stop();
    await firewall.destroy();
    console.log('✅ Agent stopped');
    process.exit(0);
  });
}

main().catch(console.error);
