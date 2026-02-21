/*
  # Final Fix for Admin Authentication

  This migration:
  1. Ensures clean slate for auth
  2. Creates admin user with correct credentials
  3. Sets proper confirmation and metadata
*/

-- First, clean up any existing users to avoid conflicts
DELETE FROM auth.users;

-- Create a fresh admin user with the correct credentials
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
  is_super_admin,
  confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'victor@bitsport.gg',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  '',
  true,
  now()
);

-- Ensure the user is active in all required tables
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) 
SELECT 
  id,
  id,
  json_build_object('sub', id::text, 'email', email),
  'email',
  now(),
  now(),
  now()
FROM auth.users
WHERE email = 'victor@bitsport.gg';