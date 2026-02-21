/*
  # Create Admin User

  1. Changes
    - Insert an admin user with email and password
    - Grant admin role to the user
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
  'admin@jamz.fun',
  crypt('admin123', gen_salt('bf')),
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
WHERE email = 'admin@jamz.fun';