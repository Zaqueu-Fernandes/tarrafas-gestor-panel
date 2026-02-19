
-- Table for department tabs
CREATE TABLE public.dept_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dept_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT DEFAULT 'fa-solid fa-file',
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dept_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read dept tabs" ON public.dept_tabs FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert dept tabs" ON public.dept_tabs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update dept tabs" ON public.dept_tabs FOR UPDATE USING (true);
CREATE POLICY "Authenticated can delete dept tabs" ON public.dept_tabs FOR DELETE USING (true);
