# Tenma Backend Deployment Script (PowerShell)
# Deploy serverless backend to Vercel

Write-Host "🚀 Deploying Tenma Backend to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found!" -ForegroundColor Red
    Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
    npm i -g vercel
}

# Check if we're in the backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Not in backend directory" -ForegroundColor Red
    Write-Host "💡 Run: cd backend; .\deploy.ps1" -ForegroundColor Yellow
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Deploy to Vercel
Write-Host ""
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
vercel --prod

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Add environment variable: vercel env add GROQ_API_KEY"
Write-Host "2. Redeploy: vercel --prod"
Write-Host "3. Update frontend .env with your backend URL"
Write-Host ""
Write-Host "🧪 Test your deployment:" -ForegroundColor Yellow
Write-Host "curl https://your-backend.vercel.app/api/health"
Write-Host ""
