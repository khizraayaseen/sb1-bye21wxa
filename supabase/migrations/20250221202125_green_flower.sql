-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own customer data" ON customers;
DROP POLICY IF EXISTS "Admin full access to customers" ON customers;
DROP POLICY IF EXISTS "Users can update own customer data" ON customers;
DROP POLICY IF EXISTS "Allow customer creation" ON customers;
DROP POLICY IF EXISTS "Admin can manage all customer data" ON customers;

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

-- Admin policies with fixed recursion
CREATE POLICY "Admin full access to customers"
ON customers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM customers c
    WHERE c.user_id = auth.uid()
      AND c.subscription_tier = 'admin'
      AND c.id != customers.id  -- Prevent recursion
  )
);