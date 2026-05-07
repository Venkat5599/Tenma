/**
 * 0G Storage Service
 * 
 * Handles all interactions with 0G Storage for:
 * - Intent tracking
 * - Transaction history
 * - Agent decisions
 * - Cross-chain swap records
 */

const STORAGE_API_URL = import.meta.env.VITE_STORAGE_API_URL || 'http://localhost:3002';

export interface StorageItem {
  key: string;
  data: any;
  timestamp: number;
  hash?: string;
}

export interface IntentRecord {
  intent: {
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    amount: string;
    status: string;
  };
  commitmentHash?: string;
  txHash?: string;
  timestamp: number;
  user: string;
}

export interface TransactionRecord {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  blockNumber?: number;
}

class StorageService {
  private isAvailable: boolean = false;
  private useLocalFallback: boolean = true;

  constructor() {
    this.checkAvailability();
  }

  /**
   * Check if storage API is available
   */
  private async checkAvailability(): Promise<void> {
    try {
      const response = await fetch(`${STORAGE_API_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      this.isAvailable = response.ok;
      console.log('✅ 0G Storage API is available');
    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️ 0G Storage API not available, using localStorage fallback');
    }
  }

  /**
   * Store intent record
   */
  async storeIntent(intent: IntentRecord): Promise<{ success: boolean; key: string }> {
    const key = `intent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      if (this.isAvailable) {
        // Store in 0G Storage via API
        const response = await fetch(`${STORAGE_API_URL}/storage/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            data: JSON.stringify(intent),
            metadata: {
              type: 'intent',
              user: intent.user,
              timestamp: intent.timestamp,
            },
          }),
        });

        if (response.ok) {
          console.log('✅ Intent stored in 0G Storage:', key);
          return { success: true, key };
        }
      }

      // Fallback to localStorage
      if (this.useLocalFallback) {
        localStorage.setItem(key, JSON.stringify(intent));
        console.log('💾 Intent stored in localStorage:', key);
        return { success: true, key };
      }

      throw new Error('Storage not available');
    } catch (error) {
      console.error('Failed to store intent:', error);
      
      // Try localStorage as last resort
      try {
        localStorage.setItem(key, JSON.stringify(intent));
        return { success: true, key };
      } catch (e) {
        return { success: false, key: '' };
      }
    }
  }

  /**
   * Store transaction record
   */
  async storeTransaction(tx: TransactionRecord): Promise<{ success: boolean; key: string }> {
    const key = `tx-${tx.txHash}`;
    
    try {
      if (this.isAvailable) {
        const response = await fetch(`${STORAGE_API_URL}/storage/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            data: JSON.stringify(tx),
            metadata: {
              type: 'transaction',
              txHash: tx.txHash,
              timestamp: tx.timestamp,
            },
          }),
        });

        if (response.ok) {
          console.log('✅ Transaction stored in 0G Storage:', key);
          return { success: true, key };
        }
      }

      // Fallback to localStorage
      if (this.useLocalFallback) {
        localStorage.setItem(key, JSON.stringify(tx));
        console.log('💾 Transaction stored in localStorage:', key);
        return { success: true, key };
      }

      throw new Error('Storage not available');
    } catch (error) {
      console.error('Failed to store transaction:', error);
      
      try {
        localStorage.setItem(key, JSON.stringify(tx));
        return { success: true, key };
      } catch (e) {
        return { success: false, key: '' };
      }
    }
  }

  /**
   * Store agent decision
   */
  async storeDecision(decision: any): Promise<{ success: boolean; key: string }> {
    const key = `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      if (this.isAvailable) {
        const response = await fetch(`${STORAGE_API_URL}/storage/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            data: JSON.stringify(decision),
            metadata: {
              type: 'decision',
              timestamp: Date.now(),
            },
          }),
        });

        if (response.ok) {
          console.log('✅ Decision stored in 0G Storage:', key);
          return { success: true, key };
        }
      }

      // Fallback to localStorage
      if (this.useLocalFallback) {
        localStorage.setItem(key, JSON.stringify(decision));
        console.log('💾 Decision stored in localStorage:', key);
        return { success: true, key };
      }

      throw new Error('Storage not available');
    } catch (error) {
      console.error('Failed to store decision:', error);
      
      try {
        localStorage.setItem(key, JSON.stringify(decision));
        return { success: true, key };
      } catch (e) {
        return { success: false, key: '' };
      }
    }
  }

  /**
   * Retrieve item from storage
   */
  async retrieve(key: string): Promise<any | null> {
    try {
      if (this.isAvailable) {
        const response = await fetch(`${STORAGE_API_URL}/storage/retrieve/${key}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const result = await response.json();
          return JSON.parse(result.data);
        }
      }

      // Fallback to localStorage
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }

      return null;
    } catch (error) {
      console.error('Failed to retrieve from storage:', error);
      return null;
    }
  }

  /**
   * List all items of a specific type
   */
  async list(prefix: string): Promise<string[]> {
    try {
      if (this.isAvailable) {
        const response = await fetch(`${STORAGE_API_URL}/storage/list?prefix=${prefix}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const result = await response.json();
          return result.items || [];
        }
      }

      // Fallback to localStorage
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('Failed to list storage items:', error);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    totalSize: number;
    byType: Record<string, number>;
  }> {
    try {
      if (this.isAvailable) {
        const response = await fetch(`${STORAGE_API_URL}/storage/stats`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          return await response.json();
        }
      }

      // Fallback to localStorage stats
      const stats = {
        totalItems: localStorage.length,
        totalSize: 0,
        byType: {} as Record<string, number>,
      };

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            stats.totalSize += value.length;
            
            // Count by type
            const type = key.split('-')[0];
            stats.byType[type] = (stats.byType[type] || 0) + 1;
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalItems: 0,
        totalSize: 0,
        byType: {},
      };
    }
  }

  /**
   * Check if storage is available
   */
  getAvailability(): boolean {
    return this.isAvailable || this.useLocalFallback;
  }
}

// Export singleton instance
export const storageService = new StorageService();

export default storageService;
