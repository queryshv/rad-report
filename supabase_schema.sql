-- Create the operator_schedule table
CREATE TABLE public.operator_schedule (
  date TEXT PRIMARY KEY, -- Storing date as MM-DD-YY string
  operator TEXT NOT NULL
);

-- After creating the table, ensure that your Row Level Security (RLS) policies in Supabase
-- allow the necessary operations (SELECT, INSERT, UPDATE) for the roles your application uses.
--
-- For example, if your application uses the anonymous key (anon role) to read and write
-- to this table (as it might for the admin upload feature if not using a service_role key
-- or authenticated user with specific permissions), you would need policies like:

-- 1. To allow all users (including anonymous) to read the schedule:
-- CREATE POLICY "Allow public read access to operator schedule"
-- ON public.operator_schedule
-- FOR SELECT
-- TO anon, authenticated
-- USING (true);

-- 2. To allow users (e.g., anon if admin uploads use anon key, or a specific admin role) to insert/update:
-- CREATE POLICY "Allow upsert for schedule management"
-- ON public.operator_schedule
-- FOR ALL -- or specific commands like INSERT, UPDATE
-- TO anon -- or your admin role e.g., 'service_role' or 'authenticated' if admins are logged in
-- USING (true)
-- WITH CHECK (true);

-- IMPORTANT: Review and tailor RLS policies according to your application's security requirements.
-- The example policies above are for guidance. For production, restrict permissions as much as possible.
-- If RLS is not enabled on the table, it will be publicly accessible, which might be acceptable
-- for this specific table if the data is not sensitive and needs to be read by the client app.
-- Check your Supabase project's RLS settings for the 'operator_schedule' table.
