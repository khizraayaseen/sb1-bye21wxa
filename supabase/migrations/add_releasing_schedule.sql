-- Add columns if they don't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS release_time TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_top_product BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Create or replace functions (this automatically updates existing functions)
CREATE OR REPLACE FUNCTION auto_lock_pagination()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run this function for INSERT operations or when explicitly called
  -- This prevents the function from triggering itself when it updates products
  IF TG_OP = 'INSERT' OR TG_OP = 'CALL' THEN
    -- Lock products beyond page 2 (using 20 products per page)
    UPDATE products
    SET is_locked = TRUE
    WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS row_num
            FROM products
            WHERE is_top_product = FALSE -- Don't include top products in pagination count
            AND (release_time IS NULL OR release_time <= NOW()) -- Only count released products
        ) AS subquery
        WHERE row_num > 40  -- Using 20 products per page, so 2 pages = 40 products
    ) 
    AND is_locked = FALSE -- Avoid unnecessary updates
    AND is_top_product = FALSE -- Don't auto-lock top products
    AND (release_time IS NULL OR release_time <= NOW()); -- Only lock released products
    
    -- Ensure top 6 products are locked for free users
    UPDATE products
    SET is_locked = TRUE
    WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY priority DESC, created_at DESC) AS row_num
            FROM products
            WHERE is_top_product = TRUE
        ) AS subquery
        WHERE row_num <= 6  -- Top 6 products based on priority
    )
    AND is_locked = FALSE; -- Avoid unnecessary updates
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_unlock_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.release_time <= NOW() THEN
    NEW.is_locked = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION manage_top_products_queue()
RETURNS TRIGGER AS $$
DECLARE
  top_product_count INTEGER;
  next_release_date TIMESTAMPTZ;
BEGIN
  -- Count current top products
  SELECT COUNT(*) INTO top_product_count FROM products WHERE is_top_product = TRUE;
  
  -- If this is a new top product being added
  IF NEW.is_top_product = TRUE AND (OLD IS NULL OR OLD.is_top_product = FALSE) THEN
    -- If we already have 6 or more top products, set a release date for this one
    IF top_product_count >= 6 THEN
      -- Find the next available release slot (7 days after the last scheduled release)
      SELECT COALESCE(MAX(release_time) + INTERVAL '7 days', NOW() + INTERVAL '7 days')
      INTO next_release_date
      FROM products
      WHERE is_top_product = TRUE AND release_time > NOW();
      
      -- Set the release date for this product
      NEW.release_time := next_release_date;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_product_locks()
RETURNS void AS $$
BEGIN
  PERFORM auto_lock_pagination();
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS trigger_auto_lock_pagination ON products;
CREATE TRIGGER trigger_auto_lock_pagination
AFTER INSERT ON products
FOR EACH STATEMENT
EXECUTE FUNCTION auto_lock_pagination();

DROP TRIGGER IF EXISTS trigger_auto_unlock_products ON products;
CREATE TRIGGER trigger_auto_unlock_products
BEFORE UPDATE ON products
FOR EACH ROW
WHEN (NEW.release_time IS NOT NULL AND NEW.release_time <= NOW() AND NEW.is_locked = TRUE)
EXECUTE FUNCTION auto_unlock_products();

DROP TRIGGER IF EXISTS trigger_manage_top_products_queue ON products;
CREATE TRIGGER trigger_manage_top_products_queue
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION manage_top_products_queue();

-- Update RLS policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Pro users can access all products" ON products;
CREATE POLICY "Pro users can access all products"
  ON products FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.user_id = auth.uid() 
      AND customers.subscription_tier = 'pro'
    )
  );

DROP POLICY IF EXISTS "Free users can access only unlocked products" ON products;
CREATE POLICY "Free users can access only unlocked products"
  ON products FOR SELECT TO authenticated
  USING (
    (NOT is_locked OR release_time <= now()) 
    AND NOT is_top_product
    AND NOT EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.user_id = auth.uid() 
      AND customers.subscription_tier = 'pro'
    )
  );