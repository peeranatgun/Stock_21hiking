-- =============================================
-- 21Hiking Stock — Storage Setup
-- =============================================

-- Create public bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: allow authenticated users to upload/view
CREATE POLICY "storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "storage_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
);

-- =============================================
-- 21Hiking Stock — Seed Data
-- =============================================

INSERT INTO brands (name) VALUES
  ('The North Face'),
  ('Patagonia'),
  ('Arc''teryx'),
  ('Columbia'),
  ('Salomon')
ON CONFLICT DO NOTHING;

INSERT INTO expenses (title, amount) VALUES
  ('ค่าขนส่ง', 150.00),
  ('ค่าบรรจุภัณฑ์', 80.00),
  ('ค่าน้ำมัน', 200.00)
ON CONFLICT DO NOTHING;
