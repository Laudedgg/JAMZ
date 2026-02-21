/*
  # Update RLS policies for admin access

  1. Changes
    - Update RLS policies to allow admin@jamz.fun access
    - Drop existing policies to avoid conflicts
    - Create new policies for both artists and campaigns tables

  2. Security
    - Maintain public read access
    - Grant full access to admin@jamz.fun
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to artists" ON artists;
DROP POLICY IF EXISTS "Allow admin write access to artists" ON artists;
DROP POLICY IF EXISTS "Allow public read access to campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow admin write access to campaigns" ON campaigns;

-- Create new policies for artists table
CREATE POLICY "Allow public read access to artists"
  ON artists
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access to artists"
  ON artists
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@jamz.fun')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@jamz.fun');

-- Create new policies for campaigns table
CREATE POLICY "Allow public read access to campaigns"
  ON campaigns
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access to campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@jamz.fun')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@jamz.fun');