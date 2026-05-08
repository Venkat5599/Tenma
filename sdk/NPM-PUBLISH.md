# 📦 Publishing Tenma Firewall SDK to NPM

## Prerequisites
- NPM account (sign up at https://www.npmjs.com)
- NPM CLI installed
- Built SDK (`npm run build` already done)

---

## Step 1: Login to NPM

```bash
cd sdk
npm login
```

Enter your NPM credentials:
- Username
- Password
- Email
- 2FA code (if enabled)

---

## Step 2: Verify Package

Check what will be published:

```bash
npm pack --dry-run
```

This shows:
- Package name: `@tenma/firewall-sdk`
- Version: `1.0.0`
- Files included: `dist/`, `README.md`, `LICENSE`

---

## Step 3: Publish to NPM

### For Scoped Package (@tenma/firewall-sdk):

```bash
npm publish --access public
```

### For Unscoped Package (if you change the name):

```bash
npm publish
```

---

## Step 4: Verify Publication

Check on NPM:
```
https://www.npmjs.com/package/@tenma/firewall-sdk
```

Or install it:
```bash
npm install @tenma/firewall-sdk
```

---

## Package Information

### Name
`@tenma/firewall-sdk`

### Description
On-Chain Firewall SDK for AI Agents on 0G Network

### Version
`1.0.0`

### What's Included
- ✅ Firewall Client
- ✅ Storage Client  
- ✅ Commit-Reveal Pattern
- ✅ Policy Management
- ✅ Transaction Simulation
- ✅ TypeScript Types
- ✅ Examples

### Installation (After Publishing)
```bash
npm install @tenma/firewall-sdk
```

### Usage
```typescript
import { TenmaFirewall } from '@tenma/firewall-sdk';

const firewall = new TenmaFirewall({
  contractAddress: '0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9',
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  privateKey: 'your-private-key'
});

// Set policy
await firewall.setPolicy({
  maxTransactionAmount: '1.0',
  maxDailyAmount: '10.0',
  maxGasPrice: '50',
  maxRiskScore: 7,
  requireApproval: true
});

// Simulate transaction
const result = await firewall.simulateTransaction(
  '0xRecipient...',
  '0.5'
);

if (result.allowed) {
  // Execute transaction
}
```

---

## Updating the Package

### 1. Update Version

Edit `package.json`:
```json
{
  "version": "1.0.1"  // or 1.1.0, 2.0.0
}
```

Or use npm:
```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### 2. Build
```bash
npm run build
```

### 3. Publish
```bash
npm publish
```

---

## Version Guidelines

Follow Semantic Versioning (semver):

- **Patch** (1.0.x): Bug fixes, no breaking changes
- **Minor** (1.x.0): New features, backward compatible
- **Major** (x.0.0): Breaking changes

---

## NPM Scripts

```bash
# Build TypeScript
npm run build

# Watch mode (development)
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Prepare for publishing (runs automatically)
npm run prepublishOnly
```

---

## Files Published

Only these files are included (see `files` in package.json):
- `dist/` - Compiled JavaScript and type definitions
- `README.md` - Documentation
- `LICENSE` - MIT License

Excluded:
- `src/` - Source TypeScript files
- `examples/` - Example code
- `node_modules/` - Dependencies
- `.git/` - Git files

---

## Troubleshooting

### Error: Package name already exists

Change the package name in `package.json`:
```json
{
  "name": "@your-username/firewall-sdk"
}
```

Or use unscoped:
```json
{
  "name": "tenma-firewall-sdk"
}
```

### Error: Need to login

```bash
npm login
```

### Error: 403 Forbidden

For scoped packages, add:
```bash
npm publish --access public
```

### Error: Version already published

Update version:
```bash
npm version patch
npm publish
```

---

## Best Practices

✅ **Test before publishing**
```bash
npm run test
npm run build
npm pack --dry-run
```

✅ **Update README** with examples and API docs

✅ **Add LICENSE file** (MIT recommended)

✅ **Use semantic versioning**

✅ **Add keywords** for discoverability

✅ **Include TypeScript types** (already configured)

✅ **Test installation** after publishing:
```bash
mkdir test-install
cd test-install
npm init -y
npm install @tenma/firewall-sdk
```

---

## Package Stats

After publishing, track:
- Downloads: https://npm-stat.com/charts.html?package=@tenma/firewall-sdk
- Bundle size: https://bundlephobia.com/package/@tenma/firewall-sdk
- Dependencies: https://www.npmjs.com/package/@tenma/firewall-sdk?activeTab=dependencies

---

## Unpublishing (Use with Caution!)

```bash
# Unpublish specific version
npm unpublish @tenma/firewall-sdk@1.0.0

# Unpublish entire package (within 72 hours)
npm unpublish @tenma/firewall-sdk --force
```

⚠️ **Warning**: Unpublishing is permanent and can break dependent projects!

---

## Summary

✅ SDK built and ready
✅ Package.json configured
✅ TypeScript compiled to `dist/`
✅ README included
✅ Repository URL set

**Ready to publish!** 🚀

Run:
```bash
cd sdk
npm login
npm publish --access public
```

Then share with developers:
```bash
npm install @tenma/firewall-sdk
```
