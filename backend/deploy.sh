#!/bin/bash

# Tenma Backend Deployment Script
# Deploy serverless backend to Vercel

echo "🚀 Deploying Tenma Backend to Vercel..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in backend directory"
    echo "💡 Run: cd backend && ./deploy.sh"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add environment variable: vercel env add GROQ_API_KEY"
echo "2. Redeploy: vercel --prod"
echo "3. Update frontend .env with your backend URL"
echo ""
echo "🧪 Test your deployment:"
echo "curl https://your-backend.vercel.app/api/health"
echo ""
