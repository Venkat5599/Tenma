# Deployment Guide

## Smart Contract Deployment

### Prerequisites

1. **Get 0G Test Tokens**
   - Visit: https://faucet.0g.ai
   - Enter your wallet address
   - Receive test A0GI tokens

2. **Set up environment variables**
   ```bash
   cd contracts
   cp .env.example .env
   ```

3. **Edit `.env` file**
   ```
   PRIVATE_KEY=your_private_key_here
   ZEROG_RPC_URL=https://evmrpc-testnet.0g.ai
   ```

### Deploy Contracts

#### Deploy CommitRevealContract

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network zerogTestnet
```

**Deployed Address**: `0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d`

#### Deploy TenmaFirewall

```bash
cd contracts
npx hardhat run scripts/deploy-tenma-firewall-full.ts --network zerogTestnet
```

**Deployed Address**: `0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9`

### Verify Contracts

```bash
# Verify CommitRevealContract
npx hardhat verify --network zerogTestnet 0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d 300 86400

# Verify TenmaFirewall
npx hardhat verify --network zerogTestnet 0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9
```

## Frontend Deployment

### Local Development

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5175

### Production Deployment

#### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Follow prompts**
   - Link to Vercel account
   - Configure project
   - Deploy

#### Deploy to Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

### Environment Variables

Create `.env` file in frontend:

```
VITE_COMMIT_REVEAL_ADDRESS=0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d
VITE_TENMA_FIREWALL_ADDRESS=0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9
VITE_CHAIN_ID=16602
VITE_RPC_URL=https://evmrpc-testnet.0g.ai
```

## SDK Setup

### Local Development

```bash
cd sdk
npm install
npm run build
```

### Publish to NPM

1. **Update package.json**
   ```json
   {
     "name": "@tenma/firewall-sdk",
     "version": "1.0.0",
     "description": "On-chain firewall SDK for AI agents"
   }
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Publish**
   ```bash
   npm login
   npm publish --access public
   ```

## Testing Deployment

### Test Smart Contracts

```bash
cd contracts
npx hardhat test
```

### Test Frontend

1. Open http://localhost:5175
2. Connect wallet (MetaMask)
3. Add 0G Newton Testnet:
   - Network Name: 0G Newton Testnet
   - RPC URL: https://evmrpc-testnet.0g.ai
   - Chain ID: 16602
   - Currency: A0GI
4. Test features:
   - Execute payment
   - Set policies
   - View analytics

### Test SDK

```bash
cd sdk
npx ts-node examples/basic-firewall.ts
```

## Troubleshooting

### Contract Deployment Fails

**Error**: "Insufficient funds"
- **Solution**: Get more test tokens from faucet

**Error**: "Network not found"
- **Solution**: Check hardhat.config.ts network name

### Frontend Build Fails

**Error**: "Module not found"
- **Solution**: Run `npm install`

**Error**: "Type errors"
- **Solution**: Run `npm run build` to see detailed errors

### SDK Issues

**Error**: "Cannot find module"
- **Solution**: Run `npm run build` in sdk folder

**Error**: "Grok API key missing"
- **Solution**: Set `GROK_API_KEY` in .env file

## Deployment Checklist

### Smart Contracts
- [ ] Get test tokens from faucet
- [ ] Set PRIVATE_KEY in .env
- [ ] Deploy CommitRevealContract
- [ ] Deploy TenmaFirewall
- [ ] Verify contracts on explorer
- [ ] Test contract functions
- [ ] Update deployments.json

### Frontend
- [ ] Install dependencies
- [ ] Set contract addresses in .env
- [ ] Test locally
- [ ] Build for production
- [ ] Deploy to hosting
- [ ] Test production deployment

### SDK
- [ ] Build SDK
- [ ] Test examples
- [ ] Update documentation
- [ ] Publish to NPM (optional)

## Network Information

### 0G Newton Testnet

- **Chain ID**: 16602
- **RPC URL**: https://evmrpc-testnet.0g.ai
- **Explorer**: https://chainscan-newton.0g.ai
- **Faucet**: https://faucet.0g.ai
- **Currency**: A0GI

### Contract Addresses

- **CommitRevealContract**: `0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d`
- **TenmaFirewall**: `0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9`

## Support

For issues or questions:
- Check documentation in `/docs`
- Review examples in `/sdk/examples`
- Check contract tests in `/contracts/test`
