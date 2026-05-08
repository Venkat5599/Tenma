# Tenma Serverless API

Groq-powered AI trading agent API deployed as serverless functions.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Install Vercel CLI
npm install -g vercel

# Run locally
vercel dev
```

The API will be available at `http://localhost:3000`

### Deploy to Production

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add environment variable
vercel env add GROQ_API_KEY
```

## 📡 Endpoints

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "provider": "Groq",
  "model": "llama-3.1-70b-versatile"
}
```

### POST /api/agent/chat

Chat with the AI trading agent.

**Request:**
```json
{
  "message": "What should I do?",
  "strategy": "DCA",
  "riskProfile": "moderate",
  "balance": "100",
  "tradesExecuted": 5,
  "account": "0x1234..."
}
```

**Response:**
```json
{
  "response": "Based on your DCA strategy...",
  "provider": "groq",
  "model": "llama-3.1-70b-versatile",
  "responseTime": "250ms",
  "timestamp": 1234567890
}
```

### POST /api/agent/decision

Get trading decision from AI.

**Request:**
```json
{
  "strategy": "DCA",
  "riskProfile": "moderate",
  "balance": "100",
  "tradesExecuted": 5
}
```

**Response:**
```json
{
  "decision": {
    "action": "buy",
    "token": "0x0000000000000000000000000000000000000000",
    "amount": "0.01",
    "reasoning": "Market conditions favorable...",
    "confidence": 0.75,
    "urgency": "medium",
    "timestamp": 1234567890
  },
  "provider": "groq",
  "model": "llama-3.1-70b-versatile"
}
```

## 🔧 Environment Variables

- `GROQ_API_KEY` - Your Groq API key (required)

## 📚 Documentation

See [SERVERLESS-DEPLOYMENT.md](../SERVERLESS-DEPLOYMENT.md) for detailed deployment instructions.

## 🎯 Features

- ✅ Ultra-fast responses (200-500ms)
- ✅ Auto-scaling
- ✅ Global CDN
- ✅ CORS enabled
- ✅ Error handling
- ✅ Fallback responses

## 💰 Cost

Free tier includes:
- 100GB bandwidth/month
- 100K function invocations/month
- 100 hours execution/month

Perfect for development and small-scale production!

## 🔐 Security

- HTTPS by default
- Environment variables for secrets
- CORS configured
- Rate limiting (Vercel default)

## 📊 Monitoring

View logs and analytics in Vercel dashboard:
```bash
vercel logs --follow
```

## 🐛 Troubleshooting

### API not responding?
1. Check Vercel dashboard for errors
2. Verify GROQ_API_KEY is set
3. Check function logs

### CORS errors?
CORS is already configured. If issues persist, check your frontend URL.

### Rate limiting?
Upgrade to Vercel Pro or implement caching.

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Groq Docs: https://console.groq.com/docs
- GitHub Issues: https://github.com/Venkat5599/Tenma/issues

---

*Powered by Vercel + Groq + Llama 3.1 70B* 🚀
