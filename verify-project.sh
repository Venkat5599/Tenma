#!/bin/bash

echo "🔍 ShieldPool Project Verification"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
        return 1
    fi
}

echo "📦 Checking Smart Contracts..."
check_dir "shieldpool-contracts"
check_file "shieldpool-contracts/contracts/CommitRevealContract.sol"
check_file "shieldpool-contracts/test/CommitRevealContract.test.ts"
check_file "shieldpool-contracts/scripts/deploy.ts"
check_file "shieldpool-contracts/hardhat.config.ts"
check_file "shieldpool-contracts/package.json"
check_file "shieldpool-contracts/.env.example"
echo ""

echo "🎨 Checking Frontend..."
check_dir "shieldpool-frontend"
check_file "shieldpool-frontend/src/components/GlassCard.tsx"
check_file "shieldpool-frontend/src/components/GlassButton.tsx"
check_file "shieldpool-frontend/src/components/Header.tsx"
check_file "shieldpool-frontend/src/components/PlumBackground.tsx"
check_file "shieldpool-frontend/src/pages/Dashboard.tsx"
check_file "shieldpool-frontend/src/App.tsx"
check_file "shieldpool-frontend/src/index.css"
check_file "shieldpool-frontend/package.json"
check_file "shieldpool-frontend/.env.example"
echo ""

echo "🗄️ Checking Storage Client..."
check_dir "shieldpool-storage"
check_file "shieldpool-storage/src/storage-client.ts"
check_file "shieldpool-storage/src/logger.ts"
check_file "shieldpool-storage/src/index.ts"
check_file "shieldpool-storage/package.json"
check_file "shieldpool-storage/tsconfig.json"
check_file "shieldpool-storage/.env.example"
echo ""

echo "🤖 Checking AI Agent..."
check_dir "shieldpool-agent"
check_file "shieldpool-agent/src/agent.ts"
check_file "shieldpool-agent/src/memory.ts"
check_file "shieldpool-agent/src/shieldpool-client.ts"
check_file "shieldpool-agent/src/storage-client.ts"
check_file "shieldpool-agent/src/logger.ts"
check_file "shieldpool-agent/src/index.ts"
check_file "shieldpool-agent/package.json"
check_file "shieldpool-agent/tsconfig.json"
check_file "shieldpool-agent/.env.example"
echo ""

echo "📚 Checking Documentation..."
check_file "README.md"
check_file "HACKATHON-SUBMISSION.md"
check_file "DEPLOYMENT-CHECKLIST.md"
check_file "INTEGRATION-GUIDE.md"
check_file "DEMO-VIDEO-SCRIPT.md"
check_file "QUICK-WINS-TO-10.md"
check_file "PROJECT-STATUS.md"
check_file "ERRORS-FIXED-COMPLETE.md"
echo ""

echo "=================================="
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Install dependencies: cd shieldpool-contracts && npm install"
echo "2. Configure .env files"
echo "3. Deploy contracts"
echo "4. Deploy frontend"
echo ""
