
-- Allow all authenticated users to read basic profile info (needed for marketplace to show farmer names)
CREATE POLICY "Authenticated users can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Drop the narrower policy since the new one covers it
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
