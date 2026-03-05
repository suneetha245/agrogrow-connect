
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'farmer', 'customer');

-- Create enum for farmer approval status
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  district TEXT,
  state TEXT,
  pincode TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create farmer_details table
CREATE TABLE public.farmer_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_size TEXT,
  crop_types TEXT,
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create products table (farmer uploads)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT DEFAULT 'kg',
  image_url TEXT,
  category TEXT,
  freshness_days INTEGER,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  shipping_date TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Farmer details policies
CREATE POLICY "Farmers can view own details" ON public.farmer_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Farmers can insert own details" ON public.farmer_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Farmers can update own details" ON public.farmer_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all farmer details" ON public.farmer_details FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update farmer details" ON public.farmer_details FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Products policies (public read, farmer write)
CREATE POLICY "Anyone can view available products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Farmers can insert own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Farmers can update own products" ON public.products FOR UPDATE USING (auth.uid() = farmer_id);
CREATE POLICY "Farmers can delete own products" ON public.products FOR DELETE USING (auth.uid() = farmer_id);

-- Orders policies
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Farmers can view orders for their products" ON public.orders FOR SELECT USING (auth.uid() = farmer_id);
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_farmer_details_updated_at BEFORE UPDATE ON public.farmer_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone, address, district, state, pincode)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'district', ''),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'pincode', '')
  );

  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, (COALESCE(NEW.raw_user_meta_data->>'role', 'customer'))::app_role);

  -- If farmer, create farmer_details
  IF NEW.raw_user_meta_data->>'role' = 'farmer' THEN
    INSERT INTO public.farmer_details (user_id, farm_size, crop_types)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'farm_size', ''),
      COALESCE(NEW.raw_user_meta_data->>'crop_types', '')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
