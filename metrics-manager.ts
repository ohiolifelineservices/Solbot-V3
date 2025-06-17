import chalk from 'chalk';

export interface TradingMetrics {
  session: {
    id: string;
    startTime: Date;
    endTime?: Date;
    status: 'active' | 'paused' | 'stopped' | 'error';
    strategy: string;
  };
  
  volume: {
    totalVolumeUSD: number;
    totalVolumeSol: number;
    buyVolume: number;
    sellVolume: number;
    transactionCount: number;
  };
  
  performance: {
    successfulTrades: number;
    failedTrades: number;
    successRate: number;
    averageSlippage: number;
    totalFeesPaid: number;
    profitLoss: number;
  };
  
  wallets: {
    totalWallets: number;
    activeWallets: number;
    totalSolBalance: number;
    totalTokenBalance: number;
    averageBalancePerWallet: number;
  };
  
  errors: {
    rpcErrors: number;
    transactionErrors: number;
    balanceErrors: number;
    networkErrors: number;
  };
  
  timing: {
    averageTransactionTime: number;
    lastUpdateTime: Date;
    uptime: number;
  };
}

export class MetricsManager {
  private metrics: TradingMetrics;
  private transactionTimes: number[] = [];
  private slippageHistory: number[] = [];
  private volumeHistory: { timestamp: Date; volume: number }[] = [];
  
  constructor(sessionId: string, strategy: string) {
    this.metrics = {
      session: {
        id: sessionId,
        startTime: new Date(),
        status: 'active',
        strategy
      },
      volume: {
        totalVolumeUSD: 0,
        totalVolumeSol: 0,
        buyVolume: 0,
        sellVolume: 0,
        transactionCount: 0
      },
      performance: {
        successfulTrades: 0,
        failedTrades: 0,
        successRate: 0,
        averageSlippage: 0,
        totalFeesPaid: 0,
        profitLoss: 0
      },
      wallets: {
        totalWallets: 0,
        activeWallets: 0,
        totalSolBalance: 0,
        totalTokenBalance: 0,
        averageBalancePerWallet: 0
      },
      errors: {
        rpcErrors: 0,
        transactionErrors: 0,
        balanceErrors: 0,
        networkErrors: 0
      },
      timing: {
        averageTransactionTime: 0,
        lastUpdateTime: new Date(),
        uptime: 0
      }
    };
  }
  
  recordTransaction(
    type: 'buy' | 'sell',
    amount: number,
    priceUSD: number,
    slippage: number,
    success: boolean,
    transactionTime: number,
    fees: number
  ): void {
    const volumeUSD = amount * priceUSD;
    
    // Update volume metrics
    this.metrics.volume.totalVolumeUSD += volumeUSD;
    this.metrics.volume.totalVolumeSol += amount;
    this.metrics.volume.transactionCount++;
    
    if (type === 'buy') {
      this.metrics.volume.buyVolume += volumeUSD;
    } else {
      this.metrics.volume.sellVolume += volumeUSD;
    }
    
    // Update performance metrics
    if (success) {
      this.metrics.performance.successfulTrades++;
    } else {
      this.metrics.performance.failedTrades++;
    }
    
    this.metrics.performance.successRate = 
      (this.metrics.performance.successfulTrades / this.metrics.volume.transactionCount) * 100;
    
    this.metrics.performance.totalFeesPaid += fees;
    
    // Track slippage
    this.slippageHistory.push(slippage);
    if (this.slippageHistory.length > 100) {
      this.slippageHistory.shift();
    }
    this.metrics.performance.averageSlippage = 
      this.slippageHistory.reduce((a, b) => a + b, 0) / this.slippageHistory.length;
    
    // Track transaction times
    this.transactionTimes.push(transactionTime);
    if (this.transactionTimes.length > 50) {
      this.transactionTimes.shift();
    }
    this.metrics.timing.averageTransactionTime = 
      this.transactionTimes.reduce((a, b) => a + b, 0) / this.transactionTimes.length;
    
    // Track volume history
    this.volumeHistory.push({ timestamp: new Date(), volume: volumeUSD });
    if (this.volumeHistory.length > 1000) {
      this.volumeHistory.shift();
    }
    
    this.updateTimestamp();
  }
  
  recordError(type: 'rpc' | 'transaction' | 'balance' | 'network'): void {
    switch (type) {
      case 'rpc':
        this.metrics.errors.rpcErrors++;
        break;
      case 'transaction':
        this.metrics.errors.transactionErrors++;
        break;
      case 'balance':
        this.metrics.errors.balanceErrors++;
        break;
      case 'network':
        this.metrics.errors.networkErrors++;
        break;
    }
    this.updateTimestamp();
  }
  
  updateWalletMetrics(
    totalWallets: number,
    activeWallets: number,
    totalSolBalance: number,
    totalTokenBalance: number
  ): void {
    this.metrics.wallets = {
      totalWallets,
      activeWallets,
      totalSolBalance,
      totalTokenBalance,
      averageBalancePerWallet: totalWallets > 0 ? totalSolBalance / totalWallets : 0
    };
    this.updateTimestamp();
  }
  
  updateSessionStatus(status: 'active' | 'paused' | 'stopped' | 'error'): void {
    this.metrics.session.status = status;
    if (status === 'stopped' || status === 'error') {
      this.metrics.session.endTime = new Date();
    }
    this.updateTimestamp();
  }
  
  private updateTimestamp(): void {
    this.metrics.timing.lastUpdateTime = new Date();
    this.metrics.timing.uptime = Date.now() - this.metrics.session.startTime.getTime();
  }
  
  getMetrics(): TradingMetrics {
    return { ...this.metrics };
  }
  
  getVolumeHistory(minutes: number = 60): { timestamp: Date; volume: number }[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.volumeHistory.filter(entry => entry.timestamp >= cutoff);
  }
  
  getHourlyVolume(): number {
    const hourlyHistory = this.getVolumeHistory(60);
    return hourlyHistory.reduce((total, entry) => total + entry.volume, 0);
  }
  
  getDailyVolume(): number {
    const dailyHistory = this.getVolumeHistory(24 * 60);
    return dailyHistory.reduce((total, entry) => total + entry.volume, 0);
  }
  
  printSummary(): void {
    const metrics = this.getMetrics();
    
    console.log(chalk.cyan('\n📊 TRADING METRICS SUMMARY'));
    console.log(chalk.cyan('═'.repeat(50)));
    
    console.log(chalk.white(`Session ID: ${metrics.session.id}`));
    console.log(chalk.white(`Strategy: ${metrics.session.strategy}`));
    console.log(chalk.white(`Status: ${this.getStatusColor(metrics.session.status)}`));
    console.log(chalk.white(`Uptime: ${this.formatUptime(metrics.timing.uptime)}`));
    
    console.log(chalk.yellow('\n💰 VOLUME METRICS:'));
    console.log(chalk.white(`Total Volume: $${metrics.volume.totalVolumeUSD.toFixed(2)} USD`));
    console.log(chalk.white(`Total Volume: ${metrics.volume.totalVolumeSol.toFixed(6)} SOL`));
    console.log(chalk.white(`Transactions: ${metrics.volume.transactionCount}`));
    console.log(chalk.white(`Buy/Sell Ratio: ${(metrics.volume.buyVolume / metrics.volume.sellVolume).toFixed(2)}`));
    
    console.log(chalk.green('\n📈 PERFORMANCE:'));
    console.log(chalk.white(`Success Rate: ${metrics.performance.successRate.toFixed(1)}%`));
    console.log(chalk.white(`Average Slippage: ${metrics.performance.averageSlippage.toFixed(2)}%`));
    console.log(chalk.white(`Total Fees: ${metrics.performance.totalFeesPaid.toFixed(6)} SOL`));
    console.log(chalk.white(`Avg Transaction Time: ${metrics.timing.averageTransactionTime.toFixed(0)}ms`));
    
    console.log(chalk.blue('\n👛 WALLET STATUS:'));
    console.log(chalk.white(`Active Wallets: ${metrics.wallets.activeWallets}/${metrics.wallets.totalWallets}`));
    console.log(chalk.white(`Total SOL: ${metrics.wallets.totalSolBalance.toFixed(6)}`));
    console.log(chalk.white(`Avg per Wallet: ${metrics.wallets.averageBalancePerWallet.toFixed(6)} SOL`));
    
    if (this.hasErrors()) {
      console.log(chalk.red('\n⚠️  ERRORS:'));
      console.log(chalk.white(`RPC Errors: ${metrics.errors.rpcErrors}`));
      console.log(chalk.white(`Transaction Errors: ${metrics.errors.transactionErrors}`));
      console.log(chalk.white(`Network Errors: ${metrics.errors.networkErrors}`));
    }
    
    console.log(chalk.cyan('═'.repeat(50)));
  }
  
  private getStatusColor(status: string): string {
    switch (status) {
      case 'active': return chalk.green(status);
      case 'paused': return chalk.yellow(status);
      case 'stopped': return chalk.blue(status);
      case 'error': return chalk.red(status);
      default: return chalk.white(status);
    }
  }
  
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  private hasErrors(): boolean {
    const errors = this.metrics.errors;
    return errors.rpcErrors > 0 || errors.transactionErrors > 0 || 
           errors.balanceErrors > 0 || errors.networkErrors > 0;
  }
  
  // Export metrics for web dashboard
  exportForDashboard(): any {
    return {
      ...this.getMetrics(),
      volumeHistory: this.getVolumeHistory(60),
      hourlyVolume: this.getHourlyVolume(),
      dailyVolume: this.getDailyVolume()
    };
  }
}