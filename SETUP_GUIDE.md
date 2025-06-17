# Solbot Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Premium Solana RPC Endpoint** (QuickNode, Alchemy, Helius, etc.)
4. **SOL for trading** and **gas fees**

## Installation

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd Solbot
npm install
```

2. **Fix Security Issues**
```bash
npm audit fix
npm update
```

## Configuration

### 1. RPC Endpoint Setup

Edit `swapConfig.ts`:
```typescript
export const swapConfig = {
  RPC_URL: "YOUR_PREMIUM_RPC_ENDPOINT_HERE",
  // ... rest of config
};
```

### 2. Environment Variables (Optional)

Create `.env` file:
```env
ADMIN_WALLET_PRIVATE_KEY=your_admin_wallet_private_key_here
RPC_URL=your_premium_rpc_endpoint
TOKEN_ADDRESS=target_token_address
```

### 3. Trading Configuration

Review and adjust parameters in `swapConfig.ts`:
- `SLIPPAGE_PERCENT`: Slippage tolerance (default: 5%)
- `initialAmount`: Initial SOL amount for swaps
- `maxRetries`: Maximum retry attempts
- Trading durations and percentages

## Usage

### Start the Bot
```bash
npm run swap
```

### Run Tests
```bash
npm test
```

### Manual Start
```bash
npx ts-node index.ts
```

## Trading Workflow

1. **Choose Session Type**
   - New session: Start fresh
   - Restart session: Resume from saved state

2. **Token Setup**
   - Enter token address
   - Bot fetches token data from DexScreener

3. **Wallet Management**
   - Import existing admin wallet OR generate new one
   - Create multiple trading wallets
   - Distribute SOL to trading wallets

4. **Trading Strategy**
   - **Increase Makers + Volume**: Creates market depth and volume
   - **Increase Volume Only**: Focuses on volume generation

5. **Monitor and Control**
   - Bot runs automatically based on configuration
   - Sessions are saved for resuming later

## Important Notes

### ⚠️ Risks and Disclaimers
- **This is a volume bot** that may be considered market manipulation
- **Use at your own risk** - trading bots can lose money
- **Test thoroughly** on devnet before mainnet
- **Start with small amounts** to validate functionality
- **Check local regulations** regarding automated trading

### 🔒 Security Best Practices
- Never share private keys
- Use dedicated wallets for bot trading
- Monitor bot activity regularly
- Keep SOL amounts reasonable
- Use hardware wallets for large holdings

### 📊 Monitoring
- Check wallet balances regularly
- Monitor for failed transactions
- Watch for API rate limits
- Keep track of trading performance

## Troubleshooting

### Common Issues

1. **"Pool keys not found"**
   - Ensure you're using a premium RPC endpoint
   - Verify token address is correct
   - Check if token has active Raydium pools

2. **"RPC call disabled"**
   - Switch to premium RPC endpoint
   - Public RPCs don't support all required calls

3. **"Environment variable not defined"**
   - Set up `.env` file or provide values when prompted
   - Ensure all required variables are set

4. **Transaction failures**
   - Check SOL balance for gas fees
   - Verify slippage settings
   - Ensure network connectivity

### Getting Help

1. Check the `FUNCTIONALITY_REPORT.md` for detailed analysis
2. Review error messages carefully
3. Test individual components using the test scripts
4. Ensure all prerequisites are met

## Advanced Configuration

### Custom Trading Parameters
Edit `swapConfig.ts` to adjust:
- Trading durations
- Buy/sell percentages  
- Retry intervals
- Fee configurations

### Session Management
- Sessions are saved in `./sessions/` directory
- Each session includes wallet data and trading state
- Sessions can be resumed at different points

### Multiple Token Support
- Bot can be restarted with different tokens
- Each token gets its own session file
- Wallets can be reused across sessions

## Support

For issues or questions:
1. Check the functionality report
2. Review the code documentation
3. Test with the provided test scripts
4. Ensure proper RPC endpoint setup