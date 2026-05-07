import { PolicyConfig, PolicyConfigSchema } from './types';
import { ethers } from 'ethers';

/**
 * PolicyManager - Manages firewall policies
 */
export class PolicyManager {
  private policy: PolicyConfig;

  constructor() {
    // Default policy
    this.policy = {
      maxTransactionAmount: ethers.parseEther('10000').toString(),
      maxDailyAmount: ethers.parseEther('50000').toString(),
      maxGasPrice: ethers.parseUnits('100', 'gwei').toString(),
      whitelistedContracts: [],
      blacklistedContracts: [],
      maxRiskScore: 50,
      requireManualApproval: false,
    };
  }

  /**
   * Set policy configuration
   */
  setPolicy(policy: PolicyConfig): void {
    this.policy = PolicyConfigSchema.parse(policy);
  }

  /**
   * Get current policy
   */
  getPolicy(): PolicyConfig {
    return { ...this.policy };
  }

  /**
   * Check if amount exceeds max transaction limit
   */
  checkMaxTransactionAmount(amount: string): boolean {
    const amountWei = ethers.parseEther(amount);
    const maxWei = BigInt(this.policy.maxTransactionAmount);
    return amountWei <= maxWei;
  }

  /**
   * Check if contract is whitelisted
   */
  isWhitelisted(address: string): boolean {
    if (this.policy.whitelistedContracts.length === 0) {
      return true; // No whitelist = all allowed
    }
    return this.policy.whitelistedContracts.some(
      addr => addr.toLowerCase() === address.toLowerCase()
    );
  }

  /**
   * Check if contract is blacklisted
   */
  isBlacklisted(address: string): boolean {
    return this.policy.blacklistedContracts.some(
      addr => addr.toLowerCase() === address.toLowerCase()
    );
  }

  /**
   * Check if within time restrictions
   */
  checkTimeRestrictions(): boolean {
    if (!this.policy.timeRestrictions?.enabled) {
      return true;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const { startHour, endHour } = this.policy.timeRestrictions;

    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Handles overnight ranges (e.g., 22:00 to 06:00)
      return currentHour >= startHour || currentHour < endHour;
    }
  }
}
