-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own customer data" ON customers;
DROP POLICY IF EXISTS "Users can update own customer data" ON customers;
DROP POLICY IF EXISTS "Allow customer creation" ON customers;
DROP POLICY IF EXISTS "Admin full access to customers" ON customers;
DROP POLICY IF EXISTS "Admin can manage all customer data" ON customers;
DROP POLICY IF EXISTS "users_read_own_data" ON customers;
DROP POLICY IF EXISTS "users_update_own_data" ON customers;
DROP POLICY IF EXISTS "allow_customer_creation" ON customers;
DROP POLICY IF EXISTS "admin_read_all" ON customers;
DROP POLICY IF EXISTS "admin_insert" ON customers;
DROP POLICY IF EXISTS "admin_update" ON customers;
DROP POLICY IF EXISTS "admin_delete" ON customers;

-- Create new simplified policies
-- 1. Basic user policies
CREATE POLICY "allow_users_read_own"
ON customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "allow_users_update_own"
ON customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_users_insert_own"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Admin policies (using a subquery to prevent recursion)
CREATE POLICY "allow_admin_read_all"
ON customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT c.user_id 
      FROM customers c 
      WHERE c.subscription_tier = 'admin'
    )
  )
);

CREATE POLICY "allow_admin_insert"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT c.user_id 
      FROM customers c 
      WHERE c.subscription_tier = 'admin'
    )
  )
);

CREATE POLICY "allow_admin_update"
ON customers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT c.user_id 
      FROM customers c 
      WHERE c.subscription_tier = 'admin'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT c.user_id 
      FROM customers c 
      WHERE c.subscription_tier = 'admin'
    )
  )
);

CREATE POLICY "allow_admin_delete"
ON customers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT c.user_id 
      FROM customers c 
      WHERE c.subscription_tier = 'admin'
    )
  )
);