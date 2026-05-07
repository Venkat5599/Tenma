import axios, { AxiosInstance } from "axios";
import { Logger } from "./logger";

/**
 * 0G Storage Client for ShieldPool Agent
 */

export interface StorageConfig {
  endpoint: string;
  apiKey?: string;
  timeout?: number;
}

export class ZeroGStorageClient {
  private config: StorageConfig;
  private client: AxiosInstance;
  private logger: Logger;

  constructor(config: StorageConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
    
    this.logger = new Logger("0GStorage");
    
    this.client = axios.create({
      baseURL: this.config.endpoint,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        ...(this.config.apiKey && { "X-API-Key": this.config.apiKey }),
      },
    });
  }

  async upload(key: string, data: string): Promise<string> {
    try {
      this.logger.info("Uploading to 0G Storage", { key, size: data.length });
      
      const response = await this.client.post("/upload", {
        key,
        data,
        metadata: {
          uploadedAt: Date.now(),
          version: "1.0",
        },
      });
      
      this.logger.info("Upload successful", { id: response.data.id });
      return response.data.id;
    } catch (error) {
      this.logger.error("Upload failed", error);
      throw error;
    }
  }

  async retrieve(key: string): Promise<string> {
    try {
      this.logger.info("Retrieving from 0G Storage", { key });
      
      const response = await this.client.get(`/retrieve/${key}`);
      
      this.logger.info("Retrieve successful");
      return response.data.data;
    } catch (error) {
      this.logger.error("Retrieve failed", error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.head(`/retrieve/${key}`);
      return true;
    } catch {
      return false;
    }
  }
}
