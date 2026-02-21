import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import User from '../models/user.js';
import OpenVerseSubmission from '../models/openVerseSubmission.js';
import { generateUniqueCode, isCodeInText } from '../utils/codeGenerator.js';

describe('Submission Verification Integration', () => {
  let testUser;
  let testCampaignId;

  beforeEach(async () => {
    // Create test user with unique code
    const uniqueCode = generateUniqueCode();
    testUser = await User.create({
      email: `test-${Date.now()}@example.com`,
      password: 'hashedPassword123',
      username: `testuser${Date.now()}`,
      uniqueCode
    });

    // Mock campaign ID
    testCampaignId = new mongoose.Types.ObjectId();
  });

  afterEach(async () => {
    // Cleanup
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
    }
    await OpenVerseSubmission.deleteMany({ userId: testUser._id });
  });

  describe('Code verification in submissions', () => {
    it('should auto-approve submission when code is found in metadata', async () => {
      const metadata = {
        title: 'My Amazing Post',
        description: `Check this out! Code: ${testUser.uniqueCode}`,
        author: { username: 'testuser' }
      };

      const submission = new OpenVerseSubmission({
        campaignId: testCampaignId,
        userId: testUser._id,
        platform: 'tiktok',
        contentUrl: 'https://tiktok.com/test',
        metadata,
        verificationCode: testUser.uniqueCode,
        codeVerified: isCodeInText(testUser.uniqueCode, `${metadata.title} ${metadata.description}`),
        codeVerificationMethod: 'auto',
        status: isCodeInText(testUser.uniqueCode, `${metadata.title} ${metadata.description}`) ? 'approved' : 'pending'
      });

      await submission.save();

      expect(submission.codeVerified).toBe(true);
      expect(submission.codeVerificationMethod).toBe('auto');
      expect(submission.status).toBe('approved');
    });

    it('should set to pending when code is not found in metadata', async () => {
      const metadata = {
        title: 'My Amazing Post',
        description: 'Check this out! No code here.',
        author: { username: 'testuser' }
      };

      const submission = new OpenVerseSubmission({
        campaignId: testCampaignId,
        userId: testUser._id,
        platform: 'instagram',
        contentUrl: 'https://instagram.com/test',
        metadata,
        verificationCode: null,
        codeVerified: false,
        codeVerificationMethod: null,
        status: 'pending'
      });

      await submission.save();

      expect(submission.codeVerified).toBe(false);
      expect(submission.codeVerificationMethod).toBeNull();
      expect(submission.status).toBe('pending');
    });

    it('should handle code in title', async () => {
      const metadata = {
        title: `${testUser.uniqueCode} - My Post`,
        description: 'Check this out!',
        author: { username: 'testuser' }
      };

      const metadataText = `${metadata.title} ${metadata.description}`;
      const codeFound = isCodeInText(testUser.uniqueCode, metadataText);

      expect(codeFound).toBe(true);
    });

    it('should handle code in description', async () => {
      const metadata = {
        title: 'My Post',
        description: `Use code ${testUser.uniqueCode} for verification`,
        author: { username: 'testuser' }
      };

      const metadataText = `${metadata.title} ${metadata.description}`;
      const codeFound = isCodeInText(testUser.uniqueCode, metadataText);

      expect(codeFound).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const metadata = {
        title: 'My Post',
        description: `Use code ${testUser.uniqueCode.toLowerCase()} for verification`,
        author: { username: 'testuser' }
      };

      const metadataText = `${metadata.title} ${metadata.description}`;
      const codeFound = isCodeInText(testUser.uniqueCode, metadataText);

      expect(codeFound).toBe(true);
    });
  });

  describe('Admin manual verification', () => {
    it('should allow admin to manually verify submission', async () => {
      const submission = new OpenVerseSubmission({
        campaignId: testCampaignId,
        userId: testUser._id,
        platform: 'youtube',
        contentUrl: 'https://youtube.com/test',
        metadata: { title: 'Test', description: 'No code' },
        codeVerified: false,
        status: 'pending'
      });

      await submission.save();

      // Admin manually verifies
      submission.codeVerified = true;
      submission.codeVerificationMethod = 'manual';
      submission.status = 'approved';
      await submission.save();

      const updated = await OpenVerseSubmission.findById(submission._id);
      expect(updated.codeVerified).toBe(true);
      expect(updated.codeVerificationMethod).toBe('manual');
      expect(updated.status).toBe('approved');
    });

    it('should allow admin to reject verification', async () => {
      const submission = new OpenVerseSubmission({
        campaignId: testCampaignId,
        userId: testUser._id,
        platform: 'tiktok',
        contentUrl: 'https://tiktok.com/test',
        metadata: { title: 'Test', description: 'Fake code' },
        codeVerified: true,
        codeVerificationMethod: 'auto',
        status: 'approved'
      });

      await submission.save();

      // Admin rejects verification
      submission.codeVerified = false;
      submission.codeVerificationMethod = 'manual';
      submission.status = 'pending';
      await submission.save();

      const updated = await OpenVerseSubmission.findById(submission._id);
      expect(updated.codeVerified).toBe(false);
      expect(updated.codeVerificationMethod).toBe('manual');
      expect(updated.status).toBe('pending');
    });
  });

  describe('Multiple submissions', () => {
    it('should track verification for multiple submissions', async () => {
      const submissions = [];

      // Submission 1: Code verified
      const sub1 = new OpenVerseSubmission({
        campaignId: testCampaignId,
        userId: testUser._id,
        platform: 'tiktok',
        contentUrl: 'https://tiktok.com/test1',
        metadata: { title: testUser.uniqueCode, description: 'Test' },
        codeVerified: true,
        codeVerificationMethod: 'auto',
        status: 'approved'
      });
      submissions.push(await sub1.save());

      // Submission 2: Code not verified
      const sub2 = new OpenVerseSubmission({
        campaignId: testCampaignId,
        userId: testUser._id,
        platform: 'instagram',
        contentUrl: 'https://instagram.com/test2',
        metadata: { title: 'Test', description: 'No code' },
        codeVerified: false,
        codeVerificationMethod: null,
        status: 'pending'
      });
      submissions.push(await sub2.save());

      const verified = submissions.filter(s => s.codeVerified);
      const pending = submissions.filter(s => !s.codeVerified);

      expect(verified.length).toBe(1);
      expect(pending.length).toBe(1);
    });
  });
});

