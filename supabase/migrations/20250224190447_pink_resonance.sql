-- Update policies to allow admin@jamz.fun to access everything
DROP POLICY IF EXISTS "Allow admin write access to artists" ON artists;
DROP POLICY IF EXISTS "Allow admin write access to campaigns" ON campaigns;

-- Create new policies for artists table
CREATE POLICY "artists_admin_access"
  ON artists
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@jamz.fun')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@jamz.fun');

-- Create new policies for campaigns table
CREATE POLICY "campaigns_admin_access"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@jamz.fun')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@jamz.fun');

-- Ensure admin user exists with correct credentials
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@jamz.fun',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  '',
  now()
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('admin123', gen_salt('bf')),
  email_confirmed_at = now(),
  confirmed_at = now();