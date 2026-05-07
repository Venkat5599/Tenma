import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract addresses
const COMMIT_REVEAL_ADDRESS = '0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d';
const TENMA_FIREWALL_ADDRESS = '0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9';

// 0G Network configuration
const ZEROG_RPC_URL = 'https://evmrpc-testnet.0g.ai';
const ZEROG_CHAIN_ID = 16602;

// ABIs
const COMMIT_REVEAL_ABI = [
  'function commit(bytes32 commitmentHash) external',
  'function reveal(bytes payload, bytes32 secret) external',
  'function canReveal(bytes32 commitmentHash) external view returns (bool, uint256)',
  'function getCommitment(bytes32 commitmentHash) external view returns (tuple(address user, uint256 timestamp, bool revealed, bool executed, bytes32 payloadHash))',
  'event CommitmentCreated(bytes32 indexed commitmentHash, address indexed user, uint256 timestamp)',
  'event TransactionRevealed(bytes32 indexed commitmentHash, bytes32 payloadHash, address indexed user)',
  'event TransactionExecuted(bytes32 indexed commitmentHash, bool success, bytes returnData)',
];

const TENMA_FIREWALL_ABI = [
  'function setPolicy(uint256 maxTransactionAmount, uint256 maxDailyAmount, uint256 maxGasPrice, uint8 maxRiskScore, bool requireApproval) external',
  'function getPolicy(address user) external view returns (tuple(uint256 maxTransactionAmount, uint256 maxDailyAmount, uint256 dailySpent, uint256 lastResetTimestamp, uint256 maxGasPrice, uint8 maxRiskScore, bool requireApproval, tuple(bool enabled, uint8 startHour, uint8 endHour) timeRestrictions, bool enabled))',
  'function addToWhitelist(address target) external',
  'function removeFromWhitelist(address target) external',
  'function isWhitelisted(address user, address target) external view returns (bool)',
  'function simulateTransaction(address sender, address target, uint256 value) external view returns (bool allowed, string reason)',
  'function commit(bytes32 commitmentHash) external',
  'function reveal(address target, uint256 value, bytes data, bytes32 secret) external payable',
  'event PolicyUpdated(address indexed user, uint256 maxTransactionAmount, uint256 maxDailyAmount, uint256 maxGasPrice, uint8 maxRiskScore)',
  'event TransactionExecuted(bytes32 indexed commitmentHash, address indexed sender, address indexed target, uint256 value, bool success)',
  'event TransactionBlocked(address indexed sender, address indexed target, uint256 value, string reason)',
];

export interface Policy {
  maxTransactionAmount: string;
  maxDailyAmount: string;
  dailySpent: string;
  lastResetTimestamp: number;
  maxGasPrice: string;
  maxRiskScore: number;
  requireApproval: boolean;
  timeRestrictions: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  enabled: boolean;
}

export const useContracts = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [commitRevealContract, setCommitRevealContract] = useState<ethers.Contract | null>(null);
  const [firewallContract, setFirewallContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const account = accounts[0];

      // Check if on correct network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== ZEROG_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${ZEROG_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${ZEROG_CHAIN_ID.toString(16)}`,
                chainName: '0G Newton Testnet',
                nativeCurrency: {
                  name: 'A0GI',
                  symbol: 'A0GI',
                  decimals: 18,
                },
                rpcUrls: [ZEROG_RPC_URL],
                blockExplorerUrls: ['https://chainscan-newton.0g.ai'],
              }],
            });
          }
        }
      }

      // Create contract instances
      const commitReveal = new ethers.Contract(COMMIT_REVEAL_ADDRESS, COMMIT_REVEAL_ABI, signer);
      const firewall = new ethers.Contract(TENMA_FIREWALL_ADDRESS, TENMA_FIREWALL_ABI, signer);

      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      setCommitRevealContract(commitReveal);
      setFirewallContract(firewall);
      setIsConnected(true);

      return { provider, signer, account, commitReveal, firewall };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setCommitRevealContract(null);
    setFirewallContract(null);
    setIsConnected(false);
  };

  // Get policy
  const getPolicy = async (address?: string): Promise<Policy | null> => {
    try {
      if (!firewallContract) return null;
      const addr = address || account;
      if (!addr) return null;

      const policy = await firewallContract.getPolicy(addr);
      
      return {
        maxTransactionAmount: ethers.formatEther(policy.maxTransactionAmount),
        maxDailyAmount: ethers.formatEther(policy.maxDailyAmount),
        dailySpent: ethers.formatEther(policy.dailySpent),
        lastResetTimestamp: Number(policy.lastResetTimestamp),
        maxGasPrice: ethers.formatUnits(policy.maxGasPrice, 'gwei'),
        maxRiskScore: Number(policy.maxRiskScore),
        requireApproval: policy.requireApproval,
        timeRestrictions: {
          enabled: policy.timeRestrictions.enabled,
          startHour: Number(policy.timeRestrictions.startHour),
          endHour: Number(policy.timeRestrictions.endHour),
        },
        enabled: policy.enabled,
      };
    } catch (error) {
      console.error('Error getting policy:', error);
      return null;
    }
  };

  // Set policy
  const setPolicy = async (
    maxTransactionAmount: string,
    maxDailyAmount: string,
    maxGasPrice: string,
    maxRiskScore: number,
    requireApproval: boolean
  ) => {
    try {
      if (!firewallContract) throw new Error('Contract not initialized');

      const tx = await firewallContract.setPolicy(
        ethers.parseEther(maxTransactionAmount),
        ethers.parseEther(maxDailyAmount),
        ethers.parseUnits(maxGasPrice, 'gwei'),
        maxRiskScore,
        requireApproval
      );

      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error setting policy:', error);
      throw error;
    }
  };

  // Simulate transaction
  const simulateTransaction = async (target: string, value: string) => {
    try {
      if (!firewallContract || !account) throw new Error('Not connected');

      const result = await firewallContract.simulateTransaction(
        account,
        target,
        ethers.parseEther(value)
      );

      return {
        allowed: result.allowed,
        reason: result.reason,
      };
    } catch (error) {
      console.error('Error simulating transaction:', error);
      throw error;
    }
  };

  // Commit transaction
  const commitTransaction = async (target: string, value: string, data: string = '0x') => {
    try {
      if (!firewallContract) throw new Error('Contract not initialized');

      // Generate secret
      const secret = ethers.randomBytes(32);
      const secretHex = ethers.hexlify(secret);

      // Create commitment hash
      const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256', 'bytes'],
        [target, ethers.parseEther(value), data]
      );
      
      const commitmentHash = ethers.keccak256(
        ethers.concat([payload, secret])
      );

      // Commit
      const tx = await firewallContract.commit(commitmentHash);
      await tx.wait();

      return {
        commitmentHash,
        secret: secretHex,
        payload,
        tx,
      };
    } catch (error) {
      console.error('Error committing transaction:', error);
      throw error;
    }
  };

  // Reveal transaction
  const revealTransaction = async (
    target: string,
    value: string,
    data: string,
    secret: string
  ) => {
    try {
      if (!firewallContract) throw new Error('Contract not initialized');

      const tx = await firewallContract.reveal(
        target,
        ethers.parseEther(value),
        data,
        secret,
        { value: ethers.parseEther(value) }
      );

      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error revealing transaction:', error);
      throw error;
    }
  };

  // Add to whitelist
  const addToWhitelist = async (target: string) => {
    try {
      if (!firewallContract) throw new Error('Contract not initialized');

      const tx = await firewallContract.addToWhitelist(target);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      throw error;
    }
  };

  // Check if whitelisted
  const isWhitelisted = async (target: string): Promise<boolean> => {
    try {
      if (!firewallContract || !account) return false;

      return await firewallContract.isWhitelisted(account, target);
    } catch (error) {
      console.error('Error checking whitelist:', error);
      return false;
    }
  };

  // Listen to account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return {
    provider,
    signer,
    account,
    commitRevealContract,
    firewallContract,
    isConnected,
    connectWallet,
    disconnectWallet,
    getPolicy,
    setPolicy,
    simulateTransaction,
    commitTransaction,
    revealTransaction,
    addToWhitelist,
    isWhitelisted,
  };
};

// Type for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
