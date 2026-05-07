import { ethers } from 'ethers';

/**
 * Generate a random secret for commit-reveal
 */
export function generateSecret(): Uint8Array {
  return ethers.randomBytes(32);
}

/**
 * Encrypt payload using AES-256-GCM
 */
export async function encryptPayload(payload: any): Promise<string> {
  const data = JSON.stringify(payload);
  
  // In browser environment, use Web Crypto API
  if (typeof window !== 'undefined' && window.crypto) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate key
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Generate IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    // Export key
    const exportedKey = await window.crypto.subtle.exportKey('raw', key);
    
    // Combine key + IV + encrypted data
    const combined = new Uint8Array(
      exportedKey.byteLength + iv.length + encrypted.byteLength
    );
    combined.set(new Uint8Array(exportedKey), 0);
    combined.set(iv, exportedKey.byteLength);
    combined.set(new Uint8Array(encrypted), exportedKey.byteLength + iv.length);
    
    return ethers.hexlify(combined);
  }
  
  // In Node.js environment, use crypto module
  const crypto = require('crypto');
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  // Combine key + IV + authTag + encrypted data
  const combined = Buffer.concat([
    key,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ]);
  
  return '0x' + combined.toString('hex');
}

/**
 * Decrypt payload
 */
export async function decryptPayload(encryptedHex: string): Promise<any> {
  const encrypted = ethers.getBytes(encryptedHex);
  
  // In browser environment
  if (typeof window !== 'undefined' && window.crypto) {
    // Extract key, IV, and encrypted data
    const keyData = encrypted.slice(0, 32);
    const iv = encrypted.slice(32, 44);
    const encryptedData = encrypted.slice(44);
    
    // Import key
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Decrypt
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    const data = decoder.decode(decrypted);
    return JSON.parse(data);
  }
  
  // In Node.js environment
  const crypto = require('crypto');
  const key = encrypted.slice(0, 32);
  const iv = encrypted.slice(32, 44);
  const authTag = encrypted.slice(44, 60);
  const encryptedData = encrypted.slice(60);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}

/**
 * Format address for display
 */
export function formatAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format ETH amount
 */
export function formatEth(wei: string | bigint, decimals: number = 4): string {
  const eth = ethers.formatEther(wei);
  const num = parseFloat(eth);
  return num.toFixed(decimals);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }
  
  throw lastError!;
}
