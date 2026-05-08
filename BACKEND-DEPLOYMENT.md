# Backend Deployment Guide

Complete guide to deploy Tenma serverless backend to Vercel.

## 📋 Prerequisites

- Vercel account ([sign up free](https://vercel.com/signup))
- Groq API key (get from [console.groq.com](https://console.groq.com))
- Git repository pushed to GitHub

## 🚀 Quick Deploy (5 minutes)

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy Backend

```bash
cd backend
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name?** tenma-backend (or your choice)
- **Directory?** ./ (current directory)
- **Override settings?** No

### Step 4: Add Environment Variable

```bash
vercel env add GROQ_API_KEY
```

When prompted:
- **Value:** Your Groq API key from [console.groq.com](https://console.groq.com)
- **Environment:** Production
- **Add to other environments?** Yes (select all)

### Step 5: Redeploy with Environment Variable

```bash
vercel --prod
```

### Step 6: Get Your Backend URL

After deployment completes, you'll see:

```
✅ Production: https://tenma-backend-xxx.vercel.app
```

Copy this URL!

## 🔗 Update Frontend

Update `frontend/.env`:

```env
VITE_AGENT_API_URL=https://tenma-backend-xxx.vercel.app
```

Restart frontend:

```bash
cd frontend
npm run dev
```

## 🧪 Test Your Deployment

### Test Health Endpoint

```bash
curl https://tenma-backend-xxx.vercel.app/api/health
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
curl -X POST https://tenma-backend-xxx.vercel.app/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show portfolio status",
    "strategy": "DCA",
    "riskProfile": "moderate",
    "balance": "10.5",
    "tradesExecuted": 5
  }'
```

### Test Decision Endpoint

```bash
curl -X POST https://tenma-backend-xxx.vercel.app/api/agent/decision \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "DCA",
    "riskProfile": "moderate",
    "balance": "10.5",
    "tradesExecuted": 5
  }'
```

## 🌐 Alternative: Deploy via Vercel Web UI

### Step 1: Push to GitHub

```bash
git add backend/
git commit -m "Add serverless backend"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select your GitHub repository
3. Click **Import**

### Step 3: Configure Project

- **Framework Preset:** Other
- **Root Directory:** `backend`
- **Build Command:** (leave empty)
- **Output Directory:** (leave empty)

### Step 4: Add Environment Variable

In project settings:
1. Go to **Settings** → **Environment Variables**
2. Add variable:
   - **Name:** `GROQ_API_KEY`
   - **Value:** Your Groq API key from [console.groq.com](https://console.groq.com)
   - **Environment:** Production, Preview, Development

### Step 5: Deploy

Click **Deploy** button.

## 📊 Verify Deployment

### Check Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your project: `tenma-backend`
3. Check deployment status: ✅ Ready
4. View logs for any errors

### Check Function Logs

```bash
vercel logs
```

### Test All Endpoints

Use the test commands above with your deployed URL.

## 🐛 Troubleshooting

### Issue: Environment Variable Not Found

**Error:** `GROQ_API_KEY is undefined`

**Solution:**
```bash
vercel env add GROQ_API_KEY
vercel --prod
```

### Issue: CORS Errors

**Error:** `Access-Control-Allow-Origin` blocked

**Solution:** Already configured in all endpoints. Check browser console for actual error.

### Issue: 404 Not Found

**Error:** Endpoint returns 404

**Solution:** Verify URL structure:
- ✅ `https://your-backend.vercel.app/api/health`
- ✅ `https://your-backend.vercel.app/api/agent/chat`
- ❌ `https://your-backend.vercel.app/health` (missing /api)

### Issue: Slow Responses

**Cause:** Cold start (first request after idle)

**Solution:** Normal behavior. Subsequent requests will be fast (200-500ms).

### Issue: Groq API Errors

**Error:** `401 Unauthorized` or `429 Too Many Requests`

**Solution:**
- Verify API key is correct
- Check Groq API limits: [console.groq.com](https://console.groq.com)
- Fallback responses will be used automatically

## 🔄 Update Deployment

### Update Code

```bash
cd backend
# Make changes to api files
git add .
git commit -m "Update backend"
git push origin main
```

Vercel will auto-deploy on push.

### Manual Redeploy

```bash
cd backend
vercel --prod
```

### Rollback Deployment

```bash
vercel rollback
```

## 📈 Monitor Performance

### View Analytics

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Analytics** tab

Metrics:
- Request count
- Response time
- Error rate
- Bandwidth usage

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Last 100 logs
vercel logs
```

## 💰 Pricing

### Free Tier (Hobby)
- ✅ 100GB bandwidth/month
- ✅ 100GB-hours compute/month
- ✅ Unlimited requests
- ✅ Auto-scaling
- ✅ HTTPS included

Perfect for development and testing!

### Pro Tier ($20/month)
- 1TB bandwidth
- 1000GB-hours compute
- Team collaboration
- Advanced analytics

## 🔐 Security Best Practices

### 1. Protect API Key

✅ **DO:**
- Store in Vercel environment variables
- Never commit to Git
- Rotate periodically

❌ **DON'T:**
- Hardcode in source files
- Share publicly
- Commit to repository

### 2. Rate Limiting

Consider adding rate limiting for production:

```javascript
// Example: Simple rate limiting
const rateLimit = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimit.get(ip) || [];
  const recentRequests = requests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= 60) {
    return false; // Too many requests
  }
  
  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);
  return true;
}
```

### 3. CORS Configuration

For production, restrict CORS to your frontend domain:

```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://your-frontend.vercel.app');
```

## 🎯 Next Steps

1. ✅ Deploy backend to Vercel
2. ✅ Test all endpoints
3. ✅ Update frontend .env
4. ✅ Test frontend-backend integration
5. 🔄 Deploy frontend to Vercel
6. 🔄 Configure custom domain (optional)
7. 🔄 Set up monitoring and alerts

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Groq API Documentation](https://console.groq.com/docs)
- [Serverless Functions Guide](https://vercel.com/docs/functions)

## 🆘 Support

- **Vercel Support:** [vercel.com/support](https://vercel.com/support)
- **Groq Support:** [console.groq.com](https://console.groq.com)
- **GitHub Issues:** [github.com/Venkat5599/Tenma/issues](https://github.com/Venkat5599/Tenma/issues)

---

**Ready to deploy?** Run: `cd backend && vercel --prod` 🚀
