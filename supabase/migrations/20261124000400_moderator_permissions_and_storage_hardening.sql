-- FasoService: align moderator permissions and harden legacy announcement uploads.
-- Safe/idempotent: no table or user data is deleted.

CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    public.is_admin(uid)
    OR EXISTS (
      SELECT 1
      FROM public.admin_staff s
      JOIN public.users u ON u.phone = s.phone
      WHERE u.id = uid
    )
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = uid
        AND u.is_moderator IS TRUE
        AND COALESCE(u.permissions ->> 'view_requests', 'false') = 'true'
    );
$function$;

-- Moderators may read user records only when the owner explicitly grants
-- the view_users permission. Ordinary users retain their own-profile policy.
DROP POLICY IF EXISTS "users admin read all" ON public.users;
CREATE POLICY "users admin read all"
ON public.users
FOR SELECT
TO authenticated
USING (
  public.is_admin((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1
    FROM public.users AS staff_user
    WHERE staff_user.id = (SELECT auth.uid())
      AND staff_user.is_moderator IS TRUE
      AND COALESCE(staff_user.permissions ->> 'view_users', 'false') = 'true'
  )
);

-- The UI already exposes provider verification to moderators with the
-- validate_provider permission; enforce the same rule in the database.
CREATE OR REPLACE FUNCTION public.admin_set_provider_verified(
  target_provider_id uuid,
  new_verified boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NOT public.is_admin((SELECT auth.uid()))
     AND NOT EXISTS (
       SELECT 1
       FROM public.users u
       WHERE u.id = (SELECT auth.uid())
         AND u.is_moderator IS TRUE
         AND COALESCE(u.permissions ->> 'validate_provider', 'false') = 'true'
     )
  THEN
    RAISE EXCEPTION 'Accès refusé : permission de validation requise';
  END IF;

  UPDATE public.providers
  SET verified = new_verified,
      updated_at = now()
  WHERE id = target_provider_id;

  RETURN FOUND;
END;
$function$;

-- Keep the historical bucket usable by administrators during transition,
-- but prevent ordinary authenticated users from uploading/replacing/deleting.
DROP POLICY IF EXISTS announcements_auth_write ON storage.objects;
CREATE POLICY announcements_auth_write
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'announcements'
  AND (SELECT private.is_admin())
);

DROP POLICY IF EXISTS announcements_auth_update ON storage.objects;
CREATE POLICY announcements_auth_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'announcements'
  AND (SELECT private.is_admin())
)
WITH CHECK (
  bucket_id = 'announcements'
  AND (SELECT private.is_admin())
);

DROP POLICY IF EXISTS announcements_auth_delete ON storage.objects;
CREATE POLICY announcements_auth_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'announcements'
  AND (SELECT private.is_admin())
);

REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_set_provider_verified(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_provider_verified(uuid, boolean) TO authenticated, service_role;
