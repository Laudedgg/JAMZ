import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Artist from '../models/artist.js';
import Campaign from '../models/campaign.js';
import User from '../models/user.js';
import Wallet from '../models/wallet.js';

dotenv.config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jamz', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  createSampleData();
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

async function createSampleData() {
  try {
    // Check if we already have artists
    const artistCount = await Artist.countDocuments();
    if (artistCount > 0) {
      console.log(`${artistCount} artists already exist. Skipping artist creation.`);
    } else {
      // Create sample artists
      const artists = [
        {
          name: 'Neon Dreams',
          imageUrl: 'https://placehold.co/400x400/purple/white?text=Neon+Dreams'
        },
        {
          name: 'Cosmic Beats',
          imageUrl: 'https://placehold.co/400x400/blue/white?text=Cosmic+Beats'
        },
        {
          name: 'Digital Harmony',
          imageUrl: 'https://placehold.co/400x400/red/white?text=Digital+Harmony'
        }
      ];

      const createdArtists = await Artist.insertMany(artists);
      console.log(`Created ${createdArtists.length} sample artists`);

      // Create sample campaigns
      const campaigns = [
        {
          artistId: createdArtists[0]._id,
          title: 'Cyber Punk',
          description: 'A futuristic electronic music campaign with cyberpunk vibes.',
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
          otherDspUrls: {
            appleMusic: 'https://music.apple.com/us/album/never-gonna-give-you-up/1558533900',
            soundcloud: 'https://soundcloud.com/rick-astley-official/never-gonna-give-you-up-4'
          },
          challengeRewardUsdt: 50,
          challengeRewardJamz: 500,
          shareRewardUsdt: 10,
          shareRewardJamz: 100,
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        {
          artistId: createdArtists[1]._id,
          title: 'Galactic Groove',
          description: 'An interstellar journey through cosmic soundscapes.',
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
          otherDspUrls: {
            appleMusic: 'https://music.apple.com/us/album/never-gonna-give-you-up/1558533900',
            soundcloud: 'https://soundcloud.com/rick-astley-official/never-gonna-give-you-up-4'
          },
          challengeRewardUsdt: 75,
          challengeRewardJamz: 750,
          shareRewardUsdt: 15,
          shareRewardJamz: 150,
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
        },
        {
          artistId: createdArtists[2]._id,
          title: 'Digital Symphony',
          description: 'A harmonious blend of digital and classical elements.',
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
          otherDspUrls: {
            appleMusic: 'https://music.apple.com/us/album/never-gonna-give-you-up/1558533900',
            soundcloud: 'https://soundcloud.com/rick-astley-official/never-gonna-give-you-up-4'
          },
          challengeRewardUsdt: 100,
          challengeRewardJamz: 1000,
          shareRewardUsdt: 20,
          shareRewardJamz: 200,
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
        }
      ];

      const createdCampaigns = await Campaign.insertMany(campaigns);
      console.log(`Created ${createdCampaigns.length} sample campaigns`);
    }

    // Check if we already have wallets
    const walletCount = await Wallet.countDocuments();
    if (walletCount > 0) {
      console.log(`${walletCount} wallets already exist. Skipping wallet creation.`);
    } else {
      // Get all users
      const users = await User.find();
      
      // Create sample wallets for each user
      for (const user of users) {
        const wallet = new Wallet({
          userId: user._id,
          usdtBalance: Math.floor(Math.random() * 1000), // Random balance between 0 and 1000
          jamzBalance: Math.floor(Math.random() * 10000), // Random balance between 0 and 10000
          transactions: [
            {
              type: 'deposit',
              token: 'USDT',
              amount: 100,
              status: 'completed',
              method: 'onchain',
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            },
            {
              type: 'deposit',
              token: 'JAMZ',
              amount: 1000,
              status: 'completed',
              method: 'onchain',
              createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) // 25 days ago
            },
            {
              type: 'reward',
              token: 'USDT',
              amount: 50,
              status: 'completed',
              method: 'reward',
              createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
            },
            {
              type: 'reward',
              token: 'JAMZ',
              amount: 500,
              status: 'completed',
              method: 'reward',
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
            }
          ]
        });
        
        await wallet.save();
      }
      
      console.log(`Created wallets for ${users.length} users`);
    }

    console.log('Sample data creation complete');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }
}
