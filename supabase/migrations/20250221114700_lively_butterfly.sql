/*
  # Fix RLS policies for artists table

  1. Changes
    - Drop existing RLS policies for artists table
    - Create new policies using correct app_metadata role check
    - Keep public read access policy unchanged

  2. Security
    - Ensures proper admin role check using app_metadata
    - Maintains public read access
    - Restricts write operations to admin users only
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin write access to artists" ON artists;
DROP POLICY IF EXISTS "Allow admin update access to artists" ON artists;
DROP POLICY IF EXISTS "Allow admin delete access to artists" ON artists;

-- Create new policies with correct role check
CREATE POLICY "Allow admin write access to artists"
  ON artists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Allow admin update access to artists"
  ON artists
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Allow admin delete access to artists"
  ON artists
  FOR DELETE
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');