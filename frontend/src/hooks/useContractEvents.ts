import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface ContractEvent {
  id: string;
  type: 'COMMITMENT_CREATED' | 'TRANSACTION_EXECUTED' | 'TRANSACTION_BLOCKED' | 'POLICY_UPDATED';
  data: any;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

export const useContractEvents = (
  firewallContract: ethers.Contract | null,
  commitRevealContract: ethers.Contract | null
) => {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    blockedTransactions: 0,
    executedTransactions: 0,
    blockRate: 0,
  });

  useEffect(() => {
    if (!firewallContract || !commitRevealContract) return;

    const handleCommitmentCreated = (commitmentHash: string, user: string, timestamp: bigint, event: any) => {
      const newEvent: ContractEvent = {
        id: event.log.transactionHash + '-' + event.log.index,
        type: 'COMMITMENT_CREATED',
        data: {
          commitmentHash,
          user,
          timestamp: Number(timestamp),
        },
        timestamp: Date.now(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
    };

    const handleTransactionExecuted = (
      commitmentHash: string,
      sender: string,
      target: string,
      value: bigint,
      success: boolean,
      event: any
    ) => {
      const newEvent: ContractEvent = {
        id: event.log.transactionHash + '-' + event.log.index,
        type: 'TRANSACTION_EXECUTED',
        data: {
          commitmentHash,
          sender,
          target,
          value: ethers.formatEther(value),
          success,
        },
        timestamp: Date.now(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 100));
      setStats(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        executedTransactions: prev.executedTransactions + 1,
        blockRate: (prev.blockedTransactions / (prev.totalTransactions + 1)) * 100,
      }));
    };

    const handleTransactionBlocked = (
      sender: string,
      target: string,
      value: bigint,
      reason: string,
      event: any
    ) => {
      const newEvent: ContractEvent = {
        id: event.log.transactionHash + '-' + event.log.index,
        type: 'TRANSACTION_BLOCKED',
        data: {
          sender,
          target,
          value: ethers.formatEther(value),
          reason,
        },
        timestamp: Date.now(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 100));
      setStats(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        blockedTransactions: prev.blockedTransactions + 1,
        blockRate: ((prev.blockedTransactions + 1) / (prev.totalTransactions + 1)) * 100,
      }));
    };

    const handlePolicyUpdated = (
      user: string,
      maxTransactionAmount: bigint,
      maxDailyAmount: bigint,
      maxGasPrice: bigint,
      maxRiskScore: number,
      event: any
    ) => {
      const newEvent: ContractEvent = {
        id: event.log.transactionHash + '-' + event.log.index,
        type: 'POLICY_UPDATED',
        data: {
          user,
          maxTransactionAmount: ethers.formatEther(maxTransactionAmount),
          maxDailyAmount: ethers.formatEther(maxDailyAmount),
          maxGasPrice: ethers.formatUnits(maxGasPrice, 'gwei'),
          maxRiskScore,
        },
        timestamp: Date.now(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 100));
    };

    // Subscribe to events
    commitRevealContract.on('CommitmentCreated', handleCommitmentCreated);
    firewallContract.on('TransactionExecuted', handleTransactionExecuted);
    firewallContract.on('TransactionBlocked', handleTransactionBlocked);
    firewallContract.on('PolicyUpdated', handlePolicyUpdated);

    // Load historical events
    const loadHistoricalEvents = async () => {
      try {
        const currentBlock = await firewallContract.runner?.provider?.getBlockNumber();
        if (!currentBlock) return;

        const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks

        // Get commitment events
        const commitmentFilter = commitRevealContract.filters.CommitmentCreated();
        const commitmentEvents = await commitRevealContract.queryFilter(commitmentFilter, fromBlock);

        // Get execution events
        const executionFilter = firewallContract.filters.TransactionExecuted();
        const executionEvents = await firewallContract.queryFilter(executionFilter, fromBlock);

        // Get blocked events
        const blockedFilter = firewallContract.filters.TransactionBlocked();
        const blockedEvents = await firewallContract.queryFilter(blockedFilter, fromBlock);

        // Process events
        const allEvents: ContractEvent[] = [];

        commitmentEvents.forEach((event: any) => {
          allEvents.push({
            id: event.transactionHash + '-' + event.index,
            type: 'COMMITMENT_CREATED',
            data: {
              commitmentHash: event.args[0],
              user: event.args[1],
              timestamp: Number(event.args[2]),
            },
            timestamp: Date.now(),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
          });
        });

        executionEvents.forEach((event: any) => {
          allEvents.push({
            id: event.transactionHash + '-' + event.index,
            type: 'TRANSACTION_EXECUTED',
            data: {
              commitmentHash: event.args[0],
              sender: event.args[1],
              target: event.args[2],
              value: ethers.formatEther(event.args[3]),
              success: event.args[4],
            },
            timestamp: Date.now(),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
          });
        });

        blockedEvents.forEach((event: any) => {
          allEvents.push({
            id: event.transactionHash + '-' + event.index,
            type: 'TRANSACTION_BLOCKED',
            data: {
              sender: event.args[0],
              target: event.args[1],
              value: ethers.formatEther(event.args[2]),
              reason: event.args[3],
            },
            timestamp: Date.now(),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
          });
        });

        // Sort by block number (newest first)
        allEvents.sort((a, b) => b.blockNumber - a.blockNumber);

        setEvents(allEvents.slice(0, 100));

        // Calculate stats
        const executed = executionEvents.length;
        const blocked = blockedEvents.length;
        const total = executed + blocked;

        setStats({
          totalTransactions: total,
          blockedTransactions: blocked,
          executedTransactions: executed,
          blockRate: total > 0 ? (blocked / total) * 100 : 0,
        });
      } catch (error) {
        console.error('Error loading historical events:', error);
      }
    };

    loadHistoricalEvents();

    // Cleanup
    return () => {
      commitRevealContract.removeAllListeners('CommitmentCreated');
      firewallContract.removeAllListeners('TransactionExecuted');
      firewallContract.removeAllListeners('TransactionBlocked');
      firewallContract.removeAllListeners('PolicyUpdated');
    };
  }, [firewallContract, commitRevealContract]);

  return { events, stats };
};
