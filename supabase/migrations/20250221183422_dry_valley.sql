/*
  # Fix Customers Table RLS Policies

  1. Security Changes
    - Add policies for customers table to allow:
      - Authenticated users to read/update their own data
      - Admin role to manage all customer data
    - Add policy for creating new customer records
    
  2. Notes
    - These policies ensure proper access control while allowing customer creation
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own customer data" ON customers;
DROP POLICY IF EXISTS "Admin full access to customers" ON customers;

-- Policy for users to read their own data
CREATE POLICY "Users can view own customer data"
ON customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for users to update their own data
CREATE POLICY "Users can update own customer data"
ON customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow creating new customer records
CREATE POLICY "Allow customer creation"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admin can manage all customer data"
ON customers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE user_id = auth.uid()
    AND subscription_tier = 'admin'
  )
);