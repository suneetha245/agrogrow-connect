
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  farmer_name TEXT NOT NULL,
  location TEXT,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can view feedback (for homepage)
CREATE POLICY "Anyone can view feedback" ON public.feedback FOR SELECT USING (true);

-- Farmers can insert their own feedback
CREATE POLICY "Farmers can insert own feedback" ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'farmer'::app_role));

-- Farmers can update their own feedback
CREATE POLICY "Farmers can update own feedback" ON public.feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- Farmers can delete their own feedback
CREATE POLICY "Farmers can delete own feedback" ON public.feedback FOR DELETE
  USING (auth.uid() = user_id);
