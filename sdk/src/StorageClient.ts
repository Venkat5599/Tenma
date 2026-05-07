import axios, { AxiosInstance } from 'axios';
import { StorageOptions } from './types';

/**
 * StorageClient - 0G Storage integration
 */
export class StorageClient {
  private client: AxiosInstance;
  private options: StorageOptions;

  constructor(options: StorageOptions) {
    this.options = {
      timeout: 30000,
      retries: 3,
      ...options,
    };

    this.client = axios.create({
      baseURL: this.options.endpoint,
      timeout: this.options.timeout,
      headers: this.options.apiKey ? {
        'Authorization': `Bearer ${this.options.apiKey}`,
      } : {},
    });
  }

  /**
   * Upload data to 0G Storage
   */
  async upload(data: string): Promise<string> {
    try {
      const response = await this.client.post('/upload', {
        data,
        timestamp: Date.now(),
      });

      return response.data.id;
    } catch (error) {
      throw new Error(`Failed to upload to 0G Storage: ${error}`);
    }
  }

  /**
   * Download data from 0G Storage
   */
  async download(id: string): Promise<string> {
    try {
      const response = await this.client.get(`/download/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to download from 0G Storage: ${error}`);
    }
  }
}
