-- Allow farmers to update orders for their products (confirm, ship, deliver)
CREATE POLICY "Farmers can update own orders" ON orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = farmer_id);