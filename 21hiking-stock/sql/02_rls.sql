-- =============================================
-- 21Hiking Stock — Row Level Security
-- =============================================

-- Enable RLS on all tables
ALTER TABLE brands   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales    ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- BRANDS policies
CREATE POLICY "brands_select" ON brands FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "brands_insert" ON brands FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "brands_update" ON brands FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "brands_delete" ON brands FOR DELETE USING (auth.role() = 'authenticated');

-- PRODUCTS policies
CREATE POLICY "products_select" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "products_update" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "products_delete" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- SALES policies
CREATE POLICY "sales_select" ON sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sales_update" ON sales FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "sales_delete" ON sales FOR DELETE USING (auth.role() = 'authenticated');

-- EXPENSES policies
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (auth.role() = 'authenticated');
