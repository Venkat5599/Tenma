import { ethers } from 'ethers';
import {
  FirewallConfig,
  FirewallConfigSchema,
  PolicyConfig,
  TransactionRequest,
  TransactionRequestSchema,
  CommitmentResult,
  TransactionResult,
  TransactionStatus,
  PolicyViolation,
  EventType,
  EventListener,
} from './types';
import { PolicyManager } from './PolicyManager';
import { TransactionGuard } from './TransactionGuard';
import { StorageClient } from './StorageClient';
import { encryptPayload, generateSecret } from './utils';

/**
 * TenmaFirewall - Main SDK class
 * 
 * Provides on-chain firewall functionality for AI agents
 * 
 * @example
 * ```typescript
 * const firewall = new TenmaFirewall({
 *   contractAddress: '0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d',
 *   rpcUrl: 'https://evmrpc-testnet.0g.ai',
 *   privateKey: process.env.PRIVATE_KEY
 * });
 * 
 * await firewall.initialize();
 * ```
 */
export class TenmaFirewall {
  private config: FirewallConfig;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private policyManager: PolicyManager;
  private transactionGuard: TransactionGuard;
  private storageClient?: StorageClient;
  private eventListeners: Map<EventType, Set<EventListener>> = new Map();
  private isInitialized: boolean = false;

  // Contract ABI (minimal for commit-reveal)
  private static readonly ABI = [
    'function commit(bytes32 commitmentHash) external',
    'function reveal(address target, uint256 value, bytes data, bytes32 secret) external',
    'function canReveal(bytes32 commitmentHash) external view returns (bool, uint256)',
    'function getCommitment(bytes32 commitmentHash) external view returns (address, uint256, bool, bool)',
    'event CommitmentCreated(bytes32 indexed commitmentHash, address indexed committer, uint256 timestamp)',
    'event TransactionRevealed(bytes32 indexed commitmentHash, address indexed target, uint256 value)',
  ];

  constructor(config: FirewallConfig) {
    this.config = FirewallConfigSchema.parse(config);
    
    // Initialize provider and wallet
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
    
    // Initialize contract
    this.contract = new ethers.Contract(
      this.config.contractAddress,
      TenmaFirewall.ABI,
      this.wallet
    );
    
    // Initialize policy manager
    this.policyManager = new PolicyManager();
    
    // Initialize transaction guard
    this.transactionGuard = new TransactionGuard(this.policyManager);
    
    // Initialize storage client if configured
    if (this.config.storageEndpoint) {
      this.storageClient = new StorageClient({
        endpoint: this.config.storageEndpoint,
        apiKey: this.config.storageApiKey,
      });
    }
  }

  /**
   * Initialize the firewall
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Verify contract is deployed
    const code = await this.provider.getCode(this.config.contractAddress);
    if (code === '0x') {
      throw new Error('Contract not deployed at specified address');
    }

    // Set up event listeners
    this.setupEventListeners();

    this.isInitialized = true;
  }

  /**
   * Set policy configuration
   */
  async setPolicy(policy: PolicyConfig): Promise<void> {
    this.policyManager.setPolicy(policy);
  }

  /**
   * Get current policy
   */
  getPolicy(): PolicyConfig {
    return this.policyManager.getPolicy();
  }

  /**
   * Execute a protected transaction
   * 
   * @param request - Transaction request
   * @returns Transaction result with status and violations
   * 
   * @example
   * ```typescript
   * const result = await firewall.executeTransaction({
   *   to: '0xRecipient...',
   *   value: '1.0',
   *   data: '0x'
   * });
   * 
   * if (result.status === TransactionStatus.BLOCKED) {
   *   console.log('Transaction blocked:', result.violations);
   * }
   * ```
   */
  async executeTransaction(request: TransactionRequest): Promise<TransactionResult> {
    const validatedRequest = TransactionRequestSchema.parse(request);

    // 1. Check policies
    const violations = await this.transactionGuard.checkTransaction(validatedRequest);
    
    // 2. If critical violations, block immediately
    const criticalViolations = violations.filter(v => v.blocked);
    if (criticalViolations.length > 0) {
      this.emit(EventType.TRANSACTION_BLOCKED, {
        request: validatedRequest,
        violations: criticalViolations,
      });

      return {
        status: TransactionStatus.BLOCKED,
        violations,
        timestamp: Date.now(),
      };
    }

    // 3. Commit transaction
    try {
      const commitment = await this.commitTransaction(validatedRequest);
      
      return {
        status: TransactionStatus.COMMITTED,
        commitmentHash: commitment.commitmentHash,
        violations,
        timestamp: commitment.timestamp,
      };
    } catch (error) {
      return {
        status: TransactionStatus.FAILED,
        violations,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Commit a transaction (step 1 of commit-reveal)
   */
  private async commitTransaction(request: TransactionRequest): Promise<CommitmentResult> {
    // Generate secret
    const secret = generateSecret();
    
    // Convert value to wei
    const value = ethers.parseEther(request.value);
    
    // Create commitment hash
    const commitmentHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256', 'bytes', 'bytes32'],
        [request.to, value, request.data, secret]
      )
    );

    // Encrypt payload for storage
    let storageId: string | undefined;
    if (this.storageClient) {
      const encryptedPayload = await encryptPayload({
        target: request.to,
        value: request.value,
        data: request.data,
        secret: ethers.hexlify(secret),
      });
      
      storageId = await this.storageClient.upload(encryptedPayload);
    }

    // Submit commitment to blockchain
    const tx = await this.contract.commit(commitmentHash);
    await tx.wait();

    const timestamp = Date.now();
    const revealTime = timestamp + 300000; // 5 minutes

    this.emit(EventType.COMMITMENT_CREATED, {
      commitmentHash,
      timestamp,
      revealTime,
      storageId,
    });

    // Schedule auto-reveal
    this.scheduleReveal(commitmentHash, request, secret, revealTime);

    return {
      commitmentHash,
      timestamp,
      revealTime,
      storageId,
    };
  }

  /**
   * Reveal a committed transaction (step 2 of commit-reveal)
   */
  async revealTransaction(commitmentHash: string): Promise<string> {
    // Check if can reveal
    const [canReveal, remainingDelay] = await this.contract.canReveal(commitmentHash);
    
    if (!canReveal) {
      throw new Error(`Cannot reveal yet. Wait ${remainingDelay} more seconds`);
    }

    // Get transaction details from storage
    if (!this.storageClient) {
      throw new Error('Storage client not configured');
    }

    // For now, we need to pass the original transaction details
    // In production, retrieve from storage using commitmentHash
    throw new Error('Manual reveal not yet implemented. Use auto-reveal.');
  }

  /**
   * Schedule automatic reveal after delay
   */
  private scheduleReveal(
    commitmentHash: string,
    request: TransactionRequest,
    secret: Uint8Array,
    revealTime: number
  ): void {
    const delay = revealTime - Date.now();
    
    setTimeout(async () => {
      try {
        const value = ethers.parseEther(request.value);
        
        const tx = await this.contract.reveal(
          request.to,
          value,
          request.data,
          ethers.hexlify(secret)
        );
        
        const receipt = await tx.wait();
        
        this.emit(EventType.TRANSACTION_REVEALED, {
          commitmentHash,
          transactionHash: receipt.hash,
          request,
        });

        this.emit(EventType.TRANSACTION_EXECUTED, {
          commitmentHash,
          transactionHash: receipt.hash,
          request,
        });
      } catch (error) {
        console.error('Failed to reveal transaction:', error);
      }
    }, delay);
  }

  /**
   * Check if a transaction would be blocked
   */
  async simulateTransaction(request: TransactionRequest): Promise<PolicyViolation[]> {
    const validatedRequest = TransactionRequestSchema.parse(request);
    return this.transactionGuard.checkTransaction(validatedRequest);
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Set up contract event listeners
   */
  private setupEventListeners(): void {
    this.contract.on('CommitmentCreated', (commitmentHash, committer, timestamp) => {
      if (committer.toLowerCase() === this.wallet.address.toLowerCase()) {
        this.emit(EventType.COMMITMENT_CREATED, {
          commitmentHash,
          committer,
          timestamp: Number(timestamp),
        });
      }
    });

    this.contract.on('TransactionRevealed', (commitmentHash, target, value) => {
      this.emit(EventType.TRANSACTION_REVEALED, {
        commitmentHash,
        target,
        value: ethers.formatEther(value),
      });
    });
  }

  /**
   * Add event listener
   */
  on<T = any>(event: EventType, listener: EventListener<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off<T = any>(event: EventType, listener: EventListener<T>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event
   */
  private emit<T = any>(event: EventType, data: T): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.contract.removeAllListeners();
    this.eventListeners.clear();
    this.isInitialized = false;
  }
}
