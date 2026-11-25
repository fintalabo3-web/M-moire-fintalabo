-- Tighten user-scoped RLS policies to authenticated sessions and cache auth.uid() per statement.
ALTER POLICY favorites_select_own ON public.favorites
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
ALTER POLICY favorites_insert_own ON public.favorites
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
ALTER POLICY favorites_delete_own ON public.favorites
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

ALTER POLICY idea_comments_admin_del ON public.idea_comments
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = (SELECT auth.uid()) AND u.is_admin IS TRUE
  ));

ALTER POLICY announcements_admin_write ON public.announcements
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = (SELECT auth.uid()) AND u.is_admin IS TRUE
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = (SELECT auth.uid()) AND u.is_admin IS TRUE
  ));

ALTER POLICY idea_posts_admin ON public.idea_posts
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = (SELECT auth.uid()) AND u.is_admin IS TRUE
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = (SELECT auth.uid()) AND u.is_admin IS TRUE
  ));

ALTER POLICY gallery_owner_write ON public.gallery
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = gallery.provider_id AND p.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid()) AND u.is_admin IS TRUE
    )
  );

ALTER POLICY services_owner_write ON public.services
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = services.provider_id AND p.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid()) AND u.is_admin IS TRUE
    )
  );

ALTER POLICY "Users read own messages" ON public.messages
  USING ((SELECT auth.uid()) = sender_id OR (SELECT auth.uid()) = receiver_id);

ALTER POLICY "requests client read own" ON public.requests
  TO authenticated
  USING ((SELECT auth.uid()) = client_id);

ALTER POLICY "requests provider read own" ON public.requests
  TO authenticated
  USING (provider_id IN (
    SELECT p.id FROM public.providers p WHERE p.user_id = (SELECT auth.uid())
  ));

ALTER POLICY "users read own profile" ON public.users
  TO authenticated
  USING ((SELECT auth.uid()) = id);
