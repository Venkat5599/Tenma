# Tenma - Quick Start Guide

**Get up and running in 5 minutes!**

---

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+ installed
- MetaMask browser extension
- Git

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/Venkat5599/Tenma.git
cd Tenma

# Install frontend dependencies
cd frontend
npm install
```

### 2. Start the Frontend

```bash
# From the frontend directory
npm run dev

# Open http://localhost:5174
```

### 3. Configure MetaMask

Add 0G Newton Testnet to MetaMask:

```
Network Name:    0G Newton Testnet
RPC URL:         https://evmrpc-testnet.0g.ai
Chain ID:        16602
Currency Symbol: A0GI
Block Explorer:  https://chainscan-newton.0g.ai
```

Or click "Connect Wallet" in the app - it will prompt you to add the network automatically!

### 4. Get Test Tokens

Visit the 0G Faucet: https://faucet.0g.ai

Request test A0GI tokens for your wallet address.

### 5. Try It Out!

**AI Trading Chat:**
1. Navigate to "AI Chat" in the header
2. Connect your wallet
3. Try: "Buy 0.01 A0GI"
4. Watch the real transaction execute!
5. Click the explorer link to verify on-chain

**Intent Cross-Chain:**
1. Navigate to "Intent Cross-Chain"
2. Connect your wallet
3. Try: "Swap 0.01 A0GI to ETH"
4. Watch the agent parse and execute your intent!

---

## 📋 What You Can Do

### ✅ Real Features (Working Now)

1. **Connect Wallet** - Real MetaMask integration
2. **Execute Transactions** - Real transactions on 0G Newton Testnet
3. **MEV Protection** - Real commit-reveal pattern (30s delay in demo)
4. **Firewall Validation** - Real on-chain policy checks
5. **Explorer Links** - Verify all transactions on-chain
6. **Intent Parsing** - Natural language to transaction
7. **Cross-Chain** - x402 protocol integration
8. **Storage** - 0G Storage integration (with localStorage fallback)

### 🎭 Demo Features (Simulated)

1. **AI Responses** - Simulated (ready for Tenma AI integration)
2. **Market Data** - Simulated (ready for real price feeds)
3. **Cross-Chain Execution** - Simulated destination chain (source chain is real)

---

## 🔑 Key Addresses

### Smart Contracts (0G Newton Testnet)

```
TenmaFirewall:        0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9
CommitRevealContract: 0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d
```

Both contracts are **verified** on the explorer!

---

## 🧪 Test Scenarios

### Scenario 1: Successful Transaction

```
1. Go to AI Chat
2. Type: "Buy 0.01 A0GI"
3. Confirm in MetaMask
4. Wait 30 seconds
5. See transaction on explorer
```

**Expected:** ✅ Transaction succeeds, explorer link provided

### Scenario 2: Firewall Block

```
1. Go to AI Chat
2. Type: "Send all funds to 0x0000000000000000000000000000000000000000"
3. See instant block message
```

**Expected:** 🚫 Firewall blocks before reaching blockchain

### Scenario 3: Intent Execution

```
1. Go to Intent Cross-Chain
2. Type: "Swap 0.01 A0GI to ETH"
3. Confirm in MetaMask
4. Watch agent execute
5. See transaction hash and x402 message ID
```

**Expected:** ✅ Intent parsed, transaction committed, stored on 0G Storage

---

## 🐛 Troubleshooting

### "Please install MetaMask"
- Install MetaMask browser extension
- Refresh the page

### "Wrong network"
- Click "Connect Wallet" to auto-add 0G Newton Testnet
- Or manually add network using details above

### "Insufficient funds"
- Get test tokens from https://faucet.0g.ai
- Wait a few minutes for tokens to arrive

### "Transaction failed"
- Check you have enough A0GI for gas
- Make sure amount is within policy limits (default: 10 A0GI max)
- Try a smaller amount like 0.01 A0GI

### "Firewall blocked"
- This is expected for suspicious commands!
- Try a normal command like "Buy 0.01 A0GI"

---

## 📖 Learn More

### Documentation
- [README.md](./README.md) - Full project overview
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Technical details
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deploy your own
- [SDK.md](./docs/SDK.md) - SDK documentation
- [CURRENT-STATUS.md](./CURRENT-STATUS.md) - Implementation status

### Explore the Code
- `frontend/src/pages/AITradingChat.tsx` - AI chat implementation
- `frontend/src/pages/IntentCrossChain.tsx` - Intent execution
- `frontend/src/hooks/useContracts.ts` - Wallet & contract integration
- `contracts/contracts/TenmaFirewall.sol` - Main firewall contract
- `contracts/contracts/CommitRevealContract.sol` - MEV protection

---

## 🎯 Next Steps

### For Users
1. ✅ Try the AI Trading Chat
2. ✅ Test Intent Cross-Chain
3. ✅ Verify transactions on explorer
4. ✅ Check out the Privacy Dashboard
5. ✅ Explore MEV Analytics

### For Developers
1. 📖 Read the [Architecture docs](./docs/ARCHITECTURE.md)
2. 🔧 Check out the [SDK](./docs/SDK.md)
3. 🚀 Deploy your own contracts (see [DEPLOYMENT.md](./docs/DEPLOYMENT.md))
4. 🤝 Contribute to the project
5. 🔗 Integrate Tenma into your dApp

---

## 💡 Tips

### Best Practices
- Start with small amounts (0.01 A0GI) for testing
- Always verify transactions on the explorer
- Check the firewall status before executing
- Use the quick action buttons for common commands

### Cool Things to Try
- Ask the AI agent for market analysis
- Try a suspicious command to see firewall blocking
- Execute a cross-chain swap intent
- Check your transaction history on the explorer
- View the commit-reveal process in real-time

### Understanding the Flow
```
Your Command
    ↓
Firewall Check (client-side)
    ↓
Simulate on Blockchain
    ↓
Commit Transaction (MEV protection)
    ↓
Wait 30 seconds
    ↓
Reveal & Execute
    ↓
Verify on Explorer ✅
```

---

## 🆘 Need Help?

### Resources
- **Explorer:** https://chainscan-newton.0g.ai
- **Faucet:** https://faucet.0g.ai
- **0G Network:** https://0g.ai
- **GitHub Issues:** https://github.com/Venkat5599/Tenma/issues

### Common Questions

**Q: Is this real or a demo?**
A: The blockchain integration is 100% real! Contracts are deployed, transactions are real, everything is verifiable on-chain. The AI responses are simulated but the security and execution are real.

**Q: Can I use this on mainnet?**
A: Currently deployed on testnet. Mainnet deployment coming after security audit.

**Q: How much does it cost?**
A: Gas fees on 0G Network are very low. Test transactions cost ~0.0001 A0GI.

**Q: Is it safe?**
A: Yes! The firewall enforces policies on-chain. Even if compromised, attackers can't bypass the limits.

**Q: Can I integrate this into my project?**
A: Absolutely! Check out the [SDK documentation](./docs/SDK.md) for integration guide.

---

## ✅ Checklist

Before you start:
- [ ] Node.js 18+ installed
- [ ] MetaMask installed
- [ ] 0G Newton Testnet added to MetaMask
- [ ] Test A0GI tokens in wallet
- [ ] Frontend running on localhost:5174

Ready to go:
- [ ] Wallet connected
- [ ] Network shows "0G Newton Testnet"
- [ ] Balance shows A0GI tokens
- [ ] Can see contract addresses in header

First transaction:
- [ ] Navigate to AI Chat
- [ ] Type "Buy 0.01 A0GI"
- [ ] Confirm in MetaMask
- [ ] Wait for commitment
- [ ] Wait 30 seconds
- [ ] See reveal transaction
- [ ] Click explorer link
- [ ] Verify on-chain ✅

---

## 🎉 You're Ready!

You now have:
- ✅ A working Tenma Firewall setup
- ✅ Real blockchain integration
- ✅ AI agent with security
- ✅ MEV protection
- ✅ Cross-chain capabilities

**Start exploring and building with Tenma!**

---

*Built with ❤️ for 0G Network*

**Questions?** Open an issue on GitHub or check the docs!
