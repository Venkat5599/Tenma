# Tenma Serverless API Deployment Script (PowerShell)

Write-Host "🚀 Deploying Tenma Serverless API to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Check if logged in
Write-Host "📝 Checking Vercel authentication..." -ForegroundColor Cyan
$loginCheck = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔐 Please login to Vercel..." -ForegroundColor Yellow
    vercel login
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

# Deploy to production
Write-Host "🚀 Deploying to production..." -ForegroundColor Cyan
vercel --prod

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Add GROQ_API_KEY: vercel env add GROQ_API_KEY"
Write-Host "2. Test your API: curl https://your-project.vercel.app/api/health"
Write-Host "3. Update frontend .env: VITE_AGENT_API_URL=https://your-project.vercel.app"
Write-Host ""
Write-Host "🎉 Your API is now live!" -ForegroundColor Green
