import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { createTransferCheckedInstruction } from '@solana/spl-token';
import chalk from 'chalk';
import bs58 from 'bs58';

export interface FeeStructure {
  subscriptionTier: 'free' | 'basic' | 'pro' | 'enterprise';
  transactionFeePercent: number;
  minimumFeeSOL: number;
  monthlyFeeUSD: number;
  maxDailyVolumeUSD: number;
  maxWallets: number;
}

export const FEE_TIERS: Record<string, FeeStructure> = {
  free: {
    subscriptionTier: 'free',
    transactionFeePercent: 1.0,
    minimumFeeSOL: 0.001,
    monthlyFeeUSD: 0,
    maxDailyVolumeUSD: 1000,
    maxWallets: 3
  },
  basic: {
    subscriptionTier: 'basic',
    transactionFeePercent: 0.5,
    minimumFeeSOL: 0.0005,
    monthlyFeeUSD: 49,
    maxDailyVolumeUSD: 10000,
    maxWallets: 10
  },
  pro: {
    subscriptionTier: 'pro',
    transactionFeePercent: 0.3,
    minimumFeeSOL: 0.0003,
    monthlyFeeUSD: 199,
    maxDailyVolumeUSD: 100000,
    maxWallets: 25
  },
  enterprise: {
    subscriptionTier: 'enterprise',
    transactionFeePercent: 0.1,
    minimumFeeSOL: 0.0001,
    monthlyFeeUSD: 999,
    maxDailyVolumeUSD: 1000000,
    maxWallets: 100
  }
};

export interface FeeTransaction {
  id: string;
  userId: string;
  sessionId: string;
  transactionHash: string;
  volumeUSD: number;
  feeSOL: number;
  feeUSD: number;
  timestamp: Date;
  status: 'pending' | 'collected' | 'failed';
}

export class FeeManager {
  private connection: Connection;
  private feeCollectionWallet: PublicKey;
  private feeCollectionPrivateKey: string;
  private pendingFees: Map<string, number> = new Map(); // userId -> accumulated fees
  private feeTransactions: FeeTransaction[] = [];
  
  constructor(
    connection: Connection,
    feeCollectionWallet: string,
    feeCollectionPrivateKey: string
  ) {
    this.connection = connection;
    this.feeCollectionWallet = new PublicKey(feeCollectionWallet);
    this.feeCollectionPrivateKey = feeCollectionPrivateKey;
  }
  
  calculateTransactionFee(
    volumeUSD: number,
    userTier: string,
    solPriceUSD: number
  ): { feeSOL: number; feeUSD: number } {
    const tier = FEE_TIERS[userTier] || FEE_TIERS.free;
    
    // Calculate percentage-based fee
    const percentageFeeUSD = volumeUSD * (tier.transactionFeePercent / 100);
    
    // Convert to SOL
    let feeSOL = percentageFeeUSD / solPriceUSD;
    
    // Apply minimum fee
    feeSOL = Math.max(feeSOL, tier.minimumFeeSOL);
    
    const feeUSD = feeSOL * solPriceUSD;
    
    return { feeSOL, feeUSD };
  }
  
  accumulateFee(userId: string, feeSOL: number): void {
    const currentFees = this.pendingFees.get(userId) || 0;
    this.pendingFees.set(userId, currentFees + feeSOL);
  }
  
  async collectAccumulatedFees(
    userId: string,
    userWalletPrivateKey: string,
    sessionId: string
  ): Promise<boolean> {
    const accumulatedFees = this.pendingFees.get(userId) || 0;
    
    if (accumulatedFees < 0.001) { // Minimum collection threshold
      return true; // Nothing to collect
    }
    
    try {
      const userKeypair = Keypair.fromSecretKey(bs58.decode(userWalletPrivateKey));
      const feeKeypair = Keypair.fromSecretKey(bs58.decode(this.feeCollectionPrivateKey));
      
      const transaction = new Transaction();
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userKeypair.publicKey;
      
      // Transfer SOL to fee collection wallet
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: userKeypair.publicKey,
          toPubkey: this.feeCollectionWallet,
          lamports: Math.floor(accumulatedFees * 1e9) // Convert SOL to lamports
        })
      );
      
      transaction.partialSign(userKeypair);
      
      const txHash = await this.connection.sendTransaction(transaction, [userKeypair]);
      
      // Record the fee transaction
      const feeTransaction: FeeTransaction = {
        id: `fee_${Date.now()}_${userId}`,
        userId,
        sessionId,
        transactionHash: txHash,
        volumeUSD: 0, // Would need to track this separately
        feeSOL: accumulatedFees,
        feeUSD: 0, // Would need current SOL price
        timestamp: new Date(),
        status: 'collected'
      };
      
      this.feeTransactions.push(feeTransaction);
      
      // Clear accumulated fees
      this.pendingFees.set(userId, 0);
      
      console.log(chalk.green(`✅ Collected ${accumulatedFees.toFixed(6)} SOL in fees from user ${userId}`));
      console.log(chalk.gray(`Transaction: https://solscan.io/tx/${txHash}`));
      
      return true;
    } catch (error) {
      console.log(chalk.red(`❌ Failed to collect fees from user ${userId}: ${error.message}`));
      return false;
    }
  }
  
  // Automatic fee collection during trading
  async collectFeeFromTransaction(
    userWalletPrivateKey: string,
    volumeUSD: number,
    userTier: string,
    solPriceUSD: number,
    userId: string,
    sessionId: string
  ): Promise<boolean> {
    const { feeSOL, feeUSD } = this.calculateTransactionFee(volumeUSD, userTier, solPriceUSD);
    
    // For small fees, accumulate instead of immediate collection
    if (feeSOL < 0.005) {
      this.accumulateFee(userId, feeSOL);
      console.log(chalk.yellow(`💰 Accumulated fee: ${feeSOL.toFixed(6)} SOL (Total: ${(this.pendingFees.get(userId) || 0).toFixed(6)} SOL)`));
      return true;
    }
    
    // Immediate collection for larger fees
    try {
      const userKeypair = Keypair.fromSecretKey(bs58.decode(userWalletPrivateKey));
      
      const transaction = new Transaction();
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userKeypair.publicKey;
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: userKeypair.publicKey,
          toPubkey: this.feeCollectionWallet,
          lamports: Math.floor(feeSOL * 1e9)
        })
      );
      
      const txHash = await this.connection.sendTransaction(transaction, [userKeypair]);
      
      const feeTransaction: FeeTransaction = {
        id: `fee_${Date.now()}_${userId}`,
        userId,
        sessionId,
        transactionHash: txHash,
        volumeUSD,
        feeSOL,
        feeUSD,
        timestamp: new Date(),
        status: 'collected'
      };
      
      this.feeTransactions.push(feeTransaction);
      
      console.log(chalk.green(`💰 Collected ${feeSOL.toFixed(6)} SOL fee (${feeUSD.toFixed(2)} USD)`));
      
      return true;
    } catch (error) {
      console.log(chalk.red(`❌ Fee collection failed: ${error.message}`));
      
      // Add to pending fees if immediate collection fails
      this.accumulateFee(userId, feeSOL);
      return false;
    }
  }
  
  getPendingFees(userId: string): number {
    return this.pendingFees.get(userId) || 0;
  }
  
  getTotalFeesCollected(): number {
    return this.feeTransactions
      .filter(tx => tx.status === 'collected')
      .reduce((total, tx) => total + tx.feeSOL, 0);
  }
  
  getFeeTransactionHistory(userId?: string): FeeTransaction[] {
    if (userId) {
      return this.feeTransactions.filter(tx => tx.userId === userId);
    }
    return this.feeTransactions;
  }
  
  // Check if user has exceeded their tier limits
  checkTierLimits(userId: string, userTier: string, dailyVolumeUSD: number, walletCount: number): {
    volumeExceeded: boolean;
    walletExceeded: boolean;
    canTrade: boolean;
  } {
    const tier = FEE_TIERS[userTier] || FEE_TIERS.free;
    
    const volumeExceeded = dailyVolumeUSD > tier.maxDailyVolumeUSD;
    const walletExceeded = walletCount > tier.maxWallets;
    const canTrade = !volumeExceeded && !walletExceeded;
    
    return { volumeExceeded, walletExceeded, canTrade };
  }
  
  // Generate fee report for dashboard
  generateFeeReport(): {
    totalFeesCollected: number;
    pendingFees: number;
    transactionCount: number;
    averageFeePerTransaction: number;
    feesByTier: Record<string, number>;
  } {
    const totalFeesCollected = this.getTotalFeesCollected();
    const pendingFees = Array.from(this.pendingFees.values()).reduce((a, b) => a + b, 0);
    const transactionCount = this.feeTransactions.length;
    const averageFeePerTransaction = transactionCount > 0 ? totalFeesCollected / transactionCount : 0;
    
    // This would need user tier tracking to implement properly
    const feesByTier: Record<string, number> = {
      free: 0,
      basic: 0,
      pro: 0,
      enterprise: 0
    };
    
    return {
      totalFeesCollected,
      pendingFees,
      transactionCount,
      averageFeePerTransaction,
      feesByTier
    };
  }
}