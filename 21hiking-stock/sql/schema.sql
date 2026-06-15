-- ============================================
-- 21Hiking Stock — Database Schema
-- ============================================

-- BRANDS
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  name text NOT NULL,
  size text,
  color text,
  description text,
  cost numeric(10,2),
  sell_price numeric(10,2),
  image_url text,
  status text DEFAULT 'instock' CHECK (status IN ('instock','sold')),
  created_at timestamptz DEFAULT now()
);

-- SALES
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  cost numeric(10,2),
  sell_price numeric(10,2),
  profit numeric(10,2),
  sold_at timestamptz DEFAULT now()
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  amount numeric(10,2),
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- BRANDS policies
CREATE POLICY "brands_select" ON brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "brands_insert" ON brands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "brands_update" ON brands FOR UPDATE TO authenticated USING (true);
CREATE POLICY "brands_delete" ON brands FOR DELETE TO authenticated USING (true);

-- PRODUCTS policies
CREATE POLICY "products_select" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "products_update" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "products_delete" ON products FOR DELETE TO authenticated USING (true);

-- SALES policies
CREATE POLICY "sales_select" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_insert" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sales_update" ON sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "sales_delete" ON sales FOR DELETE TO authenticated USING (true);

-- EXPENSES policies
CREATE POLICY "expenses_select" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "expenses_update" ON expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE TO authenticated USING (true);

-- ============================================
-- STORAGE
-- ============================================

-- Run in Supabase Dashboard > Storage > New Bucket
-- Name: product-images
-- Public: true

-- Or via SQL (if using service role):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage RLS
CREATE POLICY "storage_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "storage_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "storage_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "storage_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO brands (name) VALUES
  ('The North Face'),
  ('Arc''teryx'),
  ('Patagonia'),
  ('Columbia'),
  ('Mammut');

-- Sample products (replace brand_id with actual UUIDs after inserting brands)
-- INSERT INTO products (brand_id, name, size, color, cost, sell_price, status)
-- SELECT id, 'Fleece Jacket', 'M', 'Navy', 350, 650, 'instock' FROM brands WHERE name = 'The North Face' LIMIT 1;

-- Sample expenses
INSERT INTO expenses (title, amount) VALUES
  ('ค่าขนส่ง', 120),
  ('ค่าแพ็คเกจ', 85),
  ('ค่าน้ำมัน', 200);
