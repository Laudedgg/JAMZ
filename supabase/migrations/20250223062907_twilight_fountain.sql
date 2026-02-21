-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin write access to artists" ON artists;
DROP POLICY IF EXISTS "Allow admin write access to campaigns" ON campaigns;

-- Create new policy for admin write access to artists
CREATE POLICY "Allow admin write access to artists"
  ON artists
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'victor@bitsport.gg')
  WITH CHECK (auth.jwt() ->> 'email' = 'victor@bitsport.gg');

-- Create new policy for admin write access to campaigns
CREATE POLICY "Allow admin write access to campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'victor@bitsport.gg')
  WITH CHECK (auth.jwt() ->> 'email' = 'victor@bitsport.gg');