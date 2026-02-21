import axios from 'axios';

/**
 * Kickoff API Service
 * Handles integration with Kickoff.fun for tracking user tasks
 */

/**
 * Get Kickoff configuration from environment variables
 * Accessed dynamically to ensure environment variables are loaded
 */
function getKickoffConfig() {
  return {
    apiUrl: process.env.KICKOFF_API_URL || 'https://www.kickoff.fun/api',
    apiKey: process.env.KICKOFF_API_KEY,
    projectSlug: process.env.KICKOFF_PROJECT_SLUG || 'jamz-fun'
  };
}

/**
 * Verify a task completion with Kickoff API
 * @param {string} walletAddress - User's wallet address
 * @param {string} taskType - Type of task (e.g., 'connect_wallet')
 * @returns {Promise<Object>} - API response
 */
export async function verifyTask(walletAddress, taskType) {
  const { apiUrl, apiKey, projectSlug } = getKickoffConfig();

  if (!apiKey) {
    return { success: false, error: 'API key not configured' };
  }

  if (!walletAddress) {
    return { success: false, error: 'Wallet address is required' };
  }

  try {
    const url = `${apiUrl}/projects/${projectSlug}/verify-task`;

    const response = await axios.post(
      url,
      {
        walletAddress,
        taskType
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    // Only log successful verification result
    console.log(`✅ Kickoff Task Verified: ${taskType} | Wallet: ${walletAddress} | Result:`, response.data);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    // Only log verification failures with minimal info
    if (error.response) {
      console.log(`❌ Kickoff Task Failed: ${taskType} | Wallet: ${walletAddress} | Status: ${error.response.status} | Error: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);

      return {
        success: false,
        error: error.response.data?.error || error.response.data?.message || 'API request failed',
        status: error.response.status
      };
    }

    console.log(`❌ Kickoff Task Failed: ${taskType} | Wallet: ${walletAddress} | Error: ${error.message}`);

    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

/**
 * Verify wallet connection task
 * @param {string} walletAddress - User's wallet address
 * @returns {Promise<Object>} - API response
 */
export async function verifyWalletConnection(walletAddress) {
  return verifyTask(walletAddress, 'connect_wallet');
}

/**
 * Test Kickoff API connection
 * @returns {Promise<boolean>} - True if API is reachable
 */
export async function testConnection() {
  const { apiUrl, apiKey, projectSlug } = getKickoffConfig();

  if (!apiKey) {
    return false;
  }

  try {
    return true;
  } catch (error) {
    return false;
  }
}

export default {
  verifyTask,
  verifyWalletConnection,
  testConnection
};

