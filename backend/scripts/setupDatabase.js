import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/user.js';
import Artist from '../models/artist.js';
import Campaign from '../models/campaign.js';
import OpenVerseCampaign from '../models/openVerseCampaign.js';

dotenv.config({ path: '../.env' });

// Admin user details
const adminEmail = 'admin@jamz.fun';
const adminPassword = 'admin123'; // This should be changed in production
const adminUsername = 'admin';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27018/jamz-dev', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  setupDatabase();
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

async function setupDatabase() {
  try {
    console.log('Starting database setup...');
    
    // Step 1: Create admin user
    await createAdminUser();
    
    // Step 2: Create sample data
    await createSampleData();
    
    console.log('Database setup complete!');
    console.log('\nAdmin credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\nYou can now access the admin dashboard at: http://localhost:5173/admin/login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

async function createAdminUser() {
  try {
    console.log('\n--- Creating Admin User ---');
    
    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    
    if (existingUser) {
      console.log('Admin user already exists');
      
      // Update the user to be an admin if they're not already
      if (!existingUser.isAdmin) {
        existingUser.isAdmin = true;
        await existingUser.save();
        console.log('User updated to admin');
      }
      
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      password: hashedPassword,
      username: adminUsername,
      isAdmin: true
    });

    await adminUser.save();
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

async function createSampleData() {
  try {
    console.log('\n--- Creating Sample Data ---');

    // Check if we already have artists
    const artistCount = await Artist.countDocuments();
    if (artistCount > 0) {
      console.log(`${artistCount} artists already exist. Skipping artist creation.`);
      return;
    }

    // Get or create admin user for OpenVerseCampaigns
    let adminUser = await User.findOne({ email: 'admin@jamz.fun' });
    if (!adminUser) {
      console.log('Admin user not found for creating OpenVerseCampaigns');
      return;
    }

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

    // Create sample OpenVerseCampaigns first
    const openVerseCampaigns = [
      {
        title: 'Cyber Punk Challenge',
        description: 'A futuristic electronic music campaign with cyberpunk vibes.',
        thumbnailImage: 'https://placehold.co/400x400/purple/white?text=Cyber+Punk',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
        appleMusicUrl: 'https://music.apple.com/us/album/never-gonna-give-you-up/1558533900',
        prizePool: {
          amount: 500,
          currency: 'JAMZ'
        },
        maxParticipants: 100,
        maxWinners: 5,
        prizeDistribution: [
          { rank: 1, amount: 200 },
          { rank: 2, amount: 150 },
          { rank: 3, amount: 100 },
          { rank: 4, amount: 30 },
          { rank: 5, amount: 20 }
        ],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        status: 'active',
        allowedPlatforms: ['instagram', 'tiktok', 'youtube'],
        createdBy: adminUser._id
      },
      {
        title: 'Galactic Groove Challenge',
        description: 'An interstellar journey through cosmic soundscapes.',
        thumbnailImage: 'https://placehold.co/400x400/blue/white?text=Galactic+Groove',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
        appleMusicUrl: 'https://music.apple.com/us/album/never-gonna-give-you-up/1558533900',
        prizePool: {
          amount: 750,
          currency: 'JAMZ'
        },
        maxParticipants: 150,
        maxWinners: 5,
        prizeDistribution: [
          { rank: 1, amount: 300 },
          { rank: 2, amount: 225 },
          { rank: 3, amount: 150 },
          { rank: 4, amount: 50 },
          { rank: 5, amount: 25 }
        ],
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        isActive: true,
        status: 'active',
        allowedPlatforms: ['instagram', 'tiktok', 'youtube'],
        createdBy: adminUser._id
      },
      {
        title: 'Digital Symphony Challenge',
        description: 'A harmonious blend of digital and classical elements.',
        thumbnailImage: 'https://placehold.co/400x400/red/white?text=Digital+Symphony',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
        appleMusicUrl: 'https://music.apple.com/us/album/never-gonna-give-you-up/1558533900',
        prizePool: {
          amount: 1000,
          currency: 'JAMZ'
        },
        maxParticipants: 200,
        maxWinners: 5,
        prizeDistribution: [
          { rank: 1, amount: 400 },
          { rank: 2, amount: 300 },
          { rank: 3, amount: 200 },
          { rank: 4, amount: 70 },
          { rank: 5, amount: 30 }
        ],
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
        status: 'active',
        allowedPlatforms: ['instagram', 'tiktok', 'youtube'],
        createdBy: adminUser._id
      }
    ];

    const createdOpenVerseCampaigns = await OpenVerseCampaign.insertMany(openVerseCampaigns);
    console.log(`Created ${createdOpenVerseCampaigns.length} sample OpenVerse campaigns`);

    // Create sample campaigns linked to OpenVerseCampaigns
    const campaigns = [
      {
        artistId: createdArtists[0]._id,
        showcaseId: createdOpenVerseCampaigns[0]._id,
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
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        artistId: createdArtists[1]._id,
        showcaseId: createdOpenVerseCampaigns[1]._id,
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
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
      },
      {
        artistId: createdArtists[2]._id,
        showcaseId: createdOpenVerseCampaigns[2]._id,
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
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      }
    ];

    const createdCampaigns = await Campaign.insertMany(campaigns);
    console.log(`Created ${createdCampaigns.length} sample campaigns`);
  } catch (error) {
    console.error('Error creating sample data:', error);
    throw error;
  }
}
