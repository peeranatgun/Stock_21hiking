-- =============================================
-- 21Hiking Stock — Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- BRANDS
CREATE TABLE IF NOT EXISTS brands (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid REFERENCES brands(id) ON DELETE SET NULL,
  name        text NOT NULL,
  size        text,
  color       text,
  description text,
  cost        numeric(10,2),
  sell_price  numeric(10,2),
  image_url   text,
  status      text DEFAULT 'instock' CHECK (status IN ('instock','sold')),
  created_at  timestamptz DEFAULT now()
);

-- SALES
CREATE TABLE IF NOT EXISTS sales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  cost        numeric(10,2),
  sell_price  numeric(10,2),
  profit      numeric(10,2),
  sold_at     timestamptz DEFAULT now()
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  amount     numeric(10,2),
  created_at timestamptz DEFAULT now()
);
