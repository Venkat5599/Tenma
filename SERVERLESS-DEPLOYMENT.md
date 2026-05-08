# 🚀 Serverless Backend Deployment Guide

Deploy your Tenma AI Agent API to Vercel in minutes - no server management required!

---

## 📋 What You Get

- ✅ **Serverless Functions** - Auto-scaling, pay-per-use
- ✅ **Global CDN** - Fast responses worldwide
- ✅ **Zero Configuration** - Just deploy and go
- ✅ **Free Tier** - 100GB bandwidth, 100K requests/month
- ✅ **HTTPS** - Automatic SSL certificates
- ✅ **Custom Domain** - Use your own domain (optional)

---

## 🎯 API Endpoints

Once deployed, you'll have these endpoints:

```
https://your-project.vercel.app/api/health
https://your-project.vercel.app/api/agent/chat
https://your-project.vercel.app/api/agent/decision
```

---

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate.

### Step 3: Deploy

```bash
# From the project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? tenma-agent-api
# - Directory? ./
# - Override settings? No
```

### Step 4: Add Environment Variable

```bash
# Add your Groq API key
vercel env add GROQ_API_KEY

# Paste your key when prompted:
gsk_YOUR_GROQ_API_KEY_HERE

# Select: Production, Preview, Development (all)
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

**Done!** 🎉 Your API is now live!

---

## 📝 Update Frontend to Use Serverless API

### Option 1: Update .env

```bash
# frontend/.env
VITE_AGENT_API_URL=https://your-project.vercel.app
```

### Option 2: Auto-detect

The frontend will automatically use the Vercel URL if the local server is not available.

---

## 🧪 Test Your Deployment

### Test Health Endpoint

```bash
curl https://your-project.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "provider": "Groq",
  "model": "llama-3.1-70b-versatile",
  "services": {
    "groq": true,
    "storage": true,
    "blockchain": true
  }
}
```

### Test Chat Endpoint

```bash
curl -X POST https://your-project.vercel.app/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should I do?",
    "strategy": "DCA",
    "riskProfile": "moderate"
  }'
```

Expected response:
```json
{
  "response": "Based on your DCA strategy and moderate risk profile...",
  "provider": "groq",
  "model": "llama-3.1-70b-versatile",
  "responseTime": "250ms",
  "timestamp": 1234567890
}
```

---

## 🌐 Using Your Deployed API

### In Frontend

The frontend will automatically detect and use your deployed API:

```typescript
// frontend/src/services/agentApi.ts
const API_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:3001';

// If VITE_AGENT_API_URL is set to your Vercel URL, it will use that
// Otherwise, it falls back to localhost
```

### Update Environment Variable

```bash
# frontend/.env
VITE_AGENT_API_URL=https://tenma-agent-api.vercel.app
```

Then restart your frontend:

```bash
cd frontend
npm run dev
```

---

## 📊 Vercel Dashboard

Access your deployment dashboard:

```
https://vercel.com/dashboard
```

Here you can:
- ✅ View deployment logs
- ✅ Monitor API usage
- ✅ Set environment variables
- ✅ Configure custom domains
- ✅ View analytics

---

## 💰 Pricing

### Free Tier (Hobby)
- ✅ 100GB bandwidth/month
- ✅ 100K function invocations/month
- ✅ 100 hours function execution/month
- ✅ Unlimited projects
- ✅ HTTPS included

**Perfect for development and testing!**

### Pro Tier ($20/month)
- ✅ 1TB bandwidth/month
- ✅ 1M function invocations/month
- ✅ 1000 hours function execution/month
- ✅ Custom domains
- ✅ Team collaboration

**For production use**

---

## 🔧 Advanced Configuration

### Custom Domain

```bash
# Add your domain
vercel domains add yourdomain.com

# Point your DNS to Vercel
# Add CNAME record: api.yourdomain.com -> cname.vercel-dns.com
```

Then your API will be available at:
```
https://api.yourdomain.com/api/health
https://api.yourdomain.com/api/agent/chat
```

### Environment Variables

```bash
# Add more environment variables
vercel env add VARIABLE_NAME

# List all environment variables
vercel env ls

# Remove environment variable
vercel env rm VARIABLE_NAME
```

### Deployment Regions

Vercel automatically deploys to multiple regions for low latency worldwide:
- 🌍 North America
- 🌍 Europe
- 🌍 Asia Pacific

---

## 🐛 Troubleshooting

### Deployment Failed?

```bash
# Check logs
vercel logs

# Redeploy
vercel --prod --force
```

### API Not Responding?

1. Check Vercel dashboard for errors
2. Verify GROQ_API_KEY is set correctly
3. Check function logs in dashboard

### CORS Errors?

The API already includes CORS headers. If you still have issues:

```typescript
// api/agent/chat.ts
res.setHeader('Access-Control-Allow-Origin', 'https://your-frontend-domain.com');
```

### Rate Limiting?

Vercel has generous limits, but if you hit them:

1. Upgrade to Pro plan
2. Implement caching
3. Add rate limiting on your side

---

## 📈 Monitoring

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Logs for specific deployment
vercel logs [deployment-url]
```

### Analytics

Access analytics in Vercel dashboard:
- Request count
- Response times
- Error rates
- Bandwidth usage

---

## 🔄 Continuous Deployment

### Connect to GitHub

1. Go to Vercel dashboard
2. Import your GitHub repository
3. Vercel will auto-deploy on every push to main

**Benefits:**
- ✅ Automatic deployments
- ✅ Preview deployments for PRs
- ✅ Rollback to previous versions
- ✅ No manual deployment needed

---

## 🎯 Best Practices

### 1. Use Environment Variables

Never hardcode API keys:

```typescript
// ❌ Bad
const apiKey = 'gsk_YOUR_API_KEY_HERE';

// ✅ Good
const apiKey = process.env.GROQ_API_KEY;
```

### 2. Add Error Handling

```typescript
try {
  const response = await groq.chat.completions.create({...});
  return res.json({ response });
} catch (error) {
  console.error('Error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

### 3. Implement Caching

```typescript
// Cache responses for 5 minutes
res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
```

### 4. Monitor Usage

Check Vercel dashboard regularly to:
- Monitor API usage
- Track response times
- Identify errors
- Optimize performance

---

## 🚀 Alternative Deployment Options

### Netlify Functions

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### AWS Lambda

```bash
# Use Serverless Framework
npm install -g serverless
serverless deploy
```

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway up
```

---

## 📚 Resources

- **Vercel Docs:** https://vercel.com/docs
- **Groq API Docs:** https://console.groq.com/docs
- **Serverless Best Practices:** https://vercel.com/docs/concepts/functions/serverless-functions

---

## ✅ Deployment Checklist

- [ ] Install Vercel CLI
- [ ] Login to Vercel
- [ ] Deploy project (`vercel`)
- [ ] Add GROQ_API_KEY environment variable
- [ ] Deploy to production (`vercel --prod`)
- [ ] Test health endpoint
- [ ] Test chat endpoint
- [ ] Update frontend .env with Vercel URL
- [ ] Test frontend with deployed API
- [ ] Monitor logs and analytics
- [ ] (Optional) Add custom domain
- [ ] (Optional) Connect to GitHub for auto-deploy

---

## 🎉 You're Done!

Your Tenma AI Agent API is now:
- ✅ Deployed globally
- ✅ Auto-scaling
- ✅ Highly available
- ✅ Fast (200-500ms responses)
- ✅ Secure (HTTPS)
- ✅ Cost-effective (free tier)

**No servers to manage, no DevOps headaches!** 🚀

---

## 💡 Next Steps

1. **Monitor Performance**
   - Check Vercel dashboard daily
   - Optimize slow endpoints
   - Track error rates

2. **Add Features**
   - Implement rate limiting
   - Add authentication
   - Create more endpoints

3. **Scale Up**
   - Upgrade to Pro if needed
   - Add custom domain
   - Enable team collaboration

---

**Questions?** Check the Vercel docs or open an issue on GitHub!

*Powered by Vercel + Groq + Llama 3.1 70B* 🚀
