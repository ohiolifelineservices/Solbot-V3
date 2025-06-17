import { Connection, PublicKey } from '@solana/web3.js';
import { MetricsManager } from './metrics-manager';
import { FeeManager } from './fee-manager';
import { ErrorHandler, EnhancedError, ErrorType } from './enhanced-error-handler';
import { ConfigManager } from './enhanced-config';
import RaydiumSwap from './RaydiumSwap';
import WalletWithNumber from './wallet';
import chalk from 'chalk';

export interface TradingSession {
  id: string;
  userId: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  strategy: 'VOLUME_ONLY' | 'MAKERS_VOLUME';
  status: 'created' | 'active' | 'paused' | 'stopped' | 'error';
  adminWallet: WalletWithNumber;
  tradingWallets: WalletWithNumber[];
  poolKeys: any;
  config: any;
  startTime?: Date;
  endTime?: Date;
}

export class EnhancedTradingEngine {
  private connection: Connection;
  private metricsManager: MetricsManager;
  private feeManager: FeeManager;
  private configManager: ConfigManager;
  private activeSessions: Map<string, TradingSession> = new Map();
  private tradingLoops: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(
    connection: Connection,
    feeCollectionWallet: string,
    feeCollectionPrivateKey: string
  ) {
    this.connection = connection;
    this.feeManager = new FeeManager(connection, feeCollectionWallet, feeCollectionPrivateKey);
    this.configManager = ConfigManager.getInstance();
  }
  
  async createSession(
    userId: string,
    tokenAddress: string,
    tokenName: string,
    tokenSymbol: string,
    strategy: 'VOLUME_ONLY' | 'MAKERS_VOLUME',
    adminWallet: WalletWithNumber,
    tradingWallets: WalletWithNumber[],
    poolKeys: any,
    customConfig?: any
  ): Promise<string> {
    const sessionId = `session_${Date.now()}_${userId}`;
    
    const session: TradingSession = {
      id: sessionId,
      userId,
      tokenAddress,
      tokenName,
      tokenSymbol,
      strategy,
      status: 'created',
      adminWallet,
      tradingWallets,
      poolKeys,
      config: customConfig || this.configManager.getConfig()
    };
    
    this.activeSessions.set(sessionId, session);
    this.metricsManager = new MetricsManager(sessionId, strategy);
    
    console.log(chalk.green(`✅ Created trading session: ${sessionId}`));
    return sessionId;
  }
  
  async startSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    if (session.status === 'active') {
      console.log(chalk.yellow(`Session ${sessionId} is already active`));
      return true;
    }
    
    try {
      session.status = 'active';
      session.startTime = new Date();
      this.metricsManager.updateSessionStatus('active');
      
      // Start the trading loop
      await this.startTradingLoop(session);
      
      console.log(chalk.green(`🚀 Started trading session: ${sessionId}`));
      return true;
    } catch (error) {
      session.status = 'error';
      this.metricsManager.updateSessionStatus('error');
      console.log(chalk.red(`❌ Failed to start session ${sessionId}: ${error.message}`));
      return false;
    }
  }
  
  async pauseSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    session.status = 'paused';
    this.metricsManager.updateSessionStatus('paused');
    
    // Clear the trading loop
    const loop = this.tradingLoops.get(sessionId);
    if (loop) {
      clearInterval(loop);
      this.tradingLoops.delete(sessionId);
    }
    
    console.log(chalk.yellow(`⏸️  Paused trading session: ${sessionId}`));
    return true;
  }
  
  async stopSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    session.status = 'stopped';
    session.endTime = new Date();
    this.metricsManager.updateSessionStatus('stopped');
    
    // Clear the trading loop
    const loop = this.tradingLoops.get(sessionId);
    if (loop) {
      clearInterval(loop);
      this.tradingLoops.delete(sessionId);
    }
    
    // Collect any remaining fees
    await this.feeManager.collectAccumulatedFees(
      session.userId,
      session.adminWallet.privateKey,
      sessionId
    );
    
    console.log(chalk.blue(`🛑 Stopped trading session: ${sessionId}`));
    return true;
  }
  
  private async startTradingLoop(session: TradingSession): Promise<void> {
    const config = session.config.trading;
    const strategy = session.strategy === 'VOLUME_ONLY' ? 
      config.strategies.volumeOnly : 
      config.strategies.makersVolume;
    
    let cycleCount = 0;
    const maxCycles = Math.floor(strategy.duration / strategy.loopInterval);
    
    const loop = setInterval(async () => {
      if (session.status !== 'active') {
        clearInterval(loop);
        return;
      }
      
      try {
        await this.executeTradingCycle(session);
        cycleCount++;
        
        // Check if session duration is complete
        if (cycleCount >= maxCycles) {
          await this.stopSession(session.id);
        }
        
      } catch (error) {
        const enhancedError = new EnhancedError(
          ErrorType.TRANSACTION_FAILED,
          error.message,
          { timestamp: new Date() }
        );
        
        const shouldContinue = await ErrorHandler.handleError(enhancedError);
        if (!shouldContinue) {
          await this.stopSession(session.id);
        }
      }
    }, strategy.loopInterval);
    
    this.tradingLoops.set(session.id, loop);
  }
  
  private async executeTradingCycle(session: TradingSession): Promise<void> {
    const config = session.config.trading;
    
    // Select random wallets for this cycle
    const activeWallets = this.selectRandomWallets(
      session.tradingWallets,
      Math.min(5, session.tradingWallets.length)
    );
    
    // Execute trades for each selected wallet
    const tradePromises = activeWallets.map(wallet => 
      this.executeWalletTrade(session, wallet, config)
    );
    
    await Promise.allSettled(tradePromises);
    
    // Update metrics
    await this.updateSessionMetrics(session);
  }
  
  private async executeWalletTrade(
    session: TradingSession,
    wallet: WalletWithNumber,
    config: any
  ): Promise<void> {
    const raydiumSwap = new RaydiumSwap(this.connection.rpcEndpoint, wallet.privateKey);
    
    try {
      // Get current balances
      const solBalance = await raydiumSwap.getBalance();
      const tokenBalance = await this.getTokenBalance(raydiumSwap, session.tokenAddress);
      
      // Decide trade type based on strategy and balances
      const shouldBuy = this.shouldExecuteBuy(session.strategy, solBalance, tokenBalance, config);
      
      if (shouldBuy && solBalance > config.wallets.minSolPerWallet) {
        await this.executeBuyTrade(session, wallet, raydiumSwap, solBalance, config);
      } else if (!shouldBuy && tokenBalance > 0) {
        await this.executeSellTrade(session, wallet, raydiumSwap, tokenBalance, config);
      }
      
    } catch (error) {
      this.metricsManager.recordError('transaction');
      console.log(chalk.red(`Trade failed for wallet ${wallet.publicKey}: ${error.message}`));
    }
  }
  
  private async executeBuyTrade(
    session: TradingSession,
    wallet: WalletWithNumber,
    raydiumSwap: RaydiumSwap,
    solBalance: number,
    config: any
  ): Promise<void> {
    const startTime = Date.now();
    
    // Calculate buy amount with randomization
    const buyPercentage = this.getRandomBetween(
      config.randomization.buyAmount.min,
      config.randomization.buyAmount.max
    );
    
    const buyAmount = (solBalance - config.wallets.minSolPerWallet) * (buyPercentage / 100);
    
    if (buyAmount < 0.001) return; // Too small
    
    try {
      const tx = await raydiumSwap.getSwapTransaction(
        session.tokenAddress,
        buyAmount,
        session.poolKeys,
        config.risk.maxSlippage * 100
      );
      
      const txHash = await raydiumSwap.sendVersionedTransaction(tx, 3);
      const transactionTime = Date.now() - startTime;
      
      // Get SOL price for fee calculation (would need price oracle)
      const solPriceUSD = 100; // Placeholder - implement price fetching
      const volumeUSD = buyAmount * solPriceUSD;
      
      // Record metrics
      this.metricsManager.recordTransaction(
        'buy',
        buyAmount,
        solPriceUSD,
        2.5, // Placeholder slippage
        true,
        transactionTime,
        0.000005 // Placeholder fee
      );
      
      // Collect fees
      await this.feeManager.collectFeeFromTransaction(
        wallet.privateKey,
        volumeUSD,
        'basic', // Would get from user data
        solPriceUSD,
        session.userId,
        session.id
      );
      
      console.log(chalk.green(`✅ Buy: ${buyAmount.toFixed(6)} SOL - ${wallet.publicKey.slice(0, 8)}...`));
      console.log(chalk.gray(`   TX: https://solscan.io/tx/${txHash}`));
      
    } catch (error) {
      this.metricsManager.recordTransaction('buy', buyAmount, 100, 0, false, Date.now() - startTime, 0);
      throw error;
    }
  }
  
  private async executeSellTrade(
    session: TradingSession,
    wallet: WalletWithNumber,
    raydiumSwap: RaydiumSwap,
    tokenBalance: number,
    config: any
  ): Promise<void> {
    const startTime = Date.now();
    
    // Calculate sell amount with randomization
    const sellPercentage = this.getRandomBetween(
      config.randomization.sellAmount.min,
      config.randomization.sellAmount.max
    );
    
    const sellAmount = tokenBalance * (sellPercentage / 100);
    
    try {
      const tx = await raydiumSwap.getSwapTransaction(
        session.tokenAddress,
        sellAmount,
        session.poolKeys,
        config.risk.maxSlippage * 100,
        'out'
      );
      
      const txHash = await raydiumSwap.sendVersionedTransaction(tx, 3);
      const transactionTime = Date.now() - startTime;
      
      // Record metrics
      this.metricsManager.recordTransaction(
        'sell',
        sellAmount,
        100, // Placeholder price
        2.5, // Placeholder slippage
        true,
        transactionTime,
        0.000005
      );
      
      console.log(chalk.red(`✅ Sell: ${sellAmount.toFixed(6)} ${session.tokenSymbol} - ${wallet.publicKey.slice(0, 8)}...`));
      console.log(chalk.gray(`   TX: https://solscan.io/tx/${txHash}`));
      
    } catch (error) {
      this.metricsManager.recordTransaction('sell', sellAmount, 100, 0, false, Date.now() - startTime, 0);
      throw error;
    }
  }
  
  private shouldExecuteBuy(
    strategy: string,
    solBalance: number,
    tokenBalance: number,
    config: any
  ): boolean {
    if (strategy === 'VOLUME_ONLY') {
      // For volume-only, alternate between buy and sell
      return Math.random() > 0.5;
    } else {
      // For makers+volume, consider balance ratios
      const totalValue = solBalance + (tokenBalance * 0.1); // Rough conversion
      const solRatio = solBalance / totalValue;
      return solRatio > 0.6; // Buy if too much SOL
    }
  }
  
  private selectRandomWallets(wallets: WalletWithNumber[], count: number): WalletWithNumber[] {
    const shuffled = [...wallets].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
  
  private getRandomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
  
  private async getTokenBalance(raydiumSwap: RaydiumSwap, tokenAddress: string): Promise<number> {
    try {
      const tokenAccounts = await raydiumSwap.getOwnerTokenAccounts();
      const tokenAccount = tokenAccounts.find(acc => 
        acc.accountInfo.mint.toString() === tokenAddress
      );
      
      if (!tokenAccount) return 0;
      
      const decimals = await raydiumSwap.getTokenDecimals(tokenAddress);
      return Number(tokenAccount.accountInfo.amount) / Math.pow(10, decimals);
    } catch (error) {
      return 0;
    }
  }
  
  private async updateSessionMetrics(session: TradingSession): Promise<void> {
    // Calculate wallet metrics
    let totalSol = 0;
    let totalTokens = 0;
    let activeWallets = 0;
    
    for (const wallet of session.tradingWallets) {
      try {
        const raydiumSwap = new RaydiumSwap(this.connection.rpcEndpoint, wallet.privateKey);
        const solBalance = await raydiumSwap.getBalance();
        const tokenBalance = await this.getTokenBalance(raydiumSwap, session.tokenAddress);
        
        totalSol += solBalance;
        totalTokens += tokenBalance;
        
        if (solBalance > 0.001 || tokenBalance > 0) {
          activeWallets++;
        }
      } catch (error) {
        // Skip wallet if error
      }
    }
    
    this.metricsManager.updateWalletMetrics(
      session.tradingWallets.length,
      activeWallets,
      totalSol,
      totalTokens
    );
  }
  
  // Public methods for web API
  getSessionMetrics(sessionId: string): any {
    return this.metricsManager?.exportForDashboard();
  }
  
  getSessionStatus(sessionId: string): string | null {
    const session = this.activeSessions.get(sessionId);
    return session?.status || null;
  }
  
  getAllSessions(userId?: string): TradingSession[] {
    const sessions = Array.from(this.activeSessions.values());
    return userId ? sessions.filter(s => s.userId === userId) : sessions;
  }
  
  getFeeReport(): any {
    return this.feeManager.generateFeeReport();
  }
}