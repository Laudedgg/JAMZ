/*
  # Fix campaigns and artists relationship

  1. Changes
    - Drop existing campaigns table
    - Recreate campaigns table with proper foreign key relationship
    - Add explicit foreign key constraint
    - Update RLS policies
*/

-- Drop existing campaigns table
DROP TABLE IF EXISTS campaigns CASCADE;

-- Recreate campaigns table with proper foreign key relationship
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  title text NOT NULL,
  youtube_url text,
  spotify_url text,
  tiktok_sound_url text,
  platform_rewards jsonb DEFAULT '{
    "tiktok": {"usdt": 0, "jamz": 0},
    "instagram": {"usdt": 0, "jamz": 0},
    "youtube": {"usdt": 0, "jamz": 0}
  }'::jsonb,
  referral_rewards jsonb DEFAULT '{
    "usdt": 0,
    "jamz": 0
  }'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_artist FOREIGN KEY (artist_id) 
    REFERENCES artists(id) 
    ON DELETE CASCADE
    ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED
);

-- Create index on foreign key for better performance
CREATE INDEX idx_campaigns_artist_id ON campaigns(artist_id);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to campaigns"
  ON campaigns
  FOR SELECT
  TO public
  USING (true);

-- Create policy for admin write access
CREATE POLICY "Allow admin write access to campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'victor@bitsport.gg')
  WITH CHECK (auth.jwt() ->> 'email' = 'victor@bitsport.gg');