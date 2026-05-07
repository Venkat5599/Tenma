/**
 * Simple logger utility for ShieldPool Agent
 */

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.context}] INFO: ${message}`, data || '');
  }

  warn(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [${this.context}] WARN: ${message}`, data || '');
  }

  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${this.context}] ERROR: ${message}`, error || '');
  }

  debug(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] [${this.context}] DEBUG: ${message}`, data || '');
  }
}
