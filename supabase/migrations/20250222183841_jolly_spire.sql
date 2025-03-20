-- Drop all existing policies
DROP POLICY IF EXISTS "allow_users_read_own" ON customers;
DROP POLICY IF EXISTS "allow_users_update_own" ON customers;
DROP POLICY IF EXISTS "allow_users_insert_own" ON customers;
DROP POLICY IF EXISTS "allow_admin_read_all" ON customers;
DROP POLICY IF EXISTS "allow_admin_insert" ON customers;
DROP POLICY IF EXISTS "allow_admin_update" ON customers;
DROP POLICY IF EXISTS "allow_admin_delete" ON customers;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM customers
    WHERE customers.user_id = user_id
    AND customers.subscription_tier = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Basic user policies with admin override
CREATE POLICY "customers_select_policy"
ON customers
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  is_admin(auth.uid())
);

CREATE POLICY "customers_insert_policy"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  is_admin(auth.uid())
);

CREATE POLICY "customers_update_policy"
ON customers
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR 
  is_admin(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id OR 
  is_admin(auth.uid())
);

CREATE POLICY "customers_delete_policy"
ON customers
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR 
  is_admin(auth.uid())
);