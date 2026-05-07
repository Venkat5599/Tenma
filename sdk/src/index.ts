/**
 * @tenma/firewall-sdk
 * 
 * On-Chain Firewall SDK for AI Agents on 0G Network
 * 
 * Features:
 * - Policy enforcement at smart contract level
 * - MEV protection via commit-reveal
 * - Real-time transaction blocking
 * - Tenma AI integration for autonomous agents
 * - 0G Storage for encrypted payloads
 * 
 * @example
 * ```typescript
 * import { TenmaFirewall, TenmaAgent } from '@tenma/firewall-sdk';
 * 
 * const firewall = new TenmaFirewall({
 *   contractAddress: '0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d',
 *   rpcUrl: 'https://evmrpc-testnet.0g.ai',
 *   privateKey: process.env.PRIVATE_KEY
 * });
 * 
 * // Set policies
 * await firewall.setPolicy({
 *   maxTransactionAmount: '10000',
 *   maxDailyAmount: '50000',
 *   whitelistedContracts: ['0x...']
 * });
 * 
 * // Execute protected transaction
 * const tx = await firewall.executeTransaction({
 *   to: '0xRecipient...',
 *   value: '1.0',
 *   data: '0x'
 * });
 * ```
 */

export * from './TenmaFirewall';
export * from './TenmaAgent';
export * from './PolicyManager';
export * from './TransactionGuard';
export * from './StorageClient';
export * from './types';
export * from './utils';
