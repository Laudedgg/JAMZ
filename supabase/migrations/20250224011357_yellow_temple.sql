/*
  # Fix RLS policies for admin access

  1. Changes
    - Drop all existing policies to start fresh
    - Create new policies for both artists and campaigns tables
    - Enable RLS on both tables
    - Grant necessary permissions

  2. Security
    - Maintain public read access
    - Grant full access to admin@jamz.fun
*/

-- First, ensure RLS is enabled
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow public read access to artists" ON artists;
DROP POLICY IF EXISTS "Allow admin write access to artists" ON artists;
DROP POLICY IF EXISTS "Allow public read access to campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow admin write access to campaigns" ON campaigns;

-- Create new policies for artists table
CREATE POLICY "artists_public_read"
  ON artists
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "artists_admin_all"
  ON artists
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new policies for campaigns table
CREATE POLICY "campaigns_public_read"
  ON campaigns
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "campaigns_admin_all"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON artists TO authenticated;
GRANT ALL ON campaigns TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON artists TO anon;
GRANT SELECT ON campaigns TO anon;