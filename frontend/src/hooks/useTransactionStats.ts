/**
 * Transaction Statistics Hook
 * 
 * Tracks both on-chain and client-side transaction statistics
 * - On-chain: From smart contract events
 * - Client-side: From local blocking (suspicious patterns)
 * - Persists to localStorage for continuity
 */

import { useState, useEffect } from 'react';
import { useContractEvents } from './useContractEvents';
import { ethers } from 'ethers';

interface TransactionStats {
  totalTransactions: number;
  executedTransactions: number;
  blockedTransactions: number;
  clientSideBlocks: number;
  onChainBlocks: number;
  blockRate: number;
}

const STORAGE_KEY = 'tenma_transaction_stats';

// Load stats from localStorage
const loadStatsFromStorage = (): Partial<TransactionStats> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load stats from storage:', error);
  }
  return {};
};

// Save stats to localStorage
const saveStatsToStorage = (stats: TransactionStats): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats to storage:', error);
  }
};

export const useTransactionStats = (
  firewallContract: ethers.Contract | null,
  commitRevealContract: ethers.Contract | null
) => {
  // Get on-chain stats from contract events
  const { stats: onChainStats, events } = useContractEvents(firewallContract, commitRevealContract);

  // Local stats (includes client-side blocks)
  const [localStats, setLocalStats] = useState<TransactionStats>(() => {
    const stored = loadStatsFromStorage();
    return {
      totalTransactions: stored.totalTransactions || 0,
      executedTransactions: stored.executedTransactions || 0,
      blockedTransactions: stored.blockedTransactions || 0,
      clientSideBlocks: stored.clientSideBlocks || 0,
      onChainBlocks: stored.onChainBlocks || 0,
      blockRate: stored.blockRate || 0,
    };
  });

  // Merge on-chain stats with local stats
  useEffect(() => {
    setLocalStats(prev => {
      const newStats = {
        ...prev,
        // Update on-chain stats
        executedTransactions: onChainStats.executedTransactions,
        onChainBlocks: onChainStats.blockedTransactions,
        // Total = executed + on-chain blocks + client-side blocks
        totalTransactions: onChainStats.executedTransactions + onChainStats.blockedTransactions + prev.clientSideBlocks,
        blockedTransactions: onChainStats.blockedTransactions + prev.clientSideBlocks,
        // Calculate block rate
        blockRate: 
          (onChainStats.executedTransactions + onChainStats.blockedTransactions + prev.clientSideBlocks) > 0
            ? ((onChainStats.blockedTransactions + prev.clientSideBlocks) / 
               (onChainStats.executedTransactions + onChainStats.blockedTransactions + prev.clientSideBlocks)) * 100
            : 0,
      };

      // Save to localStorage
      saveStatsToStorage(newStats);

      return newStats;
    });
  }, [onChainStats]);

  // Function to record a client-side block
  const recordClientSideBlock = () => {
    setLocalStats(prev => {
      const newStats = {
        ...prev,
        clientSideBlocks: prev.clientSideBlocks + 1,
        totalTransactions: prev.totalTransactions + 1,
        blockedTransactions: prev.blockedTransactions + 1,
        blockRate: ((prev.blockedTransactions + 1) / (prev.totalTransactions + 1)) * 100,
      };

      // Save to localStorage
      saveStatsToStorage(newStats);

      return newStats;
    });
  };

  // Function to reset stats
  const resetStats = () => {
    const emptyStats: TransactionStats = {
      totalTransactions: 0,
      executedTransactions: 0,
      blockedTransactions: 0,
      clientSideBlocks: 0,
      onChainBlocks: 0,
      blockRate: 0,
    };
    setLocalStats(emptyStats);
    saveStatsToStorage(emptyStats);
  };

  return {
    stats: localStats,
    events,
    recordClientSideBlock,
    resetStats,
  };
};

export default useTransactionStats;
