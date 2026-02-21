/*
  # Fix artists table RLS policies

  1. Changes
    - Update RLS policies to use correct admin email
    - Maintain existing table structure
    - Keep public read access

  2. Security
    - Update admin access to use admin@jamz.fun
    - Maintain public read access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to artists" ON artists;
DROP POLICY IF EXISTS "Allow admin write access to artists" ON artists;

-- Create policy for public read access
CREATE POLICY "Allow public read access to artists"
  ON artists
  FOR SELECT
  TO public
  USING (true);

-- Create policy for admin write access
CREATE POLICY "Allow admin write access to artists"
  ON artists
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@jamz.fun')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@jamz.fun');