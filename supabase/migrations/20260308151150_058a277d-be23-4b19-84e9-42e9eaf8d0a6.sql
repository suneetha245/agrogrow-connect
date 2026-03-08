
-- Add stock column (numeric) to products, defaulting to 0
ALTER TABLE public.products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;

-- Create trigger function to decrease stock when an order is placed
CREATE OR REPLACE FUNCTION public.decrease_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id AND stock >= NEW.quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to orders table
CREATE TRIGGER on_order_decrease_stock
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrease_product_stock();
