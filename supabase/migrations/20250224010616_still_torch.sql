/*
  # Fix campaigns and artists relationship

  1. Changes
    - Drop and recreate campaigns table with proper foreign key relationship
    - Add necessary indexes and constraints
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
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
  CONSTRAINT fk_artist 
    FOREIGN KEY (artist_id) 
    REFERENCES artists(id) 
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Create index on foreign key for better performance
CREATE INDEX idx_campaigns_artist_id ON campaigns(artist_id);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow admin write access to campaigns" ON campaigns;

-- Create policy for public read access including joins
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
  USING (auth.jwt() ->> 'email' = 'admin@jamz.fun')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@jamz.fun');

-- Create trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions for joins
GRANT SELECT ON artists TO authenticated, anon;
GRANT SELECT ON campaigns TO authenticated, anon;