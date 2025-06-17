export interface TradingConfig {
  // RPC Configuration
  rpc: {
    primary: string;
    fallbacks: string[];
    timeout: number;
    retryAttempts: number;
  };
  
  // Trading Parameters
  trading: {
    strategies: {
      volumeOnly: {
        duration: number;
        buyDuration: number;
        sellDuration: number;
        loopInterval: number;
      };
      makersVolume: {
        duration: number;
        buyDuration: number;
        sellDuration: number;
        loopInterval: number;
      };
    };
    
    // Risk Management
    risk: {
      maxSlippage: number;
      minSlippage: number;
      dynamicSlippage: boolean;
      maxLossPerWallet: number; // SOL
      maxDailyVolume: number; // USD
      emergencyStopLoss: number; // %
    };
    
    // Wallet Management
    wallets: {
      maxWallets: number;
      minSolPerWallet: number;
      maxSolPerWallet: number;
      redistributionThreshold: number;
    };
    
    // Randomization
    randomization: {
      buyAmount: { min: number; max: number };
      sellAmount: { min: number; max: number };
      timing: { min: number; max: number };
      walletSelection: boolean;
    };
  };
  
  // Fee Structure
  fees: {
    transactionFee: number; // % of volume
    minimumFee: number; // SOL
    subscriptionTier: 'free' | 'basic' | 'pro' | 'enterprise';
  };
  
  // Monitoring
  monitoring: {
    enableMetrics: boolean;
    reportingInterval: number;
    alertThresholds: {
      failureRate: number;
      lowBalance: number;
      highSlippage: number;
    };
  };
}

export const defaultConfig: TradingConfig = {
  rpc: {
    primary: "https://shy-yolo-theorem.solana-mainnet.quiknode.pro/1796bb57c2fdd2a536ae9f46f2d0fd57a9f27bc3/",
    fallbacks: [
      "https://api.mainnet-beta.solana.com",
      "https://solana-api.projectserum.com"
    ],
    timeout: 30000,
    retryAttempts: 3
  },
  
  trading: {
    strategies: {
      volumeOnly: {
        duration: 1200000, // 20 minutes
        buyDuration: 61000,
        sellDuration: 30000,
        loopInterval: 8000
      },
      makersVolume: {
        duration: 181000, // 3 minutes
        buyDuration: 45000,
        sellDuration: 25000,
        loopInterval: 6000
      }
    },
    
    risk: {
      maxSlippage: 10,
      minSlippage: 1,
      dynamicSlippage: true,
      maxLossPerWallet: 0.1,
      maxDailyVolume: 100000,
      emergencyStopLoss: 50
    },
    
    wallets: {
      maxWallets: 50,
      minSolPerWallet: 0.001,
      maxSolPerWallet: 1.0,
      redistributionThreshold: 0.0005
    },
    
    randomization: {
      buyAmount: { min: 5, max: 15 },
      sellAmount: { min: 50, max: 100 },
      timing: { min: 500, max: 2000 },
      walletSelection: true
    }
  },
  
  fees: {
    transactionFee: 0.5,
    minimumFee: 0.001,
    subscriptionTier: 'free'
  },
  
  monitoring: {
    enableMetrics: true,
    reportingInterval: 30000,
    alertThresholds: {
      failureRate: 20,
      lowBalance: 0.01,
      highSlippage: 8
    }
  }
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: TradingConfig;
  
  private constructor() {
    this.config = { ...defaultConfig };
  }
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  getConfig(): TradingConfig {
    return this.config;
  }
  
  updateConfig(updates: Partial<TradingConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  // Dynamic configuration based on market conditions
  adjustForMarketConditions(volatility: number, liquidity: number): void {
    if (volatility > 0.1) { // High volatility
      this.config.trading.risk.maxSlippage = Math.min(15, this.config.trading.risk.maxSlippage + 2);
      this.config.trading.strategies.volumeOnly.loopInterval += 2000;
    }
    
    if (liquidity < 10000) { // Low liquidity
      this.config.trading.randomization.buyAmount.max = Math.min(10, this.config.trading.randomization.buyAmount.max);
      this.config.trading.risk.maxSlippage += 1;
    }
  }
  
  // Subscription tier adjustments
  applySubscriptionLimits(tier: 'free' | 'basic' | 'pro' | 'enterprise'): void {
    const limits = {
      free: { maxWallets: 3, maxDailyVolume: 1000 },
      basic: { maxWallets: 10, maxDailyVolume: 10000 },
      pro: { maxWallets: 25, maxDailyVolume: 100000 },
      enterprise: { maxWallets: 100, maxDailyVolume: 1000000 }
    };
    
    const limit = limits[tier];
    this.config.trading.wallets.maxWallets = limit.maxWallets;
    this.config.trading.risk.maxDailyVolume = limit.maxDailyVolume;
    this.config.fees.subscriptionTier = tier;
  }
}