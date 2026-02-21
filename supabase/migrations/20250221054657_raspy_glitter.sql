/*
  # Artist Campaign Management Schema

  1. New Tables
    - `artists`
      - `id` (uuid, primary key)
      - `name` (text)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `campaigns`
      - `id` (uuid, primary key)
      - `artist_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `youtube_url` (text)
      - `spotify_url` (text)
      - `other_dsp_urls` (jsonb)
      - `challenge_reward_usdt` (numeric)
      - `challenge_reward_jamz` (numeric)
      - `share_reward_usdt` (numeric)
      - `share_reward_jamz` (numeric)
      - `is_active` (boolean)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access
*/

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  youtube_url text,
  spotify_url text,
  other_dsp_urls jsonb DEFAULT '{}',
  challenge_reward_usdt numeric DEFAULT 0,
  challenge_reward_jamz numeric DEFAULT 0,
  share_reward_usdt numeric DEFAULT 0,
  share_reward_jamz numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create admin role
CREATE ROLE admin;

-- Create policies for admin access to artists
CREATE POLICY "Admin full access to artists"
  ON artists
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

-- Create policies for admin access to campaigns
CREATE POLICY "Admin full access to campaigns"
  ON campaigns
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

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