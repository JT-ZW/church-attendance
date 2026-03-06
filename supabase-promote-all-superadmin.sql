-- =====================================================
-- Promote ALL existing auth users to super_admin
-- Run this in your Supabase SQL Editor.
-- =====================================================

INSERT INTO admin_profiles (user_id, role, is_active)
SELECT id, 'super_admin', true
FROM auth.users
ON CONFLICT (user_id)
DO UPDATE SET role = 'super_admin', is_active = true;

-- Verify
SELECT
  ap.role,
  ap.is_active,
  au.email
FROM admin_profiles ap
JOIN auth.users au ON au.id = ap.user_id
ORDER BY au.created_at;
