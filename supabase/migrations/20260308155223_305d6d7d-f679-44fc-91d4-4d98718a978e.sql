
CREATE TABLE public.community_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view likes" ON public.community_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own likes" ON public.community_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.community_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_likes;
