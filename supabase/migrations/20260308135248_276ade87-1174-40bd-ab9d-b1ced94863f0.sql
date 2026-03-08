-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view available products" ON products;
DROP POLICY IF EXISTS "Farmers can delete own products" ON products;
DROP POLICY IF EXISTS "Farmers can insert own products" ON products;
DROP POLICY IF EXISTS "Farmers can update own products" ON products;

CREATE POLICY "Anyone can view available products" ON products FOR SELECT USING (true);
CREATE POLICY "Farmers can insert own products" ON products FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Farmers can update own products" ON products FOR UPDATE TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "Farmers can delete own products" ON products FOR DELETE TO authenticated USING (auth.uid() = farmer_id);