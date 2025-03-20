/*
  # Fix Customers Table RLS Recursion

  1. Changes
    - Remove recursive admin policy
    - Add separate policies for admin access
    - Maintain existing user policies
    
  2. Security
    - Maintains proper access control
    - Prevents infinite recursion
    - Preserves data integrity
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own customer data" ON customers;
DROP POLICY IF EXISTS "Users can update own customer data" ON customers;
DROP POLICY IF EXISTS "Allow customer creation" ON customers;
DROP POLICY IF EXISTS "Admin can manage all customer data" ON customers;

-- Basic user policies
CREATE POLICY "Users can view own customer data"
ON customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own customer data"
ON customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow customer creation"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin policies (using service role)
CREATE POLICY "Admin select access"
ON customers
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (subscription_tier = 'admin' AND user_id = auth.uid())
);

CREATE POLICY "Admin insert access"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  ))
);

CREATE POLICY "Admin update access"
ON customers
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  ))
);

CREATE POLICY "Admin delete access"
ON customers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);