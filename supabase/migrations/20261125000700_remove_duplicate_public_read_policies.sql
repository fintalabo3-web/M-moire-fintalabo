-- Remove three duplicate permissive public-read policies; identical policies remain in place.
DROP POLICY "announcements public read" ON public.announcements;
DROP POLICY "gallery public read" ON public.gallery;
DROP POLICY "services public read" ON public.services;
