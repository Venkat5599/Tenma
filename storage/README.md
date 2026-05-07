# ShieldPool 0G Storage Client

Client library for interacting with 0G Storage network.

## Features

- 📤 Upload/download with retry logic
- 🔄 Exponential backoff (3 retries)
- ✅ Integrity verification (Keccak256)
- 📊 Statistics tracking
- ⚡ Batch operations

## Installation

```bash
npm install
```

## Usage

```typescript
import { ZeroGStorageClient } from './src/storage-client';

const client = new ZeroGStorageClient({
  endpoint: 'https://storage.0g.ai',
  apiKey: 'your_api_key',
});

// Upload
const id = await client.upload('my-key', 'my-data');

// Retrieve
const data = await client.retrieve('my-key');

// Check existence
const exists = await client.exists('my-key');
```

## Configuration

```typescript
interface StorageConfig {
  endpoint: string;
  apiKey?: string;
  timeout?: number; // default: 30000ms
}
```

## License

MIT
