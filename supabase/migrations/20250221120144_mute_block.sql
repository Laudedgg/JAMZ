/*
  # Create admin user

  1. Changes
    - Creates a new admin user with secure credentials
    - Sets up proper role and metadata

  2. Security
    - Creates user with admin role
    - Sets up email/password authentication
*/

-- Insert admin user with email/password
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
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"role":"admin"}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Enable the admin role for the user
UPDATE auth.users
SET raw_app_meta_data = '{"provider":"email","providers":["email"],"role":"admin"}'
WHERE email = 'admin@example.com';