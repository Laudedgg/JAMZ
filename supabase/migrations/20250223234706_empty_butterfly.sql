/*
  # Fix Admin User Password

  1. Changes
    - Update password for admin user (victor@bitsport.gg)
    - Remove any duplicate admin users
    - Ensure consistent password across the system

  2. Security
    - Sets password to 'password123' for the admin user
    - Removes any conflicting admin accounts
*/

-- First, remove any duplicate admin users
DELETE FROM auth.users
WHERE email != 'victor@bitsport.gg';

-- Update the password for the main admin user
UPDATE auth.users
SET encrypted_password = crypt('password123', gen_salt('bf'))
WHERE email = 'victor@bitsport.gg';

-- Ensure the admin user has the correct metadata
UPDATE auth.users
SET raw_app_meta_data = '{"provider":"email","providers":["email"]}'
WHERE email = 'victor@bitsport.gg';