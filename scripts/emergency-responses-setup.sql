-- ============================================================
-- Emergency Responses Table Setup
-- Run this SQL in the Supabase SQL Editor
-- ============================================================

-- Table: stores every AR-app user's response during an emergency
CREATE TABLE IF NOT EXISTS public.emergency_responses (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id         UUID NOT NULL,
  user_email           TEXT NOT NULL,
  user_name            TEXT NOT NULL,
  acknowledged         BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at      TIMESTAMPTZ,
  ability_status       TEXT CHECK (ability_status IN (
                         'physically_abled','pregnant','children','not_able_to_walk'
                       )),
  choice               TEXT CHECK (choice IN ('exit','save_someone') OR choice IS NULL),
  rescue_target_name   TEXT,
  rescue_target_status TEXT,
  navigation_status    TEXT NOT NULL DEFAULT 'pending' CHECK (navigation_status IN (
                         'pending','navigating_to_exit','navigating_to_rescue',
                         'waiting_for_help','reached_exit','reached_person','rescued'
                       )),
  pos_x                DOUBLE PRECISION DEFAULT 0,
  pos_y                DOUBLE PRECISION DEFAULT 0,
  pos_z                DOUBLE PRECISION DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_emergency_responses_emergency_id
  ON public.emergency_responses (emergency_id);
CREATE INDEX IF NOT EXISTS idx_emergency_responses_navigation_status
  ON public.emergency_responses (navigation_status);
CREATE INDEX IF NOT EXISTS idx_emergency_responses_choice
  ON public.emergency_responses (choice);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_emergency_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emergency_responses_updated_at ON public.emergency_responses;
CREATE TRIGGER emergency_responses_updated_at
  BEFORE UPDATE ON public.emergency_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_responses_updated_at();

-- Row Level Security
ALTER TABLE public.emergency_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read emergency responses"
  ON public.emergency_responses FOR SELECT USING (true);

CREATE POLICY "Allow insert emergency responses"
  ON public.emergency_responses FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update emergency responses"
  ON public.emergency_responses FOR UPDATE USING (true);

CREATE POLICY "Allow delete emergency responses"
  ON public.emergency_responses FOR DELETE USING (true);

-- ============================================================
-- Seed data: dummy responses for dashboard testing
-- Uses the fixed EMERGENCY_ROW_ID from the codebase
-- ============================================================

INSERT INTO public.emergency_responses
  (emergency_id, user_email, user_name, acknowledged, acknowledged_at,
   ability_status, choice, rescue_target_name, rescue_target_status,
   navigation_status, pos_x, pos_y, pos_z)
VALUES
  -- Physically abled people
  ('00000000-0000-0000-0000-000000000001', 'rahul.kumar@pinnacle.com',   'Rahul Kumar',
   true, now() - interval '4 minutes',
   'physically_abled', 'exit', NULL, NULL,
   'navigating_to_exit', 38.5, 213, -62.3),

  ('00000000-0000-0000-0000-000000000001', 'anita.desai@pinnacle.com',   'Anita Desai',
   true, now() - interval '3 minutes',
   'physically_abled', 'exit', NULL, NULL,
   'reached_exit', 42.1, 213, -55.8),

  ('00000000-0000-0000-0000-000000000001', 'vikram.singh@pinnacle.com',  'Vikram Singh',
   true, now() - interval '3 minutes 30 seconds',
   'physically_abled', 'save_someone', 'Priya Sharma', 'pregnant',
   'navigating_to_rescue', 35.2, 213, -70.4),

  ('00000000-0000-0000-0000-000000000001', 'deepa.nair@pinnacle.com',    'Deepa Nair',
   true, now() - interval '2 minutes',
   'physically_abled', 'save_someone', 'Arjun Mehta', 'not_able_to_walk',
   'reached_person', 28.9, 213, -67.1),

  ('00000000-0000-0000-0000-000000000001', 'amit.patel@pinnacle.com',    'Amit Patel',
   true, now() - interval '2 minutes 30 seconds',
   'physically_abled', 'exit', NULL, NULL,
   'navigating_to_exit', 46.3, 213, -58.9),

  -- Non-physically-abled people (waiting for help)
  ('00000000-0000-0000-0000-000000000001', 'priya.sharma@pinnacle.com',  'Priya Sharma',
   true, now() - interval '3 minutes 45 seconds',
   'pregnant', NULL, NULL, NULL,
   'waiting_for_help', 33.7, 213, -71.2),

  ('00000000-0000-0000-0000-000000000001', 'meera.joshi@pinnacle.com',   'Meera Joshi',
   true, now() - interval '2 minutes 15 seconds',
   'children', NULL, NULL, NULL,
   'waiting_for_help', 40.8, 213, -65.5),

  ('00000000-0000-0000-0000-000000000001', 'arjun.mehta@pinnacle.com',   'Arjun Mehta',
   true, now() - interval '4 minutes 10 seconds',
   'not_able_to_walk', NULL, NULL, NULL,
   'waiting_for_help', 29.4, 213, -68.3),

  -- Acknowledged but haven't chosen yet
  ('00000000-0000-0000-0000-000000000001', 'sanjay.gupta@pinnacle.com',  'Sanjay Gupta',
   true, now() - interval '1 minute',
   'physically_abled', NULL, NULL, NULL,
   'pending', 44.6, 213, -60.1),

  ('00000000-0000-0000-0000-000000000001', 'kavita.reddy@pinnacle.com',  'Kavita Reddy',
   true, now() - interval '30 seconds',
   NULL, NULL, NULL, NULL,
   'pending', 37.2, 213, -74.8);
