export interface TradingSession {
  id: string
  tokenAddress: string
  tokenName: string
  tokenSymbol: string
  strategy: 'volume_only' | 'makers_volume'
  status: 'created' | 'active' | 'paused' | 'stopped' | 'error'
  walletCount: number
  solAmount: number
  startTime?: Date
  endTime?: Date
  metrics: TradingMetrics
}

export interface TradingMetrics {
  totalVolume: number
  totalTransactions: number
  successRate: number
  averageSlippage: number
  totalFees: number
  activeWallets: number
}

export interface TradingWallet {
  id: string
  address: string
  privateKey: string
  solBalance: number
  tokenBalance: number
  isActive: boolean
  transactionCount: number
}

export interface Transaction {
  id: string
  sessionId: string
  walletId: string
  type: 'buy' | 'sell'
  amount: string
  token: string
  price: string
  hash: string
  status: 'pending' | 'success' | 'failed'
  fee: string
  timestamp: Date
}

export interface UserStats {
  totalTrades: number
  freeTradesRemaining: number
  currentFee: number
  nextDiscount?: string
  totalVolume: number
  totalFees: number
}

export interface TokenInfo {
  address: string
  name: string
  symbol: string
  price: string
  volume24h: string
  marketCap?: string
  verified?: boolean
}

export interface FeeConfig {
  feePerTransaction: number
  minimumFee: number
  freeTrades: number
  volumeDiscounts: {
    tier1: { minTransactions: number; discount: number }
    tier2: { minTransactions: number; discount: number }
    tier3: { minTransactions: number; discount: number }
  }
}