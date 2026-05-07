import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatEther(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num.toFixed(4)
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}
