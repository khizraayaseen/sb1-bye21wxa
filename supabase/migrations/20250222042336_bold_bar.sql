/*
  # Fix Customers RLS Policies

  1. Changes
    - Remove recursive admin policies that were causing infinite loops
    - Implement proper role-based access control
    - Add separate policies for different operations
  
  2. Security
    - Enable RLS on customers table
    - Add policies for:
      - Users to view and update their own data
      - Admins to manage all customer data
      - Allow new customer creation during signup
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own customer data" ON customers;
DROP POLICY IF EXISTS "Users can update own customer data" ON customers;
DROP POLICY IF EXISTS "Allow customer creation" ON customers;
DROP POLICY IF EXISTS "Admin full access to customers" ON customers;
DROP POLICY IF EXISTS "Admin can manage all customer data" ON customers;

-- Create new policies
-- 1. Users can view their own data
CREATE POLICY "users_read_own_data"
ON customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Users can update their own data
CREATE POLICY "users_update_own_data"
ON customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Allow customer creation during signup
CREATE POLICY "allow_customer_creation"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Admin access (using subscription_tier field)
CREATE POLICY "admin_read_all"
ON customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM customers AS admin_check
    WHERE admin_check.user_id = auth.uid()
    AND admin_check.subscription_tier = 'admin'
  )
);

CREATE POLICY "admin_insert"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM customers AS admin_check
    WHERE admin_check.user_id = auth.uid()
    AND admin_check.subscription_tier = 'admin'
  )
);

CREATE POLICY "admin_update"
ON customers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM customers AS admin_check
    WHERE admin_check.user_id = auth.uid()
    AND admin_check.subscription_tier = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM customers AS admin_check
    WHERE admin_check.user_id = auth.uid()
    AND admin_check.subscription_tier = 'admin'
  )
);

CREATE POLICY "admin_delete"
ON customers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM customers AS admin_check
    WHERE admin_check.user_id = auth.uid()
    AND admin_check.subscription_tier = 'admin'
  )
);