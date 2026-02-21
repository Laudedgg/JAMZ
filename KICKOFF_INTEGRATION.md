# Kickoff API Integration

## Overview

This document describes the integration between Jamz.fun and Kickoff.fun for tracking user wallet connections.

## Configuration

### Environment Variables

The following environment variables have been added to `.env`:

```env
# Kickoff API Configuration
KICKOFF_API_KEY=c4d12fdb-b877-4128-a153-12aae3ab2b17
KICKOFF_PROJECT_SLUG=jamz-fun
KICKOFF_API_URL=https://www.kickoff.fun/api
```

### API Details

- **Project Slug**: `jamz-fun`
- **API Key**: `c4d12fdb-b877-4128-a153-12aae3ab2b17`
- **Task Type**: `connect_wallet`
- **API Endpoint**: `https://www.kickoff.fun/api/projects/jamz-fun/verify-task`

## Implementation

### 1. Kickoff Service (`backend/services/kickoffService.js`)

A new service has been created to handle all Kickoff API interactions:

**Functions:**
- `verifyTask(walletAddress, taskType)` - Generic task verification
- `verifyWalletConnection(walletAddress)` - Specific function for wallet connections
- `testConnection()` - Test API connectivity

**Features:**
- Automatic error handling
- Timeout protection (10 seconds)
- Detailed logging
- Graceful degradation (doesn't block user flow if API fails)

### 2. Integration Points

The Kickoff API is called automatically when users connect their wallets in the following scenarios:

#### A. Direct Wallet Connection (`POST /api/auth/connect-wallet`)
- Triggered when users connect via Web3 wallet (MetaMask, WalletConnect, etc.)
- Only tracks **new** wallet connections (not existing users)

#### B. Wallet Sync (`POST /api/auth/sync-wallet`)
- Triggered when authenticated users add a wallet address
- Only tracks when a user adds their **first** wallet address

#### C. AppKit Authentication (`POST /api/auth/appkit-auth`)
- Triggered when users sign in with email/social + wallet
- Tracks wallet connections for:
  - New users with wallet addresses
  - Existing users adding their first wallet address

### 3. Async Processing

All Kickoff API calls are made **asynchronously** and **non-blocking**:

```javascript
verifyWalletConnection(address)
  .then(result => {
    if (result.success) {
      console.log(`✅ Kickoff: Wallet connection tracked for ${address}`);
    } else {
      console.warn(`⚠️ Kickoff: Failed to track wallet connection:`, result.error);
    }
  })
  .catch(error => {
    console.error(`❌ Kickoff: Error tracking wallet connection:`, error);
  });
```

This ensures:
- User authentication is not delayed
- API failures don't affect user experience
- All errors are logged for monitoring

## API Request Format

```bash
curl -X POST https://www.kickoff.fun/api/projects/jamz-fun/verify-task \
  -H "X-API-Key: c4d12fdb-b877-4128-a153-12aae3ab2b17" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234...5678",
    "taskType": "connect_wallet"
  }'
```

## Monitoring

### Success Logs

When a wallet connection is successfully tracked:

```
✅ Kickoff: Wallet connection tracked for 0x1234...5678
📊 Kickoff response: { ... }
```

### Warning Logs

When the API call fails (non-critical):

```
⚠️ Kickoff: Failed to track wallet connection for 0x1234...5678: API request failed
```

### Error Logs

When there's a network or configuration error:

```
❌ Kickoff: Error tracking wallet connection: Network error
```

## Testing

### Manual Testing

1. Connect a new wallet on jamz.fun
2. Check backend logs for Kickoff API calls:
   ```bash
   pm2 logs jamz-backend | grep Kickoff
   ```

### Test Script

Run the test script to verify configuration:

```bash
cd backend
node scripts/testKickoffIntegration.js
```

## Deployment

### Production Deployment

All changes have been deployed to production:

✅ Environment variables added to `.env`  
✅ `kickoffService.js` deployed  
✅ `auth.js` updated with Kickoff integration  
✅ Backend restarted with PM2  

### Files Modified

- `backend/.env` - Added Kickoff configuration
- `backend/services/kickoffService.js` - New service file
- `backend/routes/auth.js` - Integrated Kickoff calls
- `backend/scripts/testKickoffIntegration.js` - Test script

## Troubleshooting

### API Key Not Working

Check environment variables are loaded:
```bash
ssh ubuntu@server "cd jamz.fun/backend && grep KICKOFF .env"
```

### No Logs Appearing

Ensure PM2 is running the latest code:
```bash
pm2 restart jamz-backend
pm2 logs jamz-backend --lines 50
```

### API Timeouts

The service has a 10-second timeout. If Kickoff API is slow, you'll see timeout errors in logs.

## Future Enhancements

Potential improvements:
- Add retry logic for failed API calls
- Queue failed requests for later retry
- Add analytics dashboard for tracking success rates
- Support additional task types beyond wallet connections

