# Vercel Environment Variables Setup

## Fix Failing Deployments (Make Checks Green)

### Step 1: Install Vercel CLI (if not installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Link Projects
```bash
# For frontend
cd frontend
vercel link

# For agent
cd ../agent
vercel link
```

### Step 4: Add Environment Variables

#### For Frontend:
```bash
cd frontend
vercel env add VITE_AGENT_API_URL production
# Enter: https://your-agent-api-url.vercel.app

vercel env add VITE_RPC_URL production
# Enter: https://evmrpc-testnet.0g.ai

vercel env add VITE_CHAIN_ID production
# Enter: 16602

vercel env add VITE_TENMA_FIREWALL_ADDRESS production
# Enter: 0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9

vercel env add VITE_COMMIT_REVEAL_ADDRESS production
# Enter: 0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d
```

#### For Agent:
```bash
cd ../agent
vercel env add GROQ_API_KEY production
# Enter: your-groq-api-key

vercel env add DATABASE_URL production
# Enter: your-database-url

vercel env add SUPABASE_ANON_KEY production
# Enter: your-supabase-anon-key
```

### Step 5: Redeploy
```bash
# Redeploy frontend
cd frontend
vercel --prod

# Redeploy agent
cd ../agent
vercel --prod
```

## Alternative: Use Vercel Dashboard (Easier)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add each variable with its value
6. Select **Production** environment
7. Click **Save**
8. Go to **Deployments** tab
9. Click **Redeploy** on failed deployments

## After Setup

All deployment checks should turn **GREEN** ✅

Your GitHub repo will show:
- ✅ Vercel – tenma
- ✅ Vercel – tenma-79yf
- ✅ Vercel – tenma-79y6
- ✅ Vercel – tenma-alyf
- ✅ Vercel – tenma_privacy
- ✅ Vercel – tenma_privacy_layer

Perfect for hackathon submission! 🎉
