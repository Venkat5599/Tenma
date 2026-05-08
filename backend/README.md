# Tenma Backend - Serverless API

Serverless backend for Tenma AI Trading Agent powered by Groq AI.

## 🚀 Features

- **Ultra-Fast AI**: Groq-powered responses (200-500ms)
- **Serverless**: Deploy to Vercel with zero configuration
- **CORS Enabled**: Works with any frontend
- **Fallback Responses**: Graceful degradation when API fails

## 📁 Structure

```
backend/
├── api/
│   ├── health.js           # Health check endpoint
│   └── agent/
│       ├── chat.js         # Chat with AI agent
│       └── decision.js     # Get trading decisions
├── package.json
├── vercel.json
└── README.md
```

## 🔧 Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create `.env` file:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Local Development

```bash
npm run dev
```

Server runs at: `http://localhost:3000`

## 🌐 API Endpoints

### Health Check
```
GET /api/health
```

Response:
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

### Chat with Agent
```
POST /api/agent/chat
```

Request:
```json
{
  "message": "Buy 0.5 A0GI",
  "strategy": "DCA",
  "riskProfile": "moderate",
  "balance": "10.5",
  "tradesExecuted": 5,
  "account": "0x..."
}
```

Response:
```json
{
  "response": "I'll execute a DCA buy order...",
  "provider": "groq",
  "model": "llama-3.1-70b-versatile",
  "responseTime": "250ms",
  "timestamp": 1234567890
}
```

### Get Trading Decision
```
POST /api/agent/decision
```

Request:
```json
{
  "strategy": "DCA",
  "riskProfile": "moderate",
  "balance": "10.5",
  "tradesExecuted": 5,
  "account": "0x..."
}
```

Response:
```json
{
  "decision": {
    "action": "buy",
    "token": "0x0000000000000000000000000000000000000000",
    "amount": "0.5",
    "reasoning": "Market conditions favorable...",
    "confidence": 0.85,
    "urgency": "medium",
    "timestamp": 1234567890
  },
  "provider": "groq",
  "model": "llama-3.1-70b-versatile",
  "responseTime": "300ms",
  "timestamp": 1234567890
}
```

## 🚀 Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd backend
vercel --prod
```

### Option 2: GitHub Integration

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. Select `backend` folder as root directory
5. Add environment variable: `GROQ_API_KEY`
6. Deploy

### Add Environment Variable

```bash
vercel env add GROQ_API_KEY
```

Enter your Groq API key when prompted.

## 🔗 Update Frontend

After deployment, update frontend `.env`:

```env
VITE_AGENT_API_URL=https://your-backend.vercel.app
```

## 🧪 Test Endpoints

### Test Health
```bash
curl https://your-backend.vercel.app/api/health
```

### Test Chat
```bash
curl -X POST https://your-backend.vercel.app/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show portfolio status",
    "strategy": "DCA",
    "riskProfile": "moderate",
    "balance": "10.5",
    "tradesExecuted": 5
  }'
```

### Test Decision
```bash
curl -X POST https://your-backend.vercel.app/api/agent/decision \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "DCA",
    "riskProfile": "moderate",
    "balance": "10.5",
    "tradesExecuted": 5
  }'
```

## 🛡️ Security

- API key stored in Vercel environment variables
- CORS enabled for all origins (configure as needed)
- Fallback responses for graceful degradation
- No sensitive data in responses

## 📊 Performance

- **Groq Response Time**: 200-500ms
- **Cold Start**: ~1-2s (first request)
- **Warm Requests**: <500ms
- **Fallback**: Instant (local responses)

## 🐛 Troubleshooting

### API Key Not Found
```bash
# Add environment variable
vercel env add GROQ_API_KEY

# Redeploy
vercel --prod
```

### CORS Issues
Check `Access-Control-Allow-Origin` headers in API responses.

### Slow Responses
- Check Groq API status
- Verify API key is valid
- Check Vercel function logs

## 📝 Notes

- Uses Groq SDK v0.7.0
- Llama 3.1 70B model
- Serverless functions (no server management)
- Auto-scaling based on traffic
- Free tier: 100GB bandwidth, 100GB-hours compute

## 🔗 Links

- [Groq Documentation](https://console.groq.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tenma GitHub](https://github.com/Venkat5599/Tenma)
