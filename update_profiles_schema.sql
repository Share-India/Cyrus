-- Migration: Add organization_name and industry to profiles table
-- Created at: 2026-02-01

-- 1. Add new columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_name text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS draft_data jsonb;

-- 2. Update the handle_new_user trigger function to capture metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, organization_name, industry, name, username)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'industry',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'username'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to prevent RLS recursion and identify admins reliably
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- First check: JWT Metadata (fastest, no table hit)
  IF (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' THEN
    RETURN true;
  END IF;

  -- Second check: Profiles table (backup, security definer bypasses RLS)
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Profiles
-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  public.is_admin()
);

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = id
);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (
  auth.uid() = id
);

-- 5. Create Policies for Assessments
-- Admins can view all assessments
DROP POLICY IF EXISTS "Admins can view all assessments" ON public.assessments;
CREATE POLICY "Admins can view all assessments" 
ON public.assessments FOR SELECT 
USING (
  public.is_admin()
);

-- Users can view their own assessments
DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
CREATE POLICY "Users can view own assessments" 
ON public.assessments FOR SELECT 
USING (
  auth.uid() = user_id
);

-- Users can insert their own assessments
DROP POLICY IF EXISTS "Users can insert own assessments" ON public.assessments;
CREATE POLICY "Users can insert own assessments" 
ON public.assessments FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
);
