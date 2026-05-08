#!/bin/bash

# Tenma Serverless API Deployment Script

echo "🚀 Deploying Tenma Serverless API to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in
echo "📝 Checking Vercel authentication..."
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add GROQ_API_KEY: vercel env add GROQ_API_KEY"
echo "2. Test your API: curl https://your-project.vercel.app/api/health"
echo "3. Update frontend .env: VITE_AGENT_API_URL=https://your-project.vercel.app"
echo ""
echo "🎉 Your API is now live!"
