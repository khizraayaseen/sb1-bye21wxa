-- Ensure admin role exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin;
  END IF;
END $$;

-- Categories Table (created first to prevent reference errors)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  selling_price decimal(10,2) NOT NULL CHECK (selling_price >= 0),
  product_cost decimal(10,2) NOT NULL CHECK (product_cost >= 0),
  profit_margin decimal(10,2) GENERATED ALWAYS AS (selling_price - product_cost) STORED,
  images text[] DEFAULT ARRAY[]::text[],
  stats jsonb DEFAULT '{}'::jsonb,
  specifications jsonb DEFAULT '{}'::jsonb,
  is_locked boolean DEFAULT true,
  release_time timestamptz, -- Scheduled release time
  priority integer DEFAULT 0 CHECK (priority >= 0), -- Top product ordering
  is_top_product boolean DEFAULT false, -- Marks top 6 products
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Junction Table for Many-to-Many Relationship Between Products and Categories
CREATE TABLE IF NOT EXISTS product_categories (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_products_release_time ON products(release_time);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
  full_name text,
  subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'pro')),
  subscription_tier text DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro')),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now()
);

-- Enable RLS for security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'categories' 
    AND policyname = 'Admin full access to categories'
  ) THEN
    CREATE POLICY "Admin full access to categories"
    ON categories FOR ALL TO admin USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE POLICY "Authenticated users full access to products"
  ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to categories"
  ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view categories"
  ON categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view unlocked products"
  ON products FOR SELECT TO authenticated
  USING (NOT is_locked OR release_time <= now());

CREATE POLICY "Pro users can access all products"
  ON products FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.user_id = auth.uid() 
      AND customers.subscription_tier = 'pro'
    )
  );

CREATE POLICY "Free users can access only unlocked products"
  ON products FOR SELECT TO authenticated
  USING (
    NOT is_locked 
    AND release_time <= now() 
    AND NOT EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.user_id = auth.uid() 
      AND customers.subscription_tier = 'pro'
    )
  );

CREATE POLICY "Authenticated users can schedule product releases"
  ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage product categories"
  ON product_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-Lock Products Beyond Page 2 for Free Users
CREATE OR REPLACE FUNCTION auto_lock_pagination()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET is_locked = TRUE
  WHERE id IN (
      SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS row_num
          FROM products
      ) AS subquery
      WHERE row_num > 12  -- Assuming 6 products per page
  ) 
  AND is_locked = FALSE; -- Avoid unnecessary updates
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-Unlock Products When Release Time Expires
CREATE OR REPLACE FUNCTION auto_unlock_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.release_time <= NOW() THEN
    NEW.is_locked = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-Unlock Trigger
CREATE TRIGGER trigger_auto_unlock_products
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION auto_unlock_products();

-- Auto-Lock Trigger
CREATE TRIGGER trigger_auto_lock_pagination
AFTER INSERT ON products
FOR EACH STATEMENT
EXECUTE FUNCTION auto_lock_pagination();


-- First, create the trigger_set_timestamp function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;





-- Then create the product_addons table
CREATE TABLE product_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  enabled BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,  -- Note the double quotes around order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the type column for faster queries
CREATE INDEX idx_product_addons_type ON product_addons(type);

-- Finally, add the trigger to update the updated_at timestamp
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON product_addons
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();


-- Add product_id column to product_addons table to link addons to specific products
ALTER TABLE product_addons ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_addons_product_id ON product_addons(product_id);

-- Update RLS policies
CREATE POLICY "Authenticated users can manage product addons"
  ON product_addons FOR ALL TO authenticated USING (true) WITH CHECK (true);


  -- 1. Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own files" ON storage.objects;

-- 2. Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productImages');

-- 3. Create policy to allow anyone to view/download files
CREATE POLICY "Allow public access to view files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'productImages');

-- 4. Create policy to allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'productImages' AND auth.uid() = owner);

-- 5. Create policy to allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'productImages' AND auth.uid() = owner);

-- 6. Enable RLS on the objects table if it's not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
