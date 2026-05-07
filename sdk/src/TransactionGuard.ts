import { TransactionRequest, PolicyViolation } from './types';
import { PolicyManager } from './PolicyManager';
import { ethers } from 'ethers';

/**
 * TransactionGuard - Validates transactions against policies
 */
export class TransactionGuard {
  constructor(private policyManager: PolicyManager) {}

  /**
   * Check transaction against all policies
   */
  async checkTransaction(request: TransactionRequest): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Check max transaction amount
    if (!this.policyManager.checkMaxTransactionAmount(request.value)) {
      const policy = this.policyManager.getPolicy();
      violations.push({
        rule: 'MAX_TRANSACTION_AMOUNT',
        message: `Transaction amount ${request.value} ETH exceeds maximum allowed ${ethers.formatEther(policy.maxTransactionAmount)} ETH`,
        severity: 'critical',
        blocked: true,
      });
    }

    // Check blacklist
    if (this.policyManager.isBlacklisted(request.to)) {
      violations.push({
        rule: 'BLACKLISTED_CONTRACT',
        message: `Recipient ${request.to} is blacklisted`,
        severity: 'critical',
        blocked: true,
      });
    }

    // Check whitelist
    if (!this.policyManager.isWhitelisted(request.to)) {
      violations.push({
        rule: 'NOT_WHITELISTED',
        message: `Recipient ${request.to} is not in whitelist`,
        severity: 'high',
        blocked: true,
      });
    }

    // Check time restrictions
    if (!this.policyManager.checkTimeRestrictions()) {
      const policy = this.policyManager.getPolicy();
      violations.push({
        rule: 'TIME_RESTRICTION',
        message: `Transactions only allowed between ${policy.timeRestrictions?.startHour}:00 and ${policy.timeRestrictions?.endHour}:00`,
        severity: 'medium',
        blocked: true,
      });
    }

    // Check gas price if specified
    if (request.maxFeePerGas) {
      const policy = this.policyManager.getPolicy();
      if (policy.maxGasPrice) {
        const maxGas = BigInt(policy.maxGasPrice);
        const requestGas = BigInt(request.maxFeePerGas);
        
        if (requestGas > maxGas) {
          violations.push({
            rule: 'MAX_GAS_PRICE',
            message: `Gas price ${ethers.formatUnits(requestGas, 'gwei')} gwei exceeds maximum ${ethers.formatUnits(maxGas, 'gwei')} gwei`,
            severity: 'medium',
            blocked: false, // Warning only
          });
        }
      }
    }

    return violations;
  }
}
