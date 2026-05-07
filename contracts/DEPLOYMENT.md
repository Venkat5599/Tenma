# ShieldPool Contract Deployment

## ✅ Local Deployment (Hardhat Network)

### Deployment Details

- **Network**: Hardhat (Local)
- **Chain ID**: 31337
- **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Deployer**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Execution Delay**: 300 seconds (5 minutes)
- **Reveal Window**: 86400 seconds (24 hours)
- **Deployment Time**: 2026-05-04T17:53:47.754Z

### Test Results

✅ **19/19 tests passing**

- ✅ Deployment tests
- ✅ Commit functionality
- ✅ Reveal functionality
- ✅ View functions
- ✅ Admin functions

### Contract Features

- **Commit-Reveal Mechanism**: Two-phase transaction submission
- **Execution Delay**: 5 minutes minimum between commit and reveal
- **Reveal Window**: 24 hours maximum to reveal after commit
- **Gas Optimized**: ~50k gas for commit, ~100-500k for reveal
- **Security**: Pausable, Ownable, ReentrancyGuard

---

## 🚀 Next Steps: Testnet Deployment

### Option 1: Sepolia Testnet

```bash
# Set up .env file
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key

# Deploy
npx hardhat run scripts/deploy.ts --network sepolia

# Verify
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> 300 86400
```

### Option 2: 0G Testnet

```bash
# Set up .env file
PRIVATE_KEY=your_private_key
ZEROG_RPC_URL=https://rpc.0g.ai
ZEROG_CHAIN_ID=16600

# Add 0G network to hardhat.config.ts
zerogTestnet: {
  url: process.env.ZEROG_RPC_URL || "",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 16600,
}

# Deploy
npx hardhat run scripts/deploy.ts --network zerogTestnet
```

### Get Testnet ETH

- **Sepolia**: https://sepoliafaucet.com/
- **0G Testnet**: Contact 0G Labs Discord

---

## 📝 Contract ABI

The contract ABI is available at:
```
artifacts/contracts/CommitRevealContract.sol/CommitRevealContract.json
```

Copy this to the frontend:
```bash
cp artifacts/contracts/CommitRevealContract.sol/CommitRevealContract.json ../shieldpool-frontend/src/contracts/
```

---

## 🔍 Contract Verification

After deploying to a public testnet, verify the contract:

```bash
npx hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> 300 86400
```

This will:
1. Upload source code to block explorer
2. Verify bytecode matches
3. Make contract readable on explorer

---

## 📊 Gas Report

Run gas report to see costs:

```bash
REPORT_GAS=true npx hardhat test
```

Expected costs:
- **commit()**: ~50,000 gas
- **reveal()**: ~100,000-500,000 gas (depends on payload execution)

---

## 🛡️ Security Checklist

- [x] All tests passing
- [x] Reentrancy protection enabled
- [x] Access control implemented
- [x] Pausable for emergencies
- [x] Custom errors for gas efficiency
- [ ] External security audit (recommended before mainnet)

---

## 📞 Support

- **Hardhat Docs**: https://hardhat.org/docs
- **0G Labs Discord**: https://discord.gg/0glabs
- **GitHub Issues**: https://github.com/yourusername/shieldpool/issues

---

**Status**: ✅ Local deployment successful  
**Next**: Deploy to testnet for public demo
