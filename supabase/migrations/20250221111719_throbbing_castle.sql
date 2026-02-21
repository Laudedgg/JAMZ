/*
  # Enhanced Campaign Rewards System

  1. Changes
    - Add platform-specific challenge rewards (TikTok, Instagram, YouTube)
    - Add TikTok sound URL
    - Add referral rewards structure
    - Update campaign rewards to be more flexible

  2. New Columns
    - tiktok_sound_url: Direct link to use track on TikTok
    - platform_rewards: JSON structure for platform-specific rewards
    - referral_rewards: JSON structure for referral rewards
*/

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS tiktok_sound_url text,
ADD COLUMN IF NOT EXISTS platform_rewards jsonb DEFAULT '{
  "tiktok": {"usdt": 0, "jamz": 0},
  "instagram": {"usdt": 0, "jamz": 0},
  "youtube": {"usdt": 0, "jamz": 0}
}'::jsonb,
ADD COLUMN IF NOT EXISTS referral_rewards jsonb DEFAULT '{
  "usdt": 0,
  "jamz": 0
}'::jsonb;