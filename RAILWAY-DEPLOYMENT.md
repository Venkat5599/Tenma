# 🚂 Railway Deployment Guide - Real Agent Backend

## Prerequisites
- Railway account (sign up at https://railway.app)
- GitHub repository with the code
- Supabase database credentials
- Groq API key

---

## Step 1: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: **Venkat5599/Tenma**
5. Railway will detect the project

---

## Step 2: Configure Root Directory

Since the agent is in a subdirectory, you need to set the root:

1. In Railway project settings
2. Go to **"Settings"** tab
3. Find **"Root Directory"**
4. Set to: `agent`
5. Click **"Save"**

---

## Step 3: Add Environment Variables

Go to **"Variables"** tab and add these:

### Required Variables:

```bash
# Groq AI
GROQ_API_KEY=your_groq_api_key_here

# Supabase Database
DATABASE_URL=your_database_url_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Agent Configuration
AGENT_API_PORT=3001
NODE_ENV=production
```

### Optional Variables:

```bash
# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Step 4: Deploy

1. Railway will automatically deploy after adding variables
2. Wait for build to complete (2-3 minutes)
3. Once deployed, you'll get a URL like: `https://your-app.railway.app`

---

## Step 5: Test Deployment

### Health Check:
```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1778244000000,
  "agent": "real",
  "features": {
    "tools": true,
    "memory": true,
    "approvals": true,
    "database": true
  }
}
```

### Test Chat:
```bash
curl -X POST https://your-app.railway.app/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is my balance?",
    "address": "0x1E0048D83ba01D823dc852cfabeb94fC76B089B7"
  }'
```

---

## Step 6: Update Frontend

Update your frontend `.env` file:

```env
VITE_AGENT_API_URL=https://your-app.railway.app
```

Then rebuild and redeploy your frontend.

---

## Railway Configuration Files

### ✅ Already Created:

1. **`agent/Procfile`**
   ```
   web: npm run start
   ```

2. **`agent/package.json`** (updated)
   - `start` script runs compiled code
   - `postinstall` builds TypeScript
   - `build` compiles to `dist/`

3. **`agent/tsconfig.json`** (existing)
   - Compiles to `dist/` folder
   - Includes all source files

---

## Deployment Process

Railway will:
1. ✅ Clone your GitHub repo
2. ✅ Navigate to `agent/` directory
3. ✅ Run `npm install`
4. ✅ Run `npm run postinstall` (builds TypeScript)
5. ✅ Run `npm start` (starts the server)
6. ✅ Expose on public URL

---

## Monitoring

### View Logs:
1. Go to your Railway project
2. Click on the service
3. Go to **"Deployments"** tab
4. Click on latest deployment
5. View real-time logs

### Check Metrics:
- CPU usage
- Memory usage
- Request count
- Response times

---

## Troubleshooting

### Issue: Build fails

**Check:**
- Root directory is set to `agent`
- All dependencies in `package.json`
- TypeScript compiles locally: `cd agent && npm run build`

**Solution:**
```bash
# Test locally first
cd agent
npm install
npm run build
npm start
```

### Issue: Database connection fails

**Check:**
- `DATABASE_URL` is correct
- Supabase allows connections from Railway IPs
- RLS policies are set correctly

**Solution:**
- Verify environment variables
- Check Supabase logs
- Test connection locally

### Issue: Port binding error

**Railway automatically sets PORT variable**

The code should use:
```typescript
const PORT = process.env.PORT || process.env.AGENT_API_PORT || 3001;
```

Already configured in `real-agent-api.ts`!

### Issue: 502 Bad Gateway

**Causes:**
- App crashed on startup
- Port not bound correctly
- Health check failing

**Solution:**
- Check deployment logs
- Verify app starts locally
- Check health endpoint

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Groq AI API key for LLM |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key |
| `AGENT_API_PORT` | ❌ No | Port (Railway sets PORT automatically) |
| `NODE_ENV` | ❌ No | Environment (production/development) |
| `LOG_LEVEL` | ❌ No | Logging level (info/debug/error) |

---

## API Endpoints

Once deployed, your agent will have these endpoints:

### 1. Health Check
```
GET /health
```

### 2. Chat with Agent
```
POST /agent/chat
Body: { message, address }
```

### 3. Get Conversation History
```
GET /agent/history/:address
```

### 4. Get Pending Approvals
```
GET /agent/approvals/:address
```

### 5. Approve Action
```
POST /agent/approve/:approvalId
Body: { address }
```

### 6. Reject Action
```
POST /agent/reject/:approvalId
```

### 7. Get Execution Logs
```
GET /agent/logs/:address?limit=20
```

### 8. Get User Stats
```
GET /agent/stats/:address
```

### 9. Get User Profile
```
GET /agent/profile/:address
```

### 10. Update User Profile
```
POST /agent/profile/:address
Body: { strategy, risk_profile, preferences }
```

---

## Cost Estimate

Railway pricing:
- **Free tier**: $5 credit/month
- **Pro plan**: $20/month (recommended)
- **Usage-based**: ~$0.000463/GB-hour

Estimated cost for this app:
- **Memory**: ~512MB
- **CPU**: Low usage
- **Estimated**: $5-10/month

---

## Auto-Deployment

Railway automatically deploys when you push to GitHub!

```bash
git add .
git commit -m "Update agent"
git push origin main
```

Railway will:
1. Detect the push
2. Build the new version
3. Deploy automatically
4. Zero downtime deployment

---

## Custom Domain (Optional)

1. Go to **"Settings"** tab
2. Find **"Domains"** section
3. Click **"Generate Domain"** or **"Custom Domain"**
4. Add your domain (e.g., `api.tenma.app`)
5. Update DNS records as shown

---

## Security Best Practices

✅ **Environment variables** - Never commit secrets
✅ **HTTPS** - Railway provides SSL automatically
✅ **CORS** - Configure allowed origins
✅ **Rate limiting** - Implement if needed
✅ **Database** - Use connection pooling
✅ **Logging** - Monitor for errors

---

## Next Steps After Deployment

1. ✅ Test all endpoints
2. ✅ Update frontend `.env` with Railway URL
3. ✅ Redeploy frontend
4. ✅ Test end-to-end flow
5. ✅ Monitor logs for errors
6. ✅ Set up alerts (optional)
7. ✅ Configure custom domain (optional)

---

## Quick Deploy Checklist

- [ ] Railway account created
- [ ] GitHub repo connected
- [ ] Root directory set to `agent`
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Health check passes
- [ ] Chat endpoint works
- [ ] Frontend updated with Railway URL
- [ ] End-to-end test completed

---

## Support

If you encounter issues:

1. **Check Railway logs** - Most issues show up here
2. **Test locally** - Ensure it works on your machine
3. **Verify environment variables** - Common source of errors
4. **Check Supabase** - Database connection issues
5. **Railway Discord** - Community support

---

## Summary

✅ Real Agent backend ready for Railway
✅ Configuration files created
✅ Environment variables documented
✅ Deployment steps clear
✅ Monitoring and troubleshooting guide included

**Ready to deploy!** 🚀

Follow the steps above to get your Real Agent live on Railway!
