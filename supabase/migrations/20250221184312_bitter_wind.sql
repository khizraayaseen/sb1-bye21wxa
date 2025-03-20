/*
  # Enhanced Schema for All Features

  1. New Tables
    - `saved_products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `product_id` (uuid, references products)
      - `saved_at` (timestamptz)
      - `notes` (text)

    - `product_views`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `product_id` (uuid, references products)
      - `viewed_at` (timestamptz)
      - `source` (text)
      - `session_id` (uuid)

    - `user_activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `activity_type` (text)
      - `activity_data` (jsonb)
      - `created_at` (timestamptz)

  2. Table Modifications
    - Add columns to `products`:
      - `search_volume` (jsonb)
      - `aliexpress_orders` (jsonb)
      - `engagement_metrics` (jsonb)
      - `saturation_data` (jsonb)

    - Add columns to `customers`:
      - `preferences` (jsonb)
      - `subscription_data` (jsonb)
      - `usage_stats` (jsonb)

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for CRUD operations
*/

-- Add new columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_volume jsonb DEFAULT '{
  "monthly": 0,
  "trend": "stable",
  "relatedTerms": []
}'::jsonb;

ALTER TABLE products ADD COLUMN IF NOT EXISTS aliexpress_orders jsonb DEFAULT '{
  "daily": 0,
  "weekly": 0,
  "monthly": 0,
  "trend": "stable"
}'::jsonb;

ALTER TABLE products ADD COLUMN IF NOT EXISTS engagement_metrics jsonb DEFAULT '{
  "level": "medium",
  "fbAds": "inactive",
  "targetingInfo": "unavailable"
}'::jsonb;

ALTER TABLE products ADD COLUMN IF NOT EXISTS saturation_data jsonb DEFAULT '{
  "percentage": 0,
  "totalStores": 0,
  "activeStores": 0,
  "competition": "low",
  "recentChange": "0%",
  "timeFrame": "30 days"
}'::jsonb;

-- Add new columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{
  "notifications": {
    "marketing": true,
    "security": true,
    "updates": true
  },
  "theme": "light",
  "language": "en"
}'::jsonb;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS subscription_data jsonb DEFAULT '{
  "plan": "free",
  "startDate": null,
  "endDate": null,
  "autoRenew": false,
  "paymentMethod": null
}'::jsonb;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS usage_stats jsonb DEFAULT '{
  "productsViewed": 0,
  "productsSaved": 0,
  "lastActive": null
}'::jsonb;

-- Create saved_products table
CREATE TABLE IF NOT EXISTS saved_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(user_id, product_id)
);

-- Create product_views table
CREATE TABLE IF NOT EXISTS product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  source text,
  session_id uuid
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_products
CREATE POLICY "Users can manage their saved products"
ON saved_products
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for product_views
CREATE POLICY "Users can view their product views"
ON product_views
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create product views"
ON product_views
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_activities
CREATE POLICY "Users can view their own activity"
ON user_activities
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create activity records"
ON user_activities
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin policies for new tables
CREATE POLICY "Admin can manage all saved products"
ON saved_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE user_id = auth.uid()
    AND subscription_tier = 'admin'
  )
);

CREATE POLICY "Admin can manage all product views"
ON product_views
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE user_id = auth.uid()
    AND subscription_tier = 'admin'
  )
);

CREATE POLICY "Admin can manage all user activities"
ON user_activities
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE user_id = auth.uid()
    AND subscription_tier = 'admin'
  )
);