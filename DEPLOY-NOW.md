# 🚀 Deploy Backend NOW (5 Minutes)

Quick deployment guide to get your Tenma backend live on Vercel.

## Prerequisites

- ✅ Git Bash or PowerShell
- ✅ Node.js installed
- ✅ Groq API key (from console.groq.com)

## Step 1: Install Vercel CLI (1 minute)

```bash
npm i -g vercel
```

## Step 2: Login to Vercel (1 minute)

```bash
vercel login
```

This will open your browser. Login with:
- GitHub
- GitLab
- Bitbucket
- Email

## Step 3: Deploy Backend (2 minutes)

```bash
cd backend
vercel --prod
```

Answer the prompts:
- **Set up and deploy?** `Y`
- **Which scope?** Select your account
- **Link to existing project?** `N`
- **Project name?** `tenma-backend` (or your choice)
- **Directory?** `./` (press Enter)
- **Override settings?** `N`

Wait for deployment... ⏳

You'll see:
```
✅ Production: https://tenma-backend-xxx.vercel.app
```

**Copy this URL!** 📋

## Step 4: Add API Key (1 minute)

```bash
vercel env add GROQ_API_KEY
```

When prompted:
- **Value?** Paste your Groq API key
- **Environment?** Select: `Production` (press Space, then Enter)
- **Add to other environments?** `Y`
- Select all environments (press Space for each, then Enter)

## Step 5: Redeploy with API Key (30 seconds)

```bash
vercel --prod
```

Wait for redeployment... ⏳

Done! ✅

## Step 6: Test Your Backend (30 seconds)

Replace `YOUR_URL` with your actual Vercel URL:

```bash
# Test health endpoint
curl https://YOUR_URL.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "provider": "Groq",
  "model": "llama-3.1-70b-versatile"
}
```

If you see this, **you're live!** 🎉

## Step 7: Update Frontend

Edit `frontend/.env`:

```env
VITE_AGENT_API_URL=https://YOUR_URL.vercel.app
```

Restart frontend:

```bash
cd frontend
npm run dev
```

## 🎉 Done!

Your backend is now live and your frontend is connected!

## Quick Test

1. Open frontend: http://localhost:5174
2. Go to AI Trading Chat
3. Type: "Show portfolio status"
4. You should see a Groq-powered response! 🤖

## 🐛 Troubleshooting

### Issue: "vercel: command not found"

**Solution:**
```bash
npm i -g vercel
```

### Issue: "GROQ_API_KEY is undefined"

**Solution:**
```bash
vercel env add GROQ_API_KEY
vercel --prod
```

### Issue: "404 Not Found"

**Solution:** Check your URL format:
- ✅ `https://your-backend.vercel.app/api/health`
- ❌ `https://your-backend.vercel.app/health`

### Issue: Frontend not connecting

**Solution:** Check `frontend/.env`:
```env
VITE_AGENT_API_URL=https://your-backend.vercel.app
```

Restart frontend:
```bash
cd frontend
npm run dev
```

## 📊 View Your Deployment

1. Go to: https://vercel.com/dashboard
2. Find your project: `tenma-backend`
3. View:
   - Deployment status
   - Logs
   - Analytics
   - Environment variables

## 🔄 Update Backend

Made changes to backend code?

```bash
cd backend
git add .
git commit -m "Update backend"
git push origin main
```

Vercel will auto-deploy! 🚀

Or manually:
```bash
cd backend
vercel --prod
```

## 📝 Next Steps

- ✅ Backend deployed
- ✅ Frontend connected
- 🔄 Deploy frontend to Vercel (optional)
- 🔄 Add custom domain (optional)
- 🔄 Set up monitoring (optional)

## 🆘 Need More Help?

- **Full Guide:** See `BACKEND-DEPLOYMENT.md`
- **API Docs:** See `backend/README.md`
- **Status:** See `BACKEND-STATUS.md`

---

**Ready?** Run: `cd backend && vercel --prod` 🚀
