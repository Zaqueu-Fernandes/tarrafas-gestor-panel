-- Create storage bucket for department icons
INSERT INTO storage.buckets (id, name, public) VALUES ('dept-icons', 'dept-icons', true);

-- Allow anyone to view icons (public)
CREATE POLICY "Department icons are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'dept-icons');

-- Allow authenticated users to upload icons (admin will handle in app)
CREATE POLICY "Authenticated users can upload dept icons"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dept-icons');

-- Allow authenticated users to update dept icons
CREATE POLICY "Authenticated users can update dept icons"
ON storage.objects FOR UPDATE
USING (bucket_id = 'dept-icons');

-- Allow authenticated users to delete dept icons
CREATE POLICY "Authenticated users can delete dept icons"
ON storage.objects FOR DELETE
USING (bucket_id = 'dept-icons');

-- Table to map department IDs (from external DB) to icon URLs
CREATE TABLE public.dept_icons (
  dept_id TEXT PRIMARY KEY,
  icon_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dept_icons ENABLE ROW LEVEL SECURITY;

-- Public read access for icons mapping
CREATE POLICY "Anyone can read dept icons"
ON public.dept_icons FOR SELECT
USING (true);

-- Authenticated users can manage
CREATE POLICY "Authenticated can insert dept icons"
ON public.dept_icons FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated can update dept icons"
ON public.dept_icons FOR UPDATE
USING (true);

CREATE POLICY "Authenticated can delete dept icons"
ON public.dept_icons FOR DELETE
USING (true);