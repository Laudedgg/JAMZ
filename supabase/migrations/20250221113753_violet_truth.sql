/*
  # Add RLS policies for artists table

  1. Security
    - Add RLS policies for artists table to allow admin access
    - Enable public read access for artists table
*/

-- Create policy for public read access to artists
CREATE POLICY "Allow public read access to artists"
  ON artists
  FOR SELECT
  TO public
  USING (true);

-- Create policy for admin write access to artists
CREATE POLICY "Allow admin write access to artists"
  ON artists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin update access to artists"
  ON artists
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin delete access to artists"
  ON artists
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');