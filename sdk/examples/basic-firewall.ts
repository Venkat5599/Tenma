/**
 * Basic Firewall Usage Example
 * 
 * This example demonstrates:
 * - Initializing the firewall
 * - Setting policies
 * - Executing protected transactions
 * - Handling results
 */

import { TenmaFirewall } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🛡️  Tenma Firewall - Basic Usage Example\n');

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

  // 2. Check balance
  console.log('2️⃣  Checking wallet balance...');
  const balance = await firewall.getBalance();
  console.log(`   Balance: ${balance} A0GI\n`);

  // 3. Set policies
  console.log('3️⃣  Setting firewall policies...');
  await firewall.setPolicy({
    maxTransactionAmount: '10.0',
    maxDailyAmount: '50.0',
    whitelistedContracts: [],
    maxRiskScore: 50,
    requireManualApproval: false,
  });
  console.log('✅ Policies set\n');

  // 4. Simulate transaction (check without executing)
  console.log('4️⃣  Simulating transaction...');
  const violations = await firewall.simulateTransaction({
    to: '0x1234567890123456789012345678901234567890',
    value: '1.0',
    data: '0x',
  });

  if (violations.length > 0) {
    console.log('   ⚠️  Violations found:');
    violations.forEach(v => {
      console.log(`      - ${v.rule}: ${v.message}`);
    });
  } else {
    console.log('   ✅ No violations\n');
  }

  // 5. Execute protected transaction
  console.log('5️⃣  Executing protected transaction...');
  const result = await firewall.executeTransaction({
    to: '0x1234567890123456789012345678901234567890',
    value: '0.01',
    data: '0x',
  });

  console.log(`   Status: ${result.status}`);
  if (result.commitmentHash) {
    console.log(`   Commitment Hash: ${result.commitmentHash}`);
    console.log(`   ⏰ Transaction will be revealed in 5 minutes`);
  }

  if (result.violations.length > 0) {
    console.log('   Violations:');
    result.violations.forEach(v => {
      console.log(`      - ${v.rule}: ${v.message}`);
    });
  }

  console.log('\n✅ Example completed!');
}

main().catch(console.error);
