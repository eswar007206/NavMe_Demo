-- ============================================================
-- Dashboard Authentication Setup
-- Run this SQL in the Supabase SQL Editor
-- ============================================================

-- 1. Enable pgcrypto for bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create table
CREATE TABLE IF NOT EXISTS public.dashboard_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_admins_email ON public.dashboard_admins (email);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_dashboard_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dashboard_admins_updated_at ON public.dashboard_admins;
CREATE TRIGGER dashboard_admins_updated_at
  BEFORE UPDATE ON public.dashboard_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_admins_updated_at();

-- 3. Safe view (no password_hash)
CREATE OR REPLACE VIEW public.dashboard_admins_safe AS
SELECT id, email, display_name, role, avatar_url, created_at, updated_at
FROM public.dashboard_admins;

-- 4. RPC: verify login
CREATE OR REPLACE FUNCTION public.verify_admin_login(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT id, email, password_hash, display_name, role, avatar_url, created_at, updated_at
  INTO v_admin
  FROM public.dashboard_admins
  WHERE email = LOWER(TRIM(p_email));

  IF v_admin IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT (v_admin.password_hash = crypt(p_password, v_admin.password_hash)) THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id', v_admin.id,
    'email', v_admin.email,
    'display_name', v_admin.display_name,
    'role', v_admin.role,
    'avatar_url', v_admin.avatar_url,
    'created_at', v_admin.created_at,
    'updated_at', v_admin.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: create admin (super_admin only)
CREATE OR REPLACE FUNCTION public.create_admin_account(
  p_caller_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_display_name TEXT,
  p_role TEXT DEFAULT 'admin'
)
RETURNS JSON AS $$
DECLARE
  v_caller RECORD;
  v_new_admin RECORD;
BEGIN
  SELECT id, role INTO v_caller
  FROM public.dashboard_admins
  WHERE id = p_caller_id;

  IF v_caller IS NULL OR v_caller.role != 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: only super_admin can create accounts';
  END IF;

  IF p_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: must be super_admin or admin';
  END IF;

  INSERT INTO public.dashboard_admins (email, password_hash, display_name, role)
  VALUES (LOWER(TRIM(p_email)), crypt(p_password, gen_salt('bf', 10)), TRIM(p_display_name), p_role)
  RETURNING id, email, display_name, role, avatar_url, created_at, updated_at
  INTO v_new_admin;

  RETURN json_build_object(
    'id', v_new_admin.id,
    'email', v_new_admin.email,
    'display_name', v_new_admin.display_name,
    'role', v_new_admin.role,
    'avatar_url', v_new_admin.avatar_url,
    'created_at', v_new_admin.created_at,
    'updated_at', v_new_admin.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: update profile
CREATE OR REPLACE FUNCTION public.update_admin_profile(
  p_admin_id UUID,
  p_display_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_admin RECORD;
BEGIN
  UPDATE public.dashboard_admins
  SET
    display_name = COALESCE(NULLIF(TRIM(p_display_name), ''), display_name),
    avatar_url = COALESCE(p_avatar_url, avatar_url)
  WHERE id = p_admin_id
  RETURNING id, email, display_name, role, avatar_url, created_at, updated_at
  INTO v_admin;

  IF v_admin IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id', v_admin.id,
    'email', v_admin.email,
    'display_name', v_admin.display_name,
    'role', v_admin.role,
    'avatar_url', v_admin.avatar_url,
    'created_at', v_admin.created_at,
    'updated_at', v_admin.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: delete admin (super_admin only, cannot self-delete)
CREATE OR REPLACE FUNCTION public.delete_admin_account(
  p_caller_id UUID,
  p_target_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_caller RECORD;
BEGIN
  IF p_caller_id = p_target_id THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  SELECT id, role INTO v_caller
  FROM public.dashboard_admins
  WHERE id = p_caller_id;

  IF v_caller IS NULL OR v_caller.role != 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: only super_admin can delete accounts';
  END IF;

  DELETE FROM public.dashboard_admins WHERE id = p_target_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS
ALTER TABLE public.dashboard_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read of admin list"
  ON public.dashboard_admins FOR SELECT USING (true);

CREATE POLICY "Block direct inserts"
  ON public.dashboard_admins FOR INSERT WITH CHECK (false);

CREATE POLICY "Block direct updates"
  ON public.dashboard_admins FOR UPDATE USING (false);

CREATE POLICY "Block direct deletes"
  ON public.dashboard_admins FOR DELETE USING (false);

-- 9. Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-avatars',
  'admin-avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read admin avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'admin-avatars');

CREATE POLICY "Allow avatar uploads"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'admin-avatars');

CREATE POLICY "Allow avatar updates"
  ON storage.objects FOR UPDATE USING (bucket_id = 'admin-avatars');

CREATE POLICY "Allow avatar deletes"
  ON storage.objects FOR DELETE USING (bucket_id = 'admin-avatars');

-- 10. Seed super admin
INSERT INTO public.dashboard_admins (email, password_hash, display_name, role)
VALUES (
  'admin@pinnacle.com',
  crypt('PinnacleAdmin2024!', gen_salt('bf', 10)),
  'Super Admin',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;
