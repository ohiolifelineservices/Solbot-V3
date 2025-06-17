import { Connection, PublicKey } from '@solana/web3.js';
import chalk from 'chalk';
import axios from 'axios';
import { swapConfig } from './swapConfig';
import { getPoolKeysForTokenAddress, getMarketIdForTokenAddress } from './pool-keys';
import RaydiumSwap from './RaydiumSwap';
import WalletWithNumber from './wallet';

const log = (message: string, color: string = 'white') => console.log(chalk[color](message));

async function testRPCConnection() {
  log('Testing RPC Connection...', 'cyan');
  try {
    const connection = new Connection(swapConfig.RPC_URL, 'confirmed');
    
    // Test getting slot instead of health (which doesn't exist in this version)
    const slot = await connection.getSlot();
    log(`✅ RPC Connection: OK`, 'green');
    log(`✅ Current Slot: ${slot}`, 'green');
    
    return connection;
  } catch (error) {
    log(`❌ RPC Connection Failed: ${error.message}`, 'red');
    return null;
  }
}

async function testDexScreenerAPI() {
  log('Testing DexScreener API...', 'cyan');
  try {
    // Test with USDC
    const usdcAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${usdcAddress}`);
    
    if (response.data && response.data.pairs && response.data.pairs.length > 0) {
      const pair = response.data.pairs[0];
      log(`✅ DexScreener API Working`, 'green');
      log(`   Token: ${pair.baseToken.name} (${pair.baseToken.symbol})`, 'white');
      log(`   Price: $${pair.priceUsd}`, 'white');
      return true;
    } else {
      log(`❌ DexScreener API: No pairs found`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ DexScreener API Failed: ${error.message}`, 'red');
    return false;
  }
}

async function testWalletGeneration() {
  log('Testing Wallet Generation...', 'cyan');
  try {
    const wallet = new WalletWithNumber();
    log(`✅ Wallet Generated`, 'green');
    log(`   Public Key: ${wallet.publicKey}`, 'white');
    log(`   Number: ${wallet.number}`, 'white');
    return wallet;
  } catch (error) {
    log(`❌ Wallet Generation Failed: ${error.message}`, 'red');
    return null;
  }
}

async function testRaydiumSwapInitialization() {
  log('Testing RaydiumSwap Initialization...', 'cyan');
  try {
    const wallet = new WalletWithNumber();
    const raydiumSwap = new RaydiumSwap(swapConfig.RPC_URL, wallet.privateKey);
    log(`✅ RaydiumSwap Initialized`, 'green');
    
    // Test getting token accounts
    const tokenAccounts = await raydiumSwap.getOwnerTokenAccounts();
    log(`✅ Token Accounts Retrieved: ${tokenAccounts.length}`, 'green');
    
    return raydiumSwap;
  } catch (error) {
    log(`❌ RaydiumSwap Initialization Failed: ${error.message}`, 'red');
    return null;
  }
}

async function testPoolKeysFetching(connection: Connection) {
  log('Testing Pool Keys Fetching...', 'cyan');
  try {
    // Test with a known token (USDC)
    const usdcAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    
    // Test market ID fetching
    const marketId = await getMarketIdForTokenAddress(connection, usdcAddress);
    if (marketId) {
      log(`✅ Market ID Found: ${marketId}`, 'green');
    } else {
      log(`⚠️  Market ID Not Found for USDC`, 'yellow');
    }
    
    // Test pool keys fetching
    const poolKeys = await getPoolKeysForTokenAddress(connection, usdcAddress);
    if (poolKeys) {
      log(`✅ Pool Keys Found`, 'green');
      log(`   Pool ID: ${poolKeys.id}`, 'white');
    } else {
      log(`⚠️  Pool Keys Not Found for USDC`, 'yellow');
    }
    
    return { marketId, poolKeys };
  } catch (error) {
    log(`❌ Pool Keys Fetching Failed: ${error.message}`, 'red');
    return null;
  }
}

async function testTokenDecimals(raydiumSwap: RaydiumSwap) {
  log('Testing Token Decimals Fetching...', 'cyan');
  try {
    // Test with USDC
    const usdcAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const decimals = await raydiumSwap.getTokenDecimals(usdcAddress);
    log(`✅ USDC Decimals: ${decimals}`, 'green');
    
    // Test with SOL
    const solAddress = "So11111111111111111111111111111111111111112";
    const solDecimals = await raydiumSwap.getTokenDecimals(solAddress);
    log(`✅ SOL Decimals: ${solDecimals}`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Token Decimals Fetching Failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('🚀 Starting Solbot Functionality Tests', 'magenta');
  log('='.repeat(50), 'magenta');
  
  const results = {
    rpcConnection: false,
    dexScreenerAPI: false,
    walletGeneration: false,
    raydiumSwap: false,
    poolKeys: false,
    tokenDecimals: false
  };
  
  // Test RPC Connection
  const connection = await testRPCConnection();
  results.rpcConnection = !!connection;
  
  // Test DexScreener API
  results.dexScreenerAPI = await testDexScreenerAPI();
  
  // Test Wallet Generation
  const wallet = await testWalletGeneration();
  results.walletGeneration = !!wallet;
  
  // Test RaydiumSwap Initialization
  const raydiumSwap = await testRaydiumSwapInitialization();
  results.raydiumSwap = !!raydiumSwap;
  
  // Test Pool Keys Fetching (only if connection works)
  if (connection) {
    const poolKeysResult = await testPoolKeysFetching(connection);
    results.poolKeys = !!poolKeysResult;
  }
  
  // Test Token Decimals (only if RaydiumSwap works)
  if (raydiumSwap) {
    results.tokenDecimals = await testTokenDecimals(raydiumSwap);
  }
  
  // Summary
  log('\n📊 Test Results Summary', 'magenta');
  log('='.repeat(50), 'magenta');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${test.padEnd(20)}: ${status}`, color);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('🎉 All core functionality appears to be working!', 'green');
  } else {
    log('⚠️  Some functionality may be broken or needs updates', 'yellow');
  }
}

// Run the tests
runAllTests().catch(error => {
  log(`💥 Test runner failed: ${error.message}`, 'red');
  console.error(error);
});