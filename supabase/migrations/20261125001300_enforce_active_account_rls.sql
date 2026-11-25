-- A caller-scoped predicate for RLS. It exposes only whether the current account is active.
CREATE OR REPLACE FUNCTION private.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = (SELECT auth.uid())
      AND COALESCE(u.suspended, false) IS FALSE
  );
$function$;

REVOKE ALL ON FUNCTION private.is_active_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_active_user() TO anon, authenticated;

ALTER POLICY announcements_admin_write ON public.announcements TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

ALTER POLICY favorites_select_own ON public.favorites TO authenticated
  USING (private.is_active_user() AND user_id = (SELECT auth.uid()));
ALTER POLICY favorites_insert_own ON public.favorites TO authenticated
  WITH CHECK (private.is_active_user() AND user_id = (SELECT auth.uid()));
ALTER POLICY favorites_delete_own ON public.favorites TO authenticated
  USING (private.is_active_user() AND user_id = (SELECT auth.uid()));

ALTER POLICY gallery_owner_write ON public.gallery TO authenticated
  USING (private.is_active_user() AND (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = gallery.provider_id AND p.user_id = (SELECT auth.uid()))
    OR private.is_admin()
  ))
  WITH CHECK (private.is_active_user() AND (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = gallery.provider_id AND p.user_id = (SELECT auth.uid()))
    OR private.is_admin()
  ));

ALTER POLICY idea_comments_admin_del ON public.idea_comments TO authenticated
  USING (private.is_admin());
ALTER POLICY idea_comments_user_insert ON public.idea_comments TO authenticated
  WITH CHECK (private.is_active_user() AND author_id = (SELECT auth.uid()));

ALTER POLICY idea_likes_delete ON public.idea_likes TO authenticated
  USING (private.is_active_user() AND user_id = (SELECT auth.uid()));
ALTER POLICY idea_likes_insert ON public.idea_likes TO authenticated
  WITH CHECK (private.is_active_user() AND user_id = (SELECT auth.uid()));

ALTER POLICY idea_posts_admin ON public.idea_posts TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());
ALTER POLICY idea_posts_user_insert ON public.idea_posts TO authenticated
  WITH CHECK (private.is_active_user() AND author_id = (SELECT auth.uid()));

ALTER POLICY "Users read own messages" ON public.messages TO authenticated
  USING (private.is_active_user() AND ((SELECT auth.uid()) = sender_id OR (SELECT auth.uid()) = receiver_id));

ALTER POLICY "requests client read own" ON public.requests TO authenticated
  USING (private.is_active_user() AND (SELECT auth.uid()) = client_id);
ALTER POLICY "requests provider read own" ON public.requests TO authenticated
  USING (private.is_active_user() AND provider_id IN (
    SELECT p.id FROM public.providers p WHERE p.user_id = (SELECT auth.uid())
  ));

ALTER POLICY provider_referrals_admin_read ON public.provider_referrals TO authenticated
  USING (private.is_admin());

ALTER POLICY services_owner_write ON public.services TO authenticated
  USING (private.is_active_user() AND (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = services.provider_id AND p.user_id = (SELECT auth.uid()))
    OR private.is_admin()
  ))
  WITH CHECK (private.is_active_user() AND (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = services.provider_id AND p.user_id = (SELECT auth.uid()))
    OR private.is_admin()
  ));

ALTER POLICY site_visits_insert ON public.site_visits TO anon, authenticated
  WITH CHECK (
    ((SELECT auth.uid()) IS NULL OR private.is_active_user())
    AND ((user_id IS NULL) OR (user_id = (SELECT auth.uid())))
    AND ((visitor_key IS NULL) OR (length(visitor_key) >= 16 AND length(visitor_key) <= 128))
    AND ((path IS NULL) OR length(path) <= 120)
  );

ALTER POLICY site_visits_admin_select ON public.site_visits TO authenticated
  USING (private.is_admin());

ALTER POLICY support_messages_admin_select ON public.support_messages TO authenticated
  USING (private.is_admin());
ALTER POLICY support_messages_admin_update ON public.support_messages TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

ALTER POLICY users_delete_admin_only ON public.users TO authenticated
  USING (private.is_admin());
ALTER POLICY "users admin read all" ON public.users TO authenticated
  USING (private.is_admin() OR private.has_staff_permission('view_users'));
ALTER POLICY "users admin update all" ON public.users TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());
