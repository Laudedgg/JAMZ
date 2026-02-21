import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import ArtistAuth from '../models/artistAuth.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Check if token is for an artist or regular user
    if (decoded.isArtist) {
      // Handle artist authentication
      const artistAuth = await ArtistAuth.findById(decoded.id);

      if (!artistAuth) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      req.user = {
        _id: artistAuth._id,
        artistId: artistAuth.artistId,
        email: artistAuth.email,
        isArtist: true,
        isAdmin: false
      };
    } else {
      // Handle regular user authentication
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      req.user = {
        _id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        isArtist: false
      };
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user is an artist
export const isArtist = (req, res, next) => {
  if (!req.user || !req.user.isArtist) {
    return res.status(403).json({ message: 'Access denied. Artist only.' });
  }
  next();
};

// Middleware to check if user is an admin
export const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Optional authentication - sets req.user if token exists, but doesn't require it
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Check if token is for an artist or regular user
    if (decoded.isArtist) {
      const artistAuth = await ArtistAuth.findById(decoded.id);
      if (artistAuth) {
        req.user = {
          _id: artistAuth._id,
          artistId: artistAuth.artistId,
          email: artistAuth.email,
          isArtist: true,
          isAdmin: false
        };
      } else {
        req.user = null;
      }
    } else {
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = {
          _id: user._id,
          email: user.email,
          username: user.username,
          walletAddress: user.walletAddress,
          isAdmin: user.isAdmin,
          isArtist: false
        };
      } else {
        req.user = null;
      }
    }

    next();
  } catch (error) {
    // Invalid token, continue without user
    req.user = null;
    next();
  }
};
