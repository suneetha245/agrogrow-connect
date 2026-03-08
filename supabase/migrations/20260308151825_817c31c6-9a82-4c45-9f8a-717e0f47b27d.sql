
-- Allow the trigger function to also insert notifications
-- Update the stock decrease function to notify farmers on low stock
CREATE OR REPLACE FUNCTION public.decrease_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_stock INTEGER;
  product_name TEXT;
  product_farmer_id UUID;
BEGIN
  -- Decrease stock
  UPDATE public.products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id AND stock >= NEW.quantity
  RETURNING stock, name, farmer_id INTO current_stock, product_name, product_farmer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;

  -- Notify farmer if stock drops below threshold (5)
  IF current_stock <= 5 AND current_stock >= 0 THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      product_farmer_id,
      '⚠️ Low Stock Alert',
      'Your product "' || product_name || '" has only ' || current_stock || ' units left. Consider restocking!'
    );
  END IF;

  -- Notify farmer if stock hits 0
  IF current_stock = 0 THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      product_farmer_id,
      '🚨 Out of Stock',
      'Your product "' || product_name || '" is now out of stock. Update your inventory to continue selling.'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Also allow the trigger function (SECURITY DEFINER) to insert notifications
-- The existing RLS policy only allows admins to insert notifications, so we need to add one for the function
-- Since the function runs as SECURITY DEFINER it bypasses RLS, so no policy change needed.
