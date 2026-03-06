-- =====================================================
-- RLS FIX: admin_profiles infinite recursion
-- Run this in your Supabase SQL Editor.
-- =====================================================

-- 1. Drop the recursive policies
DROP POLICY IF EXISTS "Users can read own profile" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can manage profiles" ON admin_profiles;

-- 2. Create a SECURITY DEFINER helper function.
--    SECURITY DEFINER means it runs as the function owner (postgres),
--    bypassing RLS on admin_profiles entirely — breaking the recursion loop.
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  );
$$;

-- 3. Recreate policies using the function instead of inline subqueries

-- Any authenticated user can read their OWN profile
CREATE POLICY "Users can read own profile"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can read ALL profiles
CREATE POLICY "Super admins can read all profiles"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Super admins can insert / update / delete profiles
CREATE POLICY "Super admins can manage profiles"
  ON admin_profiles FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- 4. Sanity check
SELECT
  ap.id,
  ap.role,
  ap.is_active,
  au.email,
  b.name AS branch_name
FROM admin_profiles ap
JOIN auth.users au ON au.id = ap.user_id
LEFT JOIN branches b ON b.id = ap.branch_id;
