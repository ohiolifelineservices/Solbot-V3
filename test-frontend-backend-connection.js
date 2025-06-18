// Test script to verify frontend-backend connection
const axios = require('axios');

const API_BASE = 'https://work-2-aelzbjdwepigpywc.prod-runtime.all-hands.dev';

async function testConnection() {
  console.log('🧪 Testing Frontend-Backend Connection...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE}/api/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Token Validation
    console.log('2. Testing Token Validation...');
    const tokenResponse = await axios.post(`${API_BASE}/api/tokens/validate`, {
      tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC
    });
    console.log('✅ Token Validation:', {
      valid: tokenResponse.data.valid,
      tokenName: tokenResponse.data.tokenInfo?.name,
      hasPoolKeys: !!tokenResponse.data.poolKeys
    });
    console.log('');

    // Test 3: Wallet Creation
    console.log('3. Testing Wallet Creation...');
    const walletResponse = await axios.post(`${API_BASE}/api/wallets/create`, {
      type: 'generate'
    });
    console.log('✅ Wallet Creation:', {
      success: walletResponse.data.success,
      hasPublicKey: !!walletResponse.data.publicKey,
      hasPrivateKey: !!walletResponse.data.privateKey
    });
    console.log('');

    // Test 4: Multiple Wallet Creation
    console.log('4. Testing Multiple Wallet Creation...');
    const multiWalletResponse = await axios.post(`${API_BASE}/api/wallets/create-multiple`, {
      count: 3
    });
    console.log('✅ Multiple Wallet Creation:', {
      walletsCreated: Array.isArray(multiWalletResponse.data) ? multiWalletResponse.data.length : 0
    });
    console.log('');

    // Test 5: Metrics
    console.log('5. Testing Metrics...');
    const metricsResponse = await axios.get(`${API_BASE}/api/metrics`);
    console.log('✅ Metrics:', metricsResponse.data);
    console.log('');

    console.log('🎉 All tests passed! Frontend-Backend connection is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testConnection();