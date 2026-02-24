-- Church Attendance & Analytics Platform
-- Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE gender AS ENUM ('Male', 'Female');
CREATE TYPE registration_source AS ENUM ('admin', 'self_registration');

-- =====================================================
-- TABLES
-- =====================================================

-- Branches Table
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members Table
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    gender gender NOT NULL,
    date_of_birth DATE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    baptism_year INTEGER,
    home_address TEXT NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    registration_source registration_source DEFAULT 'admin',
    email VARCHAR(255) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', full_name || ' ' || COALESCE(phone_number, ''))
    ) STORED
);

-- Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_member_event UNIQUE (member_id, event_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Members indexes
CREATE INDEX idx_members_branch ON members(branch_id);
CREATE INDEX idx_members_phone ON members(phone_number);
CREATE INDEX idx_members_search ON members USING GIN(search_vector);
CREATE INDEX idx_members_full_name ON members(full_name);

-- Events indexes
CREATE INDEX idx_events_branch ON events(branch_id);
CREATE INDEX idx_events_qr_token ON events(qr_token);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_active ON events(is_active);

-- Attendance indexes
CREATE INDEX idx_attendance_event ON attendance(event_id);
CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_attendance_checkin_date ON attendance(checked_in_at);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(dob DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(dob));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get age group for analytics
CREATE OR REPLACE FUNCTION get_age_group(dob DATE)
RETURNS TEXT AS $$
DECLARE
    age INTEGER;
BEGIN
    age := calculate_age(dob);
    CASE
        WHEN age BETWEEN 0 AND 12 THEN RETURN '0-12';
        WHEN age BETWEEN 13 AND 18 THEN RETURN '13-18';
        WHEN age BETWEEN 19 AND 35 THEN RETURN '19-35';
        WHEN age BETWEEN 36 AND 60 THEN RETURN '36-60';
        ELSE RETURN '60+';
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- VIEWS
-- =====================================================

-- Attendance summary view for analytics
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    e.id as event_id,
    e.title as event_title,
    e.event_date,
    e.branch_id,
    COUNT(a.id) as total_attendees,
    COUNT(CASE WHEN m.gender = 'Male' THEN 1 END) as male_count,
    COUNT(CASE WHEN m.gender = 'Female' THEN 1 END) as female_count,
    ROUND(
        (COUNT(a.id)::NUMERIC / NULLIF(
            (SELECT COUNT(*) FROM members WHERE branch_id = e.branch_id), 0
        )) * 100, 
        2
    ) as attendance_percentage
FROM events e
LEFT JOIN attendance a ON a.event_id = e.id
LEFT JOIN members m ON a.member_id = m.id
GROUP BY e.id, e.title, e.event_date, e.branch_id;

-- Member attendance history view
CREATE OR REPLACE VIEW member_attendance_history AS
SELECT 
    m.id as member_id,
    m.full_name,
    m.branch_id,
    COUNT(a.id) as total_events_attended,
    MAX(a.checked_in_at) as last_attendance,
    ROUND(
        (COUNT(a.id)::NUMERIC / NULLIF(
            (SELECT COUNT(*) FROM events WHERE branch_id = m.branch_id AND is_active = FALSE), 0
        )) * 100,
        2
    ) as attendance_rate
FROM members m
LEFT JOIN attendance a ON a.member_id = m.id
GROUP BY m.id, m.full_name, m.branch_id;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Branches Policies
-- Admins can do everything
CREATE POLICY "Admins can manage branches"
    ON branches
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Public can view branches
CREATE POLICY "Public can view branches"
    ON branches
    FOR SELECT
    TO anon
    USING (true);

-- Members Policies
-- Admins can manage all members
CREATE POLICY "Admins can manage members"
    ON members
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Public can view limited member info for active event branches
CREATE POLICY "Public can search members for check-in"
    ON members
    FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.branch_id = members.branch_id 
            AND events.is_active = true
        )
    );

-- Public can insert new members (self-registration)
CREATE POLICY "Public can register as members"
    ON members
    FOR INSERT
    TO anon
    WITH CHECK (registration_source = 'self_registration');

-- Events Policies
-- Admins can manage events
CREATE POLICY "Admins can manage events"
    ON events
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Public can view active events
CREATE POLICY "Public can view active events"
    ON events
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Attendance Policies
-- Admins can view and manage attendance
CREATE POLICY "Admins can manage attendance"
    ON attendance
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Public can insert attendance for active events
CREATE POLICY "Public can check in to active events"
    ON attendance
    FOR INSERT
    TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = attendance.event_id 
            AND events.is_active = true
        )
    );

-- Public can view attendance (for confirmation)
CREATE POLICY "Public can view attendance"
    ON attendance
    FOR SELECT
    TO anon
    USING (true);

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Insert a default branch
INSERT INTO branches (name, location) VALUES
    ('Main Branch', 'City Center, Main Street 123');

-- Note: You'll need to create admin users through Supabase Auth dashboard
-- and then use their UUID for creating events

-- =====================================================
-- REALTIME (Enable for live updates)
-- =====================================================

-- Enable realtime on attendance for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- =====================================================
-- TRIGGERS (Optional - for updated_at timestamps)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at columns if needed in future
-- ALTER TABLE members ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
