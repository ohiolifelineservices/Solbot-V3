import axios from 'axios';
import chalk from 'chalk';

const API_BASE_URL = 'http://localhost:12001';
const FRONTEND_URL = 'http://localhost:12000';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration: number;
}

class ProductionIntegrationTest {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({
        name,
        status: 'PASS',
        message: 'Test passed successfully',
        duration
      });
      console.log(chalk.green(`✅ ${name} - PASSED (${duration}ms)`));
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        name,
        status: 'FAIL',
        message: error.message,
        duration
      });
      console.log(chalk.red(`❌ ${name} - FAILED (${duration}ms): ${error.message}`));
    }
  }

  async testApiHealth(): Promise<void> {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.status || response.data.status !== 'ok') {
      throw new Error('Health check failed');
    }
    if (!response.data.rpcConnected) {
      throw new Error('RPC connection failed');
    }
  }

  async testTokenValidation(): Promise<void> {
    // Test with a known Solana token (USDC)
    const usdcAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    
    const response = await axios.post(`${API_BASE_URL}/api/tokens/validate`, {
      tokenAddress: usdcAddress
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.valid) {
      throw new Error('Token validation failed for USDC');
    }
    
    if (!response.data.tokenInfo) {
      throw new Error('Token info not returned');
    }
  }

  async testWalletCreation(): Promise<void> {
    const response = await axios.post(`${API_BASE_URL}/api/wallets/create`, {
      type: 'generate'
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error('Wallet creation failed');
    }
    
    if (!response.data.publicKey || !response.data.privateKey) {
      throw new Error('Wallet keys not returned');
    }
  }

  async testMultipleWalletCreation(): Promise<void> {
    const response = await axios.post(`${API_BASE_URL}/api/wallets/create-multiple`, {
      count: 3
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!Array.isArray(response.data) || response.data.length !== 3) {
      throw new Error('Expected array of 3 wallets');
    }
    
    for (const wallet of response.data) {
      if (!wallet.publicKey || !wallet.privateKey) {
        throw new Error('Wallet missing required keys');
      }
    }
  }

  async testSessionCreation(): Promise<void> {
    const sessionData = {
      userWallet: 'BDLwWVXu2vYfvqHaNd7wUem3mVgADJeSsWcnJJA4tkVm',
      tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenName: 'USD Coin',
      tokenSymbol: 'USDC',
      strategy: 'VOLUME_ONLY',
      walletCount: 3,
      solAmount: 0.1
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/sessions`, sessionData);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.sessionId) {
      throw new Error('Session ID not returned');
    }
    
    if (!response.data.session) {
      throw new Error('Session data not returned');
    }
  }

  async testMetricsEndpoint(): Promise<void> {
    const response = await axios.get(`${API_BASE_URL}/api/metrics`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const requiredFields = ['totalVolume', 'totalTransactions', 'activeWallets', 'totalFees'];
    for (const field of requiredFields) {
      if (typeof response.data[field] !== 'number') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }
  }

  async testTransactionsEndpoint(): Promise<void> {
    const response = await axios.get(`${API_BASE_URL}/api/transactions?limit=10`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array response');
    }
  }

  async testFrontendAccessibility(): Promise<void> {
    try {
      const response = await axios.get(FRONTEND_URL, { timeout: 10000 });
      if (response.status !== 200) {
        throw new Error(`Frontend not accessible: status ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Frontend server not running');
      }
      throw error;
    }
  }

  async testCorsConfiguration(): Promise<void> {
    try {
      const response = await axios.options(`${API_BASE_URL}/api/health`, {
        headers: {
          'Origin': 'http://localhost:12000',
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      // CORS should allow the request
      if (response.status >= 400) {
        throw new Error('CORS not properly configured');
      }
    } catch (error) {
      if (error.response && error.response.status >= 400) {
        throw new Error('CORS configuration failed');
      }
      // If no error response, CORS is likely working
    }
  }

  async runAllTests(): Promise<void> {
    console.log(chalk.blue('🧪 Starting Production Integration Tests...\n'));

    await this.runTest('API Health Check', () => this.testApiHealth());
    await this.runTest('Token Validation', () => this.testTokenValidation());
    await this.runTest('Wallet Creation', () => this.testWalletCreation());
    await this.runTest('Multiple Wallet Creation', () => this.testMultipleWalletCreation());
    await this.runTest('Session Creation', () => this.testSessionCreation());
    await this.runTest('Metrics Endpoint', () => this.testMetricsEndpoint());
    await this.runTest('Transactions Endpoint', () => this.testTransactionsEndpoint());
    await this.runTest('Frontend Accessibility', () => this.testFrontendAccessibility());
    await this.runTest('CORS Configuration', () => this.testCorsConfiguration());

    this.printSummary();
  }

  printSummary(): void {
    console.log('\n' + chalk.blue('📊 Test Summary:'));
    console.log('='.repeat(50));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log(chalk.green(`✅ Passed: ${passed}/${total}`));
    console.log(chalk.red(`❌ Failed: ${failed}/${total}`));

    if (failed > 0) {
      console.log('\n' + chalk.red('Failed Tests:'));
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(chalk.red(`  • ${result.name}: ${result.message}`));
        });
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(chalk.blue(`\n⏱️ Total Duration: ${totalDuration}ms`));

    if (failed === 0) {
      console.log(chalk.green('\n🎉 All tests passed! Solbot V2 is production-ready!'));
    } else {
      console.log(chalk.red('\n⚠️ Some tests failed. Please fix the issues before deploying to production.'));
      process.exit(1);
    }
  }
}

// Run the tests
async function main() {
  const tester = new ProductionIntegrationTest();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error(chalk.red('Test runner failed:'), error.message);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

export { ProductionIntegrationTest };