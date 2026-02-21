/*
  # Database Schema Setup

  1. Tables
    - Recreates artists and campaigns tables with proper structure
    - Sets up foreign key relationships and indexes
  
  2. Security
    - Enables RLS on all tables
    - Creates public read policies
    - Creates authenticated user policies
    - Sets up proper permissions
*/

-- First, ensure we have a clean slate
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS artists CASCADE;

-- Create artists table
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
  CONSTRAINT fk_artist 
    FOREIGN KEY (artist_id) 
    REFERENCES artists(id) 
    ON DELETE CASCADE
    ON UPDATE CASCADE
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