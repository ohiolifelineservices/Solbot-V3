// Core types for the Solbot application

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  price: string;
  volume24h: string;
  marketCap?: string;
  verified?: boolean;
  hasPool?: boolean;
  poolKeys?: any;
}

export interface WalletData {
  id: string;
  address: string;
  solBalance: number;
  tokenBalance: number;
  isActive: boolean;
  walletNumber?: number;
  privateKeyVisible?: boolean;
  privateKey?: string;
  transactionCount?: number;
}

export interface TradingSession {
  id: string;
  userWallet: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  strategy: 'VOLUME_ONLY' | 'MAKERS_VOLUME';
  walletCount: number;
  solAmount: number;
  status: 'created' | 'active' | 'paused' | 'stopped' | 'error';
  adminWallet?: any;
  tradingWallets: any[];
  poolKeys?: any;
  createdAt: Date;
  startTime?: Date;
  endTime?: Date;
  metrics: TradingMetrics;
}

export interface TradingMetrics {
  totalVolume: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalFees: number;
  averageSlippage: number;
  successRate?: number;
  activeWallets?: number;
}

export interface TransactionRecord {
  id: string;
  sessionId: string;
  type: 'buy' | 'sell';
  amount: number;
  tokenAmount?: number;
  price?: number;
  hash?: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  fee: number;
  slippage?: number;
  error?: string;
  tokenSymbol?: string;
  time?: string;
  walletId?: string;
  token?: string;
}

export interface UserStats {
  totalTrades: number;
  freeTradesUsed: number;
  freeTradesRemaining: number;
  totalFeesPaid: number;
  successRate?: number;
  currentFee?: number;
  nextDiscount?: string;
  totalVolume?: number;
  totalFees?: number;
}

export interface GlobalMetrics {
  totalVolume: number;
  totalTransactions: number;
  activeWallets: number;
  totalFees: number;
  activeSessions: number;
  volumeChange: number;
  transactionChange: number;
  walletChange: number;
  feeChange: number;
}

export interface SessionFile {
  filename: string;
  tokenName: string;
  timestamp: string;
  walletCount: number;
  tokenAddress: string;
  size: string;
  lastModified: Date;
}

export interface SessionData {
  admin: {
    number: number;
    address: string;
    privateKey: string;
  };
  wallets: Array<{
    number: number;
    address: string;
    privateKey: string;
    generationTimestamp?: string;
  }>;
  tokenAddress: string;
  poolKeys: any;
  tokenName: string;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationResponse {
  valid: boolean;
  tokenInfo?: TokenInfo;
  error?: string;
}

export interface FeeConfig {
  feePerTransaction: number;
  minimumFee: number;
  freeTrades: number;
  volumeDiscounts: {
    tier1: { minTransactions: number; discount: number };
    tier2: { minTransactions: number; discount: number };
    tier3: { minTransactions: number; discount: number };
  };
}