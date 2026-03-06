-- =====================================================
-- FAMILY REGISTRATION MIGRATION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Add family_role enum type
CREATE TYPE family_role AS ENUM ('head', 'spouse', 'child', 'other');

-- 2. Add family columns to the members table
ALTER TABLE members
  ADD COLUMN family_id UUID,
  ADD COLUMN family_role family_role,
  ADD COLUMN registered_by_member_id UUID REFERENCES members(id) ON DELETE SET NULL;

-- 3. Make phone_number nullable
--    (dependents such as children may not have their own phone number)
ALTER TABLE members ALTER COLUMN phone_number DROP NOT NULL;

-- 4. Drop the old blanket UNIQUE constraint on phone_number
--    (the constraint name in Supabase is typically members_phone_number_key)
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_phone_number_key;

-- 5. Replace with a partial unique index that only enforces uniqueness
--    when phone_number is NOT NULL
CREATE UNIQUE INDEX idx_members_phone_unique
  ON members(phone_number)
  WHERE phone_number IS NOT NULL;

-- 6. Indexes for family lookups
CREATE INDEX idx_members_family_id        ON members(family_id);
CREATE INDEX idx_members_registered_by    ON members(registered_by_member_id);

-- =====================================================
-- NOTES
-- =====================================================
-- * family_id is a shared UUID generated at registration time.
--   All members of the same family share the same value.
-- * family_role identifies the member's role within the family unit.
-- * registered_by_member_id points to the family head who registered
--   the dependent on their behalf.
-- * Existing members are unaffected; family_id / family_role default to NULL
--   meaning they are treated as individual (non-family) registrations.
