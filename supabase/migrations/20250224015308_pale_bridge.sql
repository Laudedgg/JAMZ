/*
  # Fix Database Schema and Relationships

  1. Changes
    - Drop existing tables to ensure clean slate
    - Recreate tables in correct order
    - Add proper foreign key constraints
    - Update RLS policies
    - Grant necessary permissions

  2. Security
    - Enable RLS on both tables
    - Public read access
    - Authenticated users have full access
*/

-- First, ensure we have a clean slate
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS artists CASCADE;

-- Create artists table first
CREATE TABLE artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaigns table with proper foreign key relationship
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
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
  updated_at timestamptz DEFAULT now()
);

-- Create index on foreign key for better performance
CREATE INDEX idx_campaigns_artist_id ON campaigns(artist_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for artists table
CREATE POLICY "artists_public_read"
  ON artists
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "artists_admin_all"
  ON artists
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for campaigns table
CREATE POLICY "campaigns_public_read"
  ON campaigns
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "campaigns_admin_all"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT ALL ON artists TO authenticated;
GRANT ALL ON campaigns TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON artists TO anon;
GRANT SELECT ON campaigns TO anon;