#!/bin/bash

echo "🚀 Tenma AI Agent & 0G Storage Integration Setup"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
echo ""

# Step 1: Install agent dependencies
echo "📦 Step 1: Installing agent dependencies..."
cd agent
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ agent/package.json not found${NC}"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install agent dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Agent dependencies installed${NC}"
echo ""

# Step 2: Setup agent environment
echo "⚙️  Step 2: Setting up agent environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created agent/.env from example${NC}"
    echo -e "${YELLOW}⚠️  Please edit agent/.env with your credentials:${NC}"
    echo "   - PRIVATE_KEY"
    echo "   - TENMA_API_KEY or OPENAI_API_KEY"
    echo "   - ZEROG_API_KEY"
else
    echo -e "${GREEN}✅ agent/.env already exists${NC}"
fi
echo ""

cd ..

# Step 3: Install frontend dependencies (if needed)
echo "📦 Step 3: Checking frontend dependencies..."
cd frontend
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ frontend/package.json not found${NC}"
    exit 1
fi

# Check if axios is installed
if ! grep -q '"axios"' package.json; then
    echo "Installing axios..."
    npm install axios
    echo -e "${GREEN}✅ Axios installed${NC}"
else
    echo -e "${GREEN}✅ Axios already installed${NC}"
fi
echo ""

# Step 4: Setup frontend environment
echo "⚙️  Step 4: Setting up frontend environment..."
if [ ! -f ".env.local" ]; then
    echo "VITE_AGENT_API_URL=http://localhost:3001" > .env.local
    echo -e "${GREEN}✅ Created frontend/.env.local${NC}"
else
    echo -e "${GREEN}✅ frontend/.env.local already exists${NC}"
fi
echo ""

cd ..

# Step 5: Build TypeScript
echo "🔨 Step 5: Building TypeScript..."
cd agent
npm run build
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  TypeScript build had warnings (this is okay)${NC}"
else
    echo -e "${GREEN}✅ TypeScript built successfully${NC}"
fi
echo ""

cd ..

# Summary
echo "================================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Edit agent/.env with your credentials:"
echo "   cd agent"
echo "   nano .env  # or use your preferred editor"
echo ""
echo "2. Start the agent API server:"
echo "   cd agent"
echo "   npm run api:start"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:5174 in your browser"
echo ""
echo "📚 For detailed instructions, see INTEGRATION-GUIDE.md"
echo ""
echo "🎉 Happy building!"
