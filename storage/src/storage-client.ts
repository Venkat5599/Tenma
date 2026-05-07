import axios, { AxiosInstance } from "axios";
import { ethers } from "ethers";
import { Logger } from "./logger";

/**
 * 0G Storage Client
 * 
 * Handles all interactions with 0G Storage network for:
 * - Encrypted transaction payloads
 * - Agent memory and decision history
 * - Transaction logs and analytics
 * - Secret backups (encrypted)
 */

export interface StorageConfig {
  endpoint: string;
  apiKey?: string;
  network?: "mainnet" | "testnet";
  redundancy?: number;
  timeout?: number;
}

export interface UploadResult {
  id: string;
  hash: string;
  size: number;
  timestamp: number;
  redundancy: number;
}

export interface RetrieveResult {
  data: string;
  hash: string;
  size: number;
  timestamp: number;
}

export interface StorageStats {
  totalUploads: number;
  totalSize: number;
  successRate: number;
  averageUploadTime: number;
  averageRetrieveTime: number;
}

export class ZeroGStorageClient {
  private config: StorageConfig;
  private client: AxiosInstance;
  private logger: Logger;
  private stats: StorageStats;

  constructor(config: StorageConfig) {
    this.config = {
      network: "mainnet",
      redundancy: 3,
      timeout: 30000,
      ...config,
    };
    
    this.logger = new Logger("0GStorage");
    
    // Initialize HTTP client
    this.client = axios.create({
      baseURL: this.config.endpoint,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        ...(this.config.apiKey && { "X-API-Key": this.config.apiKey }),
      },
    });
    
    // Initialize stats
    this.stats = {
      totalUploads: 0,
      totalSize: 0,
      successRate: 1.0,
      averageUploadTime: 0,
      averageRetrieveTime: 0,
    };
    
    this.logger.info("0G Storage client initialized", {
      endpoint: this.config.endpoint,
      network: this.config.network,
    });
  }

  /**
   * Upload data to 0G Storage with retry logic
   */
  async upload(
    key: string,
    data: string,
    metadata?: Record<string, any>
  ): Promise<UploadResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info("Uploading to 0G Storage", {
        key,
        size: data.length,
      });
      
      // Compute hash for integrity verification
      const hash = ethers.keccak256(ethers.toUtf8Bytes(data));
      
      // Upload with retry logic
      const result = await this.uploadWithRetry({
        key,
        data,
        hash,
        metadata: {
          ...metadata,
          uploadedAt: Date.now(),
          version: "1.0",
        },
        redundancy: this.config.redundancy,
      });
      
      // Update stats
      const uploadTime = Date.now() - startTime;
      this.updateUploadStats(data.length, uploadTime, true);
      
      this.logger.info("Upload successful", {
        id: result.id,
        hash: result.hash,
        time: uploadTime,
      });
      
      return result;
    } catch (error) {
      this.updateUploadStats(data.length, Date.now() - startTime, false);
      this.logger.error("Upload failed", error);
      throw error;
    }
  }

  /**
   * Retrieve data from 0G Storage with retry logic
   */
  async retrieve(key: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      this.logger.info("Retrieving from 0G Storage", { key });
      
      // Retrieve with retry logic
      const result = await this.retrieveWithRetry(key);
      
      // Verify data integrity
      const computedHash = ethers.keccak256(ethers.toUtf8Bytes(result.data));
      if (computedHash !== result.hash) {
        throw new Error("Data integrity check failed");
      }
      
      // Update stats
      const retrieveTime = Date.now() - startTime;
      this.updateRetrieveStats(retrieveTime);
      
      this.logger.info("Retrieve successful", {
        size: result.size,
        time: retrieveTime,
      });
      
      return result.data;
    } catch (error) {
      this.logger.error("Retrieve failed", error);
      throw error;
    }
  }

  /**
   * Upload with exponential backoff retry
   */
  private async uploadWithRetry(
    payload: any,
    maxRetries: number = 3
  ): Promise<UploadResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.client.post("/upload", payload);
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          this.logger.warn(`Upload attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error("Upload failed after retries");
  }

  /**
   * Retrieve with exponential backoff retry
   */
  private async retrieveWithRetry(
    key: string,
    maxRetries: number = 3
  ): Promise<RetrieveResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.client.get(`/retrieve/${key}`);
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn(`Retrieve attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error("Retrieve failed after retries");
  }

  /**
   * Delete data from 0G Storage
   */
  async delete(key: string): Promise<void> {
    try {
      this.logger.info("Deleting from 0G Storage", { key });
      await this.client.delete(`/delete/${key}`);
      this.logger.info("Delete successful");
    } catch (error) {
      this.logger.error("Delete failed", error);
      throw error;
    }
  }

  /**
   * List all stored items
   */
  async list(prefix?: string): Promise<string[]> {
    try {
      const response = await this.client.get("/list", {
        params: { prefix },
      });
      return response.data.keys || [];
    } catch (error) {
      this.logger.error("List failed", error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    return { ...this.stats };
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.client.head(`/retrieve/${key}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get metadata for a key
   */
  async getMetadata(key: string): Promise<Record<string, any>> {
    try {
      const response = await this.client.get(`/metadata/${key}`);
      return response.data;
    } catch (error) {
      this.logger.error("Get metadata failed", error);
      throw error;
    }
  }

  /**
   * Batch upload multiple items
   */
  async batchUpload(
    items: Array<{ key: string; data: string; metadata?: Record<string, any> }>
  ): Promise<UploadResult[]> {
    this.logger.info("Batch uploading", { count: items.length });
    
    const results = await Promise.all(
      items.map((item) => this.upload(item.key, item.data, item.metadata))
    );
    
    return results;
  }

  /**
   * Batch retrieve multiple items
   */
  async batchRetrieve(keys: string[]): Promise<Record<string, string>> {
    this.logger.info("Batch retrieving", { count: keys.length });
    
    const results = await Promise.all(
      keys.map(async (key) => {
        try {
          const data = await this.retrieve(key);
          return { key, data };
        } catch (error) {
          this.logger.warn(`Failed to retrieve ${key}`, error);
          return { key, data: null };
        }
      })
    );
    
    return results.reduce((acc, { key, data }) => {
      if (data) acc[key] = data;
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * Update upload statistics
   */
  private updateUploadStats(size: number, time: number, success: boolean): void {
    this.stats.totalUploads++;
    this.stats.totalSize += size;
    
    // Update success rate (exponential moving average)
    const alpha = 0.1;
    this.stats.successRate =
      alpha * (success ? 1 : 0) + (1 - alpha) * this.stats.successRate;
    
    // Update average upload time
    this.stats.averageUploadTime =
      (this.stats.averageUploadTime * (this.stats.totalUploads - 1) + time) /
      this.stats.totalUploads;
  }

  /**
   * Update retrieve statistics
   */
  private updateRetrieveStats(time: number): void {
    const totalRetrieves = this.stats.totalUploads; // Approximate
    this.stats.averageRetrieveTime =
      (this.stats.averageRetrieveTime * (totalRetrieves - 1) + time) /
      totalRetrieves;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default ZeroGStorageClient;
