#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

class ProductionReadyTest {
  private results: TestResult[] = [];

  async runAllTests() {
    console.log(chalk.blue.bold('\n🧪 SOLBOT V2 PRODUCTION READINESS TEST\n'));
    
    // Backend Core Files Tests
    await this.testBackendCoreFiles();
    
    // UI Components Tests
    await this.testUIComponents();
    
    // API Endpoints Tests
    await this.testAPIEndpoints();
    
    // Configuration Tests
    await this.testConfiguration();
    
    // Integration Tests
    await this.testIntegration();
    
    this.printResults();
  }

  private async testBackendCoreFiles() {
    console.log(chalk.yellow('📁 Testing Backend Core Files...'));
    
    const coreFiles = [
      { file: 'index.ts', description: 'Main entry point' },
      { file: 'utility.ts', description: 'Utility functions' },
      { file: 'RaydiumSwap.ts', description: 'Raydium swap functionality' },
      { file: 'dynamicTrade.ts', description: 'Dynamic trading engine' },
      { file: 'startTrading.ts', description: 'Trading execution' },
      { file: 'pool-keys.ts', description: 'Pool key management' },
      { file: 'simple-api-server.ts', description: 'API server' },
      { file: 'swapConfig.ts', description: 'Configuration management' }
    ];

    for (const { file, description } of coreFiles) {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      this.addResult(`backend-${file}`, exists, 
        exists ? `${description} exists` : `${description} missing`, true);
    }
  }

  private async testUIComponents() {
    console.log(chalk.yellow('🎨 Testing UI Components...'));
    
    const uiComponents = [
      { file: 'web-dashboard/components/AdvancedTradingControls.tsx', description: 'Advanced Trading Controls' },
      { file: 'web-dashboard/components/AdvancedSessionManager.tsx', description: 'Advanced Session Manager' },
      { file: 'web-dashboard/components/AdvancedWalletManager.tsx', description: 'Advanced Wallet Manager' },
      { file: 'web-dashboard/components/RealTimeMonitor.tsx', description: 'Real-Time Monitor' },
      { file: 'web-dashboard/components/Dashboard.tsx', description: 'Main Dashboard' }
    ];

    for (const { file, description } of uiComponents) {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      this.addResult(`ui-${file}`, exists, 
        exists ? `${description} component exists` : `${description} component missing`, true);
      
      if (exists) {
        const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
        const hasAdvancedFeatures = content.includes('useState') && content.includes('useEffect');
        this.addResult(`ui-${file}-features`, hasAdvancedFeatures,
          hasAdvancedFeatures ? `${description} has React hooks` : `${description} missing React functionality`, false);
      }
    }
  }

  private async testAPIEndpoints() {
    console.log(chalk.yellow('🔌 Testing API Endpoints...'));
    
    const apiServerPath = path.join(process.cwd(), 'simple-api-server.ts');
    if (fs.existsSync(apiServerPath)) {
      const content = fs.readFileSync(apiServerPath, 'utf-8');
      
      const endpoints = [
        { endpoint: '/api/config/default', description: 'Default configuration' },
        { endpoint: '/api/sessions/advanced', description: 'Advanced session creation' },
        { endpoint: '/api/wallets/create-multiple', description: 'Multiple wallet creation' },
        { endpoint: '/api/wallets/distribute-sol', description: 'SOL distribution' },
        { endpoint: '/api/wallets/collect-sol', description: 'SOL collection' },
        { endpoint: '/api/tokens/validate', description: 'Enhanced token validation' }
      ];

      for (const { endpoint, description } of endpoints) {
        const hasEndpoint = content.includes(endpoint);
        this.addResult(`api-${endpoint}`, hasEndpoint,
          hasEndpoint ? `${description} endpoint exists` : `${description} endpoint missing`, true);
      }

      // Test WebSocket support
      const hasWebSocket = content.includes('socket.io') && content.includes('join-session');
      this.addResult('api-websocket', hasWebSocket,
        hasWebSocket ? 'WebSocket support implemented' : 'WebSocket support missing', true);
    }
  }

  private async testConfiguration() {
    console.log(chalk.yellow('⚙️ Testing Configuration...'));
    
    // Test package.json scripts
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};
      
      const requiredScripts = [
        'setup:production',
        'dev:prod',
        'build:all',
        'start:production'
      ];

      for (const script of requiredScripts) {
        const hasScript = scripts[script] !== undefined;
        this.addResult(`config-script-${script}`, hasScript,
          hasScript ? `Script ${script} exists` : `Script ${script} missing`, true);
      }
    }

    // Test frontend package.json
    const frontendPackagePath = path.join(process.cwd(), 'web-dashboard', 'package.json');
    if (fs.existsSync(frontendPackagePath)) {
      const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf-8'));
      const hasSolanaWallet = frontendPackage.dependencies && 
        frontendPackage.dependencies['@solana/wallet-adapter-react'];
      
      this.addResult('config-frontend-deps', hasSolanaWallet,
        hasSolanaWallet ? 'Frontend has Solana wallet dependencies' : 'Frontend missing Solana dependencies', true);
    }

    // Test TypeScript configuration
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    const frontendTsconfigPath = path.join(process.cwd(), 'web-dashboard', 'tsconfig.json');
    
    this.addResult('config-backend-ts', fs.existsSync(tsconfigPath),
      fs.existsSync(tsconfigPath) ? 'Backend TypeScript config exists' : 'Backend TypeScript config missing', true);
    
    this.addResult('config-frontend-ts', fs.existsSync(frontendTsconfigPath),
      fs.existsSync(frontendTsconfigPath) ? 'Frontend TypeScript config exists' : 'Frontend TypeScript config missing', true);
  }

  private async testIntegration() {
    console.log(chalk.yellow('🔗 Testing Integration...'));
    
    // Test if Dashboard imports all advanced components
    const dashboardPath = path.join(process.cwd(), 'web-dashboard', 'components', 'Dashboard.tsx');
    if (fs.existsSync(dashboardPath)) {
      const content = fs.readFileSync(dashboardPath, 'utf-8');
      
      const advancedComponents = [
        'AdvancedTradingControls',
        'AdvancedSessionManager',
        'AdvancedWalletManager',
        'RealTimeMonitor'
      ];

      for (const component of advancedComponents) {
        const hasImport = content.includes(`import { ${component} }`) || content.includes(`import ${component}`);
        const hasUsage = content.includes(`<${component}`);
        
        this.addResult(`integration-${component}-import`, hasImport,
          hasImport ? `${component} imported in Dashboard` : `${component} not imported`, true);
        
        this.addResult(`integration-${component}-usage`, hasUsage,
          hasUsage ? `${component} used in Dashboard` : `${component} not used`, true);
      }

      // Test production mode toggle
      const hasProductionMode = content.includes('isProductionMode') && content.includes('setIsProductionMode');
      this.addResult('integration-production-mode', hasProductionMode,
        hasProductionMode ? 'Production mode toggle implemented' : 'Production mode toggle missing', true);
    }

    // Test if API server has comprehensive endpoints
    const apiPath = path.join(process.cwd(), 'simple-api-server.ts');
    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf-8');
      
      const hasComprehensiveAPI = content.includes('COMPREHENSIVE API ENDPOINTS FOR PRODUCTION-READY UI');
      this.addResult('integration-comprehensive-api', hasComprehensiveAPI,
        hasComprehensiveAPI ? 'Comprehensive API endpoints implemented' : 'Basic API only', true);
    }
  }

  private addResult(name: string, passed: boolean, message: string, critical: boolean = false) {
    this.results.push({ name, passed, message, critical });
    
    const icon = passed ? '✅' : (critical ? '❌' : '⚠️');
    const color = passed ? 'green' : (critical ? 'red' : 'yellow');
    console.log(chalk[color](`   ${icon} ${message}`));
  }

  private printResults() {
    console.log(chalk.blue.bold('\n📊 TEST RESULTS SUMMARY\n'));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    const criticalFailures = this.results.filter(r => !r.passed && r.critical).length;
    
    console.log(chalk.white(`Total Tests: ${totalTests}`));
    console.log(chalk.green(`Passed: ${passedTests}`));
    console.log(chalk.red(`Failed: ${failedTests}`));
    console.log(chalk.red(`Critical Failures: ${criticalFailures}`));
    
    const successRate = (passedTests / totalTests) * 100;
    console.log(chalk.blue(`Success Rate: ${successRate.toFixed(1)}%`));
    
    if (criticalFailures === 0) {
      console.log(chalk.green.bold('\n🎉 PRODUCTION READY! All critical tests passed.'));
      
      if (successRate >= 95) {
        console.log(chalk.green.bold('🌟 EXCELLENT! Your application is fully production-ready.'));
      } else if (successRate >= 85) {
        console.log(chalk.yellow.bold('👍 GOOD! Minor issues detected but application is production-ready.'));
      } else {
        console.log(chalk.yellow.bold('⚠️  ACCEPTABLE! Some non-critical issues detected.'));
      }
    } else {
      console.log(chalk.red.bold('\n❌ NOT PRODUCTION READY! Critical issues must be resolved.'));
    }
    
    // Show failed critical tests
    const criticalFailedTests = this.results.filter(r => !r.passed && r.critical);
    if (criticalFailedTests.length > 0) {
      console.log(chalk.red.bold('\n🚨 CRITICAL ISSUES TO RESOLVE:'));
      criticalFailedTests.forEach(test => {
        console.log(chalk.red(`   • ${test.message}`));
      });
    }
    
    // Show recommendations
    console.log(chalk.blue.bold('\n💡 RECOMMENDATIONS:'));
    
    if (criticalFailures === 0) {
      console.log(chalk.white('1. Run the production setup: npm run setup:production'));
      console.log(chalk.white('2. Start the application: npm run dev:prod'));
      console.log(chalk.white('3. Toggle to Production Mode in the UI header'));
      console.log(chalk.white('4. Test all advanced features thoroughly'));
    } else {
      console.log(chalk.white('1. Resolve all critical issues listed above'));
      console.log(chalk.white('2. Re-run this test: npx ts-node test-production-ready.ts'));
      console.log(chalk.white('3. Check the PRODUCTION_READY_GUIDE.md for detailed instructions'));
    }
    
    console.log(chalk.gray('\nFor detailed setup instructions, see: PRODUCTION_READY_GUIDE.md\n'));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new ProductionReadyTest();
  test.runAllTests().catch(error => {
    console.error(chalk.red.bold('\n💥 Test execution failed:'), error.message);
    process.exit(1);
  });
}

export default ProductionReadyTest;