import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/user.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateUniqueCode } from '../utils/codeGenerator.js';
import { verifyWalletConnection } from '../services/kickoffService.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if username is taken (if provided)
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique code for campaign verification
    let uniqueCode;
    let codeExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (codeExists && attempts < maxAttempts) {
      uniqueCode = generateUniqueCode();
      const existingCode = await User.findOne({ uniqueCode });
      codeExists = !!existingCode;
      attempts++;
    }

    if (codeExists) {
      return res.status(500).json({ message: 'Failed to generate unique code. Please try again.' });
    }

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      username: username || null,
      uniqueCode
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        username: user.username,
        uniqueCode: user.uniqueCode,
        needsUsername: false // Not needed for regular registration
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        walletAddress: user.walletAddress,
        username: user.username,
        uniqueCode: user.uniqueCode,
        needsUsername: !user.username,
        onboardingCompleted: user.onboardingCompleted || false
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        walletAddress: user.walletAddress,
        username: user.username,
        uniqueCode: user.uniqueCode,
        needsUsername: !user.username,
        onboardingCompleted: user.onboardingCompleted || false
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/connect-wallet', async (req, res) => {
  try {
    const { address } = req.body;

    // Find or create user with wallet address
    let user = await User.findOne({ walletAddress: address });
    let isNewWalletConnection = false;

    if (!user) {
      // Generate unique code for campaign verification
      let uniqueCode;
      let codeExists = true;
      let attempts = 0;
      const maxAttempts = 10;

      while (codeExists && attempts < maxAttempts) {
        uniqueCode = generateUniqueCode();
        const existingCode = await User.findOne({ uniqueCode });
        codeExists = !!existingCode;
        attempts++;
      }

      if (codeExists) {
        return res.status(500).json({ message: 'Failed to generate unique code. Please try again.' });
      }

      user = new User({
        walletAddress: address,
        email: `${address.toLowerCase()}@wallet.jamz.fun`,
        uniqueCode
      });
      await user.save();
      isNewWalletConnection = true;
    }

    // Notify Kickoff API about wallet connection (async, don't wait for response)
    if (isNewWalletConnection) {
      verifyWalletConnection(address)
        .then(result => {
          if (result.success) {
            console.log(`✅ Kickoff: Wallet connection tracked for ${address}`);
          } else {
            console.warn(`⚠️ Kickoff: Failed to track wallet connection for ${address}:`, result.error);
          }
        })
        .catch(error => {
          console.error(`❌ Kickoff: Error tracking wallet connection:`, error);
        });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        walletAddress: user.walletAddress,
        username: user.username,
        uniqueCode: user.uniqueCode,
        needsUsername: !user.username,
        onboardingCompleted: user.onboardingCompleted || false
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Handle Appkit email and social login
router.post('/appkit-auth', async (req, res) => {
  console.log('📥 Appkit auth request received:', req.body);
  console.log('📥 Request headers:', req.headers);
  try {
    const { email, provider, address, wallet } = req.body;

    // Validate that we have at least an email
    if (!email) {
      console.log('❌ Appkit auth failed: Email is required');
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log(`✅ Appkit auth: Processing login for email ${email} with provider ${provider || 'email'}`);
    console.log('📋 Additional data:', { address, wallet: wallet ? 'Present' : 'Not provided' });

    // First try to find user by email
    let user = await User.findOne({ email });

    // If no user found by email but we have an address, try to find by wallet address
    if (!user && address) {
      console.log(`Appkit auth: User not found by email, checking wallet address ${address}`);
      user = await User.findOne({ walletAddress: address });

      // If found by wallet, update the email
      if (user) {
        console.log(`Appkit auth: User found by wallet address, updating email to ${email}`);
        user.email = email;
        await user.save();
      }
    }

    // If still no user, create a new one
    if (!user) {
      console.log(`Appkit auth: User not found, creating new user with email ${email}`);

      // Generate unique code for campaign verification
      let uniqueCode;
      let codeExists = true;
      let attempts = 0;
      const maxAttempts = 10;

      while (codeExists && attempts < maxAttempts) {
        uniqueCode = generateUniqueCode();
        const existingCode = await User.findOne({ uniqueCode });
        codeExists = !!existingCode;
        attempts++;
      }

      if (codeExists) {
        return res.status(500).json({ message: 'Failed to generate unique code. Please try again.' });
      }

      // Create new user with all available information
      const userData = {
        email,
        authProvider: provider || 'email',
        uniqueCode
      };

      // Add wallet address if provided
      const hasWalletAddress = !!address;
      if (address) {
        userData.walletAddress = address;
        console.log(`Appkit auth: Adding wallet address ${address} to new user`);
      }

      // Create the user
      user = new User(userData);

      try {
        await user.save();
        console.log(`Appkit auth: New user created successfully with ID ${user._id}`);

        // Notify Kickoff API about wallet connection if wallet was provided (async, don't wait for response)
        if (hasWalletAddress && address) {
          verifyWalletConnection(address).catch(() => {
            // Silently fail - Kickoff service handles logging
          });
        }
      } catch (saveError) {
        console.error('Appkit auth: Error saving new user:', saveError);

        // Check for duplicate key error (email or wallet address already exists)
        if (saveError.code === 11000) {
          // Try one more time with a different approach
          console.log('Appkit auth: Duplicate key error, trying alternative approach');

          // If the error is due to duplicate email
          if (saveError.keyPattern && saveError.keyPattern.email) {
            // Try to find the user again (in case of race condition)
            user = await User.findOne({ email });
            if (!user) {
              return res.status(409).json({ message: 'Email already exists but user not found' });
            }
          }
          // If the error is due to duplicate wallet address
          else if (saveError.keyPattern && saveError.keyPattern.walletAddress) {
            // Try to find by wallet address
            user = await User.findOne({ walletAddress: address });
            if (user) {
              // Update the email and provider
              user.email = email;
              user.authProvider = provider || user.authProvider || 'email';
              await user.save();
              console.log(`Appkit auth: Updated existing user with wallet address ${address}`);
            } else {
              return res.status(409).json({ message: 'Wallet address already exists but user not found' });
            }
          } else {
            return res.status(500).json({ message: `Error creating user: ${saveError.message}` });
          }
        } else {
          return res.status(500).json({ message: `Error creating user: ${saveError.message}` });
        }
      }
    } else {
      console.log(`Appkit auth: Found existing user with ID ${user._id}`);

      // Update user information if needed
      let needsUpdate = false;
      let isNewWalletConnection = false;

      // Update the authProvider if it's not set or different
      if (provider && (!user.authProvider || user.authProvider !== provider)) {
        console.log(`Appkit auth: Updating user's authProvider from ${user.authProvider || 'none'} to ${provider}`);
        user.authProvider = provider;
        needsUpdate = true;
      }

      // Update wallet address if provided
      if (address) {
        if (!user.walletAddress) {
          console.log(`Appkit auth: Adding wallet address ${address} to existing user`);
          user.walletAddress = address;
          needsUpdate = true;
          isNewWalletConnection = true;
        } else if (user.walletAddress.toLowerCase() !== address.toLowerCase()) {
          console.log(`Appkit auth: Updating wallet address from ${user.walletAddress} to ${address}`);
          user.walletAddress = address;
          needsUpdate = true;
          isNewWalletConnection = true;
        } else {
          console.log(`Appkit auth: Wallet address ${address} already set for user`);
        }
      } else {
        console.log(`Appkit auth: No wallet address provided in auth data`);
      }

      // Save if updates were made
      if (needsUpdate) {
        try {
          await user.save();
          console.log(`Appkit auth: User updated successfully`);

          // Notify Kickoff API about wallet connection if this is a new wallet (async, don't wait for response)
          if (isNewWalletConnection && address) {
            verifyWalletConnection(address).catch(() => {
              // Silently fail - Kickoff service handles logging
            });
          }
        } catch (updateError) {
          console.error('Appkit auth: Error updating user:', updateError);
          // Continue anyway since we have a valid user
        }
      }
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key', // Fallback to a default if JWT_SECRET is not set
      { expiresIn: '7d' }
    );

    console.log(`Appkit auth: Authentication successful for user ${user._id}`);

    const responseData = {
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        walletAddress: user.walletAddress,
        username: user.username,
        uniqueCode: user.uniqueCode,
        needsUsername: !user.username,
        authProvider: user.authProvider,
        onboardingCompleted: user.onboardingCompleted || false
      }
    };

    console.log('Appkit auth: Sending response:', {
      token: token ? '✓ Present' : '✗ Missing',
      user: responseData.user
    });

    res.json(responseData);
  } catch (error) {
    console.error('Appkit auth error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

router.post('/set-username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim() === '') {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check if username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Update user's username
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username: username.trim() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        walletAddress: user.walletAddress,
        username: user.username,
        uniqueCode: user.uniqueCode
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update discovery source
router.post('/discovery-source', authenticateToken, async (req, res) => {
  try {
    const { discoverySource, discoverySourceOther, userType } = req.body;

    if (!discoverySource) {
      return res.status(400).json({ message: 'Discovery source is required' });
    }

    const validSources = ['google-search', 'youtube', 'instagram', 'twitter-x', 'tiktok', 'friend-word-of-mouth', 'other'];
    if (!validSources.includes(discoverySource)) {
      return res.status(400).json({ message: 'Invalid discovery source' });
    }

    if (discoverySource === 'other' && (!discoverySourceOther || discoverySourceOther.trim().length === 0)) {
      return res.status(400).json({ message: 'Please specify how you discovered us' });
    }

    if (userType && !['artist', 'fan'].includes(userType)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Update user
    const updateData = {
      discoverySource,
      discoverySourceOther: discoverySource === 'other' ? discoverySourceOther?.trim() : null,
      onboardingCompleted: true
    };

    if (userType) {
      updateData.userType = userType;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Discovery source updated successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        walletAddress: user.walletAddress,
        discoverySource: user.discoverySource,
        userType: user.userType,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync wallet address for authenticated user
router.post('/sync-wallet', authenticateToken, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update wallet address
    const oldAddress = user.walletAddress;
    const isNewWalletConnection = !oldAddress;
    user.walletAddress = address.toLowerCase();
    await user.save();

    console.log(`Wallet address synced for user ${user._id}: ${oldAddress} -> ${address}`);

    // Notify Kickoff API about wallet connection if this is a new wallet (async, don't wait for response)
    if (isNewWalletConnection) {
      verifyWalletConnection(address).catch(() => {
        // Silently fail - Kickoff service handles logging
      });
    }

    res.json({
      message: 'Wallet address synced successfully',
      user: {
        id: user._id,
        email: user.email,
        walletAddress: user.walletAddress,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error syncing wallet address:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug endpoint to check user's wallet status
router.get('/wallet-status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      userId: user._id,
      email: user.email,
      walletAddress: user.walletAddress,
      hasWalletAddress: !!user.walletAddress,
      authProvider: user.authProvider,
      username: user.username
    });
  } catch (error) {
    console.error('Error checking wallet status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's unique verification code
router.get('/verification-code', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      uniqueCode: user.uniqueCode,
      message: 'Add this code to your social media post before submitting to a campaign'
    });
  } catch (error) {
    console.error('Error fetching verification code:', error);
    res.status(500).json({ message: error.message });
  }
});

// Regenerate user's unique verification code
router.post('/regenerate-code', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new unique code
    let newCode;
    let codeExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (codeExists && attempts < maxAttempts) {
      newCode = generateUniqueCode();
      const existingCode = await User.findOne({ uniqueCode: newCode });
      codeExists = !!existingCode;
      attempts++;
    }

    if (codeExists) {
      return res.status(500).json({ message: 'Failed to generate new code. Please try again.' });
    }

    // Store old code for audit trail (optional)
    const oldCode = user.uniqueCode;

    // Update user with new code
    user.uniqueCode = newCode;
    await user.save();

    console.log(`✓ Code regenerated for user ${user._id}: ${oldCode} → ${newCode}`);

    res.json({
      message: 'Verification code regenerated successfully',
      oldCode,
      newCode,
      uniqueCode: newCode,
      warning: 'Your old code is no longer valid. Use the new code for future submissions.'
    });
  } catch (error) {
    console.error('Error regenerating verification code:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
