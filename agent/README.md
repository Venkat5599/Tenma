# ShieldPool Autonomous AI Agent

Autonomous trading agent that executes MEV-protected strategies via ShieldPool.

## Features

- 🤖 GPT-4 powered decision making
- 📊 Multiple strategies (DCA, Arbitrage, Grid, Limit Orders)
- 🧠 Memory system on 0G Storage
- ⚖️ Risk management
- 🔄 24/7 autonomous operation

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

## Usage

### Start Agent

```bash
npm run agent:start
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Environment Variables

- `RPC_URL` - Blockchain RPC endpoint
- `SHIELDPOOL_CONTRACT_ADDRESS` - ShieldPool contract address
- `AGENT_PRIVATE_KEY` - Agent wallet private key
- `ZEROG_STORAGE_ENDPOINT` - 0G Storage endpoint
- `OPENAI_API_KEY` - OpenAI API key

## License

MIT
