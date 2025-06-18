export interface SimpleFeeConfig {
  // Pay-per-trade model
  feePerTransaction: number; // SOL per transaction
  minimumFee: number; // Minimum SOL fee
  feeCollectionWallet: string; // Your wallet address
  
  // Volume-based discounts (optional)
  volumeDiscounts: {
    tier1: { minTransactions: 100, discount: 0.1 }; // 10% off after 100 trades
    tier2: { minTransactions: 500, discount: 0.2 }; // 20% off after 500 trades
    tier3: { minTransactions: 1000, discount: 0.3 }; // 30% off after 1000 trades
  };
  
  // Free trial
  freeTrades: number; // Number of free trades for new users
}

export const defaultFeeConfig: SimpleFeeConfig = {
  feePerTransaction: 0.001, // 0.001 SOL per trade (~$0.10 at $100 SOL)
  minimumFee: 0.0005,
  feeCollectionWallet: process.env.FEE_COLLECTION_WALLET || "BDLwWVXu2vYfvqHaNd7wUem3mVgADJeSsWcnJJA4tkVm", // Replace with your wallet
  
  volumeDiscounts: {
    tier1: { minTransactions: 100, discount: 0.1 },
    tier2: { minTransactions: 500, discount: 0.2 },
    tier3: { minTransactions: 1000, discount: 0.3 }
  },
  
  freeTrades: 10 // 10 free trades to try the service
};

export class SimpleFeeManager {
  private userStats = new Map<string, { totalTrades: number; freeTradesUsed: number }>();
  
  calculateFee(userWallet: string): number {
    const stats = this.userStats.get(userWallet) || { totalTrades: 0, freeTradesUsed: 0 };
    
    // Check if user has free trades remaining
    if (stats.freeTradesUsed < defaultFeeConfig.freeTrades) {
      return 0; // Free trade
    }
    
    let fee = defaultFeeConfig.feePerTransaction;
    
    // Apply volume discounts
    if (stats.totalTrades >= defaultFeeConfig.volumeDiscounts.tier3.minTransactions) {
      fee *= (1 - defaultFeeConfig.volumeDiscounts.tier3.discount);
    } else if (stats.totalTrades >= defaultFeeConfig.volumeDiscounts.tier2.minTransactions) {
      fee *= (1 - defaultFeeConfig.volumeDiscounts.tier2.discount);
    } else if (stats.totalTrades >= defaultFeeConfig.volumeDiscounts.tier1.minTransactions) {
      fee *= (1 - defaultFeeConfig.volumeDiscounts.tier1.discount);
    }
    
    return Math.max(fee, defaultFeeConfig.minimumFee);
  }
  
  recordTrade(userWallet: string, wasFree: boolean): void {
    const stats = this.userStats.get(userWallet) || { totalTrades: 0, freeTradesUsed: 0 };
    
    if (wasFree) {
      stats.freeTradesUsed++;
    } else {
      stats.totalTrades++;
    }
    
    this.userStats.set(userWallet, stats);
  }
  
  getUserStats(userWallet: string): { totalTrades: number; freeTradesRemaining: number; currentFee: number; nextDiscount?: string } {
    const stats = this.userStats.get(userWallet) || { totalTrades: 0, freeTradesUsed: 0 };
    const freeTradesRemaining = Math.max(0, defaultFeeConfig.freeTrades - stats.freeTradesUsed);
    const currentFee = this.calculateFee(userWallet);
    
    let nextDiscount: string | undefined;
    if (stats.totalTrades < defaultFeeConfig.volumeDiscounts.tier1.minTransactions) {
      nextDiscount = `${defaultFeeConfig.volumeDiscounts.tier1.minTransactions - stats.totalTrades} trades until 10% discount`;
    } else if (stats.totalTrades < defaultFeeConfig.volumeDiscounts.tier2.minTransactions) {
      nextDiscount = `${defaultFeeConfig.volumeDiscounts.tier2.minTransactions - stats.totalTrades} trades until 20% discount`;
    } else if (stats.totalTrades < defaultFeeConfig.volumeDiscounts.tier3.minTransactions) {
      nextDiscount = `${defaultFeeConfig.volumeDiscounts.tier3.minTransactions - stats.totalTrades} trades until 30% discount`;
    }
    
    return {
      totalTrades: stats.totalTrades,
      freeTradesRemaining,
      currentFee,
      nextDiscount
    };
  }
}