-- =====================================================
-- RLS FIX: Allow members from any branch to be
-- searched during check-in at any event.
-- Run this in your Supabase SQL Editor.
-- =====================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Public can search members for check-in" ON members;

-- Replace with a policy that allows any member to be
-- found as long as at least one active event exists anywhere.
-- This lets members attend events at any branch.
CREATE POLICY "Public can search members for check-in"
    ON members
    FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.is_active = true
        )
    );
