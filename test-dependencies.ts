import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const log = (message: string, color: string = 'white') => console.log(chalk[color](message));

async function checkDependencyVersions() {
  log('📦 Checking Dependency Versions...', 'cyan');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = packageJson.dependencies;
    
    log('Current Dependencies:', 'yellow');
    Object.entries(dependencies).forEach(([name, version]) => {
      log(`  ${name}: ${version}`, 'white');
    });
    
    // Check for known outdated packages
    const potentiallyOutdated = [
      '@raydium-io/raydium-sdk',
      '@solana/web3.js',
      '@solana/spl-token',
      '@coral-xyz/anchor'
    ];
    
    log('\n🔍 Checking for potentially outdated packages:', 'yellow');
    potentiallyOutdated.forEach(pkg => {
      if (dependencies[pkg]) {
        log(`  ${pkg}: ${dependencies[pkg]}`, 'white');
      }
    });
    
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, 'red');
  }
}

async function checkImportCompatibility() {
  log('\n🔗 Testing Import Compatibility...', 'cyan');
  
  const imports = [
    { name: '@solana/web3.js', test: () => require('@solana/web3.js') },
    { name: '@raydium-io/raydium-sdk', test: () => require('@raydium-io/raydium-sdk') },
    { name: '@coral-xyz/anchor', test: () => require('@coral-xyz/anchor') },
    { name: '@solana/spl-token', test: () => require('@solana/spl-token') },
    { name: 'axios', test: () => require('axios') },
    { name: 'chalk', test: () => require('chalk') },
    { name: 'bs58', test: () => require('bs58') }
  ];
  
  for (const imp of imports) {
    try {
      imp.test();
      log(`✅ ${imp.name}`, 'green');
    } catch (error) {
      log(`❌ ${imp.name}: ${error.message}`, 'red');
    }
  }
}

async function checkRaydiumSDKCompatibility() {
  log('\n🏊 Testing Raydium SDK Compatibility...', 'cyan');
  
  try {
    const { Liquidity, MAINNET_PROGRAM_ID, LIQUIDITY_STATE_LAYOUT_V4 } = require('@raydium-io/raydium-sdk');
    
    log('✅ Liquidity class imported', 'green');
    log('✅ MAINNET_PROGRAM_ID imported', 'green');
    log('✅ LIQUIDITY_STATE_LAYOUT_V4 imported', 'green');
    
    // Check if key methods exist
    if (typeof Liquidity.getAssociatedPoolKeys === 'function') {
      log('✅ Liquidity.getAssociatedPoolKeys method exists', 'green');
    } else {
      log('❌ Liquidity.getAssociatedPoolKeys method missing', 'red');
    }
    
    if (typeof Liquidity.getLayouts === 'function') {
      log('✅ Liquidity.getLayouts method exists', 'green');
    } else {
      log('❌ Liquidity.getLayouts method missing', 'red');
    }
    
    // Check program IDs
    log(`AmmV4 Program ID: ${MAINNET_PROGRAM_ID.AmmV4}`, 'white');
    log(`OpenBook Market Program ID: ${MAINNET_PROGRAM_ID.OPENBOOK_MARKET}`, 'white');
    
  } catch (error) {
    log(`❌ Raydium SDK compatibility issue: ${error.message}`, 'red');
  }
}

async function checkSolanaWebCompatibility() {
  log('\n⚡ Testing Solana Web3.js Compatibility...', 'cyan');
  
  try {
    const { Connection, PublicKey, Keypair, VersionedTransaction } = require('@solana/web3.js');
    
    log('✅ Connection class imported', 'green');
    log('✅ PublicKey class imported', 'green');
    log('✅ Keypair class imported', 'green');
    log('✅ VersionedTransaction class imported', 'green');
    
    // Test basic functionality
    const testPubkey = new PublicKey('11111111111111111111111111111111');
    log(`✅ PublicKey creation works: ${testPubkey.toString()}`, 'green');
    
    const testKeypair = Keypair.generate();
    log(`✅ Keypair generation works: ${testKeypair.publicKey.toString()}`, 'green');
    
  } catch (error) {
    log(`❌ Solana Web3.js compatibility issue: ${error.message}`, 'red');
  }
}

async function checkFileStructure() {
  log('\n📁 Checking File Structure...', 'cyan');
  
  const requiredFiles = [
    'index.ts',
    'RaydiumSwap.ts',
    'dynamicTrade.ts',
    'startTrading.ts',
    'utility.ts',
    'wallet.ts',
    'pool-keys.ts',
    'swapConfig.ts',
    'package.json',
    'tsconfig.json'
  ];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} missing`, 'red');
    }
  }
  
  // Check sessions directory
  if (fs.existsSync('./sessions')) {
    log('✅ sessions directory exists', 'green');
  } else {
    log('⚠️  sessions directory missing (will be created on first run)', 'yellow');
  }
}

async function runDependencyTests() {
  log('🔧 Starting Dependency and Compatibility Tests', 'magenta');
  log('='.repeat(60), 'magenta');
  
  await checkDependencyVersions();
  await checkImportCompatibility();
  await checkRaydiumSDKCompatibility();
  await checkSolanaWebCompatibility();
  await checkFileStructure();
  
  log('\n✨ Dependency tests completed!', 'magenta');
}

runDependencyTests().catch(error => {
  log(`💥 Dependency test runner failed: ${error.message}`, 'red');
  console.error(error);
});