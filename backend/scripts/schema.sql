-- DVS Database Schema
-- Daily Good Timings Application

-- Try to drop existing tables if they exist (in reverse order due to foreign keys)
-- Note: These may fail if user doesn't have DROP permissions, which is fine
DO $$ 
BEGIN
    DROP TABLE IF EXISTS daylight CASCADE;
EXCEPTION WHEN insufficient_privilege THEN
    -- Ignore permission errors
END $$;

DO $$ 
BEGIN
    DROP TABLE IF EXISTS time_slot_child CASCADE;
EXCEPTION WHEN insufficient_privilege THEN
    -- Ignore permission errors
END $$;

DO $$ 
BEGIN
    DROP TABLE IF EXISTS good_timings CASCADE;
EXCEPTION WHEN insufficient_privilege THEN
    -- Ignore permission errors
END $$;

DO $$ 
BEGIN
    DROP TABLE IF EXISTS categories CASCADE;
EXCEPTION WHEN insufficient_privilege THEN
    -- Ignore permission errors
END $$;

DO $$ 
BEGIN
    DROP TABLE IF EXISTS users CASCADE;
EXCEPTION WHEN insufficient_privilege THEN
    -- Ignore permission errors
END $$;

-- Try to drop existing functions and types
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
EXCEPTION WHEN insufficient_privilege THEN
    -- Ignore permission errors
END $$;

DO $$ 
BEGIN
    DROP TYPE IF EXISTS user_role CASCADE;
EXCEPTION WHEN insufficient_privilege THEN
    -- Ignore permission errors
END $$;

-- Create custom types (only if they don't exist)
DO $$ 
BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN
    -- Type already exists, ignore
    NULL;
END $$;

-- Create users table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    name VARCHAR(255),
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color_token VARCHAR(20) NOT NULL CHECK (color_token IN ('blue', 'green', 'teal', 'amber', 'red')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create good_timings (time slots) table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS good_timings (
    id SERIAL PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (start_date <= end_date)
);

-- Create time_slot_child table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS time_slot_child (
    id SERIAL PRIMARY KEY,
    time_slot_id INTEGER REFERENCES good_timings(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (start_time < end_time)
);

-- Create daylight table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS daylight (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    sunrise_time TIME NOT NULL,
    sunset_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    notes TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (sunrise_time < sunset_time)
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_good_timings_day ON good_timings(day);
CREATE INDEX IF NOT EXISTS idx_good_timings_dates ON good_timings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_time_slot_child_slot_id ON time_slot_child(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_time_slot_child_category ON time_slot_child(category_id);
CREATE INDEX IF NOT EXISTS idx_daylight_date ON daylight(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_good_timings_updated_at 
    BEFORE UPDATE ON good_timings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daylight_updated_at 
    BEFORE UPDATE ON daylight 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories (only if they don't exist)
INSERT INTO categories (name, color_token) VALUES
('Work', 'blue'),
('Personal', 'green'),
('Health', 'teal'),
('Learning', 'amber'),
('Emergency', 'red')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (password: admin123) - only if doesn't exist
INSERT INTO users (email, password_hash, role, name) VALUES
('admin@dvs.com', '$2a$10$rQ.ZbFczTpUkxnTfWEU99etNaAr61IWvDJjj8adjnyRnLoOngbCTO', 'admin', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- Insert default regular user (password: user123) - only if doesn't exist
INSERT INTO users (email, password_hash, role, name) VALUES
('user@dvs.com', '$2a$10$USBEgS/JyDinEHcQwvYyG.qKW0Y6O0bB38h4sNYA6ENxmWudWOsIK', 'user', 'Regular User')
ON CONFLICT (email) DO NOTHING;

-- Insert sample daylight data for the next 30 days (only if dates don't exist)
INSERT INTO daylight (date, sunrise_time, sunset_time, timezone) VALUES
(CURRENT_DATE, '06:30:00', '18:30:00', 'UTC'),
(CURRENT_DATE + INTERVAL '1 day', '06:29:00', '18:31:00', 'UTC'),
(CURRENT_DATE + INTERVAL '2 days', '06:28:00', '18:32:00', 'UTC'),
(CURRENT_DATE + INTERVAL '3 days', '06:27:00', '18:33:00', 'UTC'),
(CURRENT_DATE + INTERVAL '4 days', '06:26:00', '18:34:00', 'UTC'),
(CURRENT_DATE + INTERVAL '5 days', '06:25:00', '18:35:00', 'UTC'),
(CURRENT_DATE + INTERVAL '6 days', '06:24:00', '18:36:00', 'UTC'),
(CURRENT_DATE + INTERVAL '7 days', '06:23:00', '18:37:00', 'UTC'),
(CURRENT_DATE + INTERVAL '8 days', '06:22:00', '18:38:00', 'UTC'),
(CURRENT_DATE + INTERVAL '9 days', '06:21:00', '18:39:00', 'UTC'),
(CURRENT_DATE + INTERVAL '10 days', '06:20:00', '18:40:00', 'UTC'),
(CURRENT_DATE + INTERVAL '11 days', '06:19:00', '18:41:00', 'UTC'),
(CURRENT_DATE + INTERVAL '12 days', '06:18:00', '18:42:00', 'UTC'),
(CURRENT_DATE + INTERVAL '13 days', '06:17:00', '18:43:00', 'UTC'),
(CURRENT_DATE + INTERVAL '14 days', '06:16:00', '18:44:00', 'UTC'),
(CURRENT_DATE + INTERVAL '15 days', '06:15:00', '18:45:00', 'UTC'),
(CURRENT_DATE + INTERVAL '16 days', '06:14:00', '18:46:00', 'UTC'),
(CURRENT_DATE + INTERVAL '17 days', '06:13:00', '18:47:00', 'UTC'),
(CURRENT_DATE + INTERVAL '18 days', '06:12:00', '18:48:00', 'UTC'),
(CURRENT_DATE + INTERVAL '19 days', '06:11:00', '18:49:00', 'UTC'),
(CURRENT_DATE + INTERVAL '20 days', '06:10:00', '18:50:00', 'UTC'),
(CURRENT_DATE + INTERVAL '21 days', '06:09:00', '18:51:00', 'UTC'),
(CURRENT_DATE + INTERVAL '22 days', '06:08:00', '18:52:00', 'UTC'),
(CURRENT_DATE + INTERVAL '23 days', '06:07:00', '18:53:00', 'UTC'),
(CURRENT_DATE + INTERVAL '24 days', '06:06:00', '18:54:00', 'UTC'),
(CURRENT_DATE + INTERVAL '25 days', '06:05:00', '18:55:00', 'UTC'),
(CURRENT_DATE + INTERVAL '26 days', '06:04:00', '18:56:00', 'UTC'),
(CURRENT_DATE + INTERVAL '27 days', '06:03:00', '18:57:00', 'UTC'),
(CURRENT_DATE + INTERVAL '28 days', '06:02:00', '18:58:00', 'UTC'),
(CURRENT_DATE + INTERVAL '29 days', '06:01:00', '18:59:00', 'UTC')
ON CONFLICT (date) DO NOTHING;

-- Insert sample good timings for today (only if they don't exist)
INSERT INTO good_timings (day, created_by, start_date, end_date) VALUES
('Monday', 1, CURRENT_DATE, CURRENT_DATE),
('Tuesday', 1, CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day'),
('Wednesday', 1, CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days'),
('Thursday', 1, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '3 days'),
('Friday', 1, CURRENT_DATE + INTERVAL '4 days', CURRENT_DATE + INTERVAL '4 days'),
('Saturday', 1, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days'),
('Sunday', 1, CURRENT_DATE + INTERVAL '6 days', CURRENT_DATE + INTERVAL '6 days')
ON CONFLICT DO NOTHING;

-- Insert sample time slots (only if they don't exist)
INSERT INTO time_slot_child (time_slot_id, start_time, end_time, category_id, description) VALUES
(1, '09:00:00', '10:00:00', 1, 'Morning standup meeting'),
(1, '14:00:00', '15:00:00', 1, 'Project planning session'),
(1, '16:00:00', '17:00:00', 2, 'Personal time'),
(2, '10:00:00', '11:00:00', 3, 'Gym workout'),
(2, '15:00:00', '16:00:00', 4, 'Learning new technology'),
(3, '09:30:00', '10:30:00', 1, 'Client meeting'),
(3, '13:00:00', '14:00:00', 2, 'Lunch break'),
(4, '08:00:00', '09:00:00', 3, 'Morning workout'),
(4, '11:00:00', '12:00:00', 1, 'Team collaboration'),
(5, '10:30:00', '11:30:00', 1, 'Project review'),
(5, '14:30:00', '15:30:00', 2, 'Break time'),
(6, '09:00:00', '10:00:00', 4, 'Learning session'),
(6, '15:00:00', '16:00:00', 1, 'Client call'),
(7, '10:00:00', '11:00:00', 2, 'Family time'),
(7, '16:00:00', '17:00:00', 4, 'Personal development')
ON CONFLICT DO NOTHING;

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    category_id INTEGER REFERENCES categories(id),
    is_all_day BOOLEAN DEFAULT FALSE,
    color VARCHAR(20) DEFAULT 'blue',
    created_by INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE TRIGGER update_newsletter_subscribers_updated_at
    BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_category_id ON calendar_events(category_id);

COMMIT;
