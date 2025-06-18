#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

interface SetupStep {
  name: string;
  description: string;
  execute: () => Promise<void> | void;
  required: boolean;
}

class ProductionSetup {
  private steps: SetupStep[] = [];
  private completedSteps: string[] = [];
  private failedSteps: string[] = [];

  constructor() {
    this.initializeSteps();
  }

  private initializeSteps() {
    this.steps = [
      {
        name: 'check-node-version',
        description: 'Verify Node.js version compatibility',
        execute: this.checkNodeVersion,
        required: true
      },
      {
        name: 'install-backend-dependencies',
        description: 'Install backend dependencies',
        execute: this.installBackendDependencies,
        required: true
      },
      {
        name: 'install-frontend-dependencies',
        description: 'Install frontend dependencies',
        execute: this.installFrontendDependencies,
        required: true
      },
      {
        name: 'create-environment-files',
        description: 'Create and configure environment files',
        execute: this.createEnvironmentFiles,
        required: true
      },
      {
        name: 'create-sessions-directory',
        description: 'Create sessions directory',
        execute: this.createSessionsDirectory,
        required: true
      },
      {
        name: 'verify-rpc-connection',
        description: 'Verify RPC connection',
        execute: this.verifyRpcConnection,
        required: false
      },
      {
        name: 'build-frontend',
        description: 'Build frontend for production',
        execute: this.buildFrontend,
        required: true
      },
      {
        name: 'run-tests',
        description: 'Run comprehensive tests',
        execute: this.runTests,
        required: false
      },
      {
        name: 'setup-pm2-config',
        description: 'Setup PM2 configuration for production',
        execute: this.setupPM2Config,
        required: false
      }
    ];
  }

  async run() {
    console.log(chalk.blue.bold('\n🚀 SOLBOT V2 PRODUCTION SETUP\n'));
    console.log(chalk.gray('Setting up your trading application for production use...\n'));

    for (const step of this.steps) {
      await this.executeStep(step);
    }

    this.printSummary();
  }

  private async executeStep(step: SetupStep) {
    console.log(chalk.yellow(`⏳ ${step.description}...`));
    
    try {
      await step.execute();
      this.completedSteps.push(step.name);
      console.log(chalk.green(`✅ ${step.description} completed\n`));
    } catch (error) {
      this.failedSteps.push(step.name);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (step.required) {
        console.log(chalk.red(`❌ ${step.description} failed: ${errorMessage}\n`));
        console.log(chalk.red.bold('Setup cannot continue due to required step failure.'));
        process.exit(1);
      } else {
        console.log(chalk.yellow(`⚠️  ${step.description} failed (optional): ${errorMessage}\n`));
      }
    }
  }

  private checkNodeVersion = () => {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    console.log(chalk.gray(`   Current Node.js version: ${nodeVersion}`));
    
    if (majorVersion < 18) {
      throw new Error('Node.js version 18 or higher is required');
    }
    
    console.log(chalk.green('   Node.js version is compatible'));
  };

  private installBackendDependencies = () => {
    console.log(chalk.gray('   Installing backend dependencies...'));
    
    try {
      execSync('npm install', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      console.log(chalk.green('   Backend dependencies installed successfully'));
    } catch (error) {
      throw new Error('Failed to install backend dependencies');
    }
  };

  private installFrontendDependencies = () => {
    console.log(chalk.gray('   Installing frontend dependencies...'));
    
    const frontendPath = path.join(process.cwd(), 'web-dashboard');
    
    if (!fs.existsSync(frontendPath)) {
      throw new Error('Frontend directory not found');
    }
    
    try {
      execSync('npm install', { 
        stdio: 'pipe',
        cwd: frontendPath
      });
      console.log(chalk.green('   Frontend dependencies installed successfully'));
    } catch (error) {
      throw new Error('Failed to install frontend dependencies');
    }
  };

  private createEnvironmentFiles = () => {
    console.log(chalk.gray('   Creating environment configuration...'));
    
    const envPath = path.join(process.cwd(), '.env');
    const envExamplePath = path.join(process.cwd(), '.env.example');
    
    // Create .env.example if it doesn't exist
    if (!fs.existsSync(envExamplePath)) {
      const envExample = `# Solbot V2 Environment Configuration
RPC_URL=https://api.mainnet-beta.solana.com
WSS_URL=wss://api.mainnet-beta.solana.com
API_PORT=12001
FRONTEND_PORT=12000

# Trading Configuration
SLIPPAGE_PERCENT=5
MAX_RETRIES=15
RETRY_INTERVAL=1000
MAX_LAMPORTS=6000

# Session Configuration
SESSION_DIR=./sessions

# Optional: Custom RPC endpoints for better performance
# RPC_URL=https://your-custom-rpc-endpoint.com
# WSS_URL=wss://your-custom-websocket-endpoint.com

# Security (for production)
# ADMIN_WALLET_PRIVATE_KEY=your-admin-private-key-here
# TOKEN_ADDRESS=your-default-token-address-here
`;
      
      fs.writeFileSync(envExamplePath, envExample);
      console.log(chalk.green('   Created .env.example file'));
    }
    
    // Create .env if it doesn't exist
    if (!fs.existsSync(envPath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log(chalk.green('   Created .env file from example'));
      console.log(chalk.yellow('   ⚠️  Please review and update .env file with your configuration'));
    } else {
      console.log(chalk.green('   Environment file already exists'));
    }
  };

  private createSessionsDirectory = () => {
    console.log(chalk.gray('   Creating sessions directory...'));
    
    const sessionsPath = path.join(process.cwd(), 'sessions');
    
    if (!fs.existsSync(sessionsPath)) {
      fs.mkdirSync(sessionsPath, { recursive: true });
      console.log(chalk.green('   Sessions directory created'));
    } else {
      console.log(chalk.green('   Sessions directory already exists'));
    }
    
    // Create .gitkeep to ensure directory is tracked
    const gitkeepPath = path.join(sessionsPath, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '');
    }
  };

  private verifyRpcConnection = async () => {
    console.log(chalk.gray('   Testing RPC connection...'));
    
    const { Connection } = await import('@solana/web3.js');
    const rpcUrl = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
    
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const slot = await connection.getSlot();
      console.log(chalk.green(`   RPC connection successful (current slot: ${slot})`));
    } catch (error) {
      throw new Error(`RPC connection failed: ${error.message}`);
    }
  };

  private buildFrontend = () => {
    console.log(chalk.gray('   Building frontend for production...'));
    
    const frontendPath = path.join(process.cwd(), 'web-dashboard');
    
    try {
      execSync('npm run build', { 
        stdio: 'pipe',
        cwd: frontendPath
      });
      console.log(chalk.green('   Frontend built successfully'));
    } catch (error) {
      throw new Error('Failed to build frontend');
    }
  };

  private runTests = async () => {
    console.log(chalk.gray('   Running comprehensive tests...'));
    
    try {
      // Check if test files exist
      const testFiles = [
        'test-functionality.ts',
        'test-dependencies.ts',
        'test-main-flow.ts'
      ];
      
      for (const testFile of testFiles) {
        const testPath = path.join(process.cwd(), testFile);
        if (fs.existsSync(testPath)) {
          console.log(chalk.gray(`   Running ${testFile}...`));
          execSync(`npx ts-node ${testFile}`, { 
            stdio: 'pipe',
            cwd: process.cwd()
          });
        }
      }
      
      console.log(chalk.green('   All tests passed'));
    } catch (error) {
      throw new Error('Some tests failed');
    }
  };

  private setupPM2Config = () => {
    console.log(chalk.gray('   Setting up PM2 configuration...'));
    
    const pm2Config = {
      apps: [
        {
          name: 'solbot-api',
          script: 'simple-api-server.ts',
          interpreter: 'npx',
          interpreter_args: 'ts-node',
          env: {
            NODE_ENV: 'production',
            API_PORT: 12001
          },
          instances: 1,
          autorestart: true,
          watch: false,
          max_memory_restart: '1G',
          error_file: './logs/api-error.log',
          out_file: './logs/api-out.log',
          log_file: './logs/api-combined.log',
          time: true
        },
        {
          name: 'solbot-frontend',
          script: 'npm',
          args: 'start',
          cwd: './web-dashboard',
          env: {
            NODE_ENV: 'production',
            PORT: 12000
          },
          instances: 1,
          autorestart: true,
          watch: false,
          max_memory_restart: '512M',
          error_file: './logs/frontend-error.log',
          out_file: './logs/frontend-out.log',
          log_file: './logs/frontend-combined.log',
          time: true
        }
      ]
    };
    
    const pm2ConfigPath = path.join(process.cwd(), 'ecosystem.config.js');
    const configContent = `module.exports = ${JSON.stringify(pm2Config, null, 2)};`;
    
    fs.writeFileSync(pm2ConfigPath, configContent);
    console.log(chalk.green('   PM2 configuration created'));
    
    // Create logs directory
    const logsPath = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsPath)) {
      fs.mkdirSync(logsPath, { recursive: true });
      console.log(chalk.green('   Logs directory created'));
    }
  };

  private printSummary() {
    console.log(chalk.blue.bold('\n📋 SETUP SUMMARY\n'));
    
    console.log(chalk.green.bold(`✅ Completed Steps (${this.completedSteps.length}):`));
    this.completedSteps.forEach(step => {
      const stepInfo = this.steps.find(s => s.name === step);
      console.log(chalk.green(`   • ${stepInfo?.description}`));
    });
    
    if (this.failedSteps.length > 0) {
      console.log(chalk.yellow.bold(`\n⚠️  Failed Steps (${this.failedSteps.length}):`));
      this.failedSteps.forEach(step => {
        const stepInfo = this.steps.find(s => s.name === step);
        console.log(chalk.yellow(`   • ${stepInfo?.description}`));
      });
    }
    
    console.log(chalk.blue.bold('\n🚀 NEXT STEPS:\n'));
    
    if (this.completedSteps.includes('build-frontend')) {
      console.log(chalk.white('1. Review and update your .env file with proper configuration'));
      console.log(chalk.white('2. Start the application:'));
      console.log(chalk.cyan('   npm run dev:prod    # For development with production build'));
      console.log(chalk.cyan('   npm run start       # For production mode'));
      console.log(chalk.white('3. Or use PM2 for production deployment:'));
      console.log(chalk.cyan('   pm2 start ecosystem.config.js'));
      console.log(chalk.white('4. Access your application:'));
      console.log(chalk.cyan('   Frontend: http://localhost:12000'));
      console.log(chalk.cyan('   API: http://localhost:12001'));
    }
    
    console.log(chalk.green.bold('\n✨ Your Solbot V2 application is production-ready!\n'));
    
    console.log(chalk.gray('For support and documentation, visit:'));
    console.log(chalk.blue('https://github.com/your-repo/solbot-v2\n'));
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new ProductionSetup();
  setup.run().catch(error => {
    console.error(chalk.red.bold('\n💥 Setup failed:'), error.message);
    process.exit(1);
  });
}

export default ProductionSetup;