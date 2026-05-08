# 🔐 Security Setup Guide

## ⚠️ IMPORTANT: Secrets Management

### What's Protected ✅

All sensitive credentials are **NEVER committed to Git**:

1. **Database Connection String** - `agent/.env`
2. **API Keys** - `agent/.env`, `backend/.env`
3. **Private Keys** - Never stored in code
4. **Supabase Keys** - Environment variables only

### How It Works

#### Local Development
```
agent/.env          ← Your secrets (IGNORED by git)
backend/.env        ← Your secrets (IGNORED by git)
frontend/.env       ← Your secrets (IGNORED by git)
```

#### Production (Vercel)
```
Vercel Dashboard → Environment Variables
- GROQ_API_KEY (encrypted)
- DATABASE_URL (encrypted)
- SUPABASE_ANON_KEY (encrypted)
```

## 🔒 Current Security Status

### ✅ Protected Files
- `agent/.env` - **NOT in git** (contains DATABASE_URL)
- `backend/.env` - **NOT in git** (contains GROQ_API_KEY)
- `frontend/.env` - **NOT in git** (contains API URLs)
- `.vercel/` - **NOT in git** (contains deployment tokens)

### ✅ Example Files (Safe to commit)
- `agent/.env.example` - Template without secrets
- `backend/.env.example` - Template without secrets
- `frontend/.env.example` - Template without secrets

## 🛡️ Database Security

### Connection String Format
```
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### Security Layers

1. **Row Level Security (RLS)**
   - Users can only access their own data
   - Enforced at database level
   - Cannot be bypassed

2. **Supabase Auth** (Optional)
   - JWT-based authentication
   - Automatic RLS integration
   - User management

3. **API Keys**
   - Anon key: Public (read-only with RLS)
   - Service key: Private (full access)
   - Never expose service key to frontend

## 🔑 Environment Variables Setup

### Agent (Backend Service)

Create `agent/.env`:
```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Groq AI
GROQ_API_KEY=[YOUR_GROQ_KEY]

# Blockchain
RPC_URL=https://evmrpc-testnet.0g.ai
CHAIN_ID=16602

# Contracts
TENMA_FIREWALL_ADDRESS=0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9
SHIELDPOOL_CONTRACT_ADDRESS=0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d
```

### Backend (Vercel Serverless)

Add to Vercel:
```bash
vercel env add GROQ_API_KEY production
vercel env add DATABASE_URL production
vercel env add SUPABASE_ANON_KEY production
```

### Frontend (Vercel)

Add to Vercel:
```bash
vercel env add VITE_AGENT_API_URL production
vercel env add VITE_TENMA_FIREWALL_ADDRESS production
vercel env add VITE_COMMIT_REVEAL_ADDRESS production
vercel env add VITE_CHAIN_ID production
vercel env add VITE_RPC_URL production
```

## 🚨 What NOT to Do

### ❌ NEVER commit:
- `.env` files with real credentials
- Private keys or mnemonics
- API keys in code
- Database passwords
- Service account keys

### ❌ NEVER expose in frontend:
- Database connection strings
- Service role keys
- Private API keys
- Admin credentials

### ❌ NEVER log:
- Full API keys
- Database passwords
- User private keys
- Sensitive user data

## ✅ What TO Do

### ✅ ALWAYS:
- Use environment variables
- Use `.env.example` templates
- Rotate keys regularly
- Use RLS for database
- Validate all inputs
- Log only non-sensitive data

### ✅ FOR PRODUCTION:
- Use Vercel environment variables
- Enable Supabase RLS
- Use HTTPS only
- Implement rate limiting
- Monitor for suspicious activity
- Regular security audits

## 🔍 Verify Your Setup

### Check Git Status
```bash
git status
# Should NOT show any .env files
```

### Check .gitignore
```bash
cat .gitignore | grep .env
# Should show: .env, .env.local, *.env, !.env.example
```

### Check Committed Files
```bash
git log --all --full-history -- "*.env"
# Should show NO results (except .env.example)
```

## 🆘 If You Accidentally Committed Secrets

### Immediate Actions:

1. **Rotate ALL exposed credentials immediately**
   - Change database password
   - Regenerate API keys
   - Update all services

2. **Remove from Git history**
```bash
# Remove file from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch agent/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - coordinate with team)
git push origin --force --all
```

3. **Verify removal**
```bash
git log --all --full-history -- agent/.env
# Should show NO results
```

4. **Update .gitignore**
```bash
echo "agent/.env" >> .gitignore
git add .gitignore
git commit -m "Add agent/.env to gitignore"
```

## 📋 Security Checklist

Before deploying:

- [ ] All `.env` files in `.gitignore`
- [ ] No secrets in git history
- [ ] Environment variables set in Vercel
- [ ] RLS enabled on Supabase
- [ ] API keys rotated
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Error messages sanitized
- [ ] Logging excludes secrets
- [ ] Security headers configured

## 🔗 Resources

- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

---

**Your secrets are safe!** 🔒

All sensitive data is:
- ✅ In `.env` files (ignored by git)
- ✅ In Vercel environment variables (encrypted)
- ✅ Protected by RLS (database level)
- ✅ Never exposed to frontend
- ✅ Never committed to repository
