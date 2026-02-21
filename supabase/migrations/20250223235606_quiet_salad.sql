/*
  # Final Admin Authentication Fix
  
  This migration:
  1. Ensures proper user setup in all auth tables
  2. Sets correct permissions and roles
  3. Creates necessary identity records
*/

-- First ensure we have a clean slate
DELETE FROM auth.users;

-- Create the admin user with all required fields
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
  '00000000-0000-0000-0000-000000000001', -- Using a fixed UUID for consistency
  'authenticated',
  'authenticated',
  'victor@bitsport.gg',
  crypt('password123', gen_salt('bf')),
  now(),
  jsonb_build_object(
    'provider', 'email',
    'providers', array['email'],
    'role', 'admin'
  ),
  jsonb_build_object(
    'name', 'Admin User'
  ),
  now(),
  now(),
  '',
  '',
  '',
  '',
  true,
  now()
);

-- Ensure identity record exists
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'sub', '00000000-0000-0000-0000-000000000001',
    'email', 'victor@bitsport.gg',
    'email_verified', true
  ),
  'email',
  now(),
  now(),
  now()
);

-- Ensure user has proper role
INSERT INTO auth.roles (
  role
) VALUES (
  'admin'
) ON CONFLICT DO NOTHING;

-- Grant admin role to user
INSERT INTO auth.users_roles (
  user_id,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin'
) ON CONFLICT DO NOTHING;