-- Guest Attendance Extension
-- Run this AFTER supabase-schema.sql

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    gender gender NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guest_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_guest_event UNIQUE (guest_id, event_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_guests_full_name ON guests(full_name);
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_phone_unique_not_null ON guests(phone_number) WHERE phone_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guest_attendance_event ON guest_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_attendance_guest ON guest_attendance(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_attendance_checkin_date ON guest_attendance(checked_in_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_attendance ENABLE ROW LEVEL SECURITY;

-- Admins can manage guest profiles and guest attendance
CREATE POLICY "Admins can manage guests"
    ON guests
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins can manage guest attendance"
    ON guest_attendance
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE guest_attendance;