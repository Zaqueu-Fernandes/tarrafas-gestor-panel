-- Fix dept_tabs policies: drop restrictive and recreate as permissive
DROP POLICY IF EXISTS "Anyone can read dept tabs" ON public.dept_tabs;
DROP POLICY IF EXISTS "Authenticated can delete dept tabs" ON public.dept_tabs;
DROP POLICY IF EXISTS "Authenticated can insert dept tabs" ON public.dept_tabs;
DROP POLICY IF EXISTS "Authenticated can update dept tabs" ON public.dept_tabs;

CREATE POLICY "Anyone can read dept tabs" ON public.dept_tabs FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert dept tabs" ON public.dept_tabs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update dept tabs" ON public.dept_tabs FOR UPDATE USING (true);
CREATE POLICY "Authenticated can delete dept tabs" ON public.dept_tabs FOR DELETE USING (true);

-- Fix dept_icons policies too
DROP POLICY IF EXISTS "Anyone can read dept icons" ON public.dept_icons;
DROP POLICY IF EXISTS "Authenticated can delete dept icons" ON public.dept_icons;
DROP POLICY IF EXISTS "Authenticated can insert dept icons" ON public.dept_icons;
DROP POLICY IF EXISTS "Authenticated can update dept icons" ON public.dept_icons;

CREATE POLICY "Anyone can read dept icons" ON public.dept_icons FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert dept icons" ON public.dept_icons FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update dept icons" ON public.dept_icons FOR UPDATE USING (true);
CREATE POLICY "Authenticated can delete dept icons" ON public.dept_icons FOR DELETE USING (true);