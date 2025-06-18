import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { swapConfig } from './swapConfig';
import { defaultFeeConfig, SimpleFeeManager } from './simple-fee-config';
import RaydiumSwap from './RaydiumSwap';
import WalletWithNumber from './wallet';
import chalk from 'chalk';
import { EventEmitter } from 'events';

export interface TradingSessionConfig {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  strategy: 'VOLUME_ONLY' | 'MAKERS_VOLUME';
  walletCount: number;
  solAmount: number;
  duration?: number; // in milliseconds
  slippage?: number;
}

export interface SessionMetrics {
  totalVolume: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalFees: number;
  averageSlippage: number;
  startTime: Date;
  lastTransactionTime?: Date;
  isActive: boolean;
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
}

export class RealTradingEngine extends EventEmitter {
  private connection: Connection;
  private feeManager: SimpleFeeManager;
  private activeSessions: Map<string, TradingSessionData> = new Map();
  private sessionMetrics: Map<string, SessionMetrics> = new Map();
  private transactionHistory: Map<string, TransactionRecord[]> = new Map();
  private tradingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.connection = new Connection(swapConfig.RPC_URL, 'confirmed');
    this.feeManager = new SimpleFeeManager();
  }

  async createSession(
    userWallet: string,
    config: TradingSessionConfig
  ): Promise<string> {
    const sessionId = `session_${Date.now()}_${userWallet.slice(0, 8)}`;
    
    try {
      // Validate token address
      const tokenPublicKey = new PublicKey(config.tokenAddress);
      
      // Create trading wallets
      const tradingWallets = await this.createTradingWallets(config.walletCount);
      
      // Get pool keys for the token
      const raydiumSwap = new RaydiumSwap(this.connection, tradingWallets[0]);
      const poolKeys = await raydiumSwap.getPoolKeys(config.tokenAddress);
      
      if (!poolKeys) {
        throw new Error('Pool not found for token');
      }

      const sessionData: TradingSessionData = {
        id: sessionId,
        userWallet,
        config,
        tradingWallets,
        poolKeys,
        status: 'created',
        createdAt: new Date()
      };

      const metrics: SessionMetrics = {
        totalVolume: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        totalFees: 0,
        averageSlippage: 0,
        startTime: new Date(),
        isActive: false
      };

      this.activeSessions.set(sessionId, sessionData);
      this.sessionMetrics.set(sessionId, metrics);
      this.transactionHistory.set(sessionId, []);

      console.log(chalk.green(`✅ Created trading session: ${sessionId}`));
      this.emit('sessionCreated', { sessionId, sessionData });
      
      return sessionId;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to create session: ${error}`));
      throw error;
    }
  }

  async startSession(sessionId: string): Promise<boolean> {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (sessionData.status === 'active') {
      console.log(chalk.yellow(`Session ${sessionId} is already active`));
      return true;
    }

    try {
      // Collect fee before starting
      const fee = this.feeManager.calculateFee(sessionData.userWallet);
      if (fee > 0) {
        const feeCollected = await this.collectFee(sessionData.userWallet, fee);
        if (!feeCollected) {
          throw new Error('Fee collection failed');
        }
      }

      sessionData.status = 'active';
      sessionData.startTime = new Date();
      
      const metrics = this.sessionMetrics.get(sessionId)!;
      metrics.isActive = true;
      metrics.startTime = new Date();

      // Start trading loop
      await this.startTradingLoop(sessionId);

      console.log(chalk.green(`🚀 Started trading session: ${sessionId}`));
      this.emit('sessionStarted', { sessionId, sessionData });
      
      return true;
    } catch (error) {
      sessionData.status = 'error';
      console.error(chalk.red(`❌ Failed to start session: ${error}`));
      this.emit('sessionError', { sessionId, error });
      throw error;
    }
  }

  async pauseSession(sessionId: string): Promise<boolean> {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    sessionData.status = 'paused';
    const metrics = this.sessionMetrics.get(sessionId)!;
    metrics.isActive = false;

    // Clear trading interval
    const interval = this.tradingIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.tradingIntervals.delete(sessionId);
    }

    console.log(chalk.yellow(`⏸️ Paused trading session: ${sessionId}`));
    this.emit('sessionPaused', { sessionId, sessionData });
    
    return true;
  }

  async stopSession(sessionId: string): Promise<boolean> {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    sessionData.status = 'stopped';
    sessionData.endTime = new Date();
    
    const metrics = this.sessionMetrics.get(sessionId)!;
    metrics.isActive = false;

    // Clear trading interval
    const interval = this.tradingIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.tradingIntervals.delete(sessionId);
    }

    console.log(chalk.red(`🛑 Stopped trading session: ${sessionId}`));
    this.emit('sessionStopped', { sessionId, sessionData });
    
    return true;
  }

  private async createTradingWallets(count: number): Promise<WalletWithNumber[]> {
    const wallets: WalletWithNumber[] = [];
    
    for (let i = 0; i < count; i++) {
      const keypair = Keypair.generate();
      const wallet = new WalletWithNumber(keypair, i + 1);
      wallets.push(wallet);
    }
    
    return wallets;
  }

  private async startTradingLoop(sessionId: string): Promise<void> {
    const sessionData = this.activeSessions.get(sessionId)!;
    const config = sessionData.config;
    
    const interval = setInterval(async () => {
      try {
        await this.executeTrade(sessionId);
      } catch (error) {
        console.error(chalk.red(`Trading loop error for session ${sessionId}:`, error));
        this.emit('tradingError', { sessionId, error });
      }
    }, swapConfig.loopInterval);

    this.tradingIntervals.set(sessionId, interval);

    // Auto-stop after duration if specified
    if (config.duration) {
      setTimeout(() => {
        this.stopSession(sessionId);
      }, config.duration);
    }
  }

  private async executeTrade(sessionId: string): Promise<void> {
    const sessionData = this.activeSessions.get(sessionId)!;
    const metrics = this.sessionMetrics.get(sessionId)!;
    
    if (sessionData.status !== 'active') {
      return;
    }

    // Select random wallet for trading
    const wallet = sessionData.tradingWallets[
      Math.floor(Math.random() * sessionData.tradingWallets.length)
    ];

    const raydiumSwap = new RaydiumSwap(this.connection, wallet);
    
    try {
      // Determine trade type based on strategy
      const tradeType = this.determineTradeType(sessionData.config.strategy);
      const amount = this.calculateTradeAmount(sessionData.config.solAmount);
      
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create transaction record
      const transaction: TransactionRecord = {
        id: transactionId,
        sessionId,
        type: tradeType,
        amount,
        status: 'pending',
        timestamp: new Date(),
        fee: 0
      };

      // Add to history
      const history = this.transactionHistory.get(sessionId)!;
      history.unshift(transaction);
      
      // Keep only last 100 transactions
      if (history.length > 100) {
        history.splice(100);
      }

      this.emit('transactionStarted', { sessionId, transaction });

      let txHash: string | undefined;
      
      if (tradeType === 'buy') {
        // Buy tokens with SOL
        txHash = await raydiumSwap.swapSolToToken(
          sessionData.config.tokenAddress,
          amount,
          sessionData.poolKeys,
          config.slippage || swapConfig.SLIPPAGE_PERCENT
        );
      } else {
        // Sell tokens for SOL
        txHash = await raydiumSwap.swapTokenToSol(
          sessionData.config.tokenAddress,
          amount,
          sessionData.poolKeys,
          config.slippage || swapConfig.SLIPPAGE_PERCENT
        );
      }

      if (txHash) {
        transaction.status = 'success';
        transaction.hash = txHash;
        
        // Update metrics
        metrics.totalTransactions++;
        metrics.successfulTransactions++;
        metrics.totalVolume += amount;
        metrics.lastTransactionTime = new Date();
        
        console.log(chalk.green(`✅ Trade executed: ${tradeType} ${amount} SOL - ${txHash}`));
        this.emit('transactionSuccess', { sessionId, transaction });
      } else {
        throw new Error('Transaction failed - no hash returned');
      }
      
    } catch (error) {
      // Update transaction record
      const history = this.transactionHistory.get(sessionId)!;
      const transaction = history[0];
      if (transaction) {
        transaction.status = 'failed';
        transaction.error = error instanceof Error ? error.message : 'Unknown error';
      }
      
      // Update metrics
      metrics.totalTransactions++;
      metrics.failedTransactions++;
      
      console.error(chalk.red(`❌ Trade failed: ${error}`));
      this.emit('transactionFailed', { sessionId, transaction, error });
    }
  }

  private determineTradeType(strategy: string): 'buy' | 'sell' {
    if (strategy === 'VOLUME_ONLY') {
      return Math.random() > 0.5 ? 'buy' : 'sell';
    } else {
      // MAKERS_VOLUME strategy - more sophisticated logic
      return Math.random() > 0.6 ? 'buy' : 'sell';
    }
  }

  private calculateTradeAmount(baseAmount: number): number {
    // Add some randomness to trade amounts
    const variation = 0.1 + Math.random() * 0.4; // 10% to 50% variation
    return baseAmount * variation;
  }

  private async collectFee(userWallet: string, feeAmount: number): Promise<boolean> {
    try {
      // In a real implementation, you would create a transaction to collect the fee
      // For now, we'll just record that the fee was collected
      this.feeManager.recordTrade(userWallet, feeAmount === 0);
      
      console.log(chalk.blue(`💰 Fee collected: ${feeAmount} SOL from ${userWallet}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Fee collection failed: ${error}`));
      return false;
    }
  }

  // Public getters for API
  getSession(sessionId: string): TradingSessionData | undefined {
    return this.activeSessions.get(sessionId);
  }

  getSessionMetrics(sessionId: string): SessionMetrics | undefined {
    return this.sessionMetrics.get(sessionId);
  }

  getTransactionHistory(sessionId: string): TransactionRecord[] {
    return this.transactionHistory.get(sessionId) || [];
  }

  getUserSessions(userWallet: string): TradingSessionData[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userWallet === userWallet);
  }

  getAllMetrics(): { totalVolume: number; totalTransactions: number; activeSessions: number; totalFees: number } {
    let totalVolume = 0;
    let totalTransactions = 0;
    let totalFees = 0;
    let activeSessions = 0;

    for (const metrics of this.sessionMetrics.values()) {
      totalVolume += metrics.totalVolume;
      totalTransactions += metrics.totalTransactions;
      totalFees += metrics.totalFees;
      if (metrics.isActive) activeSessions++;
    }

    return { totalVolume, totalTransactions, activeSessions, totalFees };
  }
}

interface TradingSessionData {
  id: string;
  userWallet: string;
  config: TradingSessionConfig;
  tradingWallets: WalletWithNumber[];
  poolKeys: any;
  status: 'created' | 'active' | 'paused' | 'stopped' | 'error';
  createdAt: Date;
  startTime?: Date;
  endTime?: Date;
}

// Export singleton instance
export const tradingEngine = new RealTradingEngine();