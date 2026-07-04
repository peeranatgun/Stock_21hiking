-- เพิ่ม Table lots
CREATE TABLE IF NOT EXISTS lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- เพิ่ม lot_id ใน products
ALTER TABLE products ADD COLUMN IF NOT EXISTS lot_id uuid REFERENCES lots(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lots_select" ON lots FOR SELECT TO authenticated USING (true);
CREATE POLICY "lots_insert" ON lots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lots_update" ON lots FOR UPDATE TO authenticated USING (true);
CREATE POLICY "lots_delete" ON lots FOR DELETE TO authenticated USING (true);
