/**
 * Real-Time Blocking Demo
 * 
 * This example demonstrates:
 * - Real-time transaction blocking
 * - Policy violation detection
 * - Different violation scenarios
 */

import { TenmaFirewall, EventType } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚫 Tenma Firewall - Real-Time Blocking Demo\n');

  // Initialize firewall
  const firewall = new TenmaFirewall({
    contractAddress: '0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d',
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    privateKey: process.env.PRIVATE_KEY!,
  });

  await firewall.initialize();

  // Set up event listener
  firewall.on(EventType.TRANSACTION_BLOCKED, (data) => {
    console.log('\n🚫 TRANSACTION BLOCKED:');
    data.violations.forEach((v: any) => {
      const icon = v.severity === 'critical' ? '❌' : '⚠️';
      console.log(`   ${icon} [${v.severity.toUpperCase()}] ${v.rule}`);
      console.log(`      ${v.message}`);
    });
  });

  // Set strict policies
  console.log('Setting strict policies...\n');
  await firewall.setPolicy({
    maxTransactionAmount: '1.0',
    maxDailyAmount: '5.0',
    whitelistedContracts: [
      '0x1111111111111111111111111111111111111111',
    ],
    blacklistedContracts: [
      '0x2222222222222222222222222222222222222222',
    ],
    maxRiskScore: 30,
  });

  // Test scenarios
  console.log('🧪 Testing different blocking scenarios...\n');

  // Scenario 1: Amount exceeds limit
  console.log('Scenario 1: Amount exceeds limit');
  console.log('Attempting to send 10 ETH (limit: 1 ETH)...');
  await firewall.executeTransaction({
    to: '0x1111111111111111111111111111111111111111',
    value: '10.0',
    data: '0x',
  });
  await sleep(2000);

  // Scenario 2: Blacklisted recipient
  console.log('\nScenario 2: Blacklisted recipient');
  console.log('Attempting to send to blacklisted address...');
  await firewall.executeTransaction({
    to: '0x2222222222222222222222222222222222222222',
    value: '0.5',
    data: '0x',
  });
  await sleep(2000);

  // Scenario 3: Not whitelisted
  console.log('\nScenario 3: Not whitelisted');
  console.log('Attempting to send to non-whitelisted address...');
  await firewall.executeTransaction({
    to: '0x3333333333333333333333333333333333333333',
    value: '0.5',
    data: '0x',
  });
  await sleep(2000);

  // Scenario 4: Valid transaction
  console.log('\nScenario 4: Valid transaction');
  console.log('Attempting valid transaction...');
  const result = await firewall.executeTransaction({
    to: '0x1111111111111111111111111111111111111111',
    value: '0.5',
    data: '0x',
  });

  if (result.status === 'committed') {
    console.log('✅ Transaction passed all checks!');
    console.log(`   Commitment Hash: ${result.commitmentHash}`);
    console.log(`   Status: ${result.status}`);
  }

  console.log('\n✅ Demo completed!');
  await firewall.destroy();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
