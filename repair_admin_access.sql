-- ==========================================
-- ADMIN REPAIR SCRIPT
-- ==========================================
-- Run this script in the Supabase SQL Editor to ensure your 
-- admin account has full visibility.

-- 1. Replace 'your-email@example.com' with your actual admin email
DO $$
DECLARE
    admin_id uuid;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'your-email@example.com';
    
    IF admin_id IS NOT NULL THEN
        -- Update Auth Metadata
        UPDATE auth.users 
        SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
        WHERE id = admin_id;

        -- Ensure Profile exists and has admin role
        INSERT INTO public.profiles (id, email, role)
        VALUES (admin_id, 'your-email@example.com', 'admin')
        ON CONFLICT (id) DO UPDATE SET role = 'admin';
        
        RAISE NOTICE 'User % updated to admin.', admin_id;
    ELSE
        RAISE NOTICE 'User not found. Please check the email.';
    END IF;
END $$;

-- 2. Update is_admin function to be robust (JWT + Profile check)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check JWT Metadata first (fastest)
  IF (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' THEN
    RETURN true;
  END IF;

  -- Fallback to Profiles table
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Reset RLS policies to use the new is_admin
DROP POLICY IF EXISTS "Admins can view all assessments" ON public.assessments;
CREATE POLICY "Admins can view all assessments" ON public.assessments 
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles 
  FOR SELECT USING (public.is_admin());
