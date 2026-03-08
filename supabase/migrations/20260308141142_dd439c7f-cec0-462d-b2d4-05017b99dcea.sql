
-- Fix farmer_details: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Admins can update farmer details" ON farmer_details;
DROP POLICY IF EXISTS "Admins can view all farmer details" ON farmer_details;
DROP POLICY IF EXISTS "Farmers can insert own details" ON farmer_details;
DROP POLICY IF EXISTS "Farmers can update own details" ON farmer_details;
DROP POLICY IF EXISTS "Farmers can view own details" ON farmer_details;

CREATE POLICY "Admins can update farmer details" ON farmer_details FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all farmer details" ON farmer_details FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Farmers can insert own details" ON farmer_details FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Farmers can update own details" ON farmer_details FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Farmers can view own details" ON farmer_details FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix profiles: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix user_roles: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all roles" ON user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix orders: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Farmers can view orders for their products" ON orders;

CREATE POLICY "Admins can view all orders" ON orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Customers can create orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Farmers can view orders for their products" ON orders FOR SELECT TO authenticated USING (auth.uid() = farmer_id);

-- Fix notifications: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
