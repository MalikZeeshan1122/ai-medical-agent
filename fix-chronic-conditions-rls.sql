-- Enable RLS on chronic_conditions if not already enabled
ALTER TABLE IF EXISTS chronic_conditions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own chronic_conditions" ON chronic_conditions;
DROP POLICY IF EXISTS "Users can insert own chronic_conditions" ON chronic_conditions;
DROP POLICY IF EXISTS "Users can update own chronic_conditions" ON chronic_conditions;
DROP POLICY IF EXISTS "Users can delete own chronic_conditions" ON chronic_conditions;

-- Create new policies
CREATE POLICY "Users can view own chronic_conditions" ON chronic_conditions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chronic_conditions" ON chronic_conditions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chronic_conditions" ON chronic_conditions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chronic_conditions" ON chronic_conditions FOR DELETE USING (auth.uid() = user_id);
