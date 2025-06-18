#!/usr/bin/env ts-node

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

console.log(chalk.blue('🚀 Solbot Production Setup'));
console.log(chalk.yellow('This script will help you set up Solbot for production use.\n'));

// Generate a new fee collection wallet
const feeWallet = Keypair.generate();
const feeWalletAddress = feeWallet.publicKey.toBase58();
const feeWalletPrivateKey = bs58.encode(feeWallet.secretKey);

console.log(chalk.green('✅ Generated Fee Collection Wallet:'));
console.log(chalk.white(`Address: ${feeWalletAddress}`));
console.log(chalk.white(`Private Key: ${feeWalletPrivateKey}`));
console.log(chalk.yellow('\n⚠️  IMPORTANT: Save these credentials securely!'));
console.log(chalk.yellow('⚠️  The private key controls your fee collection wallet.'));
console.log(chalk.yellow('⚠️  Never share your private key with anyone.\n'));

// Update the fee config file
const feeConfigPath = path.join(__dirname, 'simple-fee-config.ts');
let feeConfigContent = fs.readFileSync(feeConfigPath, 'utf8');

feeConfigContent = feeConfigContent.replace(
  'process.env.FEE_COLLECTION_WALLET || "YOUR_WALLET_ADDRESS_HERE"',
  `process.env.FEE_COLLECTION_WALLET || "${feeWalletAddress}"`
);

fs.writeFileSync(feeConfigPath, feeConfigContent);

// Update the production environment file
const envProdPath = path.join(__dirname, '.env.production');
let envContent = fs.readFileSync(envProdPath, 'utf8');

envContent = envContent.replace(
  'FEE_COLLECTION_WALLET=YOUR_PRODUCTION_WALLET_ADDRESS_HERE',
  `FEE_COLLECTION_WALLET=${feeWalletAddress}`
);

envContent = envContent.replace(
  'FEE_COLLECTION_PRIVATE_KEY=YOUR_PRODUCTION_PRIVATE_KEY_HERE',
  `FEE_COLLECTION_PRIVATE_KEY=${feeWalletPrivateKey}`
);

// Generate a random JWT secret
const jwtSecret = require('crypto').randomBytes(64).toString('hex');
envContent = envContent.replace(
  'JWT_SECRET=your_production_jwt_secret_here_make_it_long_and_random',
  `JWT_SECRET=${jwtSecret}`
);

fs.writeFileSync(envProdPath, envContent);

console.log(chalk.green('✅ Updated configuration files'));
console.log(chalk.green('✅ Updated .env.production file'));

console.log(chalk.blue('\n📋 Next Steps:'));
console.log(chalk.white('1. Fund your fee collection wallet with some SOL for transaction fees'));
console.log(chalk.white('2. Copy .env.production to .env for local testing'));
console.log(chalk.white('3. Run: npm install'));
console.log(chalk.white('4. Run: npm run dev'));
console.log(chalk.white('5. Test the application thoroughly before going live'));

console.log(chalk.blue('\n🚀 Production Deployment:'));
console.log(chalk.white('1. Set environment variables on your hosting platform'));
console.log(chalk.white('2. Deploy the backend API server'));
console.log(chalk.white('3. Deploy the frontend dashboard'));
console.log(chalk.white('4. Configure domain and SSL certificates'));

console.log(chalk.green('\n✅ Setup complete! Your Solbot is ready for production.'));

// Create a backup of the wallet info
const backupInfo = {
  feeCollectionWallet: {
    address: feeWalletAddress,
    privateKey: feeWalletPrivateKey
  },
  generatedAt: new Date().toISOString(),
  note: 'Keep this information secure and backed up!'
};

fs.writeFileSync(
  path.join(__dirname, 'wallet-backup.json'),
  JSON.stringify(backupInfo, null, 2)
);

console.log(chalk.yellow('\n💾 Wallet backup saved to wallet-backup.json'));
console.log(chalk.red('🔒 Keep wallet-backup.json secure and delete it after backing up elsewhere!'));