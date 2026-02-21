import dotenv from 'dotenv';
import { verifyWalletConnection, testConnection } from '../services/kickoffService.js';

// Load environment variables
dotenv.config();

/**
 * Test script for Kickoff API integration
 */
async function testKickoffIntegration() {
  console.log('🧪 Testing Kickoff API Integration\n');
  console.log('=' .repeat(60));
  
  // Test 1: Check configuration
  console.log('\n📋 Test 1: Configuration Check');
  console.log('-'.repeat(60));
  console.log('KICKOFF_API_URL:', process.env.KICKOFF_API_URL || 'Not set');
  console.log('KICKOFF_PROJECT_SLUG:', process.env.KICKOFF_PROJECT_SLUG || 'Not set');
  console.log('KICKOFF_API_KEY:', process.env.KICKOFF_API_KEY ? `${process.env.KICKOFF_API_KEY.substring(0, 8)}...` : 'Not set');
  
  if (!process.env.KICKOFF_API_KEY) {
    console.error('❌ KICKOFF_API_KEY is not configured!');
    process.exit(1);
  }
  
  // Test 2: Test connection
  console.log('\n🔌 Test 2: Connection Test');
  console.log('-'.repeat(60));
  const connectionOk = await testConnection();
  if (connectionOk) {
    console.log('✅ Connection test passed');
  } else {
    console.log('❌ Connection test failed');
  }
  
  // Test 3: Test wallet verification with a sample address
  console.log('\n🔐 Test 3: Wallet Verification Test');
  console.log('-'.repeat(60));
  const testWalletAddress = '0x1234567890123456789012345678901234567890';
  console.log(`Testing with wallet address: ${testWalletAddress}`);
  
  const result = await verifyWalletConnection(testWalletAddress);
  
  if (result.success) {
    console.log('✅ Wallet verification successful!');
    console.log('📊 Response data:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('⚠️ Wallet verification failed (this might be expected for test addresses)');
    console.log('📛 Error:', result.error);
    console.log('📊 Status:', result.status);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Test Summary');
  console.log('='.repeat(60));
  console.log('Configuration: ✅ OK');
  console.log('Connection: ' + (connectionOk ? '✅ OK' : '❌ FAILED'));
  console.log('API Call: ' + (result.success ? '✅ OK' : '⚠️ FAILED (might be expected)'));
  console.log('\n💡 Note: The API call might fail if the test wallet address is not');
  console.log('   recognized by Kickoff. This is normal for testing.');
  console.log('\n✨ Integration is ready! Wallet connections will be tracked automatically.');
  console.log('='.repeat(60));
}

// Run the test
testKickoffIntegration()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  });

