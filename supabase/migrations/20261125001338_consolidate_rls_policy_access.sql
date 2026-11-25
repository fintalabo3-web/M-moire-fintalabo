-- Consolidate overlapping RLS policies without widening access.
-- Public SELECT policies remain the sole read path for public content.

DROP POLICY announcements_admin_write ON public.announcements;
CREATE POLICY announcements_admin_insert ON public.announcements
  FOR INSERT TO authenticated WITH CHECK (private.is_admin());
CREATE POLICY announcements_admin_update ON public.announcements
  FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY announcements_admin_delete ON public.announcements
  FOR DELETE TO authenticated USING (private.is_admin());

DROP POLICY gallery_owner_write ON public.gallery;
CREATE POLICY gallery_owner_insert ON public.gallery
  FOR INSERT TO authenticated WITH CHECK (
    private.is_active_user() AND (
      EXISTS (SELECT 1 FROM public.providers p WHERE p.id = gallery.provider_id AND p.user_id = (SELECT auth.uid()))
      OR private.is_admin()
    )
  );
CREATE POLICY gallery_owner_update ON public.gallery
  FOR UPDATE TO authenticated
  USING (
    private.is_active_user() AND (
      EXISTS (SELECT 1 FROM public.providers p WHERE p.id = gallery.provider_id AND p.user_id = (SELECT auth.uid()))
      OR private.is_admin()
    )
  )
  WITH CHECK (
    private.is_active_user() AND (
      EXISTS (SELECT 1 FROM public.providers p WHERE p.id = gallery.provider_id AND p.user_id = (SELECT auth.uid()))
      OR private.is_admin()
    )
  );
CREATE POLICY gallery_owner_delete ON public.gallery
  FOR DELETE TO authenticated USING (
    private.is_active_user() AND (
      EXISTS (SELECT 1 FROM public.providers p WHERE p.id = gallery.provider_id AND p.user_id = (SELECT auth.uid()))
      OR private.is_admin()
    )
  );

DROP POLICY services_owner_write ON public.services;
CREATE POLICY services_owner_insert ON public.services
  FOR INSERT TO authenticated WITH CHECK (
    private.is_active_user() AND (
      EXISTS (SELECT 1 FROM public.providers p WHERE p.id = services.provider_id AND p.user_id = (SELECT auth.uid()))
      OR private.is_admin()
    )
  );
CREATE POLICY services_owner_update ON public.services
  FOR UPDATE TO authenticated
  USING (
    private.is_active_user() AND (
      EXISTS (SELECT 1 FROM public.providers p WHERE p.id = services.provider_id AND p.user_id = (SELECT auth.uid()))
      OR private.is_admin()
    )
  )
  WITH CHECK (
    private.is_active_user() AND (
      EXISTS (SELECT 1 FROM public.providers p WHERE p.id = services.provider_id AND p.user_id = (SELECT auth.uid()))
      OR private.is_admin()
    )
  );
CREATE POLICY services_owner_delete ON public.services
  FOR DELETE TO authenticated USING (
    private.is_active_user() AND (
      EXISTS (SELECT 1 FROM public.providers p WHERE p.id = services.provider_id AND p.user_id = (SELECT auth.uid()))
      OR private.is_admin()
    )
  );

DROP POLICY idea_posts_admin ON public.idea_posts;
ALTER POLICY idea_posts_user_insert ON public.idea_posts
  TO authenticated
  WITH CHECK (
    private.is_active_user()
    AND (author_id = (SELECT auth.uid()) OR private.is_admin())
  );
CREATE POLICY idea_posts_admin_update ON public.idea_posts
  FOR UPDATE TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
CREATE POLICY idea_posts_admin_delete ON public.idea_posts
  FOR DELETE TO authenticated
  USING (private.is_admin());

DROP POLICY "requests client read own" ON public.requests;
DROP POLICY "requests provider read own" ON public.requests;
DROP POLICY "requests staff read all" ON public.requests;
CREATE POLICY requests_read_authorized ON public.requests
  FOR SELECT TO authenticated
  USING (
    private.is_active_user()
    AND (
      client_id = (SELECT auth.uid())
      OR provider_id IN (
        SELECT p.id FROM public.providers p WHERE p.user_id = (SELECT auth.uid())
      )
      OR public.is_staff((SELECT auth.uid()))
    )
  );

DROP POLICY "users admin read all" ON public.users;
DROP POLICY "users read own profile" ON public.users;
CREATE POLICY users_read_authorized ON public.users
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (
      private.is_active_user()
      AND (private.is_admin() OR private.has_staff_permission('view_users'))
    )
  );
