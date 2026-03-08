
CREATE TABLE public.disease_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text,
  disease_name text NOT NULL,
  detected boolean NOT NULL DEFAULT false,
  confidence text,
  severity text,
  affected_crop text,
  description text,
  symptoms jsonb DEFAULT '[]'::jsonb,
  causes jsonb DEFAULT '[]'::jsonb,
  treatment jsonb DEFAULT '[]'::jsonb,
  prevention jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.disease_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own detections" ON public.disease_detections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Farmers can insert own detections" ON public.disease_detections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Farmers can delete own detections" ON public.disease_detections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
