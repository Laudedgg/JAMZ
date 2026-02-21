/*
  # Artists Table Migration
  
  This migration:
  1. Creates artists table if it doesn't exist
  2. Enables RLS
  3. Creates policies with existence checks
  4. Sets up updated_at trigger
*/

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
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
  USING (auth.jwt() ->> 'email' = 'victor@bitsport.gg')
  WITH CHECK (auth.jwt() ->> 'email' = 'victor@bitsport.gg');

-- Create function to update updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  END IF;
END $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_artists_updated_at ON artists;

-- Create trigger for updated_at
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();