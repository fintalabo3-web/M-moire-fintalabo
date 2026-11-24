-- Scope staff-only policies to authenticated sessions.
-- This avoids anonymous requests evaluating functions unavailable to anon.

DROP POLICY IF EXISTS "requests staff read all" ON public.requests;
CREATE POLICY "requests staff read all"
ON public.requests
FOR SELECT
TO authenticated
USING (public.is_staff((SELECT auth.uid())));

DROP POLICY IF EXISTS "admin_log admin insert" ON public.admin_log;
CREATE POLICY "admin_log admin insert"
ON public.admin_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "admin_log admin read" ON public.admin_log;
CREATE POLICY "admin_log admin read"
ON public.admin_log
FOR SELECT
TO authenticated
USING (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "admin_staff admin only" ON public.admin_staff;
CREATE POLICY "admin_staff admin only"
ON public.admin_staff
FOR ALL
TO authenticated
USING (public.is_admin((SELECT auth.uid())))
WITH CHECK (public.is_admin((SELECT auth.uid())));
