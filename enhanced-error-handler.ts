import chalk from 'chalk';

export enum ErrorType {
  RPC_ERROR = 'RPC_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  POOL_NOT_FOUND = 'POOL_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED'
}

export interface ErrorContext {
  walletAddress?: string;
  tokenAddress?: string;
  transactionHash?: string;
  amount?: number;
  retryCount?: number;
  timestamp: Date;
}

export class EnhancedError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public context: ErrorContext,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'EnhancedError';
  }
}

export class ErrorHandler {
  private static errorCounts = new Map<ErrorType, number>();
  private static lastErrors = new Map<ErrorType, Date>();
  
  static async handleError(error: EnhancedError): Promise<boolean> {
    const count = this.errorCounts.get(error.type) || 0;
    this.errorCounts.set(error.type, count + 1);
    this.lastErrors.set(error.type, new Date());
    
    console.log(chalk.red(`[${error.type}] ${error.message}`));
    console.log(chalk.gray(`Context: ${JSON.stringify(error.context, null, 2)}`));
    
    // Circuit breaker logic
    if (count > 10 && this.isRecentError(error.type, 5 * 60 * 1000)) { // 5 minutes
      console.log(chalk.red(`Circuit breaker triggered for ${error.type}`));
      return false; // Stop trading
    }
    
    // Specific error handling
    switch (error.type) {
      case ErrorType.RPC_ERROR:
        await this.handleRpcError(error);
        break;
      case ErrorType.RATE_LIMIT:
        await this.handleRateLimit(error);
        break;
      case ErrorType.INSUFFICIENT_BALANCE:
        return false; // Stop trading
      case ErrorType.SLIPPAGE_EXCEEDED:
        await this.handleSlippageError(error);
        break;
    }
    
    return error.recoverable;
  }
  
  private static isRecentError(type: ErrorType, timeWindow: number): boolean {
    const lastError = this.lastErrors.get(type);
    return lastError ? (Date.now() - lastError.getTime()) < timeWindow : false;
  }
  
  private static async handleRpcError(error: EnhancedError): Promise<void> {
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, error.context.retryCount || 0), 30000);
    console.log(chalk.yellow(`RPC error, waiting ${delay}ms before retry`));
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  private static async handleRateLimit(error: EnhancedError): Promise<void> {
    console.log(chalk.yellow('Rate limit hit, waiting 60 seconds'));
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
  
  private static async handleSlippageError(error: EnhancedError): Promise<void> {
    console.log(chalk.yellow('Slippage exceeded, adjusting parameters'));
    // Could implement dynamic slippage adjustment here
  }
  
  static getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.errorCounts.forEach((count, type) => {
      stats[type] = count;
    });
    return stats;
  }
  
  static resetErrorCounts(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
  }
}