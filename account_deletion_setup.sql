-- ==========================================
-- ACCOUNT DELETION FUNCTION
-- ==========================================
-- This function allows users to delete their own account
-- It must be run with elevated privileges (SECURITY DEFINER)
-- to access the auth.users table

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
  -- Delete the user from auth.users
  -- This will cascade to profiles and assessments due to ON DELETE CASCADE
  DELETE FROM auth.users
  WHERE id = auth.uid();
  
  -- The function will automatically delete:
  -- 1. The user's profile (profiles table has ON DELETE CASCADE)
  -- 2. All user's assessments (assessments table has ON DELETE CASCADE)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- Add a comment for documentation
COMMENT ON FUNCTION public.delete_user_account() IS 'Allows authenticated users to permanently delete their own account and all associated data';
