-- FasoService: prevent cross-user staff status disclosure and unify admin checks.
-- No user data is changed.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT private.is_admin();
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT CASE
    WHEN uid IS NULL OR uid IS DISTINCT FROM (SELECT auth.uid()) THEN false
    ELSE private.is_admin()
  END;
$function$;

CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT CASE
    WHEN uid IS NULL OR uid IS DISTINCT FROM (SELECT auth.uid()) THEN false
    ELSE (
      private.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.admin_staff s
        JOIN public.users u ON u.phone = s.phone
        WHERE u.id = (SELECT auth.uid())
      )
      OR (SELECT private.has_staff_permission('view_requests'))
    )
  END;
$function$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
